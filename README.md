# TenderWin

The autonomous RFP architect that lives where your sales team works (Microsoft Word + Teams). Built for the [Airia AI Agents Hackathon](https://airia-hackathon.devpost.com/) (Track 1: Airia Everywhere).

## Development

- **Install:** `npm install`
- **Unit tests:** `npm run test` (runs tests in all packages via Turbo)
- **E2E tests:** From repo root, run the Word Add-in dev server in one terminal (`npm run dev --workspace=@tenderwin/word-addin`), then in another run `cd tests/e2e && npx playwright test`. Or run `npm run test` and let Playwright start the server (takes ~2 min first time).
- **Build:** `npm run build`

## CI (GitHub Actions)

To run tests on push/PR, create `.github/workflows/ci.yml` with:

```yaml
name: CI
on:
  push: { branches: [main, master] }
  pull_request: { branches: [main, master] }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npx playwright install --with-deps chromium
        working-directory: tests/e2e
      - run: npx playwright test
        working-directory: tests/e2e
```

## Structure

- `apps/word-addin` – React task pane for Word (Vite + Jest)
- `apps/teams-bot` – Bot Framework bot for "Ping Expert"; in-process handoff store, POST/GET `/api/handoff`, Adaptive Card approve/reject (Jest)
- `apps/mcp-gateway` – HTTP gateway exposing SharePoint and Salesforce MCP servers (optional `MCP_GATEWAY_API_KEY` for `/sharepoint` and `/salesforce`)
- `packages/mcp-sharepoint` – MCP server for past proposals (Vitest)
- `packages/mcp-salesforce` – MCP server for client context (Jest)
- `tests/e2e` – Playwright E2E for Word Add-in flow (includes Ping Expert with stubbed handoff when not using real Airia)

See [PRD.md](PRD.md) and [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for product and implementation details.
