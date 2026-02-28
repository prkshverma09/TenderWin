#!/usr/bin/env bash
# Start the Word Add-in dev server with VITE_AIRIA_PROXY_URL so it uses the Airia proxy (for E2E real Airia).
# Usage: from repo root, or run with first arg = repo root path.
set -e
ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT"
export VITE_AIRIA_PROXY_URL="${VITE_AIRIA_PROXY_URL:-http://localhost:3051/airia}"
unset VITE_AIRIA_API_URL VITE_AIRIA_API_KEY VITE_AIRIA_AGENT_ID
exec npm run dev --workspace=@tenderwin/word-addin
