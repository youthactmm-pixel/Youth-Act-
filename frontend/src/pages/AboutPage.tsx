import TopNavbar from '@/components/ui/topnavbar'
import Footer from '@/components/ui/footer'
import { useEffect, useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  CardImage,
} from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { FormattedText } from '@/components/RichText'
import { CardModel, fetchCards } from '@/services/Api'
import { ArrowDown, ArrowRight, BookOpen, Leaf, Map, UsersRound } from 'lucide-react'

const focusAreas = [
  { number: '01', title: 'Climate education', icon: BookOpen },
  { number: '02', title: 'Youth leadership & engagement', icon: UsersRound },
  { number: '03', title: 'Digital innovation & mapping', icon: Map },
  { number: '04', title: 'Community action & resilience', icon: Leaf },
]

export default function AboutPage() {
  const [programs, setPrograms] = useState<CardModel[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(true)

  // ဒီ effect က ပရိုဂရမ်ကတ်များကို API မှယူပြီး loading အခြေအနေကို ထိန်းပေးသည်။
  useEffect(() => {
    const loadPrograms = () => {
      setIsLoadingCards(true)
      fetchCards()
        .then((data) => {
          setPrograms(data)
        })
        .catch(() => setPrograms([]))
        .finally(() => setIsLoadingCards(false))
    }

    loadPrograms()
  }, [])

  return (
    <div className="app-shell inner-page about-page">
      <TopNavbar />

      <main>
        <section className="about-page-hero shell">
          <div className="about-page-hero-copy">
            <p className="about-page-kicker"><span />Who we are</p>
            <h1>
              Young minds<br />
              <em>for a greener</em><br />
              future.
            </h1>
            <p className="about-page-lead">
              Youth Act is an independent, youth-led initiative driven by young people passionate about climate action, education, community engagement, innovation, and youth leadership.
            </p>
            <Link className="about-page-cta" to="/programs">Explore our work <ArrowRight size={17} /></Link>
          </div>
          <div className="about-page-hero-visual">
            <img src="/nature.jpg" alt="Farmers tending crops in a green field" />
            <div className="about-image-label"><span>YOUTH ACT</span><strong>Young minds<br />for a greener future.</strong><Leaf size={21} /></div>
            <span className="about-image-caption">Climate resilience starts with community.</span>
          </div>
          <div className="about-hero-bottom">
            <span>01 / ABOUT YOUTH ACT</span>
            <span className="about-hero-bottom-line" />
            <p>Young people are not only beneficiaries of a sustainable future — they help create it.</p>
            <a href="#about-focus">Discover what drives us <ArrowDown size={15} /></a>
          </div>
        </section>

        <section className="about-focus-section shell" id="about-focus">
          <div className="about-focus-visual">
            <img src="/youthact1.jpg" alt="Youth Act campaign artwork for a greener future" />
            <span className="about-focus-stamp">LEARN<br />TOGETHER<br />ACT TOGETHER</span>
          </div>
          <div className="about-focus-content">
            <p className="about-page-kicker"><span />What we do</p>
            <h2>Young people learning, leading, and building change together.</h2>
            <p className="about-focus-description">
              We create spaces for young people to learn about climate change, build practical skills, take initiative, and work together on community-driven projects. By connecting youth with local communities, schools, and organisations, we help address local challenges and build more resilient communities.
            </p>
            <div className="about-focus-heading"><span>OUR CORE AREAS</span><span>01 — 04</span></div>
            <div className="about-focus-grid">
              {focusAreas.map(({ number, title, icon: Icon }) => (
                <article key={number}>
                  <span className="about-focus-icon"><Icon size={19} strokeWidth={1.6} /></span>
                  <div><small>{number}</small><h3>{title}</h3></div>
                  <ArrowRight className="about-focus-arrow" size={16} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-purpose">
          <div className="shell about-purpose-inner">
            <div className="about-purpose-heading">
              <p className="about-page-kicker"><span />Our mission &amp; vision</p>
              <h2>Creating a future<br />we can <em>grow into.</em></h2>
              <p>We believe young people are not only beneficiaries of a sustainable future, but active contributors to creating it.</p>
            </div>
            <div className="about-purpose-cards">
              <article className="about-purpose-card about-purpose-card-mission">
                <div className="about-purpose-card-top"><span>01</span><span>WHY WE'RE HERE</span></div>
                <h3>Our mission</h3>
                <p>To empower young people with the knowledge, opportunities, and leadership skills to take part in climate education, environmental protection, and building sustainable communities.</p>
                <BookOpen size={25} strokeWidth={1.4} />
              </article>
              <article className="about-purpose-card about-purpose-card-vision">
                <div className="about-purpose-card-top"><span>02</span><span>WHERE WE'RE GOING</span></div>
                <h3>Our vision</h3>
                <p>A future where young people are climate-conscious leaders, equipped with practical skills and actively creating meaningful, inclusive, and sustainable solutions for their communities.</p>
                <Leaf size={25} strokeWidth={1.4} />
              </article>
            </div>
          </div>
        </section>

        <section className="about-programs shell">
          <div className="about-programs-heading">
            <div><p className="about-page-kicker"><span />From ideas to action</p><h2>Explore what we're growing.</h2></div>
            <p>Discover the initiatives young people are bringing to life in their communities.</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Carousel opts={{ align: 'start' }} className="w-full">
              <CarouselContent>
                {/* ဒေတာမရသေးချိန်တွင် skeleton ပြပြီး၊ ရလာလျှင် ပရိုဂရမ်ကတ်များကို ပြသည်။ */}
                {isLoadingCards
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <CarouselItem key={`skeleton-${index}`} className="basis-full md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                          <Card className="h-full shadow-sm">
                            <CardContent className="space-y-3">
                              <Skeleton className="h-48 w-full rounded-xl" />
                              <Skeleton className="h-6 w-2/3 rounded" />
                              <Skeleton className="h-4 w-full rounded" />
                              <Skeleton className="h-4 w-5/6 rounded" />
                              <Skeleton className="h-5 w-24 rounded" />
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))
                  : programs.map((card) => (
                      <CarouselItem key={card.id} className="basis-full md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                          <Card className="h-full shadow-sm">
                            <CardContent className="space-y-3">
                              <CardImage className="program-card-images">
                                {(card.images?.length ? card.images : [card.image]).map((image, index) => (
                                  <img key={`${card.id}-${index}`} src={image} alt={`${card.title} image ${index + 1}`} />
                                ))}
                              </CardImage>
                              <CardTitle className="text-xl font-semibold text-slate-900">{card.title}</CardTitle>
                              <CardDescription className="text-sm leading-6 text-slate-600"><FormattedText text={card.description} /></CardDescription>
                              <Link className="text-link" to={`/project/${card.id}/projectdetailpage`} aria-label={`Learn about ${card.title}`}>
                                Learn more <span>↗</span>
                              </Link>
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
    </div>
  )
}
