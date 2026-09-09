import cors from 'cors'
import express from 'express'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'youthact-api' })
})

app.get('/api/programs', (_request, response) => {
  response.json([
    {
      id: 'community-labs',
      title: 'Community Labs',
      description: 'Hands-on sessions that turn local ideas into practical projects.',
    },
    {
      id: 'youth-leadership',
      title: 'Youth Leadership',
      description: 'A supportive space to build confidence, skills, and a voice in your community.',
    },
    {
      id: 'creative-exchange',
      title: 'Creative Exchange',
      description: 'Connect, collaborate, and make something meaningful with other young people.',
    },
  ])
})

app.listen(port, () => {
  console.log(`YouthAct API running at http://localhost:${port}`)
})
