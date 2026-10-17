import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck } from 'lucide-react'
import { FormattedText } from '@/components/RichText'
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
          <Link className="story-report-back" to="/stories"><ArrowLeft size={16} /> All stories</Link>
          {loading ? (
            <div className="story-report-state" role="status">
              <span className="eyebrow">Community report</span>
              <p>Loading observation details…</p>
            </div>
          ) : error ? (
            <div className="story-report-state story-report-unavailable" role="alert">
              <span className="eyebrow">Report unavailable</span>
              <h1>{error}</h1>
              <Link className="story-report-back" to="/stories"><ArrowLeft size={16} /> Back to stories</Link>
            </div>
          ) : report ? (
            <article className="story-report-detail-card">
              <div className="story-report-detail-cover">
                <ReportPhoto key={report.id} report={report} />
                <span className="story-report-cover-label">Community field report</span>
              </div>
              <div className="story-report-detail-body">
                <div className="story-report-detail-heading">
                  <div className="story-report-title-group">
                    <p className="eyebrow">Community climate report</p>
                    <p className="story-report-detail-location"><MapPin size={15} /> {report.township}</p>
                  </div>
                  <div className="story-report-detail-badges">
                    <span className={`stories-report-severity stories-report-severity-${report.severity}`}>
                      {report.severity}
                    </span>
                    {report.verified && <span className="story-report-verified"><ShieldCheck size={14} /> Verified</span>}
                  </div>
                </div>
                <div className="story-report-detail-content">
                  <section className="story-report-description-panel">
                    <p className="story-report-section-label">What was observed</p>
                    <FormattedText
                      as="p"
                      className="story-report-detail-description"
                      text={report.description || 'No public description was provided.'}
                    />
                  </section>
                  <section className="story-report-facts-panel" aria-label="Report information">
                    <p className="story-report-section-label">Report information</p>
                    <dl className="story-report-detail-facts">
                      <div>
                        <dt><CalendarDays size={14} /> Observation date</dt>
                        <dd>{new Date(report.observationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
                      </div>
                      <div>
                        <dt><MapPin size={14} /> Location</dt>
                        <dd>{report.township}</dd>
                      </div>
                      <div>
                        <dt>Severity</dt>
                        <dd className="story-report-severity-value">{report.severity}</dd>
                      </div>
                      <div>
                        <dt>Approximate coordinates</dt>
                        <dd>{report.latitude.toFixed(3)}, {report.longitude.toFixed(3)}</dd>
                      </div>
                      <div>
                        <dt><ShieldCheck size={14} /> Review status</dt>
                        <dd>{report.verified ? 'Verified by YouthAct' : 'Approved for public viewing'}</dd>
                      </div>
                    </dl>
                  </section>
                </div>
                <p className="story-report-privacy-note">
                  Reporter names, contact details, and private Kobo submission data are not displayed.
                </p>
              </div>
            </article>
          ) : null}
        </section>
        <Footer />
      </main>
    </div>
  )
}
