// index.js
import 'dotenv/config'
import express from 'express'
import makeWASocket, { useMultiFileAuthState } from '@adiwajshing/baileys'

const PORT = process.env.PORT || 3000
const PHONE_NUMBER = process.env.PHONE_NUMBER // eg: +919496123456

// express server for Render/Fly.io to detect port
const app = express()
app.get('/', (req, res) => res.send('✅ Dragon-MD Bot is Live'))
app.listen(PORT, () => console.log(`🌐 Listening on port ${PORT}`))

// WhatsApp connection
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // shows pair code if unpaired
    defaultQueryTimeoutMs: undefined,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, qr, lastDisconnect, isNewLogin }) => {
    if (connection === 'open') {
      console.log('✅ WhatsApp Connected as', sock.user.id)
    } else if (connection === 'close') {
      console.log('❌ Connection closed. Retrying...')
      startBot()
    }
  })
}

startBot()
