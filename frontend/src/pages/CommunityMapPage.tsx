import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleMarker, GeoJSON, MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import { divIcon, type LatLngExpression, type LeafletMouseEvent } from 'leaflet'
import { ArrowLeft, CloudSun, Droplets, FileText, MapPin, RefreshCw, Thermometer, Wind } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import TopNavbar from '@/components/ui/topnavbar'
import { FormattedText } from '@/components/RichText'
import { fetchCards, fetchClimateReports, fetchKoboFormDetails, fetchWeatherStatus, getPublicClimateReportImageUrl, type CardModel, type ClimateReport, type ClimateReportsResponse, type KoboFormDetails, type KoboIssueChoice, type WeatherStatusResponse } from '@/services/Api'

const DEFAULT_CENTER: LatLngExpression = [19, 96]
const DEFAULT_WEATHER_LOCATION = [16.8661, 96.1951] as const
const KOBO_CLIMATE_FORM_ID = 'asVctXHHGzNBbQ8smxu4Ro'
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

function normalizeIssueType(issue: string) {
  return issue.trim().toLocaleLowerCase().replace(/_+/g, ' ').replace(/\s+/g, ' ')
}

function issueTypeChoices(issue: string) {
  const trimmed = issue.trim()
  if (!trimmed) return []
  const hasKoboChoiceCodes = /^[\w-]+(?:\s+[\w-]+)*$/u.test(trimmed) && trimmed.includes('_')
  const choices = hasKoboChoiceCodes ? trimmed.split(/\s+/) : trimmed.split(/\s*,\s*/)
  return choices.map((choice) => choice.trim().replace(/^_+|_+$/g, '')).filter(Boolean)
}

function issueTypeLabel(choice: string) {
  if (!/^[a-z0-9_-]+$/i.test(choice) || !choice.includes('_')) return choice
  const readable = choice.replace(/_+/g, ' ').trim()
  return readable.charAt(0).toLocaleUpperCase() + readable.slice(1)
}

function reportIssueTypes(report: ClimateReport) {
  return report.issueTypes?.length ? report.issueTypes : issueTypeChoices(report.issueType)
}

