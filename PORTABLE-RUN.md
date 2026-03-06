# Vault lite – Portable run

Run the app without installing anything except Node.js.

## Quick start

1. **Install Node.js** (if needed): https://nodejs.org  
2. **Double‑click** (or run from terminal):
   - **Windows:** `start.bat`
   - **Mac / Linux:** `./start.sh` (or `sh start.sh`)

The script starts the server and opens your browser at **http://localhost:3080**.

## What the scripts do

- **start.bat** (Windows): Starts the server in a minimized window, waits 2 seconds, opens the default browser. You can close the launcher window; the server keeps running until you close the “Vault lite server” window.
- **start.sh** (Mac/Linux): Starts the server in the background, opens the browser, then keeps the terminal attached to the server (Ctrl+C to stop).

## Portable use

Copy the whole folder (including `start.bat`, `start.sh`, `server.js`, `index.html`, `app.js`, etc.) to a USB drive or cloud folder. On any PC with Node.js installed, run the same script to start the app.

## Stop the app

- **Windows:** Close the minimized “Vault lite server” window, or open Task Manager and end the `node` process.
- **Mac/Linux:** In the terminal where you ran `start.sh`, press **Ctrl+C**.

## Optional: hosts alias

To use **http://vault.lite.app:3080** instead of localhost, add this to your hosts file:

- **Windows:** `C:\Windows\System32\drivers\etc\hosts`  
  Add line: `127.0.0.1 vault.lite.app`
- **Mac/Linux:** `/etc/hosts`  
  Add line: `127.0.0.1 vault.lite.app`

See **HOSTS-ALIAS.md** in this folder for step‑by‑step instructions.
