import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import {
  fetchClimateReportsForReview,
  moderateClimateReport,
  syncKoboClimateReports,
  type ClimateReport,
} from '@/services/Api'

type ClimateReportReviewPageProps = {
  onBack: () => void
  onLogout: () => void
}

export default function ClimateReportReviewPage({ onBack, onLogout }: ClimateReportReviewPageProps) {
  const [reports, setReports] = useState<ClimateReport[]>([])
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [verification, setVerification] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const loadQueue = useCallback(async () => {
    setError('')
    try {
      const pendingReports = await fetchClimateReportsForReview()
      setReports(pendingReports)
      setDescriptions((current) => Object.fromEntries(pendingReports.map((report) => [report.id, current[report.id] ?? report.sourceDescription ?? ''])))
      setVerification((current) => Object.fromEntries(pendingReports.map((report) => [report.id, current[report.id] ?? false])))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load pending reports.')
    }
  }, [])

  useEffect(() => { void loadQueue() }, [loadQueue])

  async function syncSubmissions() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await syncKoboClimateReports()
      setNotice(`${result.imported} Kobo submission(s) checked. New reports are held for review.`)
      await loadQueue()
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Kobo submissions could not be synced.')
    } finally {
      setBusy(false)
    }
  }

  async function review(report: ClimateReport, status: 'approved' | 'rejected') {
    if (status === 'approved' && !descriptions[report.id]?.trim()) {
      setError('Add a privacy-reviewed public description before approving.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await moderateClimateReport(report.id, {
        status,
        approvedDescription: status === 'approved' ? descriptions[report.id] : '',
        verified: status === 'approved' && Boolean(verification[report.id]),
      })
      setNotice(status === 'approved' ? 'Report approved and published.' : 'Report rejected and kept off the public map.')
      await loadQueue()
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Report review could not be saved.')
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
          <p>Review Kobo submissions before they appear on the public map. Only the approved description is published; never include names, contact details, addresses, or photo links.</p>
        </div>
        <div className="climate-review-actions">
          <button className="button button-dark" type="button" onClick={() => void syncSubmissions()} disabled={busy}><RefreshCw size={16} /> Sync Kobo</button>
          <button className="button button-dark" type="button" onClick={onBack}>Back</button>
          <button className="button button-dark" type="button" onClick={onLogout}>Logout</button>
        </div>
      </header>
      <section className="shell climate-review-content">
        {error && <p className="climate-review-message error" role="alert">{error}</p>}
        {notice && <p className="climate-review-message" role="status">{notice}</p>}
        {reports.length === 0 ? <p className="climate-review-empty">No reports are waiting for review.</p> : reports.map((report) => (
          <article className="climate-review-card" key={report.id}>
            <div className="climate-review-card-heading">
              <div><span className={`severity-pill severity-${report.severity}`}>{report.severity}</span><h2>{report.issueType}</h2></div>
              <span className="unverified-label">Pending · not public</span>
            </div>
            <p className="climate-review-metadata">{report.township} · {new Date(report.observationDate).toLocaleDateString()} · {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p>
            <p className="climate-review-source-label">Imported text for review (photos and personal/contact fields are not imported):</p>
            <label className="field climate-review-description">
              <span>Public description — remove identifying or private details</span>
              <textarea maxLength={1000} value={descriptions[report.id] ?? ''} onChange={(event) => setDescriptions((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="Write a short, privacy-safe description of the observation." />
            </label>
            <label className="climate-verification-toggle"><input type="checkbox" checked={verification[report.id] ?? false} onChange={(event) => setVerification((current) => ({ ...current, [report.id]: event.target.checked }))} /> Mark as verified after checking the report</label>
            <div className="climate-review-buttons">
              <button className="button button-dark" type="button" disabled={busy} onClick={() => void review(report, 'approved')}>Approve and publish</button>
              <button className="button climate-reject-button" type="button" disabled={busy} onClick={() => void review(report, 'rejected')}>Reject</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
