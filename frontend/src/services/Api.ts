
import { withBackendLoading } from './backendLoading'

// ဒီ type များသည် backend route များက JSON ပြန်ပေးသည့် ပုံစံနှင့် ကိုက်ညီသည်။
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
  days?: CardDay[]
}

export type CardDay = {
  title: string
  description: string
  image?: string
}

export type CardCreateInput = {
  image: string
  images?: string[]
  title: string
  description: string
  category: string
  status: string
  town?: string
  days?: CardDay[]
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

export type KoboFormDetails = {
  id: string
  title: string
  description: string
  questions: KoboFormQuestion[]
  issueTypeChoices: KoboIssueChoice[]
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

// Admin token ကို protected backend route များသို့ Bearer token အဖြစ် ပို့သည်။
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
// Town နှင့် weather API — backend ၏ /api/towns နှင့် /api/weather ကို ခေါ်သည်။
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
// Card, project နှင့် story API — ဖတ်ရှုမှုများသည် /api/cards, /api/projects/:id, /api/stories နှင့် ချိတ်ဆက်သည်။
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
  projectId: string,
  signal?: AbortSignal
): Promise<CardModel | null> {
  return withBackendLoading(async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}`,
      { signal }
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

// Admin card ဖန်တီး/ပြင်ဆင်မှုများသည် backend ရှိ admin ကာကွယ်ထားသော POST/PUT route များကို ခေါ်သည်။
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

// Backend error JSON ပုံစံကွဲနိုင်သဖြင့် အသုံးပြုသူပြနိုင်မည့် message ကို တစ်နေရာတည်းမှ ထုတ်ယူသည်။
async function readApiError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { message?: string; error?: string } | null
  return body?.message ?? body?.error ?? fallback
}

// အများပြည်သူမြင်ရသော approved report များနှင့် form metadata ကို backend ၏ public Kobo/climate route များမှ ရယူသည်။
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

// အောက်ပါ review/sync/image လုပ်ဆောင်ချက်များသည် Bearer auth လိုအပ်သည့် /api/admin/climate route များနှင့် ကိုက်ညီသည်။
export async function fetchClimateReportsForReview(status: 'all' | 'pending' | 'approved' = 'pending'): Promise<ClimateReport[]> {
  async function fetchQueue(queueStatus: 'pending' | 'approved'): Promise<ClimateReport[]> {
    const params = new URLSearchParams({ status: queueStatus })
    const response = await fetch(`${API_BASE_URL}/api/admin/climate/reports?${params}`, {
      headers: getAuthHeaders(),
    })
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load the review queue.'))
    return response.json() as Promise<ClimateReport[]>
  }

  if (status !== 'all') return fetchQueue(status)

  const [pendingReports, publishedReports] = await Promise.all([
    fetchQueue('pending'),
    fetchQueue('approved'),
  ])
  const reportsById = new Map(
    [...pendingReports, ...publishedReports].map((report) => [report.id, report])
  )
  return Array.from(reportsById.values()).sort(
    (left, right) => new Date(right.observationDate).getTime() - new Date(left.observationDate).getTime()
  )
}

export async function syncKoboClimateReports(): Promise<{
  imported: number
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

export async function deleteClimateReport(reportId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/climate/reports/${encodeURIComponent(reportId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error(await readApiError(response, 'Unable to delete climate report.'))
}

export async function fetchClimateReportImage(reportId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/admin/climate/reports/${encodeURIComponent(reportId)}/image`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error(await readApiError(response, 'Unable to load report photo.'))
  return response.blob()
}

export async function saveClimateReportImage(
  reportId: string,
  imageData: string,
  consentGiven: boolean
): Promise<ClimateReport> {
  const response = await fetch(`${API_BASE_URL}/api/admin/climate/reports/${encodeURIComponent(reportId)}/image`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ imageData, consentGiven }),
  })
  if (!response.ok) throw new Error(await readApiError(response, 'Unable to save report photo.'))
  return response.json() as Promise<ClimateReport>
}

export async function removeClimateReportImage(reportId: string): Promise<ClimateReport> {
  const response = await fetch(`${API_BASE_URL}/api/admin/climate/reports/${encodeURIComponent(reportId)}/image`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error(await readApiError(response, 'Unable to remove report photo.'))
  return response.json() as Promise<ClimateReport>
}

export function getPublicClimateReportImageUrl(imagePath: string): string {
  return `${API_BASE_URL}${imagePath}`
}
