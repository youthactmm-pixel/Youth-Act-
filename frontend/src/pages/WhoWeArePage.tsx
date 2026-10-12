import { ArrowDown, ArrowRight, ArrowUpRight, Handshake, Lightbulb, Sprout, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from '@/components/ui/footer'
import TopNavbar from '@/components/ui/topnavbar'

type PageKey = 'mission' | 'leadership' | 'partnerships'

const pageContent: Record<PageKey, {
  eyebrow: string
  title: string
  accent: string
  intro: string
}> = {
  mission: {
    eyebrow: 'What moves us',
    title: 'A future shaped by the people who will live it.',
    accent: 'Mission & values',
    intro: 'We bring young people together to learn, create, and take action for the communities they call home.',
  },
  leadership: {
    eyebrow: 'Youth-led, community-rooted',
    title: 'Leadership is something we grow together.',
    accent: 'Leadership',
    intro: 'We believe the people closest to a challenge should help shape its solutions. Young people are not just the future of climate action — they are leading it now.',
  },
  partnerships: {
    eyebrow: 'Working better, together',
    title: 'Big change begins with a shared idea.',
    accent: 'Partnerships',
    intro: 'Progress takes all of us. We connect with communities, educators, youth groups, and local organizations to turn shared care into practical action.',
  },
}

const values = [
  {
    number: '01',
    title: 'Start with listening',
    text: 'Make room for different experiences, local knowledge, and the voices most affected by change.',
    icon: Lightbulb,
  },
  {
    number: '02',
    title: 'Learn by doing',
    text: 'Turn curiosity into practical steps, and let every project teach us how to do better.',
    icon: Sprout,
  },
  {
    number: '03',
    title: 'Make space for everyone',
    text: 'Build welcoming spaces where young people can bring their ideas and grow their confidence.',
    icon: UsersRound,
  },
  {
    number: '04',
    title: 'Move forward together',
    text: 'Work across communities and generations, sharing what we know and what we learn.',
    icon: Handshake,
  },
]

const leadershipPrinciples = [
  ['Lived experience matters', 'Young people bring insight, urgency, and imagination to the decisions that shape their communities.'],
  ['Share ownership', 'Good leadership is collaborative: invite ideas, make decisions transparently, and give people room to contribute.'],
  ['Grow the next voice', 'Create opportunities for young people to build skills, confidence, and the support to lead in their own way.'],
]

const partnershipSteps = [
  ['01', 'Listen first', 'Start with the priorities, knowledge, and hopes already present in the community.'],
  ['02', 'Make it together', 'Bring the right people around one table and shape a response that fits the place.'],
  ['03', 'Learn as we go', 'Share progress openly, celebrate what works, and adapt when something can be better.'],
]

export default function WhoWeArePage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pageKey: PageKey = pathname === '/leadership'
    ? 'leadership'
    : pathname === '/partnerships'
      ? 'partnerships'
      : 'mission'
  const page = pageContent[pageKey]

  return (
    <div className={`app-shell inner-page who-page who-page--${pageKey}`}>
      <TopNavbar mobileMenuOpen={mobileMenuOpen} onMobileMenuToggle={() => setMobileMenuOpen((open) => !open)} />
      <div className={`mobile-nav-backdrop ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <aside className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`} aria-label="Mobile navigation">
        <div className="mobile-nav-drawer-header">
          <Link className="brand brand-mobile" to="/" onClick={() => setMobileMenuOpen(false)}>
            <span className="brand-mark"><img src="/tran-logo.png" alt="" /></span>
            <span>YOUTH ACT</span>
          </Link>
          <button className="mobile-menu-close" type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)}>×</button>
        </div>
        <div className="mobile-nav-drawer-content">
          <nav className="mobile-nav-section" aria-label="Main navigation">
            {[
              ['/about', 'About us'],
              ['/mission', 'Mission & values'],
              ['/leadership', 'Leadership'],
              ['/partnerships', 'Partnerships'],
              ['/programs', 'Programs'],
              ['/stories', 'Stories'],
              ['/community-map', 'Community map'],
            ].map(([to, label]) => (
              <Link className="mobile-nav-link" key={to} to={to} onClick={() => setMobileMenuOpen(false)}>{label}</Link>
            ))}
          </nav>
          <button className="mobile-nav-cta" type="button" onClick={() => {
            navigate('/yangon-weather')
            setMobileMenuOpen(false)
          }}>Check local weather <ArrowUpRight size={15} /></button>
        </div>
      </aside>
      <main>
        <section className="who-hero shell">
          <div className="who-hero-copy">
            <p className="who-eyebrow"><span />{page.eyebrow}</p>
            <h1>{page.title}</h1>
            <p className="who-intro">{page.intro}</p>
            <div className="who-hero-actions">
              <a className="who-primary-link" href="#page-content">Explore {page.accent.toLowerCase()} <ArrowDown size={16} /></a>
              <Link className="who-secondary-link" to="/about">About YouthAct <ArrowUpRight size={16} /></Link>
            </div>
          </div>
          <div className="who-hero-art">
            <img src="/nature.jpg" alt="Local farmers tending a green field together" />
            <div className="who-art-note">
              <span>YOUTH ACT</span>
              <strong>Small steps.<br />Real change.</strong>
              <Sprout size={22} aria-hidden="true" />
            </div>
            <span className="who-art-caption">Ideas grow when we grow them together.</span>
          </div>
          <nav className="who-page-nav" aria-label="Who we are pages">
            <span>Who we are</span>
            <Link className={pageKey === 'mission' ? 'active' : ''} to="/mission">Mission & values</Link>
            <Link className={pageKey === 'leadership' ? 'active' : ''} to="/leadership">Leadership</Link>
            <Link className={pageKey === 'partnerships' ? 'active' : ''} to="/partnerships">Partnerships</Link>
          </nav>
        </section>

        {pageKey === 'mission' && (
          <>
            <section className="who-statement shell" id="page-content">
              <p className="who-section-index">01 / OUR PURPOSE</p>
              <div className="who-statement-copy">
                <p className="who-eyebrow">A reason to gather</p>
                <h2>Young people deserve the space, support, and trust to shape a greener future.</h2>
                <p>Our mission is to make that possible — by bringing people together, sharing knowledge, and helping community-led ideas become meaningful action.</p>
              </div>
              <div className="who-vision">
                <span>OUR VISION</span>
                <p>Communities where young people can lead with confidence and care for a thriving planet.</p>
              </div>
            </section>

            <section className="who-values">
              <div className="shell">
                <div className="who-section-heading">
                  <div>
                    <p className="who-eyebrow">How we show up</p>
                    <h2>Our values,<br /><em>in action.</em></h2>
                  </div>
                  <p>Values are more than words. They guide how we listen, work, and make space for change.</p>
                </div>
                <div className="who-value-grid">
                  {values.map(({ number, title, text, icon: Icon }) => (
                    <article className="who-value-card" key={number}>
                      <div className="who-value-top"><span>{number}</span><Icon size={22} strokeWidth={1.5} /></div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {pageKey === 'leadership' && (
          <section className="who-detail-section shell" id="page-content">
            <div className="who-detail-lead">
              <p className="who-section-index">01 / HOW WE LEAD</p>
              <p className="who-eyebrow">Leadership belongs to all of us</p>
              <h2>More voices at the table. More possibility in the room.</h2>
              <p>YouthAct believes in leadership that is shared, grounded in community, and open to learning. We make room for young people to bring forward ideas and help shape the action that follows.</p>
            </div>
            <div className="who-principles">
              {leadershipPrinciples.map(([title, text], index) => (
                <article key={title}>
                  <span>0{index + 1}</span>
                  <div><h3>{title}</h3><p>{text}</p></div>
                  <ArrowUpRight size={19} aria-hidden="true" />
                </article>
              ))}
            </div>
          </section>
        )}

        {pageKey === 'partnerships' && (
          <>
            <section className="who-detail-section shell who-partner-intro" id="page-content">
              <div className="who-detail-lead">
                <p className="who-section-index">01 / HOW WE PARTNER</p>
                <p className="who-eyebrow">Many perspectives. Shared purpose.</p>
                <h2>Good partnerships make local ideas go further.</h2>
                <p>We welcome conversations with community groups, schools, youth networks, environmental organizations, and people who want to make a positive difference together.</p>
              </div>
              <div className="who-partner-card">
                <Handshake size={30} strokeWidth={1.4} />
                <h3>Have an idea to explore?</h3>
                <p>Tell us what your community cares about and what you would like to make possible.</p>
                <a href="mailto:youthact.mm@gmail.com?subject=Let's%20partner%20with%20YouthAct">Start a conversation <ArrowRight size={16} /></a>
              </div>
            </section>
            <section className="who-steps-band">
              <div className="shell">
                <p className="who-eyebrow">A thoughtful way to work</p>
                <div className="who-steps">
                  {partnershipSteps.map(([number, title, text]) => (
                    <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        <section className="who-next shell">
          <div><p className="who-eyebrow">Keep exploring</p><h2>Change is a team effort.</h2></div>
          <Link to={pageKey === 'partnerships' ? '/programs' : '/partnerships'}>
            {pageKey === 'partnerships' ? 'See what we do' : 'Explore partnerships'} <ArrowUpRight size={17} />
          </Link>
        </section>
        <Footer />
      </main>
    </div>
  )
}
