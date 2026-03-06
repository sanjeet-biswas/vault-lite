# Vault Lite

A personal vault in the browser: store credentials, notes, and documents behind a PIN. Runs locally with no backend—just Node.js to serve the app.

## Features

- **Credentials** — Save logins (label, username, password). Copy to clipboard, show/hide fields. Passwords are encrypted in storage when a PIN is set.
- **Saved information** — Notes and snippets by type (e.g. license keys, notes). Edit and copy in place.
- **Documents** — Upload files (PDF, Office, images, text, etc.). List or card view, search, preview, download. Add by upload, drag-and-drop, or paste. Re-upload same filename to update; last-modified date is shown.
- **PIN lock** — 4–12 digit PIN. Data is encrypted at rest when unlocked. Session can be restored after refresh.
- **Work / Personal** — Two modes with separate data; switch with PIN.
- **Export / Import** — Export credentials and info as JSON (passwords encrypted). Import to merge or restore.
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
| `server.js`        | Minimal HTTP server (port 3080). Serves the app; no API. |
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

## Data and privacy

- Data is stored in the browser (localStorage and IndexedDB for documents).
- With a PIN set, credentials and saved info are encrypted in storage.
- Nothing is sent to any server except the static files you load from your own `server.js`.
- Export/import files stay on your machine; handle them as you would any sensitive backup.

## License

Use and modify as you like. No warranty.
