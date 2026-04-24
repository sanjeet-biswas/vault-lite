/**
 * Vault-bot: WhatsApp webhook handler for Vault Lite.
 * Sync endpoint stores encrypted vault by phone; webhook receives messages,
 * decrypts with user's secret, runs commands (list, get, search), sends reply.
 */
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BOT_STORE_FILE = process.env.VAULT_BOT_STORE || path.join(process.env.VAULT_DIR || path.join(require('os').homedir(), 'vault'), 'vault-bot-store.json');
const WHATSAPP_VERIFY_TOKEN = (process.env.WHATSAPP_VERIFY_TOKEN || 'vault-lite-verify').trim();
const WHATSAPP_ACCESS_TOKEN = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
const WHATSAPP_PHONE_ID = (process.env.WHATSAPP_PHONE_ID || '').trim();
const BOT_ENABLED = !!(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_ID);

const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;

function getStorePath() {
  const dir = path.dirname(BOT_STORE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return BOT_STORE_FILE;
}

function loadStore() {
  try {
    const p = getStorePath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      const data = JSON.parse(raw);
      return typeof data === 'object' && data !== null ? data : {};
    }
  } catch (e) { /* ignore */ }
  return {};
}

function saveStore(store) {
  try {
    fs.writeFileSync(getStorePath(), JSON.stringify(store, null, 0), 'utf8');
  } catch (e) {
    console.error('vault-bot: save store error', e.message);
  }
}

function deriveKey(secret) {
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

function decryptVault(encryptedBase64, secret) {
  try {
    const buf = Buffer.from(encryptedBase64, 'base64');
    if (buf.length < IV_LEN + TAG_LEN) return null;
    const key = deriveKey(secret);
    const iv = buf.slice(0, IV_LEN);
    const tag = buf.slice(buf.length - TAG_LEN);
    const ciphertext = buf.slice(IV_LEN, buf.length - TAG_LEN);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(out.toString('utf8'));
  } catch (e) {
    return null;
  }
}

function runCommand(vault, text) {
  const parts = (text || '').trim().split(/\s+/);
  const cmd = (parts[0] || '').toLowerCase();
  const arg = parts.slice(1).join(' ').trim();
  const entries = (vault.entries || []).filter(function (e) { return e && (e.label || e.username); });
  const infos = (vault.informations || []).filter(function (e) { return e && (e.title || e.content); });

  if (cmd === 'help' || cmd === '') {
    return 'Vault Bot:\n• list - list credential labels\n• get <label> - get username & password for label\n• search <word> - search in labels and infos\n• help - this message';
  }
  if (cmd === 'list') {
    if (!entries.length) return 'No credentials synced. Sync from Vault Lite first.';
    const labels = entries.map(function (e) { return e.label || e.username || '?'; }).slice(0, 30);
    return 'Credentials: ' + labels.join(', ') + (entries.length > 30 ? '…' : '');
  }
  if (cmd === 'get') {
    if (!arg) return 'Usage: get <label> e.g. get Gmail';
    const labelLower = arg.toLowerCase();
    const found = entries.find(function (e) {
      return (e.label || '').toLowerCase() === labelLower || (e.label || '').toLowerCase().indexOf(labelLower) !== -1;
    });
    if (!found) return 'Not found: ' + arg;
    return found.label + '\nUser: ' + (found.username || '') + '\nPass: ' + (found.password || '');
  }
  if (cmd === 'search') {
    if (!arg) return 'Usage: search <word>';
    const q = arg.toLowerCase();
    const creds = entries.filter(function (e) {
      return (e.label || '').toLowerCase().indexOf(q) !== -1 || (e.username || '').toLowerCase().indexOf(q) !== -1;
    });
    const infoHits = infos.filter(function (e) {
      return (e.title || '').toLowerCase().indexOf(q) !== -1 || (e.content || '').toLowerCase().indexOf(q) !== -1;
    });
    const lines = [];
    if (creds.length) lines.push('Credentials: ' + creds.map(function (e) { return e.label || e.username; }).join(', '));
    if (infoHits.length) lines.push('Infos: ' + infoHits.map(function (e) { return e.title; }).join(', '));
    return lines.length ? lines.join('\n') : 'No matches for: ' + arg;
  }
  return 'Unknown command. Send: help';
}

function sendWhatsAppMessage(phoneId, to, text, callback) {
  const body = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to.replace(/\D/g, ''),
    type: 'text',
    text: { body: text }
  });
  const opts = {
    hostname: 'graph.facebook.com',
    path: '/v18.0/' + phoneId + '/messages',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + WHATSAPP_ACCESS_TOKEN,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body, 'utf8')
    }
  };
  const req = https.request(opts, function (res) {
    const chunks = [];
    res.on('data', function (chunk) { chunks.push(chunk); });
    res.on('end', function () {
      if (res.statusCode >= 400) {
        try { console.error('WhatsApp API:', JSON.parse(Buffer.concat(chunks).toString())); } catch (_) {}
      }
      if (callback) callback(res.statusCode);
    });
  });
  req.on('error', function (err) {
    console.error('WhatsApp send error:', err.message);
    if (callback) callback(0);
  });
  req.write(body);
  req.end();
}

