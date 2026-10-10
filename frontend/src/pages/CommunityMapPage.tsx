import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { ArrowLeft, CalendarDays, RefreshCw } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import TopNavbar from '@/components/ui/topnavbar'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { fetchClimateReports, type ClimateReport, type ClimateReportsResponse } from '@/services/Api'

const DEFAULT_CENTER: LatLngExpression = [19, 96]
const severityColors: Record<ClimateReport['severity'], string> = {
  low: '#31865b',
  moderate: '#d39b20',
  high: '#e36b35',
  critical: '#bd3b3b',
}
const riskColors = { watch: '#d9bf63', moderate: '#e99447', high: '#cb4d45' }

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

  return (
    <main className="community-map-page">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={() => undefined} />
      <div className="community-map-shell">
        <header className="community-map-heading">
          <div>
            <Link className="community-map-back" to="/"><ArrowLeft size={15} /> YouthAct home</Link>
            <p className="eyebrow">Community climate observations</p>
            <h1>Local reports.<br /><em>Shared evidence.</em></h1>
            <p className="community-map-intro">Explore approved environmental observations submitted by community members. Personal details and photographs are not displayed.</p>
          </div>
          <button className="community-refresh" type="button" onClick={() => void refreshReports()} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'community-refresh-spin' : ''} /> Refresh
          </button>
        </header>

        <section className="community-filters" aria-label="Filter community reports">
          <label><span>Township</span><select value={township} onChange={(event) => setTownship(event.target.value)}><option value="">All townships</option>{townships.map((town) => <option key={town}>{town}</option>)}</select></label>
          <label><span>Issue type</span><select value={issueType} onChange={(event) => setIssueType(event.target.value)}><option value="">All issues</option>{issueTypes.map((issue) => <option key={issue}>{issue}</option>)}</select></label>
          <DateFilter label="From date" value={dateFrom} onChange={setDateFrom} />
          <DateFilter label="To date" value={dateTo} onChange={setDateTo} />
          <label><span>Severity</span><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="">All levels</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option></select></label>
        </section>

        {error && <div className="community-map-error" role="alert">{error}<button type="button" onClick={() => void refreshReports()}>Try again</button></div>}

        <section className="community-map-layout" aria-label="Community climate report map">
          <div className="community-map-frame">
            <MapContainer center={DEFAULT_CENTER} zoom={6} scrollWheelZoom className="community-leaflet-map">
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
            </MapContainer>
            <div className="community-map-attribution">Report locations are rounded to approximately 100 m for privacy.</div>
          </div>

          <aside className="community-map-sidebar">
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
        <p className="community-map-footnote">Reports are reviewed before publication. Risk zones are derived only from approved observations and should be interpreted with local knowledge and supporting GIS assessment.</p>
      </div>
    </main>
  )
}
