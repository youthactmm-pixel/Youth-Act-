import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TopNavbar from '@/components/ui/topnavbar'
import { fetchGoogleSheetTowns, fetchTowns, type TownModel } from '@/services/Api'
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
  CardImage
} from "@/components/ui/card"

import Threads from '@/components/Threads'
import { CardModel } from '@/services/Api'
import { fetchCards } from '@/services/Api'
import { Skeleton } from '@/components/ui/skeleton'

export default function YangonWeatherPage() {
  const [searchParams] = useSearchParams()
  const [towns, setTowns] = useState<TownModel[]>([])
  const [isLoadingtowns, setIsLoadingTowns] = useState(true); // Loading state for towns fetch

  useEffect(() => {
    const loadTowns = async () => {
      setIsLoadingTowns(true)

      try {
        const sheetTowns = await fetchGoogleSheetTowns()

        if (sheetTowns.length > 0) {
          setTowns(sheetTowns)
          return
        }

        const fallbackTowns = await fetchTowns()
        setTowns(fallbackTowns)
      } catch {
        try {
          const fallbackTowns = await fetchTowns()
          setTowns(fallbackTowns)
        } catch {
          setTowns([])
        }
      } finally {
        setIsLoadingTowns(false)
      }
    }

    loadTowns()
  }, [])

  const requestedTown = searchParams.get('town')
  const normalizedRequestedTown = requestedTown?.trim().toLowerCase()
  const activeTown = towns.find((item) => item.town.trim().toLowerCase() === normalizedRequestedTown) ?? towns[0]
  const visibleTown = activeTown ? [activeTown] : []
  const googleMapUrl = activeTown
    ? `https://maps.google.com/maps?q=${encodeURIComponent(`${activeTown.town}, Myanmar`)}&z=12&output=embed`
    : ''
  const activeDescription = activeTown?.description || `Explore ${activeTown?.town}`

  return (
    
    <section className="weather-page fade-section">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={function (): void {
        throw new Error('Function not implemented.')
      } }/>
      <section className="weather-dashboard shell">
        <section className="map-panel">
          <div className="map-panel-header">
            <div>
              <span className="weather-card-label">Location Map</span>
              <span className="map-title">Yangon Region</span>
            </div>
          </div>

          {activeTown ? (
            <iframe
              title={`${activeTown.town} Google Map`}
              className="map-frame"
              src={googleMapUrl}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="map-frame map-frame-empty">No town data found.</div>
          )}

          <div className="map-meta">
            <span>{activeTown ? `${activeTown.town}, Myanmar` : 'Select an area'}</span>
            <span className="meta-divider">|</span>
            <span>Local time: 08:30 AM</span>
          </div>

          <div className="town-weather-list">
            <div className="town-weather-title">
              <span className="weather-card-label">Town Temperature</span>
            </div>

            {visibleTown.length > 0 ? visibleTown.map((item) => (
              <div
                className={`town-weather-row ${item.town === activeTown?.town ? 'selected-town' : ''}`}
                key={item.id}
                onClick={() => window.location.assign(`/yangon-weather?town=${encodeURIComponent(item.town)}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    window.location.assign(`/yangon-weather?town=${encodeURIComponent(item.town)}`)
                  }
                }}
              >
                <span className="town-marker" aria-label={`Town marker for ${item.town}`}>●</span>
                <span className="town-name">{item.town}</span>
                <span className="town-condition">{item.description || 'Google Sheet data'}</span>
              </div>
            )) : (
              <div className="town-weather-row">
                <span className="town-name">No town selected</span>
              </div>
            )}
          </div>
        </section>
        <section className="weather-card-panel">
          <div className="weather-card-header">
            <div>
              <span className="weather-card-label">Today’s Conditions</span>
              <span className="weather-card-location">
                {activeTown ? `${activeTown.town}, Myanmar` : 'Select an area'}
              </span>
            </div>
            <span className="weather-icon">
              📍
            </span>
          </div>

          <div className="info-column">
          <Carousel
            opts={{ align: "start" }}
            className="w-full"
          >
            <CarouselContent>
              {isLoadingtowns
                ? Array.from({ length: 3 }).map((_, index) => (
                    <CarouselItem key={`skeleton-${index}`} className="basis-full md:basis-1/2 lg:basis-1/3">
                      <div className="p-1">
                        <Card className="h-full shadow-sm">
                          <CardContent className="space-y-3">
                            <Skeleton className="h-10 w-full rounded-xl" />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))
                : visibleTown.length > 0 ? visibleTown.map((items) => (
                    <CarouselItem key={items.id || items.town} className="basis-full md:basis-1/2 lg:basis-1/3">
                      <div className="p-1">
                        <Card className="h-full shadow-sm">
                          <CardContent className="space-y-3">
                            <CardTitle className="text-xl font-semibold text-slate-900">{items.town || 'Google Sheet data'}</CardTitle>
                            <CardDescription className="text-sm leading-6 text-slate-600">
                              {items.description || `Explore ${items.town} and discover local highlights from the Google Sheet data.`}
                            </CardDescription>
                            <Link className="text-link" to={`/project/${items.id}/projectdetailpage`} aria-label={`Learn about ${items.town}`}>Learn more <span>↗</span></Link>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  )) : (
                    <CarouselItem className="basis-full">
                      <div className="p-1">
                        <Card className="h-full shadow-sm">
                          <CardContent className="space-y-3">
                            <CardTitle className="text-xl font-semibold text-slate-900">No town selected</CardTitle>
                            <CardDescription className="text-sm leading-6 text-slate-600">
                              Please select a town from the navigation to view its data.
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  )}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
          </div>
        </section>


      </section>
    </section>
  )
}
