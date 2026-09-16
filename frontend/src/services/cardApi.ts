import type { CardCreateInput, CardModel } from '../types/card'

export async function fetchCards(): Promise<CardModel[]> {
  const response = await fetch('/api/cards')

  if (!response.ok) {
    throw new Error('Unable to load cards')
  }

  return response.json() as Promise<CardModel[]>
}

export async function fetchCardById(cardId: string): Promise<CardModel | null> {
  const response = await fetch(`/api/cards/${cardId}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error('Unable to load card')
  }

  return response.json() as Promise<CardModel>
}

export async function fetchProjectById(projectId: string): Promise<CardModel | null> {
  const response = await fetch(`/api/projects/${projectId}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error('Unable to load project')
  }

  return response.json() as Promise<CardModel>
}

export async function createCard(card: CardCreateInput): Promise<CardModel> {
  const response = await fetch('/api/cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(card),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { error?: string; message?: string } | null
    throw new Error(errorBody?.error ?? errorBody?.message ?? 'Unable to create card')
  }

  return response.json() as Promise<CardModel>
}
