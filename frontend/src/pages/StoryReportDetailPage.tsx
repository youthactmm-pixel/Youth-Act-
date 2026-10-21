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

  // အများပြည်သူခွင့်ပြုထားသောပုံကိုသာပြပြီး ပုံမရှိ/မတင်နိုင်လျှင် အခြေအနေစာပြသည်။
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
  const [loadState, setLoadState] = useState<{
    id: string | undefined | null
    report: ClimateReport | null
    error: string
  }>({ id: null, report: null, error: '' })
  const currentLoad = loadState.id === id
  const loading = !currentLoad
  const report = currentLoad ? loadState.report : null
  const error = currentLoad ? loadState.error : ''

  // အများပြည်သူဖတ်ရှုနိုင်သော report များထဲမှ URL ID နှင့်ကိုက်ညီသည်ကိုရှာသည်။
  useEffect(() => {
    const controller = new AbortController()

    fetchClimateReports(controller.signal)
      .then(({ reports }) => {
        const matchingReport = reports.find((item) => item.id === id)
        if (!matchingReport) {
          setLoadState({
            id,
            report: null,
            error: 'This report is unavailable or is no longer public.',
          })
          return
        }
        setLoadState({ id, report: matchingReport, error: '' })
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setLoadState({
            id,
            report: null,
            error: loadError instanceof Error ? loadError.message : 'Unable to load this report.',
          })
        }
      })

    return () => controller.abort()
  }, [id])

  return (
    <div className="app-shell inner-page">
      <TopNavbar />
      <main>
        <section className="story-report-detail shell">
          <Link className="story-report-back" to="/stories"><ArrowLeft size={16} /> All stories</Link>
          {loading ? (
            <div className="story-report-loading-card" role="status" aria-label="Loading community report">
              <span className="detail-loading-announcement">Loading observation details…</span>
              <div className="detail-skeleton story-report-loading-cover" aria-hidden="true" />
              <div className="story-report-loading-body" aria-hidden="true">
                <div className="story-report-loading-heading">
                  <div className="story-report-loading-title">
                    <span className="detail-skeleton story-report-skeleton-kicker" />
                    <span className="detail-skeleton story-report-skeleton-title" />
                    <span className="detail-skeleton story-report-skeleton-location" />
                  </div>
                  <span className="detail-skeleton story-report-skeleton-badge" />
                </div>
                <div className="story-report-loading-columns">
                  <div className="story-report-loading-copy">
                    <span className="detail-skeleton story-report-skeleton-section-label" />
                    <span className="detail-skeleton" />
                    <span className="detail-skeleton" />
                    <span className="detail-skeleton" />
                    <span className="detail-skeleton story-report-skeleton-line-short" />
                  </div>
                  <div className="story-report-loading-copy">
                    <span className="detail-skeleton story-report-skeleton-section-label" />
                    <span className="detail-skeleton" />
                    <span className="detail-skeleton" />
                    <span className="detail-skeleton" />
                  </div>
                </div>
              </div>
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
