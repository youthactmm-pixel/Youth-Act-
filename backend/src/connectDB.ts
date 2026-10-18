import 'dotenv/config'
import mongoose from 'mongoose'
import dns from 'dns'

// Atlas DNS lookup အတွက် resolver သတ်မှတ်ပြီး env မှ MONGO_URI ကို အသုံးပြုသည်။
dns.setServers([
  '8.8.8.8',
  '8.8.4.4',
])

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

  // Connection တည်ဆောက်ပြီးမှ server စတင်သည်; Schema.ts မှ model အားလုံးသည် ဤ Mongoose connection ကို မျှဝေသည်။
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