import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

import Threads from '@/components/Threads'
import { CardModel } from '@/types/card'
import { fetchCards } from '@/services/cardApi'
import TopNavbar from '@/components/ui/topnavbar'
import Footer from '@/components/ui/footer'

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
        <div className="hero-threads fade-in-threads">
          <Threads
            color={[0.06274509803921569,0.7254901960784313,0.5058823529411764]}
            amplitude={0.8}
            distance={0.4}
          />
        </div>
      <section className="hero shell" id="top">
        <div className='hero-combine'>
        <div className="hero-copy fade-in-text">
          <p className="eyebrow">A community for young changemakers</p>
          <h1>Small steps.<br /><em>Real change.</em></h1>
          <p className="hero-intro">We bring young people together to learn, create, and take action for the communities they call home.</p>
          <a className="button" href="#programs">Explore our work <span>↓</span></a>
        </div>
        <img className="hero-img" src="/youthact-Photoroom.png" alt="YouthAct campaign artwork" />
        </div>
        <div className="hero-foot">
          <span>01 / 03</span><span className="line" />
            <span>Growing together since 2019</span>
        </div>
      </section>

      <section className="intro-band" id="about">
        <div className="shell intro-grid">
          <div className="intro-brand">
            <p className="eyebrow">"Youth Act" is</p>
            <img className="intro-image" src="/youthact1.jpg" alt="YouthAct community members" />
          </div>
          <div>
            <h2> A platform brought to life by passionate youth, dedicated to driving climate action and environmental advocacy for a greener, more sustainable future.  
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
                         <Link className="text-link" to={`/project/${card.id}/projectdetailpage`} aria-label={`Learn about ${card.title}`}>Learn more <span>↗</span></Link>
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
      <Footer />
    </main>
  )

  return (
    <div className="app-shell">
      <TopNavbar
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen((open) => !open)}
      />
      <div className={`mobile-nav-backdrop ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <aside className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}> 
        <div className="mobile-nav-drawer-header">
          <span className="brand brand-mobile">
          <span className="brand-mark"><img src="/tran-logo.png" alt="YouthAct logo" /></span>           
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

            <a className="mobile-nav-link" href="/about" onClick={() => setMobileMenuOpen(false)}>About us</a>
            <a className="mobile-nav-link" href="/programs" onClick={() => setMobileMenuOpen(false)}>Programs</a>
            <a className="mobile-nav-link" href="/stories" onClick={() => setMobileMenuOpen(false)}>Stories</a>
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
