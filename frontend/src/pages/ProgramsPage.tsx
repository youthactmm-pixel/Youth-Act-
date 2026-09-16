import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopNavbar from '@/components/ui/topnavbar'
import { fetchCards } from '@/services/cardApi'
import { CardModel } from '@/types/card'
import Footer from '@/components/ui/footer'

const fallbackPrograms: CardModel[] = [
]

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<CardModel[]>(fallbackPrograms)

  useEffect(() => {
    fetchCards().then(setPrograms).catch(() => undefined)
  }, [])

  return (
    <div className="app-shell inner-page">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={() => undefined} />
      <main>
        <section className="page-hero shell">
          <div>
            <p className="eyebrow">Find your way in</p>
            <h1>There is always<br /><em>room for you.</em></h1>
          </div>
          <p className="page-hero-copy">Bring your questions, your energy, and whatever you are curious about. Start wherever feels right.</p>
        </section>

        <section className="programs-page-list shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Our programs</p>
              <h2>Learn something.<br /><em>Make something.</em></h2>
            </div>
            <p className="body-copy">Every program is a different invitation to connect, grow, and contribute.</p>
          </div>
          <div className="program-page-grid">
            {programs.map((program, index) => (
              <article className={`program-page-card program-page-card-${(index % 3) + 1}`} key={program.id}>
                <span className="card-number">0{index + 1}</span>
                <p className="program-category">{program.category}</p>
                <h3>{program.title}</h3>
                <p>{program.description}</p>
                <Link className="text-link" to={`/project/${program.id}/projectdetailpage`}>Learn more <span>↗</span></Link>
              </article>
            ))}
          </div>
        </section>
        <Footer />
      </main>
    </div>
  )
}
