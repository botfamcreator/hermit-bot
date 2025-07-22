import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  PHONENUMBER_MCC,
  useSingleFileAuthState
} from '@whiskeysockets/baileys'

import pino from 'pino'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 8000

app.get('/', (req, res) => {
  res.send('🟢 Hermit-MD Server Running!')
})

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`)
})

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('session')
  const { version, isLatest } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    browser: ['Ubuntu', 'Chrome', '22.04.4'],
  })

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('❌ Connection closed. Reconnecting?', shouldReconnect)
      if (shouldReconnect) startSock()
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp')
    }
  })
}

startSock()
