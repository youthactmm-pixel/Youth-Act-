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
