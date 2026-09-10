import 'dotenv/config'
import mongoose from 'mongoose'
import dns from 'dns'


dns.setServers([
  '8.8.8.8',
  '8.8.4.4',
])

const dburl = 'mongodb+srv://eddolody_db_user:youthactadmin@youthact.ak4qtfl.mongodb.net/test?appName=YouthAct'
mongoose.connect(dburl)
.then(() => {
  console.log('Connected to MongoDB Atlas')
})
.catch((error) => {
  console.error('Error connecting to MongoDB Atlas:', error)
})

const configuredUri = process.env.MONGO_URI

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI ?? configuredUri

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined')
  }

  await mongoose.connect(mongoUri, {})

  console.log('MongoDB Atlas connected successfully')
}