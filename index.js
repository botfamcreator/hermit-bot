const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, PHONENUMBER_MCC, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require('@hapi/boom');
const pino = require("pino");
const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8000;

app.get("/", (_, res) => {
  res.send("✅ Hermit Bot is running...");
});

app.listen(PORT, () => {
  console.log("🌐 Server running on port", PORT);
});

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
    },
    browser: ["Ubuntu", "Chrome", "22.04.4"]
  });

  sock.ev.on("creds.update", saveCreds);

  // Show 8-digit Pairing Code
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr, pairingCode } = update;

    if (pairingCode) {
      console.log("\n🔗 Pairing Code (valid 30s):", pairingCode);
      console.log("📲 Open WhatsApp → Linked Devices → Link with Code → Enter above code\n");
    }

    if (connection === "open") {
      console.log("✅ Connected to WhatsApp");
    }

    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
      console.log("❌ Connection closed. Reconnecting?", shouldReconnect);
      if (shouldReconnect) startSock();
    }
  });
}

startSock();
