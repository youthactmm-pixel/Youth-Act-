import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TopNavbar from '@/components/ui/topnavbar'
import { fetchTowns, type TownModel } from '@/services/Api'

export default function YangonWeatherPage() {
  const [searchParams] = useSearchParams()
  const [towns, setTowns] = useState<TownModel[]>([])

  useEffect(() => {
    fetchTowns().then(setTowns).catch(() => setTowns([]))
  }, [])

  const requestedTown = searchParams.get('town')
  const activeTown = towns.find((item) => item.town === requestedTown) ?? towns[0]
  const googleMapUrl = activeTown
    ? `https://maps.google.com/maps?q=${encodeURIComponent(`${activeTown.town}, Myanmar`)}&z=12&output=embed`
    : ''
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

            {towns.map((item) => (
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
                <span className="town-temp">--</span>
                <span className="town-condition">Database location</span>
              </div>
            ))}
          </div>
        </section>
        <section className="weather-card-panel">
          <div className="weather-card-header">
            <div>
              <span className="weather-card-label">Today’s Weather</span>
              <span className="weather-card-location">
                {activeTown ? `${activeTown.town}, Myanmar` : 'Select an area'}
              </span>
            </div>
            <span className="weather-icon">
              📍
            </span>
          </div>

          <div className="temperature-row">
            <div>
              <span className="temperature-main">--</span>
              <span className="temperature-unit">°C</span>
            </div>
            <span className="weather-condition">Database location</span>
          </div>    

          <div className="weather-summary">
            <div className="summary-row">
              <span className="summary-label">Feels like</span>
                <span className="summary-value">N/A</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Humidity</span>
                <span className="summary-value">N/A</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Wind</span>
                <span className="summary-value">N/A</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">UV Index</span>
                <span className="summary-value">N/A</span>
            </div>
          </div>

          <div className="forecast-strip">
            <div className="forecast-day">
              <span className="forecast-date">Mon</span>
              <span className="forecast-icon">🌤️</span>
              <span className="forecast-temp">32° / 27°</span>
            </div>
            <div className="forecast-day">
              <span className="forecast-date">Tue</span>
              <span className="forecast-icon">🌧️</span>
              <span className="forecast-temp">30° / 26°</span>
            </div>
            <div className="forecast-day">
              <span className="forecast-date">Wed</span>
              <span className="forecast-icon">☀️</span>
              <span className="forecast-temp">33° / 28°</span>
            </div>
            <div className="forecast-day">
              <span className="forecast-date">Thu</span>
              <span className="forecast-icon">🌤️</span>
              <span className="forecast-temp">31° / 27°</span>
            </div>
          </div>
        </section>


      </section>
    </section>
  )
}
