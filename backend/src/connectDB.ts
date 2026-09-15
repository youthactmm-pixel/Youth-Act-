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

const configuredUri = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> }
}).process?.env?.MONGO_URI

export async function connectDB() {
  const mongoUri = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env?.MONGO_URI ?? configuredUri

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined')
  }

  await mongoose.connect(mongoUri, {
    allowPartialTrustChain: undefined,
    ALPNProtocols: undefined,
    ca: undefined,
    cert: undefined,
    checkServerIdentity: undefined,
    ciphers: undefined,
    crl: undefined,
    ecdhCurve: undefined,
    key: undefined,
    minDHSize: undefined,
    passphrase: undefined,
    pfx: undefined,
    rejectUnauthorized: undefined,
    secureContext: undefined,
    secureProtocol: undefined,
    servername: undefined,
    session: undefined,
    autoSelectFamily: undefined,
    autoSelectFamilyAttemptTimeout: undefined,
    keepAliveInitialDelay: undefined,
    family: undefined,
    hints: undefined,
    localAddress: undefined,
    localPort: undefined,
    lookup: undefined
  })

  console.log('MongoDB Atlas connected successfully')
}