
import { withBackendLoading } from './backendLoading'

export type TownModel = {
  id: string
  town: string
  description: string
  address?: string
}

export type CardModel = {
  id: string
  title: string
  description: string
  category: string
  status: string
  town?: string
  image: string
  images?: string[]
}

export type CardCreateInput = {
  image: string
  images?: string[]
  title: string
  description: string
  category: string
  status: string
  town?: string
}

export type StoryModel = {
  id: string
  title: string
  type: string
  description: string
  image: string
  status: 'active' | 'draft'
}

export type KoboFormQuestion = {
  name: string
  label: string
  type: string
  required: boolean
}

export type KoboIssueChoice = {
  value: string
  label: string
}

export type KoboSection3OptionGroup = {
  questionName: string
  questionLabel: string
  choices: KoboIssueChoice[]
}

export type KoboFormDetails = {
  id: string
  title: string
  description: string
  questions: KoboFormQuestion[]
  issueTypeChoices: KoboIssueChoice[]
  section3Options: KoboSection3OptionGroup[]
  participationUrl: string | null
  active: boolean
}

export type ClimateReport = {
  id: string
  township: string
  issueType: string
  issueTypes?: string[]
  observationDate: string
  latitude: number
  longitude: number
  severity: 'low' | 'moderate' | 'high' | 'critical'
  status: 'pending' | 'approved' | 'rejected'
  verified: boolean
  description?: string
  sourceDescription?: string
  approvedDescription?: string
  imageUrl?: string
  hasImage?: boolean
  imageConsentGiven?: boolean
  publicImageApproved?: boolean
}

export type ClimateReportsResponse = {
  reports: ClimateReport[]
  riskZones: {
    type: 'FeatureCollection'
    features: Array<{
      type: 'Feature'
      properties: { tier: 'watch' | 'moderate' | 'high'; score: number; reportCount: number }
      geometry: { type: 'Polygon'; coordinates: number[][][] }
    }>
  }
  updatedAt: string
  refreshIntervalSeconds: number
}

export type WeatherStatusResponse = {
  current: {
    time: string
    temperature: number
    feelsLike: number
    humidity: number
    precipitation: number
    description: string
    icon: string
    windSpeed: number
  }
  daily: Array<{
    date: string
    description: string
    icon: string
    maxTemperature: number
    minTemperature: number
    precipitationProbability: number
  }>
}

const API_BASE_URL = 'https://youth-act-backend.onrender.com'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('youthact_admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function jsonHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  }
}

// =========================
// Town API
// =========================

export async function fetchWeatherStatus(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<WeatherStatusResponse> {
  return withBackendLoading(async () => {
    const weatherApiBaseUrl = import.meta.env.DEV ? '' : API_BASE_URL
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
    })
    const response = await fetch(`${weatherApiBaseUrl}/api/weather?${params}`, { signal })
    const data = await response.json().catch(() => null) as { message?: string } | null

    if (!response.ok) {
      throw new Error(data?.message ?? 'Unable to load weather conditions.')
    }

    if (!data) {
      throw new Error('The weather service returned an invalid response.')
    }

    return data as WeatherStatusResponse
  })
}

export async function fetchTowns(): Promise<TownModel[]> {
  return withBackendLoading(async () => {
    const response = await fetch(`${API_BASE_URL}/api/towns`)

    if (!response.ok) {
      throw new Error('Unable to load towns')
    }

    return response.json() as Promise<TownModel[]>
  })
}

export async function fetchGoogleSheetTowns(): Promise<TownModel[]> {
  return withBackendLoading(async () => {
    const sheetUrl =
      (import.meta.env.VITE_SHEET_DATA_URL ??
        import.meta.env.SHEET_DATA_URL ??
        'https://sheetdb.io/api/v1/olv0rua6l4fak') as string

    const response = await fetch(sheetUrl)

    if (!response.ok) {
      throw new Error('Unable to load Google Sheet data')
    }

    const rows = (await response.json()) as Array<Record<string, string | number | undefined>>

    const uniqueTowns = new Map<string, TownModel>()

    for (const [index, row] of rows.entries()) {
      const townName = String(row.Town ?? row.town ?? row.Name ?? row['Town Name'] ?? '').trim()

      if (!townName) {
        continue
      }

      const normalizedTown = townName.toLowerCase().replace(/\s+/g, ' ').trim()
      if (uniqueTowns.has(normalizedTown)) {
        continue
      }

      const description = String(
        row.Comments ??
        row.Description ??
        row.Address ??
        row['Town Description'] ??
        row['Details'] ??
        ''
      ).trim() || `Explore ${townName} and discover local highlights from the Google Sheet data.`

      uniqueTowns.set(normalizedTown, {
        id: String(row.id ?? `${townName}-${index}`),
        town: townName,
        description,
        address: String(row.Address ?? row['Address'] ?? '').trim() || undefined,
      })
    }

    return Array.from(uniqueTowns.values())
  })
}

// =========================
// Card API
// =========================

export async function fetchStories(): Promise<StoryModel[]> {
  const response = await fetch(`${API_BASE_URL}/api/stories`)
  if (!response.ok) {
    throw new Error('Unable to load stories')
  }
  return response.json() as Promise<StoryModel[]>
}

