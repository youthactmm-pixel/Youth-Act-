import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopNavbar from '@/components/ui/topnavbar'
import Footer from '@/components/ui/footer'
import {
  fetchClimateReports,
  fetchStories,
  getPublicClimateReportImageUrl,
  type ClimateReport,
  type StoryModel,
} from '@/services/Api'

export default function StoriesPage() {
  const [reports, setReports] = useState<ClimateReport[]>([])
  const [reportsError, setReportsError] = useState('')
  const [reportsLoading, setReportsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    fetchClimateReports(controller.signal)
      .then((data) => setReports(data.reports))
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setReportsError(loadError instanceof Error ? loadError.message : 'Unable to load community reports.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setReportsLoading(false)
      })

    return () => controller.abort()
  }, [])

  return (
    <div className="app-shell inner-page">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={() => undefined} />
      <main>
        <section className="page-hero shell">
          <div>
            <p className="eyebrow">From the community</p>
            <h1>Stories that<br /><em>keep us moving.</em></h1>
          </div>
          <p className="page-hero-copy">Every action starts somewhere. These are the people, questions, and small victories shaping the YouthAct community.</p>
        </section>
        <section className="stories-reports shell" aria-labelledby="stories-reports-title">
          <div className="stories-reports-heading">
            <div>
              <p className="eyebrow">Community field reports</p>
              <h2 id="stories-reports-title">Observations from the ground.</h2>
              <p>Climate and environmental reports shared by community members and reviewed by YouthAct.</p>
            </div>
            <Link className="text-link" to="/community-map">Explore the climate map <span aria-hidden="true">↗</span></Link>
          </div>

          {reportsLoading ? (
            <p className="stories-reports-feedback" role="status">Loading approved community reports…</p>
          ) : reportsError ? (
            <p className="stories-reports-feedback" role="alert">{reportsError}</p>
          ) : reports.length === 0 ? (
            <p className="stories-reports-feedback">No approved reports are available yet. New submissions appear here after review.</p>
          ) : (
            <div className="stories-report-grid">
              {reports.map((report) => (
                <Link
                  className="stories-report-card"
                  key={report.id}
                  to={`/stories/reports/${encodeURIComponent(report.id)}`}
                  aria-label={`View details for ${report.issueType} report in ${report.township}`}
                >
                  {report.imageUrl && (
                    <img
                      className="stories-report-image"
                      src={getPublicClimateReportImageUrl(report.imageUrl)}
                      alt={`${report.issueType} observation in ${report.township}`}
                      loading="lazy"
                    />
                  )}
                  <div className="stories-report-card-content">
                    <div className="stories-report-card-meta">
                      <span className={`stories-report-severity stories-report-severity-${report.severity}`}>
                        {report.severity}
                      </span>
                      {report.verified && <span className="verified-label">Verified</span>}
                    </div>
                    <p className="stories-report-location">
                      {report.township} · {new Date(report.observationDate).toLocaleDateString()}
                    </p>
                    <h3>{report.issueType}</h3>
                    <p className={`stories-report-description${report.description ? '' : ' is-empty'}`}>
                      {report.description || 'No public description was provided.'}
                    </p>
                    <span className="stories-report-read-more">View report details →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        <Footer/>
      </main>
    </div>
  )
}
