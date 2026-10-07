import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { divIcon, type LatLngExpression } from 'leaflet'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { ArrowLeft, CloudSun, Droplets, MapPin, RefreshCw, Thermometer, Wind } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { fetchWeatherStatus, type WeatherStatusResponse } from '@/services/Api'

const statusPin = divIcon({
  className: 'weather-status-pin',
  html: '<span></span>',
  iconSize: [30, 38],
  iconAnchor: [15, 34],
})

function getWeatherIcon(icon: string) {
  const condition = icon.slice(0, 2)
  if (condition === '11') return '⛈️'
  if (condition === '09' || condition === '10') return '🌧️'
  if (condition === '13') return '❄️'
  if (condition === '50') return '🌫️'
  if (condition === '01') return icon.endsWith('n') ? '🌙' : '☀️'
  if (condition === '02') return '🌤️'
  if (condition === '03') return '⛅'
  if (condition === '04') return '☁️'
  return '🌡️'
}

function formatWeatherDescription(description: string) {
  return description ? `${description[0].toUpperCase()}${description.slice(1)}` : 'Unknown'
}

function formatForecastDay(date: string, index: number) {
  if (index === 0) return 'Today'

  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
  })
}

function formatCoordinate(value: number, positiveDirection: string, negativeDirection: string) {
  return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positiveDirection : negativeDirection}`
}

export default function WeatherStatusPage() {
  const [searchParams] = useSearchParams()
  const latitude = Number(searchParams.get('lat'))
  const longitude = Number(searchParams.get('lon'))
  const label = searchParams.get('label') || 'Selected location'
  const hasValidCoordinates =
    searchParams.has('lat') &&
    searchParams.has('lon') &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  const [weather, setWeather] = useState<WeatherStatusResponse | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!hasValidCoordinates) return

    const controller = new AbortController()
    fetchWeatherStatus(latitude, longitude, controller.signal)
      .then(setWeather)
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return
        setError(fetchError instanceof Error ? fetchError.message : 'Weather data could not be loaded.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [hasValidCoordinates, latitude, longitude, reloadKey])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setReloadKey((key) => key + 1)
    }, 10 * 60 * 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  if (!hasValidCoordinates) return <Navigate to="/yangon-weather" replace />

  const coordinates: LatLngExpression = [latitude, longitude]
  const selectionUrl = `/yangon-weather?${new URLSearchParams({
    lat: latitude.toFixed(5),
    lon: longitude.toFixed(5),
    label,
  }).toString()}`
  const currentCondition = weather?.current
  const refreshWeather = () => {
    setIsLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }
  const updatedTime = weather
    ? new Date(weather.current.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : ''

  return (
    <main className="weather-status-page">
      <header className="weather-picker-header weather-status-header">
        <Link className="weather-picker-brand" to={selectionUrl} aria-label="Change selected weather location">
          <span className="weather-picker-brand-icon"><CloudSun size={20} /></span>
          <span>
            <strong>Weather status</strong>
            <small>LOCAL CONDITIONS</small>
          </span>
        </Link>
        <Link className="weather-status-back" to={selectionUrl}><ArrowLeft size={16} /> Change location</Link>
      </header>

      <div className="weather-status-content">
        <section className="weather-status-heading">
          <div>
            <p className="weather-status-eyebrow"><MapPin size={14} /> WEATHER AT YOUR PIN</p>
            <h1>{label}</h1>
            <p className="weather-status-coordinates">
              {formatCoordinate(latitude, 'N', 'S')} · {formatCoordinate(longitude, 'E', 'W')}
            </p>
          </div>
          <button
            type="button"
            className="weather-status-refresh"
            onClick={refreshWeather}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'weather-refresh-spinning' : ''} />
            Refresh
          </button>
        </section>

        {error && (
          <div className="weather-status-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={refreshWeather}>Try again</button>
          </div>
        )}

        <section className="weather-status-grid" aria-label="Current weather and map">
          <article className="weather-status-current">
            <div className="weather-status-card-top">
              <div>
                <p className="weather-status-eyebrow">CURRENT CONDITIONS</p>
                <p className="weather-status-place">{label}</p>
              </div>
              <span className="weather-status-condition-icon" aria-hidden="true">
                {currentCondition ? getWeatherIcon(currentCondition.icon) : '🌡️'}
              </span>
            </div>

            {isLoading ? (
              <p className="weather-status-loading" role="status">Loading local weather…</p>
            ) : weather && currentCondition ? (
              <>
                <div className="weather-status-temperature">
                  <strong>{Math.round(weather.current.temperature)}°</strong>
                  <span>{formatWeatherDescription(currentCondition.description)}</span>
                </div>
                <p className="weather-status-feels">Feels like {Math.round(weather.current.feelsLike)}°C</p>
                <div className="weather-status-metrics">
                  <div><Thermometer size={17} /><span>Humidity</span><strong>{weather.current.humidity}%</strong></div>
                  <div><Droplets size={17} /><span>Rainfall</span><strong>{weather.current.precipitation} mm</strong></div>
                  <div><Wind size={17} /><span>Wind</span><strong>{Math.round(weather.current.windSpeed)} m/s</strong></div>
                </div>
                <p className="weather-status-updated" aria-live="polite">
                  Live from OpenWeather · Updated at {updatedTime}
                </p>
              </>
            ) : null}
          </article>

          <section className="weather-status-map-panel" aria-label="Map showing selected location">
            <div className="weather-status-map-heading">
              <div>
                <p className="weather-status-eyebrow">SELECTED ON MAP</p>
                <h2>{label}</h2>
              </div>
              <MapPin size={20} />
            </div>
            <MapContainer key={`${latitude},${longitude}`} center={coordinates} zoom={11} scrollWheelZoom className="weather-status-map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={coordinates} icon={statusPin} />
            </MapContainer>
            <p className="weather-status-map-coordinates">{latitude.toFixed(5)}°, {longitude.toFixed(5)}°</p>
          </section>
        </section>

        {weather && (
          <section className="weather-status-forecast" aria-label="Three day forecast">
            <div className="weather-status-forecast-heading">
              <div>
                <p className="weather-status-eyebrow">COMING UP</p>
                <h2>Three-day outlook</h2>
              </div>
              <CloudSun size={22} />
            </div>
            <div className="weather-status-forecast-list">
              {weather.daily.map((forecast, index) => {
                return (
                  <article className="weather-status-forecast-day" key={forecast.date}>
                    <strong>{formatForecastDay(forecast.date, index)}</strong>
                    <span className="weather-status-forecast-icon" aria-hidden="true">{getWeatherIcon(forecast.icon)}</span>
                    <span className="weather-status-forecast-condition">{formatWeatherDescription(forecast.description)}</span>
                    <span className="weather-status-forecast-range">
                      {Math.round(forecast.maxTemperature)}° / {Math.round(forecast.minTemperature)}°C
                    </span>
                    <span className="weather-status-rain-chance">
                      <Droplets size={13} /> {forecast.precipitationProbability}% rain
                    </span>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        <footer className="weather-status-footer">
          <Link to={selectionUrl}><ArrowLeft size={16} /> Pick a different spot on the map</Link>
          <span>Weather data provided by OpenWeather</span>
        </footer>
      </div>
    </main>
  )
}
