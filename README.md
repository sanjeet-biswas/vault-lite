# Vault Lite

A personal vault in the browser: store credentials, notes, and documents behind a PIN. Runs locally with no backend—just Node.js to serve the app.

## Features

- **Credentials** — Save logins (label, username, password). Copy to clipboard, show/hide fields. Passwords are encrypted in storage when a PIN is set.
- **Saved information** — Notes and snippets by type (e.g. license keys, notes). Edit and copy in place.
- **Documents** — Upload files (PDF, Office, images, text, etc.). List or card view, search, preview, download. Add by upload, drag-and-drop, or paste. Re-upload same filename to update; last-modified date is shown.
- **PIN lock** — 4–12 digit PIN. Data is encrypted at rest when unlocked. Session can be restored after refresh.
- **Work / Personal** — Two modes with separate data; switch with PIN.
- **Backup / Restore** — **Backup** exports all data (credentials, info, documents) as a single JSON file to download. **Restore** imports from a previously exported JSON file (merge into current data).
- **Install as app** — Install as a standalone desktop app (PWA) from Chrome or Edge; runs in its own window with no browser UI.

## Requirements

- **Node.js** (any recent LTS) — used only to serve static files. No npm packages required.

## Quick start

1. Start the server:
   ```bash
   node server.js
   ```
2. Open in a browser: **http://localhost:3080**

To launch with one click and auto-open the browser, use the launcher scripts (see [Portable run](#portable-run) below).

## Project structure

| File / folder      | Purpose |
|--------------------|--------|
| `server.js`        | HTTP server (port 3080). Serves the app, Jira proxy, backup, and vault-bot sync/webhook. |
| `vault-bot.js`     | WhatsApp webhook handler: sync store, decrypt vault, run commands (list/get/search), send reply. |
| `index.html`       | Single-page app shell and styles. |
| `app.js`           | All app logic: PIN, encryption, credentials, info, documents, UI. |
| `manifest.json`    | PWA manifest for “Install app” and standalone window. |
| `icons/`           | App icons (SVG + PNG for installed app). |
| `DESKTOP-APP.md`   | How to install as a desktop app and fix the icon. |
| `PORTABLE-RUN.md`  | Using `start.bat` / `start.sh` for portable run. |
| `HOSTS-ALIAS.md`   | Optional: use `http://vault.lite.app:3080` via hosts file. |

## Install as a desktop app

You can install Vault Lite so it opens in its own window (no address bar or tabs):

1. Run the server and open **http://localhost:3080** in Chrome or Edge.
2. Use the install option in the address bar (e.g. “Install Vault Lite” / “Install app”).
3. The app appears in your Start Menu or Applications and runs standalone.

For details and how to fix the icon if you see a gray “V”, see **[DESKTOP-APP.md](DESKTOP-APP.md)**.

## Portable run

- **Windows:** double-click `start.bat` to start the server and open the browser.
- **Mac / Linux:** run `./start.sh` (or `sh start.sh`).

See **[PORTABLE-RUN.md](PORTABLE-RUN.md)** for more.

## Optional: custom URL

To use **http://vault.lite.app:3080** instead of localhost, add a hosts entry so `vault.lite.app` points to `127.0.0.1`. Steps are in **[HOSTS-ALIAS.md](HOSTS-ALIAS.md)**.

## WhatsApp Vault Bot (optional)

You can sync your vault to a bot and query credentials and infos via WhatsApp.

1. **In the app:** Open the **Bot** tab, enter your WhatsApp number (with country code, no +) and a **Bot secret** (password you’ll type in WhatsApp). Click **Sync to Bot**. Data is encrypted with your secret before upload; the server never sees your PIN or plaintext.
2. **WhatsApp:** Message your bot with `<your_secret> <command>`. Commands: `help`, `list`, `get <label>`, `search <word>`.

**Server env (required for the webhook to work):**

| Variable | Description |
|----------|-------------|
| `WHATSAPP_VERIFY_TOKEN` | String you set in Meta App → Webhook verify token (e.g. `vault-lite-verify`). |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp Cloud API access token. |
| `WHATSAPP_PHONE_ID` | Phone number ID of your WhatsApp Business number (from Meta dashboard). |

**Setup (Meta / WhatsApp Cloud API):**

1. Create a [Meta for Developers](https://developers.facebook.com/) app and add the **WhatsApp** product.
2. In WhatsApp → Configuration, set the **Webhook URL** to your public HTTPS URL, e.g. `https://your-domain.com/webhook/whatsapp`.
3. Set **Verify token** to the same value as `WHATSAPP_VERIFY_TOKEN`.
4. Subscribe to **messages**.
5. Deploy the server so the webhook URL is reachable (e.g. ngrok for local: `ngrok http 3080`, then use the ngrok HTTPS URL as webhook).

Synced vaults are stored in `vault/vault-bot-store.json` (or `VAULT_BOT_STORE`). Override with env if needed.

## Data and privacy

- Data is stored in the browser (localStorage and IndexedDB for documents).
- With a PIN set, credentials and saved info are encrypted in storage.
- **Backup** downloads a JSON file to your machine; **Restore** reads a JSON file you choose. No data is sent to any server except the static files from your own `server.js`.
- **Bot sync:** Vault data is encrypted with your Bot secret before upload; only you can decrypt it by sending that secret in WhatsApp. Keep the webhook server and token private.

## License

Use and modify as you like. No warranty.
