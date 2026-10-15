import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopNavbar from '@/components/ui/topnavbar'
import Footer from '@/components/ui/footer'
import {
  fetchClimateReports,
  getPublicClimateReportImageUrl,
  type ClimateReport,
} from '@/services/Api'

function ReportPhoto({ report }: { report: ClimateReport }) {
  const [loadFailed, setLoadFailed] = useState(false)

  if (!report.imageUrl || loadFailed) {
    return (
      <p className="story-report-photo-unavailable" role="status">
        {loadFailed
          ? 'The submitted photo could not be loaded.'
          : 'No photo is available for public viewing. Submitted photos appear here only after Kobo consent and YouthAct admin review.'}
      </p>
    )
  }

  return (
    <img
      className="story-report-detail-image"
      src={getPublicClimateReportImageUrl(report.imageUrl)}
      alt={`Submitted photo for the ${report.issueType} observation in ${report.township}`}
      onError={() => setLoadFailed(true)}
    />
  )
}

export default function StoryReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<ClimateReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetchClimateReports(controller.signal)
      .then(({ reports }) => {
        const matchingReport = reports.find((item) => item.id === id)
        if (!matchingReport) {
          setError('This report is unavailable or is no longer public.')
          return
        }
        setReport(matchingReport)
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load this report.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [id])

  return (
    <div className="app-shell inner-page">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={() => undefined} />
      <main>
        <section className="story-report-detail shell">
          <Link className="project-back-link" to="/stories">← Back to stories</Link>
          {loading ? (
            <p className="stories-reports-feedback" role="status">Loading report details…</p>
          ) : error ? (
            <div className="story-report-unavailable" role="alert">
              <p className="eyebrow">Report unavailable</p>
              <h1>{error}</h1>
              <Link className="button button-dark" to="/stories">Back to stories</Link>
            </div>
          ) : report ? (
            <article className="story-report-detail-card">
              <ReportPhoto key={report.id} report={report} />
              <div className="story-report-detail-heading">
                <div>
                  <p className="eyebrow">Community climate report</p>
                  <h1>{report.issueType}</h1>
                  <p className="story-report-detail-location">{report.township}</p>
                </div>
                <div className="story-report-card-meta">
                  <span className={`stories-report-severity stories-report-severity-${report.severity}`}>
                    {report.severity}
                  </span>
                  {report.verified && <span className="verified-label">Verified</span>}
                </div>
              </div>
              <p className="story-report-detail-description">
                {report.description || 'No public description was provided.'}
              </p>
              <dl className="story-report-detail-facts">
                <div>
                  <dt>Observation date</dt>
                  <dd>{new Date(report.observationDate).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt>Township</dt>
                  <dd>{report.township}</dd>
                </div>
                <div>
                  <dt>Severity</dt>
                  <dd>{report.severity}</dd>
                </div>
                <div>
                  <dt>Approximate coordinates</dt>
                  <dd>{report.latitude.toFixed(3)}, {report.longitude.toFixed(3)}</dd>
                </div>
                <div>
                  <dt>Review status</dt>
                  <dd>{report.verified ? 'Verified by YouthAct' : 'Approved for public viewing'}</dd>
                </div>
              </dl>
              <p className="story-report-privacy-note">
                This page shows public-safe information reviewed for sharing. Reporter names,
                contact details, and private Kobo submission data are not displayed.
              </p>
            </article>
          ) : null}
        </section>
        <Footer />
      </main>
    </div>
  )
}
