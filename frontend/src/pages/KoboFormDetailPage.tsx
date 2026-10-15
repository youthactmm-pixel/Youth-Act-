import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Footer from '@/components/ui/footer'
import TopNavbar from '@/components/ui/topnavbar'
import {
  fetchKoboFormDetails,
  fetchKoboFormSubmissions,
  type ClimateReport,
  type KoboFormDetails,
} from '@/services/Api'

export default function KoboFormDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [result, setResult] = useState<{
    id: string
    form: KoboFormDetails | null
    error: string
  } | null>(null)
  const [submissionResult, setSubmissionResult] = useState<{
    id: string
    reports: ClimateReport[]
    error: string
  } | null>(null)

  useEffect(() => {
    if (!id) return

    const controller = new AbortController()
    fetchKoboFormDetails(id, controller.signal)
      .then((form) => setResult({ id, form, error: '' }))
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            id,
            form: null,
            error: loadError instanceof Error ? loadError.message : 'Unable to load this Kobo form.',
          })
        }
      })
    fetchKoboFormSubmissions(id, controller.signal)
      .then((reports) => setSubmissionResult({ id, reports, error: '' }))
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setSubmissionResult({
            id,
            reports: [],
            error: loadError instanceof Error ? loadError.message : 'Unable to load community submissions.',
          })
        }
      })

    return () => controller.abort()
  }, [id])

  const currentResult = result && result.id === id ? result : null
  const loading = Boolean(id) && currentResult?.id !== id
  const form = currentResult?.form ?? null
  const error = id
    ? currentResult ? currentResult.error : ''
    : 'This Kobo form could not be found.'
  const currentSubmissionResult = submissionResult && submissionResult.id === id
    ? submissionResult
    : null
  const submissionsLoading = Boolean(id) && !currentSubmissionResult
  const submissions = currentSubmissionResult?.reports ?? []

  return (
    <div className="app-shell inner-page">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={() => undefined} />
      <main>
        <section className="kobo-form-page shell">
          <Link className="project-back-link" to="/community-map">← Community map</Link>

          {loading && (
            <div className="kobo-form-feedback" role="status">
              <p className="eyebrow">Loading form</p>
              <h1>One moment.</h1>
            </div>
          )}

          {!loading && error && (
            <div className="kobo-form-feedback" role="alert">
              <p className="eyebrow">Form unavailable</p>
              <h1>{error}</h1>
              <p>Please try again later or contact the YouthAct team for help.</p>
            </div>
          )}

          {!loading && form && (
            <>
              <header className="kobo-form-header">
                <div>
                  <p className="eyebrow">Take part with YouthAct</p>
                  <h1>{form.title}</h1>
                </div>
                <span className={`kobo-form-status${form.active ? '' : ' is-inactive'}`}>
                  {form.active ? 'Open for responses' : 'Not currently accepting responses'}
                </span>
              </header>

              <div className="kobo-form-intro">
                <div>
                  <p className="eyebrow">About this form</p>
                  <p className="kobo-form-description">
                    {form.description || 'Share what you have noticed and help build a clearer picture of local needs.'}
                  </p>
                </div>
                {form.active && form.participationUrl && (
                  <a
                    className="button button-dark"
                    href={form.participationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Participate in the survey <span aria-hidden="true">↗</span>
                  </a>
                )}
                {form.active && !form.participationUrl && (
                  <p className="kobo-form-link-unavailable" role="status">
                    The form is open, but its participation link is not available right now.
                  </p>
                )}
              </div>

              <section className="kobo-submissions" aria-labelledby="kobo-submissions-heading">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">From the community</p>
                    <h2 id="kobo-submissions-heading">Submitted observations.</h2>
                  </div>
                  <p className="body-copy">
                    Approved observations shared through this form. Personal contact details are not displayed.
                  </p>
                </div>

                {submissionsLoading && (
                  <p className="kobo-form-empty" role="status">Loading approved observations…</p>
                )}
                {!submissionsLoading && currentSubmissionResult?.error && (
                  <p className="kobo-form-empty" role="alert">
                    Community submissions could not be loaded. {currentSubmissionResult.error}
                  </p>
                )}
                {!submissionsLoading && !currentSubmissionResult?.error && submissions.length === 0 && (
                  <p className="kobo-form-empty">There are no approved observations to show yet.</p>
                )}
                {!submissionsLoading && !currentSubmissionResult?.error && submissions.length > 0 && (
                  <div className="kobo-submission-list">
                    {submissions.map((report) => (
                      <article className="kobo-submission-card" key={report.id}>
                        <div className="kobo-submission-card-header">
                          <p className="eyebrow">{report.township}</p>
                          <span className={`kobo-severity kobo-severity-${report.severity}`}>
                            {report.severity}
                          </span>
                        </div>
                        <h3>{report.issueType}</h3>
                        <p className="kobo-submission-date">
                          Observed {new Date(report.observationDate).toLocaleDateString()}
                        </p>
                        {report.description && <p className="kobo-submission-description">{report.description}</p>}
                        {report.verified && <span className="verified-label">Verified</span>}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="kobo-questions" aria-labelledby="kobo-questions-heading">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">What we will ask</p>
                    <h2 id="kobo-questions-heading">A few questions.<br /><em>A bigger picture.</em></h2>
                  </div>
                  <p className="body-copy">
                    Your answers help us understand experiences and priorities in the community.
                  </p>
                </div>
                {form.questions.length > 0 ? (
                  <ol className="kobo-question-list">
                    {form.questions.map((question, index) => (
                      <li className="kobo-question-card" key={`${question.name}-${index}`}>
                        <span className="kobo-question-number">{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <h3>{question.label}</h3>
                          <p>{question.type}{question.required ? ' · Required' : ''}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="kobo-form-empty">Question details are not available for this form.</p>
                )}
              </section>
            </>
          )}
        </section>
        <Footer />
      </main>
    </div>
  )
}
