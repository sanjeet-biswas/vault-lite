#!/usr/bin/env bash
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed or not in PATH."
  echo "Install from https://nodejs.org and try again."
  exit 1
fi

# Start server in background
node server.js &
PID=$!
sleep 2

# Open browser (macOS or Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:3080"
else
  xdg-open "http://localhost:3080" 2>/dev/null || sensible-browser "http://localhost:3080" 2>/dev/null || echo "Open http://localhost:3080 in your browser"
fi

echo "Vault lite is running at http://localhost:3080"
echo "Press Ctrl+C to stop the server."
wait $PID
