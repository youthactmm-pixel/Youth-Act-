import cors from 'cors'
import express from 'express'
import Card from './Card'
import { connectDB } from './connectDB'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

function serializeCard(card: any) {
  const plainCard = typeof card?.toObject === 'function' ? card.toObject() : card
  return {
    id: plainCard?._id ? plainCard._id.toString() : plainCard?.id,
    title: plainCard?.title,
    description: plainCard?.description,
    category: plainCard?.category,
    status: plainCard?.status,
  }
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'youthact-api' })
})

app.get('/api/programs', async (_request, response) => {
  const cards = await Card.find({}).lean()
  response.json(cards.map(serializeCard))
})

app.get('/api/cards', async (_request, response) => {
  const cards = await Card.find({}).lean()
  response.json(cards.map(serializeCard))
})

app.delete('/api/cards', async (_request, response) => {
  try {
    const result = await Card.deleteMany({})
    response.json({ deletedCount: result.deletedCount ?? 0 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to delete cards'
    response.status(500).json({ message: 'Unable to delete cards', error: errorMessage })
  }
})

app.get('/api/cards/:id', async (request, response) => {
  const card = await Card.findById(request.params.id)

  if (!card) {
    response.status(404).json({ message: 'Card not found' })
    return
  }

  response.json(serializeCard(card))
})

app.post('/api/cards', async (request, response) => {
  try {
    const newCard = await Card.create({
      title: request.body.title,
      description: request.body.description,
      category: request.body.category,
      status: request.body.status ?? 'active',
    })

    response.status(201).json(serializeCard(newCard))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to create card'
    response.status(400).json({ message: 'Unable to create card', error: errorMessage })
  }
})

async function startServer() {
  await connectDB()
  app.listen(port, () => {
    console.log(`YouthAct API running at http://localhost:${port}`)
  })
}

startServer()

