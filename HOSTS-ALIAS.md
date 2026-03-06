# Local alias: vault.lite.app

To open Vault Lite at **http://vault.lite.app:3080** instead of localhost, add a hosts entry so `vault.lite.app` points to your machine.

## Windows

1. Open Notepad **as Administrator** (right‑click → Run as administrator).
2. File → Open and go to:
   ```
   C:\Windows\System32\drivers\etc
   ```
3. Set the file type to **All Files**, select **hosts**, and open it.
4. At the end of the file, add this line:
   ```
   127.0.0.1 vault.lite.app
   ```
5. Save and close.

## macOS / Linux

Edit the hosts file with sudo:

```bash
sudo nano /etc/hosts
```

Add this line at the end:

```
127.0.0.1 vault.lite.app
```

Save (Ctrl+O, Enter) and exit (Ctrl+X).

---

Then start the server (`node server.js`) and open:

**http://vault.lite.app:3080**

The port (3080) is still required unless you run the server on port 80 and have the right permissions.
