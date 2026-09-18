import cors from 'cors'
import express from 'express'
import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import { Card, Town, User } from './Schema'
import { connectDB } from './connectDB'
import mongoose from 'mongoose'

const app = express()
const port = process.env.PORT || 4000
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin'
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123'
const adminSessions = new Map<string, { username: string; createdAt: number }>()

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
  }
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

function requireAdmin(request: express.Request, response: express.Response, next: express.NextFunction) {
  const token = getBearerToken(request)

  if (!token || !adminSessions.has(token)) {
    response.status(401).json({ message: 'Unauthorized. Admin access required.' })
    return
  }

  next()
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

app.get('/api/cards', async (_request, response) => {
  try {
    const cards = await Card.find({}).sort({ createdAt: -1 }).lean()
    response.json(cards.map(serializeCard))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load cards'
    response.status(500).json({ message: 'Unable to load cards', error: errorMessage })
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

app.put('/api/cards/:id', requireAdmin, async (request, response) => {
  try {
    const payload = {
      title: request.body.title,
      description: request.body.description,
      category: request.body.category,
      status: request.body.status ?? 'active',
      image: request.body.image,
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

async function startServer() {
  await connectDB()
  await ensureDefaultAdminUser()
  app.listen(port, () => {
    console.log(`YouthAct API running at http://localhost:${port}`)
  })
}

startServer()

