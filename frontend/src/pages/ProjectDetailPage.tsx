import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FormattedText } from '@/components/RichText'
import TopNavbar from '@/components/ui/topnavbar'
import Footer from '@/components/ui/footer'
import { fetchProjectById } from '@/services/Api'
import type { CardModel } from '@/services/Api'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [loadState, setLoadState] = useState<{
    id: string | undefined | null
    project: CardModel | null
    error: string
  }>({ id: null, project: null, error: '' })
  const currentLoad = loadState.id === id
  const loading = !currentLoad
  const project = currentLoad ? loadState.project : null
  const error = !id ? 'Project not found.' : currentLoad ? loadState.error : ''

  // URL ရှိ project ID အလိုက် အသေးစိတ်အချက်အလက်ယူပြီး stale request များကို ဖယ်ရှားသည်။
  useEffect(() => {
    const controller = new AbortController()

    if (!id) {
      return () => controller.abort()
    }

    fetchProjectById(id, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        if (!data) {
          setLoadState({ id, project: null, error: 'Project not found.' })
          return
        }

        setLoadState({ id, project: data, error: '' })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadState({ id, project: null, error: 'Unable to load this project right now.' })
        }
      })
    return () => controller.abort()
  }, [id])

  // ထပ်နေသောပုံများကိုဖယ်ပြီး gallery အတွက် ပြသမည့်ပုံစာရင်းကို ပြင်ဆင်သည်။
  const projectImages = project
    ? [...new Set(project.images?.length ? project.images : [project.image])].filter(Boolean)
    : []

  return (
    <div className="app-shell inner-page">
      <TopNavbar />
      <main>
        {loading && (
          <section className="project-detail-page shell project-detail-loading" role="status" aria-label="Loading project details">
            <span className="detail-loading-announcement">Loading project details…</span>
            <div className="project-detail-loading-heading" aria-hidden="true">
              <span className="detail-skeleton project-detail-skeleton-kicker" />
              <span className="detail-skeleton project-detail-skeleton-title" />
              <span className="detail-skeleton project-detail-skeleton-title-short" />
            </div>
            <div className="project-detail-loading-gallery" aria-hidden="true">
              <span className="detail-skeleton project-detail-skeleton-photo project-detail-skeleton-photo-featured" />
              <span className="detail-skeleton project-detail-skeleton-photo" />
              <span className="detail-skeleton project-detail-skeleton-photo" />
            </div>
            <div className="project-detail-loading-content" aria-hidden="true">
              <div>
                <span className="detail-skeleton project-detail-skeleton-label" />
                <span className="detail-skeleton project-detail-skeleton-label-short" />
              </div>
              <div className="project-detail-skeleton-copy">
                <span className="detail-skeleton" />
                <span className="detail-skeleton" />
                <span className="detail-skeleton" />
                <span className="detail-skeleton project-detail-skeleton-line-short" />
              </div>
            </div>
          </section>
        )}

        {!loading && error && (
          <section className="project-detail-page shell">
            <p className="eyebrow">Project unavailable</p>
            <h1>{error}</h1>
            <Link className="button button-dark" to="/programs">
              Back to programs <span>↗</span>
            </Link>
          </section>
        )}

        {!loading && project && (
          <section className="project-detail-page shell">
            <Link className="project-back-link" to="/programs">← All programs</Link>
            <div className="project-detail-header">
              <div className="project-detail-heading">
                <p className="eyebrow">{project.category}</p>
                <h1>{project.title}</h1>
              </div>
              <span className="project-status">{project.status}</span>
            </div>

            {projectImages.length > 0 && (
              <div
                className={`project-detail-gallery${projectImages.length === 1 ? ' project-detail-gallery-single' : ''}`}
                aria-label="Project photos"
              >
                {projectImages.map((image, index) => (
                  <img
                    className={index === 0 ? 'project-detail-photo project-detail-photo-featured' : 'project-detail-photo'}
                    src={image}
                    alt={`${project.title} photo ${index + 1}`}
                    key={`${image.slice(0, 40)}-${index}`}
                  />
                ))}
              </div>
            )}

            <div className="project-detail-content">
              <div className="project-detail-content-label">
                <span>About this program</span>
                <span>Project overview</span>
              </div>
              <FormattedText as="p" text={project.description} />
            </div>

            {!!project.days?.length && (
              <section className="project-days" aria-labelledby="project-days-title">
                <header className="project-days-heading">
                  <p className="eyebrow">The journey</p>
                  <h2 id="project-days-title">Day by day</h2>
                </header>
                <div className="project-days-list">
                  {project.days.map((day, index) => (
                    <article
                      className={`project-day${day.image ? '' : ' project-day-without-image'}`}
                      key={`${day.title}-${index}`}
                    >
                      {day.image && (
                        <img
                          className="project-day-image"
                          src={day.image}
                          alt={`${project.title}: ${day.title}`}
                        />
                      )}
                      <div className="project-day-copy">
                        <span className="project-day-number">DAY {String(index + 1).padStart(2, '0')}</span>
                        <h3>{day.title}</h3>
                        <FormattedText as="p" text={day.description} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </section>
        )}
        <Footer />
      </main>
    </div>
  )
}