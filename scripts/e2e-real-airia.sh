#!/usr/bin/env bash
# Run E2E with real Airia: start proxy and add-in (with proxy URL), then run Playwright.
# Requires apps/word-addin/.env.local with Airia credentials (proxy reads them).
# No mocks: add-in -> proxy -> real Airia API.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROXY_PORT="${AIRIA_PROXY_PORT:-3051}"
ADDIN_PORT="${PORT:-3050}"
PROXY_URL="http://localhost:${PROXY_PORT}/airia"

# Free ports so proxy and add-in can bind (avoid EADDRINUSE from previous runs)
for port in ${PROXY_PORT} ${ADDIN_PORT}; do
  pid=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo "Killing process on port $port (PID $pid)..."
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
done

echo "Starting Airia proxy on port ${PROXY_PORT}..."
npm run dev --workspace=@tenderwin/airia-proxy &
PROXY_PID=$!

echo "Waiting for proxy..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:${PROXY_PORT}/" 2>/dev/null; then break; fi
  if ! kill -0 $PROXY_PID 2>/dev/null; then exit 1; fi
  sleep 1
done

echo "Starting Word Add-in with VITE_AIRIA_PROXY_URL=${PROXY_URL}..."
export VITE_AIRIA_PROXY_URL="$PROXY_URL"
unset VITE_AIRIA_API_URL VITE_AIRIA_API_KEY VITE_AIRIA_AGENT_ID
npm run dev --workspace=@tenderwin/word-addin &
ADDIN_PID=$!

echo "Waiting for add-in..."
for i in $(seq 1 60); do
  if curl -s -o /dev/null "http://localhost:${ADDIN_PORT}/" 2>/dev/null; then break; fi
  if ! kill -0 $ADDIN_PID 2>/dev/null; then exit 1; fi
  sleep 1
done

# When tests finish we kill proxy and add-in; npm then reports "dev failed" (process was terminated). That is expected — ignore it.
cleanup() {
  kill $PROXY_PID $ADDIN_PID 2>/dev/null || true
}
trap cleanup EXIT

echo "Running E2E (real Airia)..."
E2E_USE_REAL_AIRIA=1 E2E_SERVERS_ALREADY_RUNNING=1 npm run test --workspace=@tenderwin/e2e-tests -- --project=chromium "$@"