function displayIssueType(issue: string) {
  return issueTypeChoices(issue).map(issueTypeLabel).join(', ')
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
  const [koboIssueChoices, setKoboIssueChoices] = useState<KoboIssueChoice[]>([])
  const [koboSection3Options, setKoboSection3Options] = useState<KoboFormDetails['section3Options']>([])
  const [koboIssueChoicesError, setKoboIssueChoicesError] = useState('')
  const [koboIssueChoicesLoading, setKoboIssueChoicesLoading] = useState(true)
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
    const controller = new AbortController()
    fetchKoboFormDetails(KOBO_CLIMATE_FORM_ID, controller.signal)
      .then((form) => {
        const hasValidChoice = (choice: { value: string; label: string }) =>
          choice &&
          typeof choice.value === 'string' &&
          typeof choice.label === 'string'
        const hasValidSection3Options =
          Array.isArray(form.section3Options) &&
          form.section3Options.every((group) =>
            group &&
            typeof group.questionName === 'string' &&
            typeof group.questionLabel === 'string' &&
            Array.isArray(group.choices) &&
            group.choices.every(hasValidChoice)
          )
        const hasValidIssueChoices =
          Array.isArray(form.issueTypeChoices) && form.issueTypeChoices.every(hasValidChoice)
        if (!hasValidSection3Options || !hasValidIssueChoices) {
          throw new Error(
            'The Kobo metadata API is outdated. Deploy the latest backend to load Section 3 options.'
          )
        }
        setKoboIssueChoices(form.issueTypeChoices)
        setKoboSection3Options(form.section3Options)
        setKoboIssueChoicesError('')
      })
      .catch((fetchError: unknown) => {
        if (!controller.signal.aborted) {
          setKoboIssueChoicesError(
            fetchError instanceof Error ? fetchError.message : 'Section 3 options could not be loaded.'
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setKoboIssueChoicesLoading(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    fetchCards(false)
      .then(setProjects)
      .catch((fetchError: unknown) => {
        setProjectsError(fetchError instanceof Error ? fetchError.message : 'Projects could not be loaded.')
      })
      .finally(() => setProjectsLoading(false))
  }, [])

  const townships = useMemo(() => [...new Set(reports.map((report) => report.township))].sort(), [reports])
  const issueChoices = Array.isArray(koboIssueChoices) ? koboIssueChoices : []
  const selectedIssueType = normalizeIssueType(issueType)
  const filteredReports = useMemo(() => reports.filter((report) => {
    return (!township || report.township === township)
      && (!selectedIssueType || reportIssueTypes(report).some((choice) => normalizeIssueType(choice) === selectedIssueType))
      && (!severity || report.severity === severity)
  }), [reports, township, selectedIssueType, severity])
  const hasActiveFilters = Boolean(township || issueType || severity)
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
            <p className="eyebrow">Climate Mapping</p>
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
          <label>
            <select aria-label="Q8. What environmental problem did you notice?" value={issueType} onChange={(event) => setIssueType(event.target.value)}>
              <option value="">Show all</option>
              {issueChoices.map(({ value, label }) => <option key={value} value={label}>{label}</option>)}
            </select>
            {koboIssueChoicesLoading && <small role="status">Loading Section 3 options…</small>}
            {koboIssueChoicesError && <small className="field-error" role="status">{koboIssueChoicesError}</small>}
          </label>
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
                      <strong>{displayIssueType(report.issueType)}</strong>
                      {report.imageUrl && (
                        <img
                          className="community-report-popup-image"
                          src={getPublicClimateReportImageUrl(report.imageUrl)}
                          alt={`Submitted photo for ${displayIssueType(report.issueType)}`}
                          onError={(event) => { event.currentTarget.hidden = true }}
                        />
                      )}
                      <span>{report.township} · {readableDate(report.observationDate)}</span>
                      <span>Severity: {report.severity}</span>
                      <span className={report.verified ? 'verified-label' : 'unverified-label'}>{report.verified ? 'Verified report' : 'Unverified report'}</span>
                      <FormattedText as="p" text={report.description ?? ''} />
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
              <p className="community-category-note">
                {koboIssueChoicesLoading
                  ? 'Loading Section 3 options…'
                  : koboIssueChoicesError
                    ? koboIssueChoicesError
                    : koboSection3Options.length
                      ? koboSection3Options
                        .map(({ questionLabel, choices }) => `${questionLabel}: ${choices.map(({ label }) => label).join(', ')}`)
                        .join(' · ')
                      : 'No Section 3 options are configured.'}
              </p>
            </div>
            <div className="community-report-list">
              {loading && reports.length === 0 ? <p className="community-empty">Loading approved reports…</p> : filteredReports.length === 0 ? <p className="community-empty">No approved reports match these filters.</p> : filteredReports.slice(0, 30).map((report) => (
                <article className="community-report-item" key={report.id}>
                  <span className="community-report-dot" style={{ backgroundColor: severityColors[report.severity] }} />
                  <div><strong>{displayIssueType(report.issueType)}</strong><p>{report.township} · {readableDate(report.observationDate)}</p><span className={report.verified ? 'verified-label' : 'unverified-label'}>{report.verified ? 'Verified' : 'Unverified'}</span></div>
                </article>
              ))}
              {filteredReports.length > 30 && <p className="community-empty">Showing 30 of {filteredReports.length} reports; all reports remain visible on the map.</p>}
            </div>
          </aside>
        </section>
        <section className="community-observations" aria-labelledby="community-observations-title">
          <div className="community-observations-heading">
            <div>
              <p className="community-kicker">KOBO TOOLBOX · APPROVED SUBMISSIONS</p>
              <h2 id="community-observations-title">Community climate observations</h2>
              <p>Field observations shared through KoboToolbox and reviewed by the YouthAct team.</p>
            </div>
            <span>{filteredReports.length} {filteredReports.length === 1 ? 'observation' : 'observations'}</span>
          </div>
          {loading && reports.length === 0 ? (
            <p className="community-observations-empty" role="status">Loading approved KoboToolbox observations…</p>
          ) : filteredReports.length === 0 ? (
            <p className="community-observations-empty">
              No approved observations match these filters. New KoboToolbox submissions appear here after review.
            </p>
          ) : (
            <div className="community-observation-grid">
              {filteredReports.slice(0, 30).map((report) => (
                <article className="community-observation-card" key={report.id}>
                  {report.imageUrl && (
                    <img
                      className="community-observation-image"
                      src={getPublicClimateReportImageUrl(report.imageUrl)}
                      alt={`Submitted photo for ${displayIssueType(report.issueType)} in ${report.township}`}
                      loading="lazy"
                      onError={(event) => { event.currentTarget.hidden = true }}
                    />
                  )}
                  <div className="community-observation-card-top">
                    <span className={`community-observation-severity community-observation-severity-${report.severity}`}>
                      {report.severity}
                    </span>
                    {report.verified && <span className="verified-label">Verified</span>}
                  </div>
                  <h3 className="community-observation-issues-label">Issue type</h3>
                  <ul className="community-observation-issues" aria-label={`Issue type: ${displayIssueType(report.issueType)}`}>
                    {reportIssueTypes(report).slice(0, 1).map((choice) => (
                      <li key={`${report.id}-${choice}`}>{issueTypeLabel(choice)}</li>
                    ))}
                  </ul>
                  <p className="community-observation-location">{report.township} · {readableDate(report.observationDate)}</p>
                  {report.description ? (
                    <FormattedText as="p" className="community-observation-description" text={report.description} />
                  ) : (
                    <p className="community-observation-description is-empty">No public description was added.</p>
                  )}
                </article>
              ))}
            </div>
          )}
          {filteredReports.length > 30 && (
            <p className="community-observations-footnote">
              Showing the latest 30 of {filteredReports.length} matching observations. Use the filters above to narrow the list.
            </p>
          )}
        </section>
        <p className="community-map-footnote">Reports are reviewed before publication. Risk zones are derived only from approved observations and should be interpreted with local knowledge and supporting GIS assessment.</p>
      </div>
    </main>
  )
}
