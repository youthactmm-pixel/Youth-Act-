import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react'
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
  syncKoboClimateReports,
  type ClimateReport,
} from '@/services/Api'

function ClimateReportImagePreview({ reportId }: { reportId: string }) {
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
  }, [reportId])

  if (error) return <p className="climate-review-image-error" role="alert">{error}</p>
  if (!imageUrl) return <p className="climate-review-image-loading" role="status">Loading submitted photo…</p>
  return <img className="climate-review-image-preview" src={imageUrl} alt="Submitted climate report for admin review" />
}

type ClimateReportReviewPageProps = {
  onBack: () => void
  onLogout: () => void
}

export default function ClimateReportReviewPage({ onBack, onLogout }: ClimateReportReviewPageProps) {
  // Queue ထဲက report များနှင့် per-report ပြင်ဆင်ချက်များကို key ဖြင့်ထိန်းကာ card controls သို့ပြန်ချိတ်သည်။
  const [reports, setReports] = useState<ClimateReport[]>([])
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [verification, setVerification] = useState<Record<string, boolean>>({})
  const [publicImages, setPublicImages] = useState<Record<string, boolean>>({})
  const [queueStatus, setQueueStatus] = useState<'pending' | 'approved'>('pending')
  const [error, setError] = useState('')
  const [savedDialogOpen, setSavedDialogOpen] = useState(false)
  const [savedDialogMessage, setSavedDialogMessage] = useState('')
  const [reportToDelete, setReportToDelete] = useState<ClimateReport | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [busy, setBusy] = useState(false)

  // ရွေးထားသော queue ကိုရယူပြီး မပြင်ရသေးသော description/verification/photo အခြေအနေများကို report data ဖြင့်ဖြည့်သည်။
  const loadQueue = useCallback(async () => {
    setError('')
    try {
      const queuedReports = await fetchClimateReportsForReview(queueStatus)
      setReports(queuedReports)
      setDescriptions((current) => Object.fromEntries(queuedReports.map((report) => [
        report.id,
        current[report.id] ?? (queueStatus === 'approved' ? report.approvedDescription : report.sourceDescription) ?? '',
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
      setError(loadError instanceof Error ? loadError.message : 'Unable to load pending reports.')
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
    if (status === 'approved' && queueStatus === 'pending' && !descriptions[report.id]?.trim()) {
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
          <Link className="climate-review-back" to="/admin" onClick={(event) => { event.preventDefault(); onBack() }}><ArrowLeft size={15} /> Admin dashboard</Link>
          <p className="eyebrow">Moderation queue</p>
          <h1>Community reports</h1>
          <p>New Kobo submissions stay private until a YouthAct administrator reviews and approves them. Review each submitted image before explicitly allowing it on public story cards. Never publish photos with identifying or sensitive details.</p>
        </div>
        <div className="climate-review-actions">
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
            <select value={queueStatus} onChange={(event) => setQueueStatus(event.target.value as 'pending' | 'approved')}>
              <option value="pending">Pending review</option>
              <option value="approved">Published</option>
            </select>
          </label>
          <button className="button button-dark" type="button" onClick={onBack}>Back</button>
          <button className="button button-dark" type="button" onClick={onLogout}>Logout</button>
        </div>
      </header>
      <section className="shell climate-review-content">
        {/* Queue state ကိုလိုက်၍ report cards, image consent, ပြင်ဆင်နိုင်သောစာသားနှင့် moderation actions ပြသည်။ */}
        {error && <p className="climate-review-message error" role="alert">{error}</p>}
        {reports.length === 0 ? <p className="climate-review-empty">{queueStatus === 'pending' ? 'No reports are waiting for review.' : 'No reports have been published yet.'}</p> : reports.map((report) => (
          <article className="climate-review-card" key={report.id}>
            <div className="climate-review-card-heading">
              <div><span className={`severity-pill severity-${report.severity}`}>{report.severity}</span><h2>{report.issueType}</h2></div>
              <span className={queueStatus === 'approved' ? 'verified-label' : 'unverified-label'}>{queueStatus === 'approved' ? 'Published' : 'Pending · not public'}</span>
            </div>
            <p className="climate-review-metadata">{report.township} · {new Date(report.observationDate).toLocaleDateString()} · {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p>
            {report.hasImage && (
              <div className="climate-review-image">
                <p className="climate-review-source-label">Submitted photo — review for faces, personal information, and sensitive locations:</p>
                <ClimateReportImagePreview reportId={report.id} />
                <label className="climate-verification-toggle">
                  <input
                    type="checkbox"
                    checked={publicImages[report.id] ?? false}
                    disabled={!report.imageConsentGiven}
                    onChange={(event) => setPublicImages((current) => ({ ...current, [report.id]: event.target.checked }))}
                  />
                  {report.imageConsentGiven
                    ? 'Allow this photo to appear on public report cards'
                    : 'Photo cannot be shared publicly: Kobo consent was not given'}
                </label>
                {report.imageConsentGiven && (
                  <p className="climate-review-image-status">
                    {report.publicImageApproved
                      ? 'This photo is public.'
                      : queueStatus === 'approved'
                        ? 'This report is published, but its photo is still private. Check the option above and save to publish it.'
                        : 'The photo will be published with the report only when the option above is checked.'}
                  </p>
                )}
              </div>
            )}
            {!report.hasImage && (
              <p className="climate-review-image-status">
                No Kobo photo is linked to this report yet. Use Sync Kobo to refresh its attachment details.
              </p>
            )}
            <p className="climate-review-source-label">Imported text for review (personal/contact fields are not imported):</p>
            <label className="field climate-review-description">
              <span>Public description — remove identifying or private details</span>
              <RichTextArea maxLength={1000} value={descriptions[report.id] ?? ''} onChange={(description) => setDescriptions((current) => ({ ...current, [report.id]: description }))} placeholder="Write a short, privacy-safe description of the observation." />
            </label>
            {queueStatus === 'pending' && (
              <>
                <label className="climate-verification-toggle"><input type="checkbox" checked={verification[report.id] ?? false} onChange={(event) => setVerification((current) => ({ ...current, [report.id]: event.target.checked }))} /> Mark as verified after checking the report</label>
                <div className="climate-review-buttons">
                  <button className="button button-dark" type="button" disabled={busy} onClick={() => void review(report, 'approved')}>Approve and publish</button>
                  <button className="button climate-reject-button" type="button" disabled={busy} onClick={() => void review(report, 'rejected')}>Reject</button>
                  <button className="button climate-reject-button" type="button" disabled={busy} onClick={() => { setDeleteError(''); setReportToDelete(report) }}><Trash2 size={15} /> Delete</button>
                </div>
              </>
            )}
            {queueStatus === 'approved' && (
              <div className="climate-review-buttons">
                <button className="button button-dark" type="button" disabled={busy} onClick={() => void review(report, 'approved')}>
                  {publicImages[report.id] && report.imageConsentGiven
                    ? 'Save settings and publish photo'
                    : 'Save public card settings'}
                </button>
                <button className="button climate-reject-button" type="button" disabled={busy} onClick={() => { setDeleteError(''); setReportToDelete(report) }}><Trash2 size={15} /> Delete</button>
              </div>
            )}
          </article>
        ))}
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
