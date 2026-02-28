#!/usr/bin/env bash
# Run the MCP HTTP gateway so Airia (or any MCP client) can reach SharePoint and Salesforce MCP servers.
# Usage: ./scripts/run-mcp-http.sh [--tunnel]
#   --tunnel  print ngrok instructions (you run ngrok separately)

set -e
cd "$(dirname "$0")/.."

echo "Building MCP packages and gateway..."
npm run build --workspace=@tenderwin/mcp-sharepoint --workspace=@tenderwin/mcp-salesforce --workspace=@tenderwin/mcp-gateway

PORT="${MCP_GATEWAY_PORT:-3100}"
echo ""
echo "Starting MCP Gateway on port $PORT"
echo "  SharePoint:  http://localhost:$PORT/sharepoint"
echo "  Salesforce:  http://localhost:$PORT/salesforce"
echo "  Health:      http://localhost:$PORT/health"
echo ""

if [[ "${1:-}" == "--tunnel" ]]; then
  echo "To expose for Airia (e.g. local dev), in another terminal run:"
  echo "  npx ngrok http $PORT"
  echo "Then in Airia register:"
  echo "  SharePoint: https://YOUR_NGROK_URL/sharepoint"
  echo "  Salesforce: https://YOUR_NGROK_URL/salesforce"
  echo ""
fi

exec node apps/mcp-gateway/dist/server.js
