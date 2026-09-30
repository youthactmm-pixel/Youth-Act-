import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { divIcon, type LatLngExpression, type LeafletMouseEvent } from 'leaflet'
import { ArrowRight, CloudSun, LocateFixed, MapPin, Search, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { fetchGoogleSheetTowns, fetchTowns, type TownModel } from '@/services/Api'

const YANGON: LatLngExpression = [16.8661, 96.1951]

const weatherPin = divIcon({
  className: 'weather-pin-icon',
  html: '<span></span>',
  iconSize: [30, 38],
  iconAnchor: [15, 34],
})

async function findTownCoordinates(townName: string): Promise<[number, number]> {
  const query = encodeURIComponent(`${townName}, Myanmar`)
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
    { signal: AbortSignal.timeout(8000) }
  )
  if (!response.ok) throw new Error('Location search is unavailable right now.')
  const [result] = await response.json() as Array<{ lat: string; lon: string }>
  if (!result) throw new Error(`Could not find ${townName} on the map.`)
  return [Number(result.lat), Number(result.lon)]
}

function MapCamera({ center }: { center: LatLngExpression }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 12), { duration: 0.7 })
  }, [center, map])

  return null
}

function MapClickHandler({ onSelect }: { onSelect: (point: [number, number]) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onSelect([event.latlng.lat, event.latlng.lng])
    },
  })

  return null
}

export default function YangonWeatherPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [towns, setTowns] = useState<TownModel[]>([])
  const [selectedTown, setSelectedTown] = useState<TownModel | null>(null)
  const [position, setPosition] = useState<LatLngExpression>(YANGON)
  const [locationLabel, setLocationLabel] = useState('Yangon, Myanmar')
  const [search, setSearch] = useState('')
  const [isLoadingTowns, setIsLoadingTowns] = useState(true)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    const loadTowns = async () => {
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

  useEffect(() => {
    if (!towns.length) return

    const latitude = Number(searchParams.get('lat'))
    const longitude = Number(searchParams.get('lon'))
    if (searchParams.has('lat') && searchParams.has('lon') && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      setPosition([latitude, longitude])
      setSelectedTown(null)
      setLocationLabel('Pinned location')
      return
    }

    const requestedTown = searchParams.get('town')?.trim().toLowerCase()
    const town = towns.find((item) => item.town.trim().toLowerCase() === requestedTown) ?? towns[0]
    setSelectedTown(town)
    setLocationLabel(`${town.town}, Myanmar`)
    void findTownCoordinates(town.town)
      .then(setPosition)
      .catch(() => setLocationError(`Could not place ${town.town} on the map.`))
  }, [towns, searchParams])

  const matchingTowns = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return []

    return towns
      .filter((town) => town.town.toLowerCase().includes(normalizedSearch))
      .slice(0, 6)
  }, [search, towns])

  const chooseTown = async (town: TownModel) => {
    setSelectedTown(town)
    setSearch('')
    setLocationLabel(`${town.town}, Myanmar`)
    setLocationError('')
    setIsLocating(true)

    try {
      setPosition(await findTownCoordinates(town.town))
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Could not find this town on the map.')
    } finally {
      setIsLocating(false)
    }
  }

  const searchForTown = async () => {
    const query = search.trim()
    if (!query) return

    const normalizedQuery = query.toLowerCase()
    const town = towns.find((item) => item.town.trim().toLowerCase() === normalizedQuery)
      ?? matchingTowns[0]

    if (town) {
      await chooseTown(town)
      return
    }

    setSelectedTown(null)
    setSearch('')
    setLocationLabel(`${query}, Myanmar`)
    setLocationError('')
    setIsLocating(true)

    try {
      setPosition(await findTownCoordinates(query))
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Could not find this town on the map.')
    } finally {
      setIsLocating(false)
    }
  }

  const selectPoint = (point: [number, number], label = 'Pinned location') => {
    setPosition(point)
    setLocationLabel(label)
    setSelectedTown(null)
    setLocationError('')
  }

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Location is not available in this browser.')
      return
    }

    setIsLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        selectPoint([coords.latitude, coords.longitude], 'Your current location')
        setIsLocating(false)
      },
      () => {
        setLocationError('Location access was unavailable. Check your browser permission.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const confirmLocation = () => {
    if (selectedTown) {
      setSearchParams({ town: selectedTown.town })
      return
    }

    const [latitude, longitude] = position as [number, number]
    setSearchParams({ lat: latitude.toFixed(5), lon: longitude.toFixed(5) })
  }

  const markerPosition = position as [number, number]

  return (
    <main className="weather-picker">
      <header className="weather-picker-header">
        <Link className="weather-picker-brand" to="/" aria-label="Back to Youth Act home">
          <span className="weather-picker-brand-icon"><CloudSun size={20} /></span>
          <span>
            <strong>Weather map</strong>
            <small>MYANMAR LOCATION</small>
          </span>
        </Link>
        <span className="weather-picker-tag">YOUTH ACT</span>
      </header>

      <section className="weather-map-stage" aria-label="Choose a location on the weather map">
        <MapContainer center={YANGON} zoom={12} scrollWheelZoom className="weather-leaflet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCamera center={position} />
          <MapClickHandler onSelect={(point) => selectPoint(point)} />
          <Marker
            position={position}
            icon={weatherPin}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target
                const point = marker.getLatLng()
                selectPoint([point.lat, point.lng])
              },
            }}
          />
        </MapContainer>

        <div className="weather-map-search-wrap">
          <div className="weather-map-search">
            <label htmlFor="town-search"><Search size={18} aria-hidden="true" /></label>
            <input
              id="town-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void searchForTown()
                }
              }}
              placeholder="Search a town or village"
              autoComplete="off"
            />
            {search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={16} /></button>}
          </div>
        </div>

        <button className="weather-locate-button" type="button" onClick={locateMe} disabled={isLocating} aria-label="Use my current location" title="Use my current location">
          <LocateFixed size={19} />
        </button>
        <div className="weather-map-hint">Tap the map or drag the pin to choose a location</div>
      </section>

      <footer className="weather-selection-bar">
        <div className="weather-selection-copy" aria-live="polite">
          <span className="weather-selection-icon"><MapPin size={19} /></span>
          <span>
            <small>SELECTED LOCATION</small>
            <strong>{isLocating ? 'Finding location…' : locationLabel}</strong>
            {selectedTown?.description && <span className="weather-selection-description">{selectedTown.description}</span>}
            {locationError && <span className="weather-location-error">{locationError}</span>}
          </span>
        </div>
        <button type="button" className="weather-confirm-button" onClick={confirmLocation}>
          Confirm location
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </footer>
    </main>
  )   
}
