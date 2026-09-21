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
import { CardModel, fetchCards } from '@/services/Api'

export default function AboutPage() {
  const [programs, setPrograms] = useState<CardModel[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(true)

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
    <div className="app-shell inner-page">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={() => undefined} />

      <main>
        <section className="about-hero shell">
          <img className="hero-img-about" src="/nature.jpg" alt="YouthAct campaign artwork" />
        </section>

        <section className="page-hero shell">
          <div>
            <p className="eyebrow">Who we are</p>
            <h1>
              Young people
              <br />
              <em>moving forward.</em>
            </h1>
          </div>
          <p className="page-hero-copy">
            YouthAct is a platform for young people who care deeply about their communities and are ready to turn that care into action.
          </p>
        </section>

        <section className="about-feature shell">
          <img src="/youthact1.jpg" alt="YouthAct community members working together" />
          <div>
            <p className="eyebrow">Our reason to gather</p>
            <h2>Change starts with a room full of people who are willing to listen.</h2>
            <p className="body-copy">
              We create space for fresh thinking, honest conversations, and practical projects. Our work connects young people with the knowledge, confidence, and community they need to shape a greener, fairer future.
            </p>
          </div>
        </section>

        <section className="shell">
          <div className="flex items-center justify-between gap-4">
            <Carousel opts={{ align: 'start' }} className="w-full">
              <CarouselContent>
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
                              <CardImage className="h-full w-full">
                                <img className="h-full w-full object-cover" src={card.image} alt={card.title} />
                              </CardImage>
                              <CardTitle className="text-xl font-semibold text-slate-900">{card.title}</CardTitle>
                              <CardDescription className="text-sm leading-6 text-slate-600">{card.description}</CardDescription>
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
