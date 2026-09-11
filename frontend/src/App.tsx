import { useEffect, useState } from 'react'
import './App.css'
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

import type { CardModel } from './types/card'
import { fetchCards } from './services/cardApi'
import CardAdminPage from './pages/CardAdminPage'
import YangonWeatherPage from './pages/YangonWeatherPage'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function App() {
  const [programs, setPrograms] = useState<CardModel[]>([])
  const [currentPage, setCurrentPage] = useState<'home' | 'admin' | 'weather'>('home')

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
        <div className="nav-links">
          <div className="nav-dropdown">
            <DropdownMenu>
            <DropdownMenuTrigger className="nav-dropdown-button">
              <span className="nav-dropdown-label">Who We are</span>
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="nav-drop-icon"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>            
              </DropdownMenuTrigger>
            <DropdownMenuContent className="nav-dropdown-menu">
              <DropdownMenuItem className="nav-dropdown-menu-item" onClick={() => window.location.hash = 'about'}>
                <a href="#about">About us</a>
              </DropdownMenuItem>
              <DropdownMenuItem className="nav-dropdown-menu-item" onClick={() => window.location.hash = 'programs'}>
                <a href="#programs">Mission and values</a>
              </DropdownMenuItem>
              <DropdownMenuItem className="nav-dropdown-menu-item" onClick={() => window.location.hash = 'stories'}>
                <a href="#stories">Leadership</a>
              </DropdownMenuItem>
              <DropdownMenuItem className="nav-dropdown-menu-item" onClick={() => window.location.hash = 'connect'}>
                <a href="#connect">Policies</a>
              </DropdownMenuItem>
              <DropdownMenuItem className="nav-dropdown-menu-item" onClick={() => window.location.hash = 'connect'}>
                <a href="#connect">Partnerships</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <a href="#about">About us</a>
          <a href="#programs">Programs</a>
          <a href="#stories">Stories</a>
          <button className="nav-weather" type="button" onClick={() => setCurrentPage('weather')}>Weather</button>
        </div>
        <button className="nav-cta" type="button" onClick={() => setCurrentPage('admin')}>Create card <span>↗</span></button>
      </nav>

      {currentPage === 'admin' ? (
        <CardAdminPage onBack={() => {
          setCurrentPage('home')
          loadPrograms()
        }} />
      ) : currentPage === 'weather' ? (
        <YangonWeatherPage onBack={() => setCurrentPage('home')} />
      ) : (
        renderHomePage()
      )}
    </div>
  )
}

export default App
