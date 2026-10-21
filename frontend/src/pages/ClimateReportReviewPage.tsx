import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { RichTextArea } from '@/components/RichText'
import SavedChangeDialog from '@/components/SavedChangeDialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  deleteClimateReport,
  fetchClimateReportsForReview,
  fetchClimateReportImage,
  moderateClimateReport,
  removeClimateReportImage,
  saveClimateReportImage,
  syncKoboClimateReports,
  type ClimateReport,
} from '@/services/Api'

const MAX_REPORT_PHOTO_SIZE = 5 * 1024 * 1024

function ClimateReportImagePreview({ reportId, refreshKey }: { reportId: string; refreshKey: number }) {
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')

  // Report ပြောင်းသည့်အခါ image ကိုပြန်ယူပြီး component ထွက်လျှင် object URL ကိုဖျက်သိမ်းသည်။
  useEffect(() => {
    let objectUrl = ''
    let cancelled = false
    fetchClimateReportImage(reportId)
      .then((image) => {
        objectUrl = URL.createObjectURL(image)
        if (!cancelled) setImageUrl(objectUrl)
        else URL.revokeObjectURL(objectUrl)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load report image.')
        }
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [reportId, refreshKey])

  if (error) return <p className="climate-review-image-error" role="alert">{error}</p>
  if (!imageUrl) return <p className="climate-review-image-loading" role="status">Loading submitted photo…</p>
  return <img className="climate-review-image-preview" src={imageUrl} alt="Submitted climate report for admin review" />
}

type ClimateReportReviewPageProps = {
  onBack: () => void
  onLogout: () => void
}

function isPublishedReport(report: ClimateReport) {
  return report.status === 'approved' && Boolean(report.approvedDescription?.trim())
}

function getReportIssueTypes(report: ClimateReport) {
  return report.issueTypes?.length
    ? report.issueTypes
    : report.issueType.split(/\s*,\s*/).filter(Boolean)
}

function formatIssueType(value: string) {
  const readable = value.replace(/[_-]+/g, ' ').trim()
  return readable ? readable.charAt(0).toLocaleUpperCase() + readable.slice(1) : 'Not specified'
}

export default function ClimateReportReviewPage({ onBack, onLogout }: ClimateReportReviewPageProps) {
  const { reportId } = useParams<{ reportId: string }>()
  // Queue ထဲက report များနှင့် per-report ပြင်ဆင်ချက်များကို key ဖြင့်ထိန်းကာ card controls သို့ပြန်ချိတ်သည်။
  const [reports, setReports] = useState<ClimateReport[]>([])
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [verification, setVerification] = useState<Record<string, boolean>>({})
  const [publicImages, setPublicImages] = useState<Record<string, boolean>>({})
  const [queueStatus, setQueueStatus] = useState<'all' | 'pending' | 'approved'>('all')
  const [loadingReports, setLoadingReports] = useState(true)
  const [error, setError] = useState('')
  const [savedDialogOpen, setSavedDialogOpen] = useState(false)
  const [savedDialogMessage, setSavedDialogMessage] = useState('')
  const [reportToDelete, setReportToDelete] = useState<ClimateReport | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [busy, setBusy] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoConsent, setPhotoConsent] = useState(false)
  const [imageRevision, setImageRevision] = useState(0)
  const selectedReport = reportId ? reports.find((report) => report.id === reportId) : undefined

  // ရွေးထားသော queue ကိုရယူပြီး မပြင်ရသေးသော description/verification/photo အခြေအနေများကို report data ဖြင့်ဖြည့်သည်။
  const loadQueue = useCallback(async () => {
    setError('')
    setLoadingReports(true)
    try {
      const queuedReports = await fetchClimateReportsForReview(queueStatus)
      setReports(queuedReports)
      setDescriptions((current) => Object.fromEntries(queuedReports.map((report) => [
        report.id,
        current[report.id] ?? (report.approvedDescription?.trim() ? report.approvedDescription : report.sourceDescription) ?? '',
      ])))
      setVerification((current) => Object.fromEntries(queuedReports.map((report) => [
        report.id,
        current[report.id] ?? report.verified,
      ])))
      setPublicImages((current) => Object.fromEntries(queuedReports.map((report) => [
        report.id,
        current[report.id] ?? Boolean(report.publicImageApproved),
      ])))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load reports.')
    } finally {
      setLoadingReports(false)
    }
  }, [queueStatus])

  // Pending/Published filter ပြောင်းလျှင် သက်ဆိုင်ရာ queue ကို ပြန်ဖတ်စေသည်။
  useEffect(() => { void loadQueue() }, [loadQueue])

  // Kobo မှ submission/photo metadata ကို sync လုပ်ပြီး လက်ရှိ queue နှင့် အောင်မြင်မှု dialog ကို update လုပ်သည်။
  async function syncSubmissions() {
    setBusy(true)
    setError('')
    try {
      const result = await syncKoboClimateReports()
      setSavedDialogMessage(
        `${result.imported} new Kobo submission(s) imported for admin review; ${result.photosFound} photo(s) found and ${result.photosSaved} linked to reports.`
      )
      await loadQueue()
      setSavedDialogOpen(true)
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Kobo submissions could not be synced.')
    } finally {
      setBusy(false)
    }
  }

  // Privacy-safe description လိုအပ်ချက်နှင့် consent/photo toggle များကိုစစ်ပြီး report ကို publish သို့မဟုတ် reject လုပ်သည်။
  async function review(report: ClimateReport, status: 'approved' | 'rejected') {
    if (status === 'approved' && !isPublishedReport(report) && !descriptions[report.id]?.trim()) {
      setError('Add a privacy-reviewed public description before approving.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const sharePhoto = status === 'approved' &&
        report.hasImage &&
        report.imageConsentGiven &&
        Boolean(publicImages[report.id])
      await moderateClimateReport(report.id, {
        status,
        approvedDescription: status === 'approved' ? descriptions[report.id] : '',
        verified: status === 'approved' && Boolean(verification[report.id]),
        publicImageApproved: sharePhoto,
      })
      setSavedDialogMessage(status === 'approved'
        ? sharePhoto
          ? 'Report and consented photo are published. Anyone can view the photo.'
          : report.hasImage
            ? 'Report published. Its photo remains private; enable photo sharing below and save public card settings to publish it.'
            : 'Report approved and published.'
        : 'Report rejected and kept off the public map.')
      await loadQueue()
      setSavedDialogOpen(true)
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Report review could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  async function saveReportPhoto() {
    if (!selectedReport || !photoFile) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(photoFile.type)) {
      setError('Choose a JPEG, PNG, or WebP photo.')
      return
    }
    if (photoFile.size > MAX_REPORT_PHOTO_SIZE) {
      setError('The photo must be smaller than 5 MB.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result)
          else reject(new Error('Unable to read the selected photo.'))
        }
        reader.onerror = () => reject(new Error('Unable to read the selected photo.'))
        reader.readAsDataURL(photoFile)
      })
      await saveClimateReportImage(selectedReport.id, imageData, photoConsent)
      setPublicImages((current) => ({ ...current, [selectedReport.id]: false }))
      setPhotoFile(null)
      setPhotoConsent(false)
      setImageRevision((revision) => revision + 1)
      await loadQueue()
      setSavedDialogMessage(photoConsent
        ? 'Photo added. It will remain private until you enable photo sharing and save the report settings.'
        : 'Photo added and kept private.')
      setSavedDialogOpen(true)
    } catch (photoError) {
      setError(photoError instanceof Error ? photoError.message : 'Unable to save report photo.')
    } finally {
      setBusy(false)
    }
  }

  async function removeReportPhoto() {
    if (!selectedReport) return
    setBusy(true)
    setError('')
    try {
      await removeClimateReportImage(selectedReport.id)
      setPublicImages((current) => ({ ...current, [selectedReport.id]: false }))
      setPhotoFile(null)
      setPhotoConsent(false)
      setImageRevision((revision) => revision + 1)
      await loadQueue()
      setSavedDialogMessage('Report photo removed.')
      setSavedDialogOpen(true)
    } catch (photoError) {
      setError(photoError instanceof Error ? photoError.message : 'Unable to remove report photo.')
    } finally {
      setBusy(false)
    }
  }

  // အတည်ပြု dialog မှရွေးထားသော report ကိုဖျက်ပြီး queue ကို ပြန်ဖတ်သည်။
  async function deleteReport() {
    if (!reportToDelete) return
    setBusy(true)
    setDeleteError('')
    try {
      await deleteClimateReport(reportToDelete.id)
      setSavedDialogMessage(`The report "${reportToDelete.issueType}" was permanently deleted.`)
      setReportToDelete(null)
      await loadQueue()
      setSavedDialogOpen(true)
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : 'Unable to delete climate report.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-page climate-review-page">
      <header className="admin-page-top shell climate-review-header">
        <div>
          {reportId ? (
            <Link className="climate-review-back" to="/admin/reports"><ArrowLeft size={15} /> All reports</Link>
          ) : (
            <Link className="climate-review-back" to="/admin" onClick={(event) => { event.preventDefault(); onBack() }}><ArrowLeft size={15} /> Admin dashboard</Link>
          )}
          <p className="eyebrow">Moderation queue</p>
          <h1>{selectedReport ? selectedReport.issueType : 'Community reports'}</h1>
          {!reportId && <p>Review pending submissions and published reports. New Kobo submissions stay private until approved.</p>}
        </div>
        <div className="climate-review-actions">
          {!reportId && (
            <>
              <button
                className="button climate-sync-button"
                type="button"
                onClick={() => void syncSubmissions()}
                disabled={busy}
                aria-busy={busy}
              >
                <RefreshCw className={busy ? 'climate-sync-icon is-spinning' : 'climate-sync-icon'} size={16} />
                <span>{busy ? 'Syncing Kobo…' : 'Sync Kobo'}</span>
              </button>
              <label className="climate-review-status-filter">
                <select value={queueStatus} onChange={(event) => setQueueStatus(event.target.value as 'all' | 'pending' | 'approved')}>
                  <option value="all">All reports</option>
                  <option value="pending">Pending review</option>
                  <option value="approved">Published</option>
                </select>
              </label>
            </>
          )}
          {!reportId && <button className="button button-dark" type="button" onClick={onBack}>Back</button>}
          <button className="button button-dark" type="button" onClick={onLogout}>Logout</button>
        </div>
      </header>
      <section className="shell climate-review-content">
        {error && <p className="climate-review-message error" role="alert">{error}</p>}
        {!reportId ? (
          loadingReports && reports.length === 0 ? (
            <p className="climate-review-empty" role="status">Loading reports…</p>
          ) : reports.length === 0 ? (
            <p className="climate-review-empty">{queueStatus === 'all' ? 'No reports are available.' : queueStatus === 'pending' ? 'No reports are waiting for review.' : 'No reports have been published yet.'}</p>
          ) : (
            <div className="climate-review-table-wrap">
              <table className="climate-review-table">
                <thead>
                  <tr>
                    <th scope="col">Issue type</th>
                    <th scope="col">Township</th>
                    <th scope="col">Date observed</th>
                    <th scope="col">Severity</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <div className="climate-review-table-issues" aria-label={`Issue types: ${getReportIssueTypes(report).map(formatIssueType).join(', ')}`}>
                          {getReportIssueTypes(report).slice(0, 1).map((issueType) => (
                            <span className="climate-review-table-issue" key={`${report.id}-${issueType}`}>{formatIssueType(issueType)}</span>
                          ))}
                        </div>
                      </td>
                      <td>{report.township.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim().toLocaleUpperCase()}</td>
                      <td>{new Date(report.observationDate).toLocaleDateString()}</td>
                      <td><span className={`severity-pill severity-${report.severity}`}>{report.severity}</span></td>
                      <td>
                        <span className={isPublishedReport(report) ? 'verified-label' : 'unverified-label'}>
                          {isPublishedReport(report) ? 'Published' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <Link className="climate-review-table-action" to={`/admin/reports/${encodeURIComponent(report.id)}`}>
                          Review <ArrowRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : selectedReport ? (
          <article className="climate-review-card" key={selectedReport.id}>
            <div className="climate-review-card-heading">
              <div><span className={`severity-pill severity-${selectedReport.severity}`}>{selectedReport.severity}</span></div>
              <span className={isPublishedReport(selectedReport) ? 'verified-label' : 'unverified-label'}>{isPublishedReport(selectedReport) ? 'Published' : 'Pending · not public'}</span>
            </div>
            <p className="climate-review-metadata">{selectedReport.township.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim().toLocaleUpperCase()} · {new Date(selectedReport.observationDate).toLocaleDateString()} · {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}</p>
            <p className="community-observation-issues-label">Issue type</p>
                        <div className="climate-review-table-issues" aria-label={`Issue types: ${getReportIssueTypes(selectedReport).map(formatIssueType).join(', ')}`}>
                          {getReportIssueTypes(selectedReport).slice(0, 1).map((issueType) => (
                            <span className="climate-review-table-issue" key={`${selectedReport.id}-${issueType}`}>{formatIssueType(issueType)}</span>
                          ))}
                        </div>

            <div className="climate-review-image">
              <p className="climate-review-source-label">Report photo</p>
              {selectedReport.hasImage ? (
                <>
                  <p className="climate-review-image-status">Review the photo for faces, personal information, and sensitive locations.</p>
                  <ClimateReportImagePreview reportId={selectedReport.id} refreshKey={imageRevision} />
                  <label className="climate-verification-toggle">
                    <input
                      type="checkbox"
                      checked={publicImages[selectedReport.id] ?? false}
                      disabled={!selectedReport.imageConsentGiven}
                      onChange={(event) => setPublicImages((current) => ({ ...current, [selectedReport.id]: event.target.checked }))}
                    />
                    {selectedReport.imageConsentGiven
                      ? 'Allow this photo to appear on public report cards'
                      : 'Photo cannot be shared publicly: permission was not given'}
                  </label>
                  {selectedReport.imageConsentGiven && (
                    <p className="climate-review-image-status">
                      {selectedReport.publicImageApproved
                        ? 'This photo is public.'
                        : isPublishedReport(selectedReport)
                          ? 'This report is published, but its photo is still private. Check the option above and save to publish it.'
                          : 'The photo will be published with the report only when the option above is checked.'}
                    </p>
                  )}
                  <button className="button climate-reject-button climate-report-photo-remove" type="button" disabled={busy} onClick={() => void removeReportPhoto()}>
                    <Trash2 size={15} /> Remove photo
                  </button>
                </>
              ) : (
                <p className="climate-review-image-status">No photo is attached to this report.</p>
              )}
              <label className="field climate-report-photo-upload">
                <span>{selectedReport.hasImage ? 'Replace photo' : 'Add photo'} (JPEG, PNG, or WebP; up to 5 MB)</span>
                <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(event) => {
                  setPhotoFile(event.target.files?.[0] ?? null)
                  event.target.value = ''
                }}
                />
              </label>
              <label className="climate-verification-toggle">
                <input
                  type="checkbox"
                  checked={photoConsent}
                  disabled={!photoFile || busy}
                  onChange={(event) => setPhotoConsent(event.target.checked)}
                />
                I have permission to share this photo publicly
              </label>
              <p className="climate-review-image-status">Photos stay private unless permission is confirmed and public photo sharing is enabled.</p>
              <button className="button button-dark climate-report-photo-save" type="button" disabled={!photoFile || busy} onClick={() => void saveReportPhoto()}>
                <ImagePlus size={15} /> {selectedReport.hasImage ? 'Save replacement photo' : 'Add photo'}
              </button>
            </div>
            <p className="climate-review-source-label">Imported text for review (personal/contact fields are not imported):</p>
            <label className="field climate-review-description">
              <span>Public description — remove identifying or private details</span>
              <RichTextArea maxLength={1000} value={descriptions[selectedReport.id] ?? ''} onChange={(description) => setDescriptions((current) => ({ ...current, [selectedReport.id]: description }))} placeholder="Write a short, privacy-safe description of the observation." />
            </label>
            {!isPublishedReport(selectedReport) && (
              <>
                <label className="climate-verification-toggle"><input type="checkbox" checked={verification[selectedReport.id] ?? false} onChange={(event) => setVerification((current) => ({ ...current, [selectedReport.id]: event.target.checked }))} /> Mark as verified after checking the report</label>
                <div className="climate-review-buttons">
                  <button className="button button-dark" type="button" disabled={busy} onClick={() => void review(selectedReport, 'approved')}>Approve and publish</button>
                  <button className="button climate-reject-button" type="button" disabled={busy} onClick={() => void review(selectedReport, 'rejected')}>Reject</button>
                  <button className="button climate-reject-button" type="button" disabled={busy} onClick={() => { setDeleteError(''); setReportToDelete(selectedReport) }}><Trash2 size={15} /> Delete</button>
                </div>
              </>
            )}
            {isPublishedReport(selectedReport) && (
              <div className="climate-review-buttons">
                <button className="button button-dark" type="button" disabled={busy} onClick={() => void review(selectedReport, 'approved')}>
                  {publicImages[selectedReport.id] && selectedReport.imageConsentGiven
                    ? 'Save settings and publish photo'
                    : 'Save public card settings'}
                </button>
                <button className="button climate-reject-button" type="button" disabled={busy} onClick={() => { setDeleteError(''); setReportToDelete(selectedReport) }}><Trash2 size={15} /> Delete</button>
              </div>
            )}
          </article>
        ) : loadingReports ? (
          <p className="climate-review-empty" role="status">Loading report…</p>
        ) : (
          <p className="climate-review-empty">This report could not be found.</p>
        )}
      </section>
      <SavedChangeDialog
        open={savedDialogOpen}
        onOpenChange={setSavedDialogOpen}
        message={savedDialogMessage}
      />
      <AlertDialog
        open={reportToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setReportToDelete(null)
            setDeleteError('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{reportToDelete?.issueType}” from the review records and public pages. This action cannot be undone.
            </AlertDialogDescription>
            {deleteError && <p className="climate-review-message error" role="alert">{deleteError}</p>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <button className="button climate-reject-button" type="button" disabled={busy} onClick={() => void deleteReport()}>
              {busy ? 'Deleting…' : 'Delete permanently'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
