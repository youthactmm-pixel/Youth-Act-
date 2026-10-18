import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { FormattedText } from '@/components/RichText'
import TopNavbar from '@/components/ui/topnavbar'
import Footer from '@/components/ui/footer'
import {
  fetchClimateReports,
  getPublicClimateReportImageUrl,
  type ClimateReport,
} from '@/services/Api'

export default function StoriesPage() {
  const [reports, setReports] = useState<ClimateReport[]>([])
  const [reportsError, setReportsError] = useState('')
  const [reportsLoading, setReportsLoading] = useState(true)
  // အများပြည်သူမြင်နိုင်သော report များကိုယူပြီး request ကို cleanup လုပ်ကာ loading/error ကိုညှိသည်။
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

  // ရွေးချယ်မှုကုဒ်များကို ဖတ်ရလွယ်သည့် issue အမည်များအဖြစ် ပြောင်းပေးသည်။
  function displayIssueType(issueType: string) {
    if (!issueType) return 'Not specified'

    return issueType
      .split(/[|,]/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) =>
        value
          .replace(/[_-]+/g, ' ')
          .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      )
      .join(', ')
  }

  function reportIssueTypes(report: ClimateReport) {
    const issueTypes = Array.isArray(report.issueType)
      ? report.issueType
      : typeof report.issueType === 'string'
        ? report.issueType.split(/[|,]/)
        : []

    return issueTypes
      .map((value) => String(value).trim())
      .filter(Boolean)
  }

  function issueTypeLabel(choice: any): import('react').ReactNode {
    return displayIssueType(String(choice ?? ''))
  }

  return (
    <div className="app-shell inner-page">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={() => undefined} />
      <main>
        <section className="stories-hero shell">
          <div className="stories-hero-copy">
            <p className="eyebrow">From the community</p>
            <h1>Real stories.<br /><em>Local action.</em></h1>
            <p className="stories-hero-intro">
              Meet the people, places, and observations inspiring a more
              resilient future for our communities.
            </p>
            <button
              className="stories-hero-link"
              type="button"
              onClick={() => document.getElementById('community-reports')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Read community reports <ArrowDown size={17} aria-hidden="true" />
            </button>
          </div>
          <div className="stories-hero-visual">
            <img src="/nature.jpg" alt="Green landscape reflecting the communities caring for their environment" />
            <div className="stories-hero-note">
              <span>YOUTHACT · COMMUNITY VOICES</span>
              <strong>Every voice<br />can move us forward.</strong>
              <ArrowRight size={19} aria-hidden="true" />
            </div>
            <span className="stories-hero-caption">Stories rooted in our communities.</span>
          </div>
        </section>
        <section className="stories-reports shell" id="community-reports" aria-labelledby="stories-reports-title">
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
                  <ul className="community-observation-issues" aria-label={`Issue type: ${displayIssueType(report.issueType)}`}>
                    {reportIssueTypes(report).slice(0, 1).map((choice) => (
                      <li key={`${report.id}-${choice}`}>{issueTypeLabel(choice)}</li>
                    ))}
                  </ul>
                    <FormattedText
                      as="p"
                      className={`stories-report-description${report.description ? '' : ' is-empty'}`}
                      text={report.description || 'No public description was provided.'}
                    />
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
