import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { FormattedText } from '@/components/RichText'
import TopNavbar from '@/components/ui/topnavbar'
import { fetchCards, type CardModel } from '@/services/Api'
import Footer from '@/components/ui/footer'

const fallbackPrograms: CardModel[] = [
]
const LATEST_PROGRAMS_LIMIT = 3

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<CardModel[]>(fallbackPrograms)

  useEffect(() => {
    fetchCards().then((cards) => setPrograms(cards.slice(0, LATEST_PROGRAMS_LIMIT))).catch(() => undefined)
  }, [])

  return (
    <div className="app-shell inner-page">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={() => undefined} />
      <main>
        <section className="programs-hero shell">
          <div className="programs-hero-copy">
            <p className="eyebrow">Find your way in</p>
            <h1>There’s always <em>room for you.</em></h1>
            <p className="programs-hero-intro">
              Bring your questions, your energy, and whatever you’re curious
              about. Start wherever feels right.
            </p>
            <a
              className="programs-hero-link"
              href="#program-list"
              onClick={(event) => {
                event.preventDefault()
                document.getElementById('program-list')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Explore our programs <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="programs-hero-visual">
            <img src="/nature.jpg" alt="A green landscape representing a healthier future" />
            <div className="programs-hero-note">
              <span>YOUTHACT · OUR PROGRAMS</span>
              <strong>Big change<br />starts together.</strong>
              <ArrowDown size={19} aria-hidden="true" />
            </div>
            <span className="programs-hero-caption">Learning, growing, creating change.</span>
          </div>
        </section>

        <section className="programs-page-list shell" id="program-list">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest programs</p>
              <h2>Fresh ways to<br /><em>make a difference.</em></h2>
            </div>
            <p className="body-copy">Every program is a different invitation to connect, grow, and contribute.</p>
          </div>
          <div className="program-page-grid">
            {programs.map((Card, index) => (
              <article className={`program-page-card program-page-card-${(index % 3) + 1}`} key={Card.id}>
                <img src={Card.image} alt={`${Card.title} program`} />
                <span className="card-number">0{index + 1}</span>
                <p className="program-category">{Card.category}</p>
                <h3>{Card.title}</h3>
                <FormattedText as="p" text={Card.description} />
                <Link className="text-link" to={`/project/${Card.id}/projectdetailpage`}>Learn more <span>↗</span></Link>
              </article>
            ))}
          </div>
        </section>
        <Footer />
      </main>
    </div>
  )
}
