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

  // form အချက်အလက်နှင့် တင်သွင်းချက်များကို သီးခြားယူကာ စာမျက်နှာမှထွက်လျှင် request များကိုဖျက်သိမ်းသည်။
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
      <TopNavbar />
      <main>
        <section className="kobo-form-page shell">
          <Link className="project-back-link" to="/community-map">← Community map</Link>

          {loading && (
            <div className="kobo-form-loading" role="status" aria-label="Loading form details">
              <span className="kobo-form-loading-announcement">Loading form details…</span>
              <div className="kobo-form-loading-hero" aria-hidden="true">
                <span className="kobo-form-skeleton kobo-form-skeleton-status" />
                <div className="kobo-form-loading-copy">
                  <span className="kobo-form-skeleton kobo-form-skeleton-kicker" />
                  <span className="kobo-form-skeleton kobo-form-skeleton-title" />
                  <span className="kobo-form-skeleton kobo-form-skeleton-title kobo-form-skeleton-title-short" />
                  <span className="kobo-form-skeleton kobo-form-skeleton-caption" />
                </div>
              </div>
              <div className="kobo-form-loading-panel" aria-hidden="true">
                <span className="kobo-form-skeleton kobo-form-skeleton-kicker" />
                <span className="kobo-form-skeleton kobo-form-skeleton-description" />
                <span className="kobo-form-skeleton kobo-form-skeleton-description kobo-form-skeleton-description-short" />
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="kobo-form-feedback" role="alert">
              <p className="eyebrow">Form unavailable</p>
              <h1>{error}</h1>
              <p>Please try again later or contact the YouthAct team for help.</p>
            </div>
          )}

          {/* form ရလာမှ မိတ်ဆက်အချက်အလက်နှင့် ဖြေဆိုရန်လင့်ခ်ကို ပြသသည်။ */}
          {!loading && form && (
            <>
              <header className="kobo-form-hero">
                <img
                  className="kobo-form-hero-image"
                  src="/nature.jpg"
                  alt=""
                  aria-hidden="true"
                />
                <div className="kobo-form-hero-content">
                  <p className="eyebrow">Take part with YouthAct</p>
                  <h1>{form.title}</h1>
                  <p className="kobo-form-hero-caption">
                    Your observations help build a clearer picture of local needs.
                  </p>
                </div>
                <span className={`kobo-form-status${form.active ? '' : ' is-inactive'}`}>
                  <span className="kobo-form-status-dot" aria-hidden="true" />
                  {form.active ? 'Open for responses' : 'Not currently accepting responses'}
                </span>
              </header>

              <div className="kobo-form-intro">
                <div className="kobo-form-intro-copy">
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
                    <span>Participate in the survey</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
                {form.active && !form.participationUrl && (
                  <p className="kobo-form-link-unavailable" role="status">
                    The form is open, but its participation link is not available right now.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
        <Footer />
      </main>
    </div>
  )
}
