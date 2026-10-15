import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleMarker, GeoJSON, MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import { divIcon, type LatLngExpression, type LeafletMouseEvent } from 'leaflet'
import { ArrowLeft, CalendarDays, CloudSun, Droplets, FileText, MapPin, RefreshCw, Thermometer, Wind } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import TopNavbar from '@/components/ui/topnavbar'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { fetchCards, fetchClimateReports, fetchWeatherStatus, type CardModel, type ClimateReport, type ClimateReportsResponse, type WeatherStatusResponse } from '@/services/Api'

const DEFAULT_CENTER: LatLngExpression = [19, 96]
const DEFAULT_WEATHER_LOCATION = [16.8661, 96.1951] as const
const severityColors: Record<ClimateReport['severity'], string> = {
  low: '#31865b',
  moderate: '#d39b20',
  high: '#e36b35',
  critical: '#bd3b3b',
}
const riskColors = { watch: '#d9bf63', moderate: '#e99447', high: '#cb4d45' }
const weatherPin = divIcon({
  className: 'community-weather-pin',
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
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })
}

function MapLocationPicker({ onSelect }: { onSelect: (point: [number, number]) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onSelect([event.latlng.lat, event.latlng.lng])
    },
  })
  return null
}

function buildRiskZones(reports: ClimateReport[]): ClimateReportsResponse['riskZones'] {
  const gridSize = 0.05
  const scores: Record<ClimateReport['severity'], number> = { low: 1, moderate: 2, high: 3, critical: 4 }
  const cells = new Map<string, { south: number; west: number; score: number; reportCount: number }>()
  reports.forEach((report) => {
    const south = Math.floor(report.latitude / gridSize) * gridSize
    const west = Math.floor(report.longitude / gridSize) * gridSize
    const key = `${south.toFixed(2)}:${west.toFixed(2)}`
    const cell = cells.get(key) ?? { south, west, score: 0, reportCount: 0 }
    cell.score += scores[report.severity]
    cell.reportCount += 1
    cells.set(key, cell)
  })
  return {
    type: 'FeatureCollection',
    features: [...cells.values()].map(({ south, west, score, reportCount }) => {
      const tier = score >= 8 ? 'high' : score >= 4 ? 'moderate' : 'watch'
      const north = south + gridSize
      const east = west + gridSize
      return {
        type: 'Feature',
        properties: { tier, score, reportCount },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [west, south], [east, south], [east, north], [west, north], [west, south],
          ]],
        },
      }
    }),
  }
}

function readableDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function dateFromInput(value: string) {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function dateToInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedDate = dateFromInput(value)

  return (
    <div className="community-date-filter">
      <span>{label}</span>
      <Button
        type="button"
        variant="outline"
        className="community-date-trigger"
        aria-label={`${label}${selectedDate ? `: ${selectedDate.toLocaleDateString()}` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <CalendarDays size={15} />
        {selectedDate
          ? selectedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          : 'Choose date'}
      </Button>
      {open && (
        <div className="community-date-popover">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onChange(date ? dateToInput(date) : '')
              setOpen(false)
            }}
            autoFocus
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              className="community-date-clear"
              onClick={() => onChange('')}
            >
              Clear date
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default function CommunityMapPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [reports, setReports] = useState<ClimateReport[]>([])
  const [serverRiskZones, setServerRiskZones] = useState<ClimateReportsResponse['riskZones'] | null>(null)
  const [lastUpdated, setLastUpdated] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [township, setTownship] = useState('')
  const [issueType, setIssueType] = useState('')
  const [severity, setSeverity] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [projects, setProjects] = useState<CardModel[]>([])
  const [projectsError, setProjectsError] = useState('')
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [weatherResult, setWeatherResult] = useState<{
    requestKey: string
    data?: WeatherStatusResponse
    error?: string
  } | null>(null)
  const [weatherReloadKey, setWeatherReloadKey] = useState(0)
  const requestedLatitude = Number(searchParams.get('lat'))
  const requestedLongitude = Number(searchParams.get('lon'))
  const hasValidCoordinates =
    searchParams.has('lat') &&
    searchParams.has('lon') &&
    Number.isFinite(requestedLatitude) &&
    Number.isFinite(requestedLongitude) &&
    Math.abs(requestedLatitude) <= 90 &&
    Math.abs(requestedLongitude) <= 180
  const latitude = hasValidCoordinates ? requestedLatitude : DEFAULT_WEATHER_LOCATION[0]
  const longitude = hasValidCoordinates ? requestedLongitude : DEFAULT_WEATHER_LOCATION[1]
  const locationLabel = searchParams.get('label')?.trim() || 'Yangon, Myanmar'
  const weatherRequestKey = `${latitude.toFixed(5)}:${longitude.toFixed(5)}:${weatherReloadKey}`

  useEffect(() => {
    const controller = new AbortController()
    fetchWeatherStatus(latitude, longitude, controller.signal)
      .then((data) => setWeatherResult({ requestKey: weatherRequestKey, data }))
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return
        setWeatherResult({
          requestKey: weatherRequestKey,
          error: fetchError instanceof Error ? fetchError.message : 'Weather data could not be loaded.',
        })
      })

    return () => controller.abort()
  }, [latitude, longitude, weatherReloadKey, weatherRequestKey])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setWeatherReloadKey((key) => key + 1)
    }, 10 * 60 * 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  const refreshReports = useCallback(async () => {
    try {
      const data = await fetchClimateReports()
      setReports(data.reports)
      setServerRiskZones(data.riskZones)
      setLastUpdated(data.updatedAt)
      setError('')
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Community reports could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshReports()
    const intervalId = window.setInterval(() => void refreshReports(), 60_000)
    return () => window.clearInterval(intervalId)
  }, [refreshReports])

  useEffect(() => {
    fetchCards(false)
      .then(setProjects)
      .catch((fetchError: unknown) => {
        setProjectsError(fetchError instanceof Error ? fetchError.message : 'Projects could not be loaded.')
      })
      .finally(() => setProjectsLoading(false))
  }, [])

  const townships = useMemo(() => [...new Set(reports.map((report) => report.township))].sort(), [reports])
  const issueTypes = useMemo(() => [...new Set(reports.map((report) => report.issueType))].sort(), [reports])
  const filteredReports = useMemo(() => reports.filter((report) => {
    const date = report.observationDate.slice(0, 10)
    return (!township || report.township === township)
      && (!issueType || report.issueType === issueType)
      && (!severity || report.severity === severity)
      && (!dateFrom || date >= dateFrom)
      && (!dateTo || date <= dateTo)
  }), [reports, township, issueType, severity, dateFrom, dateTo])
  const hasActiveFilters = Boolean(township || issueType || severity || dateFrom || dateTo)
  const riskZones = useMemo(
    () => hasActiveFilters || !serverRiskZones ? buildRiskZones(filteredReports) : serverRiskZones,
    [filteredReports, hasActiveFilters, serverRiskZones]
  )
  const selectWeatherLocation = (point: [number, number]) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.set('lat', point[0].toFixed(5))
      nextParams.set('lon', point[1].toFixed(5))
      nextParams.set('label', 'Selected map location')
      return nextParams
    }, { replace: true })
  }
  const currentWeatherResult = weatherResult?.requestKey === weatherRequestKey ? weatherResult : null
  const weather = currentWeatherResult?.data ?? null
  const weatherError = currentWeatherResult?.error ?? ''
  const weatherLoading = !currentWeatherResult
  const selectedTown = locationLabel.replace(/,\s*Myanmar$/i, '').trim()
  const normalizeTown = (town: string) => town.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
  const townProjects = projects.filter((project) =>
    project.status.toLocaleLowerCase() === 'active' &&
    project.town &&
    normalizeTown(project.town) === normalizeTown(selectedTown)
  )
  const currentCondition = weather?.current
  const updatedWeatherTime = weather
    ? new Date(weather.current.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : ''

  return (
    <main className="community-map-page">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={() => undefined} />
      <div className="community-map-shell">
        <header className="community-map-heading">
          <div>
            <Link className="community-map-back" to="/"><ArrowLeft size={15} /> YouthAct home</Link>
            <p className="eyebrow">Community + weather dashboard</p>
            <h1>One map.<br /><em>Local climate.</em></h1>
            <p className="community-map-intro">Explore approved community observations alongside live weather conditions. Click anywhere on the map to check the weather at that location.</p>
          </div>
          <div className="community-map-heading-actions">
            <Link className="community-location-link" to="/kobo-form/asVctXHHGzNBbQ8smxu4Ro">
              <FileText size={15} /> Share an observation
            </Link>
            <Link className="community-location-link" to="/yangon-weather"><MapPin size={15} /> Choose a location</Link>
            <button className="community-refresh" type="button" onClick={() => void refreshReports()} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'community-refresh-spin' : ''} /> Refresh reports
            </button>
          </div>
        </header>

        <section className="community-filters" aria-label="Filter community reports">
          <label><span>Township</span><select value={township} onChange={(event) => setTownship(event.target.value)}><option value="">All townships</option>{townships.map((town) => <option key={town}>{town}</option>)}</select></label>
          <label><span>Issue type</span><select value={issueType} onChange={(event) => setIssueType(event.target.value)}><option value="">All issues</option>{issueTypes.map((issue) => <option key={issue}>{issue}</option>)}</select></label>
          <DateFilter label="From date" value={dateFrom} onChange={setDateFrom} />
          <DateFilter label="To date" value={dateTo} onChange={setDateTo} />
          <label><span>Severity</span><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="">All levels</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option></select></label>
        </section>

        {error && <div className="community-map-error" role="alert">{error}<button type="button" onClick={() => void refreshReports()}>Try again</button></div>}

        <section className="community-map-layout community-dashboard-layout" aria-label="Community reports and local weather">
          <div className="community-map-frame">
            <MapContainer center={DEFAULT_CENTER} zoom={6} scrollWheelZoom className="community-leaflet-map">
              <MapLocationPicker onSelect={selectWeatherLocation} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON
                key={JSON.stringify(riskZones.features)}
                data={riskZones}
                style={(feature) => {
                  const tier = feature?.properties?.tier as keyof typeof riskColors
                  return { color: riskColors[tier] ?? riskColors.watch, weight: 1, fillColor: riskColors[tier] ?? riskColors.watch, fillOpacity: 0.28 }
                }}
                onEachFeature={(feature, layer) => {
                  const properties = feature.properties ?? {}
                  layer.bindPopup(`${properties.tier} risk index · ${properties.reportCount} report(s) · score ${properties.score}`)
                }}
              />
              {filteredReports.map((report) => (
                <CircleMarker
                  key={report.id}
                  center={[report.latitude, report.longitude]}
                  radius={8}
                  pathOptions={{ color: '#fff', weight: 2, fillColor: severityColors[report.severity], fillOpacity: 0.95 }}
                >
                  <Popup>
                    <div className="community-report-popup">
                      <strong>{report.issueType}</strong>
                      <span>{report.township} · {readableDate(report.observationDate)}</span>
                      <span>Severity: {report.severity}</span>
                      <span className={report.verified ? 'verified-label' : 'unverified-label'}>{report.verified ? 'Verified report' : 'Unverified report'}</span>
                      <p>{report.description}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              <Marker position={[latitude, longitude]} icon={weatherPin}>
                <Popup>
                  <div className="community-report-popup">
                    <strong>Weather location</strong>
                    <span>{locationLabel}</span>
                    <span>{latitude.toFixed(4)}°, {longitude.toFixed(4)}°</span>
                    <span>Click another point on the map to update local conditions.</span>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
            <div className="community-map-hints">
              <span><MapPin size={13} /> Weather pin · click map to move</span>
              <span>Report locations rounded for privacy</span>
            </div>
          </div>

          <aside className="community-map-sidebar">
            <section className="community-weather-card" aria-label="Current local weather">
              <div className="community-weather-heading">
                <div>
                  <p className="community-kicker">LOCAL WEATHER</p>
                  <h2>{locationLabel}</h2>
                </div>
                <button
                  type="button"
                  className="community-weather-refresh"
                  aria-label="Refresh local weather"
                  title="Refresh local weather"
                  onClick={() => {
                    setWeatherReloadKey((key) => key + 1)
                  }}
                  disabled={weatherLoading}
                >
                  <RefreshCw size={15} className={weatherLoading ? 'community-refresh-spin' : ''} />
                </button>
              </div>
              {weatherError ? (
                <div className="community-weather-error" role="alert">
                  <p>{weatherError}</p>
                  <button type="button" onClick={() => setWeatherReloadKey((key) => key + 1)}>Try again</button>
                </div>
              ) : weatherLoading && !currentCondition ? (
                <p className="community-weather-loading" role="status">Loading local weather…</p>
              ) : currentCondition ? (
                <>
                  <div className="community-weather-current">
                    <span className="community-weather-icon" aria-hidden="true">{getWeatherIcon(currentCondition.icon)}</span>
                    <div>
                      <strong>{Math.round(currentCondition.temperature)}°</strong>
                      <span>{formatWeatherDescription(currentCondition.description)}</span>
                      <small>Feels like {Math.round(currentCondition.feelsLike)}°C</small>
                    </div>
                  </div>
                  <div className="community-weather-metrics">
                    <span><Droplets size={14} /> Humidity <strong>{currentCondition.humidity}%</strong></span>
                    <span><CloudSun size={14} /> Rain <strong>{currentCondition.precipitation} mm</strong></span>
                    <span><Wind size={14} /> Wind <strong>{Math.round(currentCondition.windSpeed)} m/s</strong></span>
                  </div>
                  <p className="community-weather-updated" aria-live="polite">
                    <Thermometer size={12} /> OpenWeather · Updated {updatedWeatherTime}
                  </p>
                  {weather?.daily.length ? (
                    <div className="community-weather-forecast" aria-label="Three day forecast">
                      {weather.daily.map((forecast, index) => (
                        <div key={forecast.date}>
                          <strong>{formatForecastDay(forecast.date, index)}</strong>
                          <span aria-hidden="true">{getWeatherIcon(forecast.icon)}</span>
                          <small>{Math.round(forecast.maxTemperature)}° / {Math.round(forecast.minTemperature)}°</small>
                          <small><Droplets size={11} /> {forecast.precipitationProbability}%</small>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>
            <div className="community-sidebar-heading"><div><p className="community-kicker">VISIBLE REPORTS</p><h2>{filteredReports.length}</h2></div><span>{lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Waiting for data'}</span></div>
            <div className="community-legend">
              <h3>Map legend</h3>
              <p className="community-legend-section">Report pins · severity</p>
              {Object.entries(severityColors).map(([level, color]) => <div className="community-legend-row" key={level}><span className="legend-dot" style={{ backgroundColor: color }} />{level[0].toUpperCase() + level.slice(1)}</div>)}
              <p className="community-legend-section">Risk zones · report index</p>
              {Object.entries(riskColors).map(([tier, color]) => <div className="community-legend-row" key={tier}><span className="legend-square" style={{ backgroundColor: color }} />{tier[0].toUpperCase() + tier.slice(1)}</div>)}
              <p className="community-methodology">Each 0.05° grid cell (~5 km) sums approved report severity points: low 1, moderate 2, high 3, critical 4. Scores 1–3 = watch, 4–7 = moderate, 8+ = high. This is a screening index to guide assessment, not an official hazard boundary or forecast.</p>
              <p className="community-legend-section">Issue categories</p>
              <p className="community-category-note">{issueTypes.length ? issueTypes.join(' · ') : 'Categories appear when approved reports are available.'}</p>
            </div>
            <div className="community-report-list">
              {loading && reports.length === 0 ? <p className="community-empty">Loading approved reports…</p> : filteredReports.length === 0 ? <p className="community-empty">No approved reports match these filters.</p> : filteredReports.slice(0, 30).map((report) => (
                <article className="community-report-item" key={report.id}>
                  <span className="community-report-dot" style={{ backgroundColor: severityColors[report.severity] }} />
                  <div><strong>{report.issueType}</strong><p>{report.township} · {readableDate(report.observationDate)}</p><span className={report.verified ? 'verified-label' : 'unverified-label'}>{report.verified ? 'Verified' : 'Unverified'}</span></div>
                </article>
              ))}
              {filteredReports.length > 30 && <p className="community-empty">Showing 30 of {filteredReports.length} reports; all reports remain visible on the map.</p>}
            </div>
          </aside>
        </section>
        <section className="community-town-projects" aria-labelledby="community-town-projects-title">
          <div className="community-town-projects-heading">
            <div>
              <p className="community-kicker">YOUTHACT PROJECTS</p>
              <h2 id="community-town-projects-title">Work happening in {selectedTown}</h2>
              <p>Explore active projects connected to this town.</p>
            </div>
            <span>{townProjects.length} {townProjects.length === 1 ? 'project' : 'projects'}</span>
          </div>
          {projectsLoading ? (
            <p className="community-projects-empty" role="status">Loading projects…</p>
          ) : projectsError ? (
            <p className="community-projects-empty" role="alert">{projectsError}</p>
          ) : townProjects.length ? (
            <div className="community-town-project-grid">
              {townProjects.map((project) => (
                <article className="community-town-project" key={project.id}>
                  <img src={project.images?.[0] || project.image} alt="" loading="lazy" />
                  <div>
                    <span>{project.category}</span>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <Link to={`/project/${project.id}/projectdetailpage`}>Explore project <span aria-hidden="true">↗</span></Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="community-projects-empty">
              {selectedTown.toLocaleLowerCase() === 'selected map location'
                ? 'Choose a town from “Choose a location” to see projects assigned to it.'
                : `No active projects are assigned to ${selectedTown} yet.`}
            </p>
          )}
        </section>
        <p className="community-map-footnote">Reports are reviewed before publication. Risk zones are derived only from approved observations and should be interpreted with local knowledge and supporting GIS assessment.</p>
      </div>
    </main>
  )
}
