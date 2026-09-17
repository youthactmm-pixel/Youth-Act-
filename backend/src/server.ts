import cors from 'cors'
import express from 'express'
import { Card, Town } from './Schema'
import { connectDB } from './connectDB'
import mongoose from 'mongoose'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
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
  }
}

function serializeTown(town: any) {
  const plainTown = typeof town?.toObject === 'function' ? town.toObject() : town
  return {
    id: plainTown?._id ? plainTown._id.toString() : plainTown?.id,
    town: plainTown?.town,
  }
}

app.post('/createCard', async (_request, response) => {
  try {
    const newCard = new Card({
      id: '',
      title: '',
      description: '',
      category: '',
      status: '',
      image:'',
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

app.get('/api/towns', async (_request, response) => {
  try {
    const towns = await Town.find({}).sort({ town: 1 }).lean()
    response.json(towns.map(serializeTown))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load towns'
    response.status(500).json({ message: 'Unable to load towns', error: errorMessage })
  }
})

app.post('/api/towns', async (request, response) => {
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

app.get('/api/programs', async (_request, response) => {
  const cards = await Card.find({}).lean()
  response.json(cards.map(serializeCard))
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

app.post('/api/cards', async (request, response) => {
  try {
    const newCard = await Card.create({
      title: request.body.title,
      description: request.body.description,
      category: request.body.category,
      status: request.body.status ?? 'active',
      image: request.body.image,
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

