import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopNavbar from '@/components/ui/topnavbar'
import Footer from '@/components/ui/footer'
import { fetchProjectById } from '@/services/Api'
import type { CardModel } from '@/types/card'

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
              <div>
                <p className="eyebrow">{project.category}</p>
                <h1>{project.title}</h1>
              </div>
              <span className="project-status">{project.status}</span>
            </div>
            <div className="project-detail-content">
              <p>{project.description}</p>
              <p>Every project starts with a question and grows through people, ideas, and action. Explore how this work creates room for young people to contribute.</p>
            </div>
          </section>
        )}
        <Footer />
      </main>
    </div>
  )
}