#!/usr/bin/env bash
# Copy env template to apps/word-addin/.env.local if missing.
# Usage: ./scripts/setup-addin-env.sh

set -e
cd "$(dirname "$0")/.."

ADDIN_ENV="apps/word-addin/.env.local"
EXAMPLE=".env.example"

if [[ -f "$ADDIN_ENV" ]]; then
  echo "Already exists: $ADDIN_ENV"
  exit 0
fi

if [[ -f "$EXAMPLE" ]]; then
  # Extract only VITE_ and add-in relevant lines, or copy whole file
  grep -E '^#|^VITE_|^$' "$EXAMPLE" > "$ADDIN_ENV" 2>/dev/null || cp "$EXAMPLE" "$ADDIN_ENV"
  echo "Created $ADDIN_ENV from $EXAMPLE – fill in your Airia values."
else
  cat > "$ADDIN_ENV" << 'EOF'
# Word Add-in + Airia (copy from root .env.example or fill in)
# VITE_AIRIA_PROXY_URL=https://your-proxy.example.com/airia
# Or:
# VITE_AIRIA_API_URL=https://api.airia.ai
# VITE_AIRIA_API_KEY=
# VITE_AIRIA_AGENT_ID=
EOF
  echo "Created $ADDIN_ENV – add your Airia URL/key/agent ID."
fi
