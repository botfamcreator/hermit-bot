import 'dotenv/config'
import express from 'express'
import baileys, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from 'baileys'

const PORT = process.env.PORT || 8000

const app = express()
app.get('/', (_, res) => res.send('✅ Dragon-MD Bot is Live'))
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const { version } = await fetchLatestBaileysVersion()

  const sock = baileys({
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
      console.log(`❌ Disconnected: ${lastDisconnect?.error}`)
      if (shouldReconnect) startBot()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    const from = msg.key.remoteJid
    const text = msg.message?.conversation || ''

    if (text.toLowerCase() === 'ping') {
      await sock.sendMessage(from, { text: 'pong 🏓' })
    }
  })
}

startBot()