function handleWhatsAppMessage(from, bodyText, callback) {
  const phone = (from || '').replace(/\D/g, '');
  if (!phone) { if (callback) callback(200); return; }
  const store = loadStore();
  const encrypted = store[phone];
  if (!encrypted) {
    sendWhatsAppMessage(WHATSAPP_PHONE_ID, phone, 'No vault synced for this number. Open Vault Lite, go to Bot, set your WhatsApp number and Sync.', callback);
    return;
  }
  const parts = (bodyText || '').trim().split(/\s+/);
  const secret = parts[0];
  const rest = parts.slice(1).join(' ');
  if (!secret) {
    sendWhatsAppMessage(WHATSAPP_PHONE_ID, phone, 'Send: <your_bot_secret> <command>\nExample: mySecret list\nCommands: help, list, get <label>, search <word>', callback);
    return;
  }
  const vault = decryptVault(encrypted, secret);
  if (!vault) {
    sendWhatsAppMessage(WHATSAPP_PHONE_ID, phone, 'Wrong secret or corrupted data. Use the same Bot secret you set in Vault Lite.', callback);
    return;
  }
  const reply = runCommand(vault, rest || 'help');
  sendWhatsAppMessage(WHATSAPP_PHONE_ID, phone, reply, callback);
}

function handleSync(phone, encryptedBase64, res, sendJson) {
  if (!phone || !encryptedBase64) {
    sendJson(res, 400, { ok: false, error: 'phone and data required' });
    return;
  }
  const normalized = phone.replace(/\D/g, '');
  if (normalized.length < 10) {
    sendJson(res, 400, { ok: false, error: 'Invalid phone number' });
    return;
  }
  const store = loadStore();
  store[normalized] = encryptedBase64;
  saveStore(store);
  sendJson(res, 200, { ok: true, message: 'Vault synced. Message the bot with: <your_secret> help' });
}

function verifyWebhook(mode, token, challenge) {
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) return challenge;
  return null;
}

function parseIncomingWebhook(body) {
  try {
    const data = typeof body === 'string' ? JSON.parse(body) : body;
    if (data.object !== 'whatsapp_business_account') return null;
    const entry = data.entry && data.entry[0];
    const changes = entry && entry.changes && entry.changes[0];
    const value = changes && changes.value;
    const messages = value && value.messages;
    if (!messages || !messages[0]) return null;
    const msg = messages[0];
    const from = msg.from;
    const text = msg.text && msg.text.body;
    return { from: from, text: text || '' };
  } catch (e) {
    return null;
  }
}

module.exports = {
  BOT_ENABLED,
  WHATSAPP_VERIFY_TOKEN,
  verifyWebhook,
  parseIncomingWebhook,
  handleWhatsAppMessage,
  handleSync,
  decryptVault,
  runCommand
};
