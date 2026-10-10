import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopNavbar from '@/components/ui/topnavbar'
import Footer from '@/components/ui/footer'
import { fetchStories, type StoryModel } from '@/services/Api'

const featuredStories: StoryModel[] = [
  { id: 'featured-first-spark', title: 'The first spark', type: 'Field notes', description: 'How a simple question became a neighborhood project for cleaner, cooler streets.', image: '/youthact2.jpg', status: 'active' },
  { id: 'featured-place-to-begin', title: 'A place to begin', type: 'People', description: 'Meet the young organizers creating new ways to care for the places they call home.', image: '/youthact1.jpg', status: 'active' },
  { id: 'featured-keep-going', title: 'Keep going', type: 'Conversations', description: 'An honest conversation about momentum, uncertainty, and making change together.', image: '/youthact-Photoroom.png', status: 'active' },
]

export default function StoriesPage() {
  const [stories, setStories] = useState<StoryModel[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStories()
      .then(setStories)
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load community stories.')
      })
  }, [])

  const visibleStories = stories.length > 0 ? stories : featuredStories

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

        <section className="stories-list shell">
          {error && <p className="stories-feedback" role="alert">{error}</p>}
          {visibleStories.map((story, index) => (
            <article className="story-row" key={story.id}>
              <div className="story-number">{String(index + 1).padStart(2, '0')}</div>
              <img src={story.image} alt="" />
              <div className="story-content">
                <p className="eyebrow">{story.type}</p>
                <h2>{story.title}</h2>
                <p className="body-copy">{story.description}</p>
                {story.id.startsWith('featured-') && <Link className="text-link" to="/community-map">Explore the community <span>↗</span></Link>}
              </div>
            </article>
          ))}
        </section>
        <Footer/>
      </main>
    </div>
  )
}
