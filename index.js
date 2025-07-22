require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@adiwajshing/baileys');
const Pino = require('pino');
const { Boom } = require('@hapi/boom');
const readline = require("readline");

async function connectBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "silent" }))
    },
    browser: ['Hermit-MD', 'Chrome', '4.0.0'],
    logger: Pino({ level: 'silent' })
  });

  // Pairing Code login
  if (!sock.authState.creds.registered) {
    const phoneNumber = await askQuestion('📱 Enter your WhatsApp number (with country code): ');
    const code = await sock.requestPairingCode(phoneNumber.trim());
    console.log(`\n🔗 Pairing Code: ${code}\n👉 Open WhatsApp > Linked Devices > Link with Code`);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('📴 Connection closed. Reconnecting...', shouldReconnect);
      if (shouldReconnect) connectBot();
    } else if (connection === 'open') {
      console.log('✅ BOT Connected successfully!');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    console.log(JSON.stringify(m, null, 2));
  });
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }))
}

connectBot();
