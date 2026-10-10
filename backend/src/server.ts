import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Card, Story, User, GoogleSheetImport, Town, ClimateReport } from './Schema'
import { connectDB } from './connectDB'
import mongoose from 'mongoose'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist')

const app = express()
const port = process.env.PORT || 4000
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin'
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123'
const adminSessions = new Map<string, { username: string; createdAt: number }>()
const KOBO_API_URL = (process.env.KOBO_API_URL ?? 'https://kf.kobotoolbox.org').replace(/\/+$/, '')
let isKoboSyncRunning = false

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))

function serializeCard(card: any) {
  const plainCard = typeof card?.toObject === 'function' ? card.toObject() : card
  return {
    id: plainCard?._id ? plainCard._id.toString() : plainCard?.id,
    title: plainCard?.title,
    description: plainCard?.description,
    category: plainCard?.category,
    status: plainCard?.status,
    image: plainCard?.image,
    images: Array.isArray(plainCard?.images) && plainCard.images.length > 0
      ? plainCard.images
      : plainCard?.image ? [plainCard.image] : [],
  }
}

function serializeStory(story: any) {
  const plainStory = typeof story?.toObject === 'function' ? story.toObject() : story
  return {
    id: plainStory?._id ? plainStory._id.toString() : plainStory?.id,
    title: plainStory?.title,
    type: plainStory?.type,
    description: plainStory?.description,
    image: plainStory?.image,
    status: plainStory?.status,
  }
}

function getCardImages(body: Record<string, unknown>): string[] | null {
  const submittedImages = body.images
  const images: unknown[] = Array.isArray(submittedImages)
    ? submittedImages
    : typeof body.image === 'string' && body.image ? [body.image] : []
  if (
    images.length === 0 ||
    images.length > 8 ||
    !images.every((image): image is string => typeof image === 'string' && image.length > 0)
  ) {
    return null
  }
  return images
}

function serializeTown(town: any) {
  const plainTown = typeof town?.toObject === 'function' ? town.toObject() : town
  return {
    id: plainTown?._id ? plainTown._id.toString() : plainTown?.id,
    town: plainTown?.town,
  }
}

function getBearerToken(request: express.Request) {
  const header = request.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7) : null
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (character === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      break
    }

    current += character
  }

  values.push(current)
  return values.map((value) => value.trim())
}

function parseCsvRows(csvText: string): string[][] {
  const rows = csvText
    .split(/\r?\n/)
    .filter((row) => row.trim().length > 0)
    .map((row) => parseCsvLine(row))

  return rows.filter((row) => row.some((value) => value.length > 0))
}

function normalizeFieldName(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ')
}

function pickValue(record: Record<string, string>, candidates: string[]) {
  const normalizedMap = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [normalizeFieldName(key), value ?? ''])
  )

  for (const candidate of candidates) {
    const normalized = normalizeFieldName(candidate)
    if (normalizedMap[normalized]) {
      return normalizedMap[normalized].trim()
    }
  }

  return ''
}

function toGoogleSheetCard(record: Record<string, string>) {
  const title = pickValue(record, ['title', 'name', 'project', 'headline'])
  const description = pickValue(record, ['description', 'summary', 'details', 'about'])
  const category = pickValue(record, ['category', 'type', 'program', 'theme'])
  const status = pickValue(record, ['status', 'state', 'visibility']) || 'active'
  const image = pickValue(record, ['image', 'photo', 'thumbnail', 'picture', 'url'])

  return {
    title: title || 'Untitled card',
    description: description || 'Imported from Google Sheet',
    category: category || 'general',
    status: ['active', 'draft', 'archived'].includes(status.toLowerCase()) ? status.toLowerCase() : 'active',
    image: image || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  }
}

