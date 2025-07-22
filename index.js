// index.js
import 'dotenv/config'
import express from 'express'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from 'baileys'

const PORT = process.env.PORT || 3000

// express server for Render/Fly.io
const app = express()
app.get('/', (_, res) => res.send('✅ Dragon-MD Bot is Live'))
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    defaultQueryTimeoutMs: undefined,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('✅ WhatsApp Connected as', sock.user.id)
    } else if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log(`❌ Connection closed (${lastDisconnect?.error})`)
      if (shouldReconnect) {
        startBot()
      } else {
        console.log('🔒 Logged out. Please delete auth_info and re-authenticate.')
      }
    }
  })

  // Listen to incoming messages (basic example)
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type === 'notify' && messages[0]?.message) {
      const msg = messages[0]
      const from = msg.key.remoteJid
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
      console.log(`📩 Message from ${from}: ${text}`)

      // Example reply
      if (text.toLowerCase() === 'ping') {
        await sock.sendMessage(from, { text: 'pong 🏓' })
      }
    }
  })
}

startBot()
