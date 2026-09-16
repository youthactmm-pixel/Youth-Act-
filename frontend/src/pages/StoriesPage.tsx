import TopNavbar from '@/components/ui/topnavbar'
import Footer
 from '@/components/ui/footer'
const stories = [
  { number: '01', title: 'The first spark', type: 'Field notes', description: 'How a simple question became a neighborhood project for cleaner, cooler streets.', image: '/youthact2.jpg' },
  { number: '02', title: 'A place to begin', type: 'People', description: 'Meet the young organizers creating new ways to care for the places they call home.', image: '/youthact1.jpg' },
  { number: '03', title: 'Keep going', type: 'Conversations', description: 'An honest conversation about momentum, uncertainty, and making change together.', image: '/youthact-Photoroom.png' },
]

export default function StoriesPage() {
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
          {stories.map((story) => (
            <article className="story-row" key={story.number}>
              <div className="story-number">{story.number}</div>
              <img src={story.image} alt="" />
              <div className="story-content">
                <p className="eyebrow">{story.type}</p>
                <h2>{story.title}</h2>
                <p className="body-copy">{story.description}</p>
                <a className="text-link" href="#connect">Read story <span>↗</span></a>
              </div>
            </article>
          ))}
        </section>
        <Footer/>
      </main>
    </div>
  )
}