function getGoogleSheetCsvUrl(sourceUrl: string) {
  const trimmed = sourceUrl.trim()

  if (/\.csv(?:\?|$)/i.test(trimmed) || /export\?format=csv/i.test(trimmed)) {
    return trimmed
  }

  const spreadsheetIdMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  const gidMatch = trimmed.match(/[?&]gid=(\d+)/i)

  if (!spreadsheetIdMatch) {
    return trimmed
  }

  const spreadsheetId = spreadsheetIdMatch[1]
  const gid = gidMatch ? `&gid=${gidMatch[1]}` : ''
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gid}`
}

function requireAdmin(request: express.Request, response: express.Response, next: express.NextFunction) {
  const token = getBearerToken(request)

  if (!token || !adminSessions.has(token)) {
    response.status(401).json({ message: 'Unauthorized. Admin access required.' })
    return
  }

  next()
}

function normalizeKoboKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function flattenKoboRecord(record: Record<string, unknown>) {
  const values = new Map<string, unknown>()
  const visit = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      if (value.every((part) => typeof part === 'number')) {
        values.set(normalizeKoboKey(path), value)
      } else {
        value.forEach((part, index) => visit(part, `${path}${index}`))
      }
      return
    }
    if (value && typeof value === 'object') {
      for (const [key, nestedValue] of Object.entries(value)) {
        visit(nestedValue, path ? `${path}/${key}` : key)
      }
      return
    }
    values.set(normalizeKoboKey(path), value)
  }

  visit(record, '')
  return values
}

function pickKoboValue(values: Map<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    const wanted = normalizeKoboKey(alias)
    const value = values.get(wanted) ?? [...values.entries()].find(([key]) => key.endsWith(wanted))?.[1]
    if (value !== undefined && value !== null && String(value).trim()) return value
  }
  return undefined
}

function parseKoboCoordinate(value: unknown): [number, number] | null {
  if (Array.isArray(value) && value.length >= 2) {
    const latitude = Number(value[0])
    const longitude = Number(value[1])
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null
  }
  if (typeof value !== 'string') return null
  const parts = value.trim().split(/[,\s]+/).map(Number)
  return parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])
    ? [parts[0], parts[1]]
    : null
}

function normalizeKoboSeverity(value: unknown): 'low' | 'moderate' | 'high' | 'critical' {
  const severity = String(value ?? '').toLowerCase()
  if (/critical|extreme|very high|severe/.test(severity)) return 'critical'
  if (/high/.test(severity)) return 'high'
  if (/medium|moderate/.test(severity)) return 'moderate'
  return 'low'
}

function normalizeKoboReport(record: Record<string, unknown>) {
  const values = flattenKoboRecord(record)
  const coordinate =
    parseKoboCoordinate(pickKoboValue(values, ['_geolocation', 'geolocation', 'gps', 'geopoint', 'location'])) ??
    (() => {
      const latitude = Number(pickKoboValue(values, ['latitude', 'lat']))
      const longitude = Number(pickKoboValue(values, ['longitude', 'lon', 'lng']))
      return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] as [number, number] : null
    })()

  if (!coordinate || Math.abs(coordinate[0]) > 90 || Math.abs(coordinate[1]) > 180) return null

  const issueType = String(pickKoboValue(values, ['issue_type', 'issue', 'environmental_issue', 'climate_hazard', 'hazard', 'category']) ?? '').trim()
  if (!issueType) return null
  const observedAt = pickKoboValue(values, ['observation_date', 'date_observed', 'date', '_submission_time'])
  const parsedDate = observedAt ? new Date(String(observedAt)) : new Date()
  const id = String(record._uuid ?? record._id ?? record.id ?? '').trim()
  if (!id) return null

  return {
    externalId: id,
    township: String(pickKoboValue(values, ['township', 'town', 'district', 'area']) ?? 'Unspecified').trim().slice(0, 120) || 'Unspecified',
    issueType: issueType.slice(0, 120),
    observationDate: Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
    latitude: coordinate[0],
    longitude: coordinate[1],
    severity: normalizeKoboSeverity(pickKoboValue(values, ['severity', 'impact_level', 'risk_level'])),
    sourceDescription: String(pickKoboValue(values, ['approved_description', 'description', 'observation', 'details', 'notes']) ?? '').trim().slice(0, 2000),
  }
}

async function syncKoboReports() {
  const assetUid = process.env.KOBO_ASSET_UID?.trim()
  const apiToken = process.env.KOBO_API_TOKEN?.trim()
  if (!assetUid || !apiToken) return { imported: 0, configured: false }
  if (isKoboSyncRunning) return { imported: 0, configured: true }

  isKoboSyncRunning = true
  try {
    if (new URL(KOBO_API_URL).protocol !== 'https:') {
      throw new Error('KOBO_API_URL must use HTTPS to protect the API token')
    }
    let nextUrl: string | null = `${KOBO_API_URL}/api/v2/assets/${encodeURIComponent(assetUid)}/data/?format=json`
    let imported = 0
    let pageCount = 0
    while (nextUrl && pageCount < 50) {
      const parsedUrl = new URL(nextUrl)
      if (parsedUrl.origin !== new URL(KOBO_API_URL).origin) {
        throw new Error('Kobo pagination returned an unexpected host')
      }
      const pageResponse = await axios.get<{ results?: unknown[]; next?: string | null }>(nextUrl, {
        headers: { Authorization: `Token ${apiToken}` },
        timeout: 20000,
        maxRedirects: 0,
      })
      const pageData: { results?: unknown[]; next?: string | null } = pageResponse.data
      const records = Array.isArray(pageData.results) ? pageData.results : []
      for (const record of records) {
        const normalized = normalizeKoboReport(record as Record<string, unknown>)
        if (!normalized) continue
        const upsertResult = await ClimateReport.updateOne(
          { externalId: normalized.externalId },
          { $setOnInsert: { ...normalized, status: 'pending', verified: false } },
          { upsert: true }
        )
        imported += upsertResult.upsertedCount
      }
      nextUrl = typeof pageData.next === 'string' ? pageData.next : null
      pageCount += 1
    }
    if (nextUrl) throw new Error('Kobo submissions exceeded the 50-page synchronization limit')
    return { imported, configured: true }
  } finally {
    isKoboSyncRunning = false
  }
}

function serializeClimateReport(report: any, publicView = false) {
  const latitude = Number(report.latitude)
  const longitude = Number(report.longitude)
  const common = {
    id: report._id?.toString() ?? report.id,
    township: report.township,
    issueType: report.issueType,
    observationDate: new Date(report.observationDate).toISOString(),
    latitude: publicView ? Number(latitude.toFixed(3)) : latitude,
    longitude: publicView ? Number(longitude.toFixed(3)) : longitude,
    severity: report.severity,
    status: report.status,
    verified: Boolean(report.verified),
  }
  return publicView
    ? { ...common, description: sanitizePublicDescription(report.approvedDescription) }
    : { ...common, sourceDescription: report.sourceDescription, approvedDescription: report.approvedDescription }
}

function sanitizePublicDescription(value: unknown) {
  return String(value ?? '')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[contact detail removed]')
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, '[link removed]')
    .replace(/(?:\+?\d[\d\s().-]{6,}\d)/g, '[contact detail removed]')
    .trim()
}

const severityScores: Record<string, number> = { low: 1, moderate: 2, high: 3, critical: 4 }

function createRiskZones(reports: Array<{ latitude: number; longitude: number; severity: string }>) {
  const cellSize = 0.05
  const cells = new Map<string, { south: number; west: number; score: number; count: number }>()
  for (const report of reports) {
    const south = Math.floor(report.latitude / cellSize) * cellSize
    const west = Math.floor(report.longitude / cellSize) * cellSize
    const key = `${south.toFixed(2)}:${west.toFixed(2)}`
    const cell = cells.get(key) ?? { south, west, score: 0, count: 0 }
    cell.score += severityScores[report.severity] ?? 1
    cell.count += 1
    cells.set(key, cell)
  }
  return {
    type: 'FeatureCollection',
    features: [...cells.values()].map((cell) => {
      const tier = cell.score >= 8 ? 'high' : cell.score >= 4 ? 'moderate' : 'watch'
      const north = cell.south + cellSize
      const east = cell.west + cellSize
      return {
        type: 'Feature',
        properties: { tier, score: cell.score, reportCount: cell.count },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [cell.west, cell.south], [east, cell.south], [east, north],
            [cell.west, north], [cell.west, cell.south],
          ]],
        },
      }
    }),
  }
}

async function ensureDefaultAdminUser() {
  const normalizedUsername = DEFAULT_ADMIN_USERNAME.trim().toLowerCase()
  const existingUser = await User.findOne({ username: normalizedUsername }).lean()

  if (existingUser) {
    return
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10)
  await User.create({
    username: normalizedUsername,
    password: hashedPassword,
    role: 'admin',
  })
}

app.post('/api/admin/login', async (request, response) => {
  const username = typeof request.body?.username === 'string' ? request.body.username.trim() : ''
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  const normalizedUsername = username.toLowerCase()

  const user = await User.findOne({ username: normalizedUsername })

  if (!user) {
    response.status(401).json({ message: 'Invalid admin credentials' })
    return
  }

  const isValidPassword = await bcrypt.compare(password, user.password)

  if (!isValidPassword) {
    response.status(401).json({ message: 'Invalid admin credentials' })
    return
  }

  const token = randomUUID()
  adminSessions.set(token, {
    username: normalizedUsername,
    createdAt: Date.now(),
  })

  response.json({
    token,
    user: {
      username: normalizedUsername,
      role: user.role ?? 'admin',
    },
  })
})

app.post('/createCard', async (_request, response) => {
  try {
    const newCard = new Card({
      id: '',
      title: '',
      description: '',
      category: '',
      status: '',
      image: '',
    })

    await newCard.save()
    response.status(201).json(serializeCard(newCard))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to create card'
    response.status(400).json({ message: 'Unable to create card', error: errorMessage })
  }
})

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'youthact-api' })
})

app.get('/api/climate/reports', async (_request, response) => {
  try {
    const reports = await ClimateReport.find({ status: 'approved' }).sort({ observationDate: -1 }).limit(500).lean()
    response.json({
      reports: reports.map((report) => serializeClimateReport(report, true)),
      riskZones: createRiskZones(reports),
      updatedAt: new Date().toISOString(),
      refreshIntervalSeconds: 60,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load climate reports'
    response.status(500).json({ message: 'Unable to load climate reports', error: errorMessage })
  }
})

app.get('/api/admin/climate/reports', requireAdmin, async (request, response) => {
  try {
    const status = typeof request.query.status === 'string' ? request.query.status : 'pending'
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      response.status(400).json({ message: 'Invalid report status' })
      return
    }
    const reports = await ClimateReport.find({ status }).sort({ createdAt: -1 }).limit(500).lean()
    response.json(reports.map((report) => serializeClimateReport(report)))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load report review queue'
    response.status(500).json({ message: 'Unable to load report review queue', error: errorMessage })
  }
})

app.post('/api/admin/climate/sync', requireAdmin, async (_request, response) => {
  try {
    const result = await syncKoboReports()
    if (!result.configured) {
      response.status(503).json({ message: 'Kobo sync is not configured on the server.' })
      return
    }
    response.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to sync Kobo submissions'
    console.error('Kobo submission sync failed:', errorMessage)
    response.status(502).json({ message: 'Unable to sync Kobo submissions', error: errorMessage })
  }
})

app.put('/api/admin/climate/reports/:id', requireAdmin, async (request, response) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(404).json({ message: 'Climate report not found' })
      return
    }
    const status = request.body?.status
    const approvedDescription = typeof request.body?.approvedDescription === 'string'
      ? request.body.approvedDescription.trim().slice(0, 1000)
      : ''
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      response.status(400).json({ message: 'A valid review status is required' })
      return
    }
    if (status === 'approved' && !approvedDescription) {
      response.status(400).json({ message: 'Add an approved, privacy-reviewed description before publishing.' })
      return
    }
    const report = await ClimateReport.findByIdAndUpdate(
      request.params.id,
      {
        status,
        approvedDescription: status === 'approved' ? approvedDescription : '',
        verified: status === 'approved' && request.body?.verified === true,
      },
      { new: true, runValidators: true }
    )
    if (!report) {
      response.status(404).json({ message: 'Climate report not found' })
      return
    }
    response.json(serializeClimateReport(report))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to update climate report'
    response.status(400).json({ message: 'Unable to update climate report', error: errorMessage })
  }
})

app.get('/api/weather', async (request, response) => {
  const latitudeValue = typeof request.query.lat === 'string' ? request.query.lat.trim() : ''
  const longitudeValue = typeof request.query.lon === 'string' ? request.query.lon.trim() : ''
  const latitude = Number(latitudeValue)
  const longitude = Number(longitudeValue)
  const apiKey = process.env.OPENWEATHER_API_KEY?.trim()

  if (!latitudeValue || !longitudeValue ||
      !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    response.status(400).json({ message: 'Valid latitude and longitude are required.' })
    return
  }

  if (!apiKey) {
    response.status(503).json({ message: 'Weather service is not configured. Set OPENWEATHER_API_KEY on the backend.' })
    return
  }

  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    appid: apiKey,
    units: 'metric',
  })
  const baseUrl = 'https://api.openweathermap.org/data/2.5'

  try {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`${baseUrl}/weather?${params}`, { signal: AbortSignal.timeout(10000) }),
      fetch(`${baseUrl}/forecast?${params}`, { signal: AbortSignal.timeout(10000) }),
    ])

    if (!currentResponse.ok || !forecastResponse.ok) {
      const failedResponse = !currentResponse.ok ? currentResponse : forecastResponse
      console.error(`OpenWeather returned HTTP ${failedResponse.status}.`)
      response.status(502).json({ message: 'OpenWeather could not load conditions for this location.' })
      return
    }

    const currentData = await currentResponse.json() as {
      dt: number
      main: { temp: number; feels_like: number; humidity: number }
      weather: Array<{ description: string; icon: string }>
      wind: { speed: number }
      rain?: { '1h'?: number; '3h'?: number }
    }
    const forecastData = await forecastResponse.json() as {
      city: { timezone: number }
      list: Array<{
        dt: number
        main: { temp_min: number; temp_max: number }
        weather: Array<{ description: string; icon: string }>
        pop: number
      }>
    }

    if (!currentData.main || !currentData.weather?.length || !forecastData.list?.length) {
      console.error('OpenWeather returned incomplete weather data.')
      response.status(502).json({ message: 'OpenWeather returned incomplete weather data.' })
      return
    }

    const forecastsByDate = new Map<string, typeof forecastData.list>()
    for (const forecast of forecastData.list) {
      const date = new Date((forecast.dt + forecastData.city.timezone) * 1000).toISOString().slice(0, 10)
      const forecasts = forecastsByDate.get(date) ?? []
      forecasts.push(forecast)
      forecastsByDate.set(date, forecasts)
    }

    const daily = Array.from(forecastsByDate.entries()).slice(0, 3).map(([date, forecasts]) => {
      const minTemperature = Math.min(...forecasts.map((forecast) => forecast.main.temp_min))
      const maxTemperature = Math.max(...forecasts.map((forecast) => forecast.main.temp_max))
      const precipitationProbability = Math.round(Math.max(...forecasts.map((forecast) => forecast.pop)) * 100)
      const representativeForecast = forecasts.reduce((closest, forecast) => {
        const localHour = new Date((forecast.dt + forecastData.city.timezone) * 1000).getUTCHours()
        const closestHour = new Date((closest.dt + forecastData.city.timezone) * 1000).getUTCHours()
        return Math.abs(localHour - 12) < Math.abs(closestHour - 12) ? forecast : closest
      })

      return {
        date,
        description: representativeForecast.weather[0]?.description ?? 'Unknown',
        icon: representativeForecast.weather[0]?.icon ?? '',
        maxTemperature,
        minTemperature,
        precipitationProbability,
      }
    })

    response.json({
      current: {
        time: new Date(currentData.dt * 1000).toISOString(),
        temperature: currentData.main.temp,
        feelsLike: currentData.main.feels_like,
        humidity: currentData.main.humidity,
        precipitation: currentData.rain?.['1h'] ?? currentData.rain?.['3h'] ?? 0,
        description: currentData.weather[0]?.description ?? 'Unknown',
        icon: currentData.weather[0]?.icon ?? '',
        windSpeed: currentData.wind.speed,
      },
      daily,
    })
  } catch {
    console.error('Unable to reach the OpenWeather service.')
    response.status(502).json({ message: 'Unable to reach OpenWeather. Please try again.' })
  }
})

app.get('/api/towns', async (_request, response) => {
  try {
    const towns = await Town.find({}).sort({ town: 1 }).lean()
    response.json(towns.map(serializeTown))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load towns'
    response.status(500).json({ message: 'Unable to load towns', error: errorMessage })
  }
})

app.post('/api/towns', requireAdmin, async (request, response) => {
  try {
    const townName = typeof request.body.town === 'string' ? request.body.town.trim() : ''

    if (!townName) {
      response.status(400).json({ message: 'Town name is required' })
      return
    }

    const newTown = await Town.create({ town: townName })
    response.status(201).json(serializeTown(newTown))
  } catch (error: any) {
    if (error?.code === 11000) {
      response.status(409).json({ message: 'This town already exists' })
      return
    }

    const errorMessage = error instanceof Error ? error.message : 'Unable to create town'
    response.status(400).json({ message: 'Unable to create town', error: errorMessage })
  }
})

app.put('/api/towns/:id', requireAdmin, async (request, response) => {
  try {
    const townName = typeof request.body.town === 'string' ? request.body.town.trim() : ''

    if (!townName) {
      response.status(400).json({ message: 'Town name is required' })
      return
    }

    const town = await Town.findByIdAndUpdate(
      request.params.id,
      { town: townName },
      { new: true, runValidators: true }
    )

    if (!town) {
      response.status(404).json({ message: 'Town not found' })
      return
    }

    response.json(serializeTown(town))
  } catch (error: any) {
    if (error?.code === 11000) {
      response.status(409).json({ message: 'This town already exists' })
      return
    }

    const errorMessage = error instanceof Error ? error.message : 'Unable to update town'
    response.status(400).json({ message: 'Unable to update town', error: errorMessage })
  }
})

app.get('/api/programs', async (_request, response) => {
  const cards = await Card.find({}).lean()
  response.json(cards.map(serializeCard))
})

app.get('/api/stories', async (_request, response) => {
  try {
    const stories = await Story.find({ status: 'active' }).sort({ createdAt: -1 }).lean()
    response.json(stories.map(serializeStory))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load stories'
    response.status(500).json({ message: 'Unable to load stories', error: errorMessage })
  }
})

app.get('/api/admin/stories', requireAdmin, async (_request, response) => {
  try {
    const stories = await Story.find({}).sort({ createdAt: -1 }).lean()
    response.json(stories.map(serializeStory))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load stories'
    response.status(500).json({ message: 'Unable to load stories', error: errorMessage })
  }
})

app.post('/api/admin/stories', requireAdmin, async (request, response) => {
  try {
    const title = typeof request.body?.title === 'string' ? request.body.title.trim() : ''
    const type = typeof request.body?.type === 'string' ? request.body.type.trim() : ''
    const description = typeof request.body?.description === 'string' ? request.body.description.trim() : ''
    const image = typeof request.body?.image === 'string' ? request.body.image.trim() : ''
    const status = request.body?.status

    if (!title || !type || !description || !image) {
      response.status(400).json({ message: 'Title, story type, description, and image are required.' })
      return
    }
    if (title.length > 160 || type.length > 80 || description.length > 4000) {
      response.status(400).json({ message: 'Some story fields exceed the allowed length.' })
      return
    }
    if (!['active', 'draft'].includes(status)) {
      response.status(400).json({ message: 'Choose whether the story should be published or saved as a draft.' })
      return
    }

    const story = await Story.create({ title, type, description, image, status })
    response.status(201).json(serializeStory(story))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to create story'
    response.status(400).json({ message: 'Unable to create story', error: errorMessage })
  }
})

app.get('/api/cards', async (_request, response) => {
  try {
    const cards = await Card.find({}).sort({ createdAt: -1 }).lean()
    response.json(cards.map(serializeCard))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load cards'
    response.status(500).json({ message: 'Unable to load cards', error: errorMessage })
  }
})

app.post('/api/google-sheet/import', requireAdmin, async (request, response) => {
  try {
    const sourceUrl = typeof request.body?.sourceUrl === 'string' ? request.body.sourceUrl.trim() : ''

    if (!sourceUrl) {
      response.status(400).json({ message: 'Google Sheet URL is required' })
      return
    }

    const csvUrl = getGoogleSheetCsvUrl(sourceUrl)
    const csvResponse = await fetch(csvUrl)

    if (!csvResponse.ok) {
      throw new Error(`Unable to fetch Google Sheet: ${csvResponse.status}`)
    }

    const csvText = await csvResponse.text()
    const rows = parseCsvRows(csvText)

    if (rows.length < 2) {
      response.status(400).json({ message: 'No data rows found in the Google Sheet' })
      return
    }

    const headerRow = rows[0].map((header) => header.trim())
    const dataRows = rows.slice(1)
    const records = dataRows.map((row) => {
      const record: Record<string, string> = {}
      headerRow.forEach((header, index) => {
        record[header] = row[index] ?? ''
      })
      return record
    })

    const cardsToCreate = records.map((record) => toGoogleSheetCard(record))

    const createdCards = await Card.insertMany(cardsToCreate)

    await GoogleSheetImport.create({
      sourceUrl,
      status: 'success',
      headers: headerRow,
      rowCount: createdCards.length,
    })

    response.status(201).json({
      importedCount: createdCards.length,
      cards: createdCards.map(serializeCard),
      sourceUrl,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to import Google Sheet'

    await GoogleSheetImport.create({
      sourceUrl: typeof (request.body ?? {})?.sourceUrl === 'string' ? request.body.sourceUrl.trim() : '',
      status: 'failed',
      headers: [],
      rowCount: 0,
    }).catch(() => undefined)

    response.status(400).json({ message: 'Unable to import Google Sheet', error: errorMessage })
  }
})

app.delete('/api/cards', requireAdmin, async (_request, response) => {
  try {
    const result = await Card.deleteMany({})
    response.json({ deletedCount: result.deletedCount ?? 0 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to delete cards'
    response.status(500).json({ message: 'Unable to delete cards', error: errorMessage })
  }
})

app.get('/api/cards/:id', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    response.status(404).json({ message: 'Card not found' })
    return
  }

  const card = await Card.findById(request.params.id)

  if (!card) {
    response.status(404).json({ message: 'Card not found' })
    return
  }

  response.json(serializeCard(card))
})

app.get('/api/projects/:id', async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    response.status(404).json({ message: 'Project not found' })
    return
  }

  const project = await Card.findById(request.params.id)

  if (!project) {
    response.status(404).json({ message: 'Project not found' })
    return
  }

  response.json(serializeCard(project))
})

app.post('/api/cards', requireAdmin, async (request, response) => {
  try {
    const images = getCardImages(request.body ?? {})
    if (!images) {
      response.status(400).json({ message: 'Attach between 1 and 8 valid card images.' })
      return
    }
    const newCard = await Card.create({
      title: request.body.title,
      description: request.body.description,
      category: request.body.category,
      status: request.body.status ?? 'active',
      image: images[0],
      images,
    })

    response.status(201).json(serializeCard(newCard))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to create card'
    response.status(400).json({ message: 'Unable to create card', error: errorMessage })
  }
})

app.put('/api/cards/:id', requireAdmin, async (request, response) => {
  try {
    const images = getCardImages(request.body ?? {})
    if (!images) {
      response.status(400).json({ message: 'Attach between 1 and 8 valid card images.' })
      return
    }
    const payload = {
      title: request.body.title,
      description: request.body.description,
      category: request.body.category,
      status: request.body.status ?? 'active',
      image: images[0],
      images,
    }

    const card = await Card.findByIdAndUpdate(request.params.id, payload, {
      new: true,
      runValidators: true,
    })

    if (!card) {
      response.status(404).json({ message: 'Card not found' })
      return
    }

    response.json(serializeCard(card))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to update card'
    response.status(400).json({ message: 'Unable to update card', error: errorMessage })
  }
})

if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath, { index: false }))

  app.use((request, response, next) => {
    if (request.path.startsWith('/api')) {
      next()
      return
    }

    response.sendFile(path.join(frontendDistPath, 'index.html'), (error) => {
      if (error) {
        next(error)
      }
    })
  })
} else {
  console.warn('Frontend dist not found. SPA fallback is disabled until the frontend is built.')
}

async function startServer() {
  await connectDB()
  await ensureDefaultAdminUser()
  syncKoboReports().catch((error) => {
    console.error('Initial Kobo submission sync failed:', error instanceof Error ? error.message : error)
  })
  setInterval(() => {
    syncKoboReports().catch((error) => {
      console.error('Scheduled Kobo submission sync failed:', error instanceof Error ? error.message : error)
    })
  }, 60 * 1000)
  app.listen(port, () => {
    console.log(`YouthAct API running at http://localhost:${port}`)
  })
}

startServer()
