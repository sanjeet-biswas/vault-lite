# Vault Lite as a standalone desktop app

Vault Lite is set up as a **Progressive Web App (PWA)**. You can install it so it runs in its own window without the browser toolbar, like a desktop app.

## How to install (Chrome / Edge)

1. **Start the app**  
   Run the server (e.g. `node server.js`) and open the app in Chrome or Edge:
   - **http://localhost:3080**  
   - Or, if you use a hosts alias: **http://vault.lite.app:3080**

2. **Install the app**  
   - **Chrome:** Use the install icon in the address bar (⊕ or "Install" / "Install app"), or open the three-dot menu → "Install Vault Lite" / "Install app".  
   - **Edge:** Use the "App available" / install prompt in the address bar, or menu → "Apps" → "Install this site as an app".

3. **Open the installed app**  
   The app will be in your Start Menu (Windows) or Applications (Mac). It opens in a separate window with no address bar or tabs.

## What's included

- **`manifest.json`** – App name, standalone display mode, theme/background color, and icon.
- **`/icons/icon.svg`** – App icon (SVG). For the installed app to show the correct icon, use PNG icons (see below).
- **Meta and link tags in `index.html`** – Theme color, manifest link, and Apple/install hints.

## Fixing the installed app icon (gray "V" to proper logo)

Chrome/Edge often ignore SVG and show a gray letter icon. Use **PNG** icons so the installed app shows the correct logo. The manifest is already set to use `icon-192.png` and `icon-512.png` when they exist.

To regenerate or replace the PNG icons (e.g. after changing `icon.svg`):  
1. Open `icons/generate-png-from-svg.html` in a browser (double-click the file or drag it into Chrome).  
2. Click "Download icon-192.png" and "Download icon-512.png".  
3. Save both files into the `icons` folder (same folder as `icon.svg`).  
4. Restart the server, then uninstall and reinstall the PWA to refresh the icon.

## HTTPS (optional)

For "Install" to work from another device (e.g. your phone), the app must be served over **HTTPS**. The server in this repo is HTTP only. For local use on the same machine, **http://localhost:3080** is enough for Chrome/Edge to offer install.
