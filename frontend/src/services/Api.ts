
export type TownModel = {
  id: string
  town: string
}

export type CardModel = {
  id: string
  title: string
  description: string
  category: string
  status: string
  image: string
}

export type CardCreateInput = {
  image: string
  title: string
  description: string
  category: string
  status: string
}

const API_BASE_URL = 'https://youth-act-backend.onrender.com'

// =========================
// Town API
// =========================

export async function fetchTowns(): Promise<TownModel[]> {
  const response = await fetch(`${API_BASE_URL}/api/towns`)

  if (!response.ok) {
    throw new Error('Unable to load towns')
  }

  return response.json() as Promise<TownModel[]>
}

export async function createTown(town: string): Promise<TownModel> {
  const response = await fetch(`${API_BASE_URL}/api/towns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ town }),
  })

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => null) as {
        message?: string
        error?: string
      } | null

    throw new Error(
      errorBody?.message ??
      errorBody?.error ??
      'Unable to create town'
    )
  }

  return response.json() as Promise<TownModel>
}

// =========================
// Card API
// =========================

export async function fetchCards(): Promise<CardModel[]> {
  const response = await fetch(`${API_BASE_URL}/api/cards`)

  if (!response.ok) {
    throw new Error('Unable to load cards')
  }

  return response.json() as Promise<CardModel[]>
}

export async function fetchCardById(
  cardId: string
): Promise<CardModel | null> {
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
}

export async function fetchProjectById(
  projectId: string
): Promise<CardModel | null> {
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
}

export async function createCard(
  card: CardCreateInput
): Promise<CardModel> {
  const response = await fetch(
    `${API_BASE_URL}/api/cards`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
}