export async function fetchCards(showLoading = true): Promise<CardModel[]> {
  const loadCards = async () => {
    const response = await fetch(`${API_BASE_URL}/api/cards`)

    if (!response.ok) {
      throw new Error('Unable to load cards')
    }

    return response.json() as Promise<CardModel[]>
  }
  return showLoading ? withBackendLoading(loadCards) : loadCards()
}

export async function fetchCardById(
  cardId: string
): Promise<CardModel | null> {
  return withBackendLoading(async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/cards/${cardId}`
    )

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error('Unable to load card')
    }

    return response.json() as Promise<CardModel>
  })
}

export async function fetchProjectById(
  projectId: string
): Promise<CardModel | null> {
  return withBackendLoading(async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}`
    )

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error('Unable to load project')
    }

    return response.json() as Promise<CardModel>
  })
}

export async function fetchKoboFormDetails(assetUid: string, signal?: AbortSignal): Promise<KoboFormDetails> {
  const response = await fetch(`${API_BASE_URL}/api/kobo/forms/${encodeURIComponent(assetUid)}`, { signal })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Unable to load Kobo form details.'))
  }

  return response.json() as Promise<KoboFormDetails>
}

export async function createCard(
  card: CardCreateInput
): Promise<CardModel> {
  return withBackendLoading(async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/cards`,
      {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(card),
      }
    )

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => null) as {
          error?: string
          message?: string
        } | null

      throw new Error(
        errorBody?.error ??
        errorBody?.message ??
        'Unable to create card'
      )
    }

    return response.json() as Promise<CardModel>
  })
}

export async function updateCard(
  cardId: string,
  card: CardCreateInput
): Promise<CardModel> {
  return withBackendLoading(async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/cards/${cardId}`,
      {
        method: 'PUT',
        headers: jsonHeaders(),
        body: JSON.stringify(card),
      }
    )

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => null) as {
          error?: string
          message?: string
        } | null

      throw new Error(
        errorBody?.error ??
        errorBody?.message ??
        'Unable to update card'
      )
    }

    return response.json() as Promise<CardModel>
  })
}

export async function importGoogleSheetCards(sourceUrl: string): Promise<{ importedCount: number; cards: CardModel[] }> {
  return withBackendLoading(async () => {
    const response = await fetch(`${API_BASE_URL}/api/google-sheet/import`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ sourceUrl }),
    })

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => null) as {
          error?: string
          message?: string
        } | null

      throw new Error(
        errorBody?.error ??
        errorBody?.message ??
        'Unable to import Google Sheet cards'
      )
    }

    return response.json() as Promise<{ importedCount: number; cards: CardModel[] }>
  })
}

async function readApiError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { message?: string; error?: string } | null
  return body?.message ?? body?.error ?? fallback
}

export async function fetchClimateReports(signal?: AbortSignal): Promise<ClimateReportsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/climate/reports`, { signal })
  if (!response.ok) throw new Error(await readApiError(response, 'Unable to load community reports.'))
  return response.json() as Promise<ClimateReportsResponse>
}

export async function fetchKoboFormSubmissions(assetUid: string, signal?: AbortSignal): Promise<ClimateReport[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/kobo/forms/${encodeURIComponent(assetUid)}/submissions`,
    { signal }
  )
  if (!response.ok) throw new Error(await readApiError(response, 'Unable to load Kobo form submissions.'))
  return response.json() as Promise<ClimateReport[]>
}

export async function fetchClimateReportsForReview(status: 'pending' | 'approved' = 'pending'): Promise<ClimateReport[]> {
  const params = new URLSearchParams({ status })
  const response = await fetch(`${API_BASE_URL}/api/admin/climate/reports?${params}`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error(await readApiError(response, 'Unable to load the review queue.'))
  return response.json() as Promise<ClimateReport[]>
}

export async function syncKoboClimateReports(): Promise<{
  imported: number
  published: number
  photosFound: number
  photosSaved: number
}> {
  const response = await fetch(`${API_BASE_URL}/api/admin/climate/sync`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  })
  if (!response.ok) throw new Error(await readApiError(response, 'Unable to sync Kobo submissions.'))
  return response.json() as Promise<{
    imported: number
    published: number
    photosFound: number
    photosSaved: number
  }>
}

export async function moderateClimateReport(
  reportId: string,
  input: {
    status: 'approved' | 'rejected'
    approvedDescription?: string
    verified: boolean
    publicImageApproved?: boolean
  }
): Promise<ClimateReport> {
  const response = await fetch(`${API_BASE_URL}/api/admin/climate/reports/${encodeURIComponent(reportId)}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error(await readApiError(response, 'Unable to update report moderation.'))
  return response.json() as Promise<ClimateReport>
}

export async function fetchClimateReportImage(reportId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/admin/climate/reports/${encodeURIComponent(reportId)}/image`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error(await readApiError(response, 'Unable to load report photo.'))
  return response.blob()
}

export function getPublicClimateReportImageUrl(imagePath: string): string {
  return `${API_BASE_URL}${imagePath}`
}
