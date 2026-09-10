import 'dotenv/config'
import mongoose from 'mongoose'
import dns from 'dns'

const configuredUri = process.env.MONGO_URI

dns.setServers([
  '8.8.8.8',
  '8.8.4.4',
])

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI ?? configuredUri

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined')
  }

  await mongoose.connect(mongoUri, {
    dbName: 'test',
    serverSelectionTimeoutMS: 5000,
  })

  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collectionName = 'cards'
    const collection = await mongoose.connection.db.listCollections({ name: collectionName }).next()

    if (!collection) {
      await mongoose.connection.db.createCollection(collectionName)
      console.log('Created MongoDB collection:', collectionName)
    } else {
      console.log('MongoDB collection already exists:', collectionName)
    }
  }

  console.log('MongoDB Atlas connected successfully')
}