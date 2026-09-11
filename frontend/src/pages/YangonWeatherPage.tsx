import { useState } from 'react'

type YangonWeatherPageProps = {
  onBack: () => void
}

type TownWeather = {
  town: string
  temperature: number
  feelsLike: number
  humidity: number
  wind: number
  condition: string
  marker: string
  zoom: number
  uvIndex: string
}

const townWeather: TownWeather[] = [
  { town: 'Yangon', temperature: 32, feelsLike: 34, humidity: 78, wind: 14, condition: 'Sunny', marker: '●', zoom: 12, uvIndex: 'High' },
  { town: 'Mawlamyine', temperature: 29, feelsLike: 30, humidity: 80, wind: 12, condition: 'Partly Cloudy', marker: '●', zoom: 11, uvIndex: 'Medium' },
  { town: 'Bago', temperature: 31, feelsLike: 33, humidity: 74, wind: 10, condition: 'Sunny', marker: '●', zoom: 11, uvIndex: 'High' },
  { town: 'Taungoo', temperature: 30, feelsLike: 31, humidity: 76, wind: 13, condition: 'Light Rain', marker: '●', zoom: 11, uvIndex: 'Low' },
  { town: 'Pathein', temperature: 30, feelsLike: 32, humidity: 82, wind: 15, condition: 'Humid', marker: '●', zoom: 11, uvIndex: 'Medium' },
]

export default function YangonWeatherPage({ onBack }: YangonWeatherPageProps) {
  const [selectedTown, setSelectedTown] = useState('Yangon')
  const activeTown = townWeather.find((item) => item.town === selectedTown) ?? townWeather[0]
  const googleMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(`${activeTown.town}, Myanmar`)}&z=${activeTown.zoom}&output=embed`

  return (
    <section className="weather-page fade-section">
      <div className="weather-page-top shell">
        <div>
          <p className="eyebrow">Yangon Weather</p>
          <h1>Yangon Region</h1>
        </div>

        <div className="weather-page-actions">
          <button className="button button-dark" type="button" onClick={() => onBack()}>
            Back to home <span>↗</span>
          </button>
        </div>
      </div>

      <section className="weather-dashboard shell">
        <section className="weather-card-panel">
          <div className="weather-card-header">
            <div>
              <span className="weather-card-label">Today’s Weather</span>
              <span className="weather-card-location">{activeTown.town}, Myanmar</span>
            </div>
            <span className="weather-icon">
              {activeTown.condition === 'Sunny' ? '☀️' : activeTown.condition === 'Partly Cloudy' ? '🌤️' : activeTown.condition === 'Light Rain' ? '🌧️' : '🌡️'}
            </span>
          </div>

          <div className="temperature-row">
            <div>
              <span className="temperature-main">{activeTown.temperature}°</span>
              <span className="temperature-unit">C</span>
            </div>
            <span className="weather-condition">{activeTown.condition}</span>
          </div>

          <div className="weather-summary">
            <div className="summary-row">
              <span className="summary-label">Feels like</span>
              <span className="summary-value">{activeTown.feelsLike}° C</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Humidity</span>
              <span className="summary-value">{activeTown.humidity}%</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Wind</span>
              <span className="summary-value">{activeTown.wind} km/h</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">UV Index</span>
              <span className="summary-value">{activeTown.uvIndex}</span>
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

        <section className="map-panel">
          <div className="map-panel-header">
            <div>
              <span className="weather-card-label">Location Map</span>
              <span className="map-title">Yangon Region</span>
            </div>
            <span className="map-pin">●</span>
          </div>

          <iframe
            title="Yangon Region Google Map"
            className="map-frame"
            src={googleMapUrl}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          <div className="map-meta">
            <span>{activeTown.town}, Myanmar</span>
            <span className="meta-divider">|</span>
            <span>Local time: 08:30 AM</span>
          </div>

          <div className="town-weather-list">
            <div className="town-weather-title">
              <span className="weather-card-label">Town Temperature</span>
              <span className="town-list-icon">✦</span>
            </div>

            {townWeather.map((item) => (
              <div
                className={`town-weather-row ${item.town === selectedTown ? 'selected-town' : ''}`}
                key={item.town}
                onClick={() => setSelectedTown(item.town)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedTown(item.town)
                  }
                }}
              >
                <span className="town-marker" aria-label={`Town marker for ${item.town}`}>{item.marker}</span>
                <span className="town-name">{item.town}</span>
                <span className="town-temp">{item.temperature}°C</span>
                <span className="town-condition">{item.condition}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </section>
  )
}
