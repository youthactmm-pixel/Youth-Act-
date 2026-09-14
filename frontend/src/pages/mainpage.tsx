import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '@/App.css'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import CardAdminPage from './CardAdminPage'
import YangonWeatherPage from './YangonWeatherPage'
import { CardModel } from '@/types/card'
import { fetchCards } from '@/services/cardApi'

/**
 * App component - Main application component that manages the overall state and rendering of the application
 * @returns {JSX.Element} The rendered application component
 */
export function HomePage() {
  const navigate = useNavigate()

  // State hooks for managing application data and UI state
  const [programs, setPrograms] = useState<CardModel[]>([]); // Array of program cards
  const [whoWeAreOpen, setWhoWeAreOpen] = useState(false); // State for "Who We Are" dropdown menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // State for mobile menu visibility

  const loadPrograms = () => {
    fetchCards()
      .then((data) => setPrograms(data))
      .catch(() => setPrograms([]))
  }

  useEffect(() => {
    loadPrograms()
  }, [])

  const renderHomePage = () => (
    <main>
      <link href="/src/style.css" rel="stylesheet"></link>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A community for young changemakers</p>
          <h1>Small steps.<br /><em>Real change.</em></h1>
          <p className="hero-intro">We bring young people together to learn, create, and take action for the communities they call home.</p>
          <a className="button" href="#programs">Explore our work <span>↓</span></a>
        </div>
        <div className="hero-art" aria-label="Young people collaborating outdoors" role="img">
          <video className="hero-video" src="/yg.mp4" autoPlay muted loop playsInline />
          <div className="art-note">Make room<br />for new ideas.</div>
          <div className="art-sticker">Be<br /><strong>curious</strong></div>
        </div>
        <div className="hero-foot">
          <span>01 / 03</span><span className="line" />
            <span>Growing together since 2019</span>
        </div>
      </section>

      <section className="intro-band" id="about">
        <div className="shell intro-grid">
          <p className="eyebrow">What we believe</p>
          <div>
            <h2>Young people are not waiting for the future. They are 
              <em>building it now.</em>
            </h2>
              <p className="body-copy">YouthAct is a space for fresh thinking, honest conversations, and practical action. From the first spark of an idea to the moment it makes a difference, we are here to help it grow.</p>
              <a className="text-link" href="#stories">Our approach <span>↗</span></a>
          </div>
        </div>
      </section>

      <section className="programs shell" id="programs">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Find your way in</p>
            <h2>There is always<br /><em>room for you.</em></h2>
          </div>
          <p className="body-copy">Bring your questions, your energy, and whatever you are curious about. Start wherever feels right.</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Carousel
            opts={{ align: "start" }}
            className="w-full"
          >
            <CarouselContent>
              {programs.map((card, index) => (
                <CarouselItem key={card.id} className="basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <Card className="h-full rounded-3xl border-0 bg-white shadow-sm">
                      <CardHeader className="pb-2">
                        <span className="card-number">0{index + 1}</span>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <CardTitle className="text-xl font-semibold text-slate-900">{card.title}</CardTitle>
                        <CardDescription className="text-sm leading-6 text-slate-600">
                          {card.description}
                        </CardDescription>
                         <a className="text-link" href="#connect" aria-label={`Learn about ${card.title}`}>Learn more <span>↗</span></a>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      <section className="quote-band" id="stories"><div className="shell quote-inner"><span className="quote-mark">“</span><blockquote>When we make space for each other, we find the courage to make something new.</blockquote><p>— A YouthAct community member</p></div></section>

      <footer className="footer shell" id="connect"><div><a className="brand" href="#top"><span className="brand-mark">Y</span><span>Youth<span>Act</span></span></a><p className="footer-note">A little more possibility,<br />every day.</p></div><div className="footer-links"><a href="mailto:hello@youthact.org">hello@youthact.org</a><a href="#programs">Instagram ↗</a><a href="#programs">Facebook ↗</a></div><p className="copyright">© 2026 YouthAct</p></footer>
    </main>
  )

  return (
    <div className="app-shell">
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="YouthAct home">
          <span className="brand-mark">Y</span>
          <span>Youth
            <span>Act</span>
          </span>
        </a>

        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="mobile-menu-icon">
            <span />
            <span />
            <span />
          </span>
        </button>

        <div className="nav-links">
          <div className="nav-dropdown">
            <button
              className="nav-dropdown-button"
              onClick={() => setWhoWeAreOpen(!whoWeAreOpen)}
            >
              <span className="nav-dropdown-label">
                Who We are
              </span>

              <span className={`nav-drop-icon ${whoWeAreOpen ? "open" : ""}`}>
                ▼
              </span>
            </button>

            {whoWeAreOpen && (
              <div className="nav-dropdown-children">
                <a href="/about">About us</a>
                <a href="/mission">Mission and values</a>
                <a href="/leadership">Leadership</a>
                <a href="/partnerships">Partnerships</a>
              </div>
            )}
          </div>
          <a href="#about">About us</a>
          <a href="#programs">Programs</a>
          <a href="#stories">Stories</a>
          <button className="nav-weather" type="button" onClick={() => navigate('/yangon-weather')}>Weather</button>
        </div>
        <button className="nav-cta" type="button" onClick={() => navigate('/admin')}>Create card <span>↗</span></button>
      </nav>

      <div className={`mobile-nav-backdrop ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <aside className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}> 
        <div className="mobile-nav-drawer-header">
          <span className="brand brand-mobile">
            <span className="brand-mark">Y</span>
            <span>Youth<span>Act</span></span>
          </span>
          <button className="mobile-menu-close" type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)}>×</button>
        </div>

        <div className="mobile-nav-drawer-content">
          <div className="mobile-nav-section">
            <div className="nav-dropdown-mobile">
              <button className="nav-dropdown-button" onClick={() => setWhoWeAreOpen(!whoWeAreOpen)}>
                <span className="nav-dropdown-label">Who We are</span>
                <span className={`nav-drop-icon ${whoWeAreOpen ? "open" : ""}`}>▼</span>
              </button>

              {whoWeAreOpen && (
                <div className="nav-dropdown-children-mobile">
                  <a href="/about">About us</a>
                  <a href="/mission">Mission and values</a>
                  <a href="/leadership">Leadership</a>
                  <a href="/policies">Policies</a>
                  <a href="/partnerships">Partnerships</a>
                </div>
              )}
            </div>

            <a className="mobile-nav-link" href="#about" onClick={() => setMobileMenuOpen(false)}>About us</a>
            <a className="mobile-nav-link" href="#programs" onClick={() => setMobileMenuOpen(false)}>Programs</a>
            <a className="mobile-nav-link" href="#stories" onClick={() => setMobileMenuOpen(false)}>Stories</a>
            <button className="mobile-nav-link nav-weather" type="button" onClick={() => {
              navigate('/yangon-weather')
              setMobileMenuOpen(false)
            }}>Weather</button>
          </div>

          <button className="mobile-nav-cta" type="button" onClick={() => {
            navigate('/admin')
            setMobileMenuOpen(false)
          }}>Create card <span>↗</span></button>
        </div>
      </aside>

      {renderHomePage()}
    </div>
  )
}
