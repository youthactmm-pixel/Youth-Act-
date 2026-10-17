import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FormattedText } from '@/components/RichText'
import TopNavbar from '@/components/ui/topnavbar'
import Footer from '@/components/ui/footer'
import { fetchProjectById } from '@/services/Api'
import type { CardModel } from '@/services/Api'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<CardModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setError('Project not found.')
      setLoading(false)
      return
    }

    fetchProjectById(id)
      .then((data) => {
        if (!data) {
          setError('Project not found.')
          return
        }

        setProject(data)
      })
      .catch(() => setError('Unable to load this project right now.'))
      .finally(() => setLoading(false))
  }, [id])

  const projectImages = project
    ? [...new Set(project.images?.length ? project.images : [project.image])].filter(Boolean)
    : []

  return (
    <div className="app-shell inner-page">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={() => undefined} />
      <main>
        {loading && (
          <section className="project-detail-page shell">
            <p className="eyebrow">Loading project</p>
            <h1>Just a moment.</h1>
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
              <div className="project-detail-gallery" aria-label="Project photos">
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
          </section>
        )}
        <Footer />
      </main>
    </div>
  )
}