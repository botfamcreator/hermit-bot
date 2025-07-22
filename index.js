import 'dotenv/config'
import express from 'express'
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys'
import { DisconnectReasonMap } from '@whiskeysockets/baileys/lib/Types'

const PORT = process.env.PORT || 8000

const app = express()
app.get('/', (req, res) => res.send('✅ Dragon-MD Bot is Live'))
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false, // No QR needed
    getMessage: async () => ({ conversation: '🟢 Fallback' })
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, isNewLogin, qr, pairingCode, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('✅ WhatsApp connected as', sock.user.id)
    } else if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('❌ Connection closed. Reconnecting?', shouldReconnect)
      if (shouldReconnect) startBot()
    } else if (isNewLogin) {
      // Important: Shows 6-digit pair code
      setTimeout(async () => {
        const code = await sock.requestPairingCode(process.env.PHONE_NUMBER)
        console.log(`🔑 Pair this bot via WhatsApp: ${code}`)
        console.log('📱 On your phone: Linked Devices → Link with code')
      }, 3000)
    }
  })
}

startBot()
