# End-to-End Setup and Testing with Airia

This guide explains how to set up TenderWin so the **full user flow runs through Airia** (Agent Builder, MCP Gateway, MCP Apps) and how to test that flow end-to-end.

**Relevant links (from the hackathon):**

- [Sign up for Airia](https://airia.com/register/?utm_source=devpost&utm_medium=hackathon&utm_campaign=q126)
- [Support videos & documentation (Explore)](https://explore.airia.com/home)
- [Airia API documentation](https://api.airia.ai/docs/)
- [Hackathon resources](https://airia-hackathon.devpost.com/resources) (Getting Started PDF, Design Patterns, Discord)

# TLDR
npm run mcp:gateway
npx ngrok http 3100

npm run dev --workspace=@tenderwin/word-addin
npm run ngrok:addin

npm run e2e:real-airia 
npx playwright show-report 


In short:

Terminal 1: MCP gateway (e.g. npm run mcp:gateway).
Terminal 2: npx ngrok http 3100 — use this HTTPS URL in Airia for the MCP servers.
Terminal 3: Add-in dev server: npm run dev --workspace=@tenderwin/word-addin.
Terminal 4: npx localtunnel --port 3050 — use the printed HTTPS URL (e.g. https://something.loca.lt) in apps/word-addin/manifest.xml as SourceLocation, then upload that manifest in Word on the web.
Terminal 5: start airia proxy: npm run build --workspace=@tenderwin/airia-proxy

---

## 1. What “E2E with Airia” Means

The target flow:

1. User opens an RFP in **Microsoft Word** and the **TenderWin** task pane.
2. User clicks **“Draft Answers.”**
3. The add-in sends the document context (e.g. selected section or full text) to **Airia**.
4. The **Airia agent** runs: **extract questions → call MCP tools** (SharePoint for past proposals, Salesforce for client context) **→ draft answers → return response + citation data**.
5. The add-in receives the response, **inserts the drafted text into Word** and shows the **citation widget** (confidence score, sources) from Airia MCP Apps.
6. Optionally, **“Ping Expert”** sends the current draft to the Teams bot; the expert reviews in Teams (Adaptive Card with Approve/Reject), and when they approve, the add-in inserts the expert's reply into the Word document.

When Airia is not configured, the Word add-in uses **mock** behavior (inserts mock text and shows static citation UI). This doc describes how to **configure Airia** and **wire the add-in** so the same UI drives the real Airia E2E flow.

---

## 2. Prerequisites

| Item | Purpose |
|------|--------|
| **Airia account** | Create agents, MCP Gateway, API keys. [Sign up](https://airia.com/register/). |
| **Airia API key / Agent ID** | So the Word add-in can call your TenderWin agent. Get from Airia dashboard or API docs. |
| **Node 18+** | To run the repo and (optionally) expose MCP servers. |
| **Microsoft Word** | To run the add-in in Word (or use the add-in in browser for UI-only tests). |
| **HTTPS URL for the add-in** | Required for Office Add-ins. Use ngrok or a deployed URL (e.g. Vercel) for local dev. |

---

## 3. Airia Setup (Account and Agent)

### 3.1 Create an Airia account

1. Go to [Airia registration](https://airia.com/register/?utm_source=devpost&utm_medium=hackathon&utm_campaign=q126).
2. Complete signup and sign in.
3. Use [Explore (docs)](https://explore.airia.com/home) and the **Getting Started** PDF from [hackathon resources](https://airia-hackathon.devpost.com/resources) for product overview.

### 3.2 Create the TenderWin agent

1. In the Airia dashboard, open **Agents** (or equivalent).
2. **Create a new agent** and name it **TenderWin**.
3. **Instructions / system prompt** – define the RFP workflow, for example:
   - “You are TenderWin. The user will send you RFP questions or document sections. Use the connected tools to search past proposals (SharePoint) and get client context (Salesforce). Draft a concise, accurate answer suitable for insertion into a Word document. Return the answer and, when possible, citation data (source document, snippet, confidence) for the MCP Apps widget.”
4. **Tools** – attach the MCP tools that the agent will call (see Section 4). These will be the SharePoint and Salesforce tools exposed via the MCP Gateway.
5. **Model / routing** – choose the model(s) (e.g. via Airia’s AI Gateway). No code change in the add-in required for this.
6. **Save** the agent and note:
   - **Agent ID** (or equivalent)
   - **API endpoint** and **API key** for invoking the agent (from [Airia API docs](https://api.airia.ai/docs/) or dashboard).

For a concise checklist of what to configure on the agent (instructions, tools, API key, etc.), see [AIRIA_AGENT_CHECKLIST.md](docs/AIRIA_AGENT_CHECKLIST.md).

### 3.3 Agent constraints (for enterprise / demo)

In the Airia dashboard (e.g. Admin / Governance):

- Add an **Agent Constraint** that fits the story, e.g.:
  - “Only allow writes to the current Word document” (data exfiltration prevention), or
  - “Block access to HR and restricted file locations” (RBAC).
- You’ll use this in the demo and in E2E “trust” verification.

---

## 4. Connecting Your MCP Servers (SharePoint and Salesforce)

TenderWin’s agent needs **past proposals** (SharePoint) and **client context** (Salesforce). The repo provides MCP servers in `packages/mcp-sharepoint` and `packages/mcp-salesforce`, and an **MCP HTTP Gateway** that exposes both over Streamable HTTP so Airia can reach them.

### 4.1 Run the MCP servers over HTTP (automated)

A single gateway app exposes both MCP servers on one port. No manual HTTP wrapper or process spawning is required.

**Option A – npm scripts (recommended)**

From the repo root:

```bash
# Build and start the gateway (port 3100)
npm run mcp:gateway
```

Or use the script (same effect, with optional tunnel reminder):

```bash
chmod +x scripts/run-mcp-http.sh
./scripts/run-mcp-http.sh
```

Endpoints:

- **SharePoint MCP:** `http://localhost:3100/sharepoint`
- **Salesforce MCP:** `http://localhost:3100/salesforce`
- **Health check:** `http://localhost:3100/health`

To use another port: `MCP_GATEWAY_PORT=3000 npm run mcp:gateway`  
Optional API key: set `MCP_GATEWAY_API_KEY` to require an `X-API-Key` header on `/sharepoint` and `/salesforce`; `/health` stays open for readiness checks.

**Option B – Expose for Airia (local dev)**

Airia needs an **HTTPS** URL. For local testing:

1. Start the gateway: `npm run mcp:gateway`
2. In another terminal, run **ngrok**: `npx ngrok http 3100`
3. Copy the ngrok HTTPS URL (e.g. `https://abc123.ngrok.io`).
4. In Airia, register:
   - **SharePoint:** `https://YOUR_NGROK_URL/sharepoint`
   - **Salesforce:** `https://YOUR_NGROK_URL/salesforce`

Or run the script with the tunnel reminder: `./scripts/run-mcp-http.sh --tunnel`, then start ngrok in another terminal.

**Option C – Deploy the gateway**

Deploy `apps/mcp-gateway` (e.g. to Render, Fly.io, or Azure) so it’s reachable at a public HTTPS URL. Use that base URL plus `/sharepoint` and `/salesforce` when registering in Airia.

### 4.2 Register the MCP servers in Airia

1. **Start the MCP gateway locally** (if not already running):
   ```bash
   npm run mcp:gateway
   ```
   Leave it running (port 3100).

2. **Expose it over HTTPS** so Airia can reach it (Airia requires HTTPS):
   - In another terminal: `npx ngrok http 3100`
   - Copy the **HTTPS** URL ngrok shows (e.g. `https://abc123.ngrok-free.app`). You will use this as `YOUR_NGROK_URL` below.

3. **In the Airia dashboard**, go to the **Tools Library** (project **Tools**, not AI Model → MCP Servers). In the **top right**, use **"Add Remote MCP Server"** to add by URL; do not use "Create new deployment" (catalog only).
4. **Add your first MCP server** (SharePoint) (e.g. “Add integration” or “Connect MCP”):
   - **Name:** e.g. `SharePoint (TenderWin)`
   - **URL:** `https://YOUR_NGROK_URL/sharepoint` (replace with your ngrok HTTPS URL).
   - Save. If Airia asks for authentication, leave it blank unless your gateway requires it.
5. **Add a second MCP server** (Salesforce):
   - **Name:** e.g. `Salesforce (TenderWin)`
   - **URL:** `https://YOUR_NGROK_URL/salesforce`
   - Save.

**If you don't see "Add Remote MCP Server":** Airia’s UI may vary. Try: **Tools** → **Create New Tool** and look for an option to add a **remote MCP** or **custom URL**; or go to **Gateway** → **MCP Gateway** → **Server Management** and see if there is a way to add a custom server URL. The docs ([Custom MCP Servers](https://explore.airia.com/integrations/Tools/add-a-mcp-server)) state that the Tools Library has "Add Remote MCP Server" in the top right. There is **no public REST API** in the documented Airia API for registering MCP servers by URL; use the UI or contact Airia support / hackathon Discord if your layout differs.

You have now **registered** the two MCP servers. Next, attach them to your agent. For more detail and API notes, see [docs/AIRIA_ADD_CUSTOM_MCP.md](docs/AIRIA_ADD_CUSTOM_MCP.md).

### 4.3 Attach the SharePoint and Salesforce tools to the TenderWin agent

1. In Airia, open **Agents** and open your **TenderWin** agent (or create it first per Section 3.2).
2. In the agent configuration, find the **Tools** (or **Integrations** / **Capabilities** / **Connected tools**) section. This is where you choose which tools this agent can use.
3. **Add** or **enable** the tools from the two MCP servers you just registered:
   - From the **SharePoint** integration: add the tool(s) it exposes (e.g. `search_proposals` or whatever the server lists).
   - From the **Salesforce** integration: add the tool(s) it exposes (e.g. `fetch_account`, `fetch_opportunity`, `get_client_context` or the names shown).
4. **Save** the agent.

If the Airia UI lists integrations by name, select “SharePoint (TenderWin)” and “Salesforce (TenderWin)” (or the names you gave in 4.2) and turn them **on** for this agent. The agent can then call those tools when answering RFP questions.

### 4.4 Verify MCP from Airia

- In the Airia UI, use the agent’s “test” or “playground” (if available) and run a prompt that should trigger:
  - SharePoint: e.g. “Search past proposals for cloud migration.”
  - Salesforce: e.g. “Get client context for account X.”
- Confirm the agent receives tool results. Once this works, E2E from Word will use the same agent and tools.

---

## 5. Wiring the Word Add-in to Airia

The add-in **already implements** (1) reading document content, (2) calling Airia (or mock), (3) inserting the answer into Word, and (4) showing citation data in the sidebar. You only need to set env vars and run the dev server.

### 5.1 Environment variables (automated setup)

**Option A – One-time setup from repo root:**

```bash
npm run addin:setup-env
```

This creates `apps/word-addin/.env.local` from the root `.env.example` (or a template). Then edit `apps/word-addin/.env.local` and set either:

- **Proxy (recommended):** `VITE_AIRIA_PROXY_URL=https://your-proxy.example.com/airia`
- **Or direct API:** `VITE_AIRIA_API_URL`, `VITE_AIRIA_API_KEY`, `VITE_AIRIA_AGENT_ID` (see root `.env.example`).

**Option B – Manual:** Create `apps/word-addin/.env.local` with the same variables. Do not commit it (already in `.gitignore`).

**Ping Expert (Teams handoff):** To use the "Ping Expert" button in the add-in, set **`VITE_TEAMS_BOT_URL`** to your Teams bot base URL (e.g. `http://localhost:3978` for local dev). The add-in then POSTs to `/api/handoff` and polls `/api/handoff/status` until the expert approves or rejects in Teams. See root `.env.example` and Section 7.

**Check that config is present (optional):**

```bash
npm run addin:check-env
```

Exits 0 if proxy or direct API vars are set; otherwise prints what’s missing.

**Where to get the values**

| Variable | How to get it |
|----------|----------------|
| **VITE_AIRIA_PROXY_URL** | You don’t get this from Airia. **You build a small backend** (e.g. Next.js API route, Express, or Vercel serverless) that accepts `POST` with `{ documentText }`, calls the Airia API with your API key and agent ID on the server, and returns `{ text, confidence?, sources? }`. Set this to that backend’s URL (e.g. `https://your-app.vercel.app/api/airia`). The API key then never lives in the add-in. |
| **VITE_AIRIA_API_URL** | Use the Airia API base URL, e.g. `https://api.airia.ai`. Confirm in [Airia API docs](https://api.airia.ai/docs/). |
| **VITE_AIRIA_API_KEY** | In the **Airia dashboard**: look for **Settings**, **API Keys**, **Integrations**, or **Developer** (wording may vary). Create or copy an API key that is allowed to invoke agents. Do not commit it; use `.env.local` only. |
| **VITE_AIRIA_AGENT_ID** | After you **create the TenderWin agent** in the Airia dashboard (Section 3.2), the agent has an ID. Find it in the agent’s settings, in the agent URL, or in the API docs when using “invoke agent”–style endpoints. That value is your Agent ID. |

**If you see "Failed to fetch"**

When using **direct API** vars (`VITE_AIRIA_API_URL` + key + agent ID), the add-in calls `https://api.airia.ai` from the browser. Many APIs (including Airia's) do not allow requests from `http://localhost:3050` because of **CORS**. The browser blocks the request and you get "Failed to fetch". **Fix:** Use a **backend proxy** (`VITE_AIRIA_PROXY_URL`). The add-in then only calls your server; your server calls the Airia API with the API key. No CORS from browser to Airia, and the API key stays server-side.

### 5.2 Add-in logic (already implemented)

The codebase already wires the flow:

| Step | Implementation |
|------|----------------|
| Document context | `apps/word-addin/src/taskpane/document.ts` – `getDocumentText()` (Word.run when in Word). |
| Call Airia | `apps/word-addin/src/services/airia.ts` – `draftFromDocument(text)` uses `VITE_AIRIA_PROXY_URL` or `VITE_AIRIA_API_*`; returns mock when unset. |
| Insert into Word | `document.ts` – `insertTextAtSelection(text)` (Office.context.document.body.insertText when in Word). |
| Citation widget | `App.tsx` – state from `draftFromDocument` result (`confidence`, `sources`); expandable citation UI. |
| Ping Expert | `App.tsx` – "Ping Expert" button (enabled when draft/citation exists). POSTs to `VITE_TEAMS_BOT_URL/api/handoff` with `{ sessionId, question?, draftText }`, polls `GET .../api/handoff/status?sessionId=...`; on `approved`, inserts `expertReply` into Word. See `apps/word-addin/src/services/handoff.ts`. |

Request/response shape for the **proxy** is: `POST` body `{ documentText }`, response `{ text, confidence?, sources? }`. For the **direct Airia API**, the service uses the endpoint and headers described in [Airia API](https://api.airia.ai/docs/); adjust `airia.ts` if your agent’s API differs.

### 5.3 Running the add-in (automated)

From repo root:

```bash
npm run dev:addin
```

This starts the Word Add-in dev server at **http://localhost:3050**. For **Word** (including Word on the web) you must load the task pane over **HTTPS**. Use either ngrok (local) or a deployed URL.

**What you do next (Word on the web):**

1. **Terminal 1:** `npm run dev --workspace=@tenderwin/word-addin`
2. **Terminal 2:** Expose the add-in over HTTPS. **Recommended:** `npx cloudflared@latest tunnel --url http://localhost:3050` (no password page). Or `npm run ngrok:addin` if ngrok is free. Copy the HTTPS URL.
3. In **`apps/word-addin/manifest.xml`**, set `<SourceLocation DefaultValue="https://YOUR-TUNNEL-URL/" />` (e.g. `https://xxx.trycloudflare.com/`). If you see "Blocked request" in Word, the add-in’s Vite config allows `.trycloudflare.com`; ensure `apps/word-addin/vite.config.ts` (and any `vite.config.js`) includes `server.allowedHosts` for your tunnel domain.
4. **For Draft Answers with Airia:** Set **`VITE_AIRIA_PROXY_URL=http://localhost:3051/airia`** in `apps/word-addin/.env.local` (keeps API key server-side and avoids CORS). Start the proxy: **`npm run dev --workspace=@tenderwin/airia-proxy`** in another terminal. Restart the add-in dev server after changing env.
5. In Word on the web: **Home → Add-ins → More Settings → Upload My Add-in** → select **`apps/word-addin/manifest.xml`**.
6. Use **Home → Add-ins → TenderWin** and test **Draft Answers** (and **Ping Expert** if the Teams bot is running).

**Alternatives:** Deploy `apps/word-addin/dist` (after `npm run build --workspace=@tenderwin/word-addin`) to Vercel/Netlify and set `SourceLocation` to that HTTPS URL instead of ngrok.

**E2E with Word on the web (add-in + Airia + MCP):** For the full flow you need **both** the add-in and the MCP gateway reachable at the same time: clicking "Draft Answers" sends context to Airia, and Airia then calls your MCP (SharePoint/Salesforce). Ngrok free tier allows only one tunnel, so use **two different tunnels:** (1) **ngrok for MCP** — keep `npx ngrok http 3100` running and register `https://YOUR-NGROK-URL/sharepoint` and `.../salesforce` in Airia. (2) **Second tunnel for the add-in** — run `npx cloudflared@latest tunnel --url http://localhost:3050` (recommended; no password page) or `npx localtunnel --port 3050` (may show a "Tunnel Password" interstitial—if so, use cloudflared). Use the printed HTTPS URL as `SourceLocation` in `manifest.xml`, then upload the manifest in Word on the web. **Use the Airia proxy** so Draft Answers works from the tunnel: set `VITE_AIRIA_PROXY_URL=http://localhost:3051/airia` in `apps/word-addin/.env.local` and run **`npm run dev --workspace=@tenderwin/airia-proxy`** (proxy reads API key and agent ID from the same .env.local). If Word shows "Blocked request" for the tunnel host, the add-in’s `vite.config.ts` includes `allowedHosts` for `.trycloudflare.com` (and other tunnel domains); ensure no stale `vite.config.js` overrides it.

### 5.4 Automated E2E test (Draft Answers)

Playwright runs two modes:

| Mode | When | What it does |
|------|------|----------------|
| **Stubbed (default)** | `E2E_USE_REAL_AIRIA` not set | Intercepts Airia/proxy requests and returns a fixed response. Asserts exact stub text and citation. No real API or credentials needed. |
| **Real Airia** | `E2E_USE_REAL_AIRIA=1` or `true` | No interception; the add-in calls your proxy or the Airia API. Asserts no error, citation visible, and confidence score/source present. Requires add-in env (Section 5.1) and a CORS-safe setup (see below). |

**Run (default = stubbed):**

From repo root:

```bash
npm run e2e
```

Or from `tests/e2e`: `npx playwright test --project=chromium`. The config starts the Word Add-in dev server automatically (`reuseExistingServer: true` if something is already on port 3050). The test uses system Chrome when available (`channel: 'chrome'`); for CI, run `npx playwright install chromium` in `tests/e2e` then run the test.

**Run with real Airia:**

1. Ensure **`apps/word-addin/.env.local`** has valid Airia credentials: **`VITE_AIRIA_API_URL`**, **`VITE_AIRIA_API_KEY`**, **`VITE_AIRIA_AGENT_ID`**. The add-in must call Airia via a **proxy** from localhost (to avoid CORS). Use either:
   - **Recommended:** run the repo’s Airia proxy and point the add-in at it (see below), or
   - Your own backend that forwards to Airia.
2. **One-command real Airia E2E** (starts proxy and add-in, then runs the test):

   ```bash
   bash scripts/e2e-real-airia.sh
   ```

   The script starts **`@tenderwin/airia-proxy`** (reads credentials from `apps/word-addin/.env.local`), then the Word Add-in with **`VITE_AIRIA_PROXY_URL=http://localhost:3051/airia`**, then runs Playwright with **`E2E_USE_REAL_AIRIA=1`** and **`--project=chromium`**. Only the “real Airia” test runs.

3. **Manual:** start the proxy and add-in in two terminals, then run the test:

   ```bash
   # Terminal 1
   npm run dev:airia-proxy
   # Terminal 2 (after proxy is up)
   bash scripts/start-addin-with-proxy.sh
   # Terminal 3
   E2E_USE_REAL_AIRIA=1 E2E_SERVERS_ALREADY_RUNNING=1 npm run e2e -- --project=chromium
   ```

**Real Airia E2E uses no mocks** (add-in → proxy → real Airia API). If the test fails: **401** = auth rejected — use the API key from Airia dashboard (View API Info); if Airia expects `Authorization: Bearer <key>`, add `AIRIA_AUTH_TYPE=Bearer` to `apps/word-addin/.env.local`. **404** = wrong invoke path — add `AIRIA_INVOKE_PATH=/exact/path/{agentId}` from the dashboard. Required in `.env.local`: `VITE_AIRIA_API_URL`, `VITE_AIRIA_API_KEY`, `VITE_AIRIA_AGENT_ID`.

If you see **“Airia proxy error: 401”**, the Airia API rejected the request: check that **API key** and **Agent ID** in `apps/word-addin/.env.local` are valid and not expired. **Steps:** (1) Get key and Agent ID from Airia dashboard (TenderWin agent → View API Info). (2) Set `VITE_AIRIA_API_KEY` and `VITE_AIRIA_AGENT_ID` in `apps/word-addin/.env.local`. (3) If 401 persists, add `AIRIA_AUTH_TYPE=Bearer`. (4) For 404, set `AIRIA_INVOKE_PATH` to the path from the dashboard. Re-run `npm run e2e:real-airia` after changes.

---

## 6. End-to-End Test Flow (With Airia)

Use this once Airia is configured and the add-in is wired to the API.

### 6.1 Before you start

- [ ] Airia account created; TenderWin agent created and configured with MCP tools.
- [ ] SharePoint and Salesforce MCP servers running and registered in Airia; agent can call them successfully in the dashboard.
- [ ] Add-in env: for **Word on the web** use **`VITE_AIRIA_PROXY_URL=http://localhost:3051/airia`** (and keep `VITE_AIRIA_API_KEY`, `VITE_AIRIA_AGENT_ID` in `.env.local` for the proxy). Start the proxy: **`npm run dev --workspace=@tenderwin/airia-proxy`**. For desktop Word you can use direct API vars or the same proxy.
- [ ] Add-in served over HTTPS and sideloaded in Word (or loaded in browser for UI-only check). For Word on the web: use a tunnel (e.g. `npx cloudflared@latest tunnel --url http://localhost:3050`) and set that URL in the manifest `SourceLocation`.
- [ ] Sample RFP in Word: e.g. paste `test-data/sample-rfp-section.txt` (see [MANUAL_TESTING_AND_DEMO.md](MANUAL_TESTING_AND_DEMO.md)).

### 6.2 Step-by-step E2E test

| Step | Action | What to verify |
|------|--------|----------------|
| 1 | Open Word and the document with the sample RFP. | Document shows RFP questions/sections. |
| 2 | Open the TenderWin task pane (Insert → Add-ins → TenderWin or your sideload entry). | Task pane loads; no console errors. |
| 3 | Place the cursor where the first answer should go (e.g. under “3.1 Data encryption”). | Cursor is in the right place. |
| 4 | Click **“Draft Answers.”** | Add-in sends document context to Airia (check network tab if possible). |
| 5 | Wait for the response. | Drafted answer appears in the document at the cursor. |
| 6 | Check the sidebar. | Citation widget shows a confidence score (e.g. from Airia MCP Apps). |
| 7 | Click a citation (if available). | Source snippet or “Source Data” from the agent response is shown. |
| 8 | (Optional) Click “Ping Expert.” | Add-in sends handoff to Teams bot; when the expert approves in Teams (Adaptive Card), add-in inserts the expert reply and shows “Expert approved.” |

**When using Word on the web:** Use the same flow; only steps 1–2 differ. (1) Go to [office.com](https://office.com), sign in, open **Word**, and open or create a document with the sample RFP (e.g. paste `test-data/sample-rfp-section.txt`). (2) Open the task pane: **Home → Add-ins → More Settings** to upload **`apps/word-addin/manifest.xml`** if needed, then **Home → Add-ins** → select **TenderWin**. Then follow steps 3–8 above (cursor, Draft Answers, citation, optional Ping Expert).

### 6.3 What “success” looks like

- **Document:** The answer text inserted is the one returned by the Airia agent (not “Mocked text”).
- **Citations:** The confidence and sources match what the agent returned (from MCP tools / MCP Apps).
- **Reproducibility:** Repeating the flow with another section produces another agent-generated answer and citation.

### 6.4 If something fails

- **ngrok add-in fails (ERR_NGROK_334):** For **E2E with Airia**, you need **both** the add-in (Word on the web) and the MCP gateway reachable at the same time—swapping tunnels is not viable. **Use:** keep ngrok for MCP (port 3100); expose the add-in with a second tunnel, e.g. `npx cloudflared@latest tunnel --url http://localhost:3050`, and set that HTTPS URL in `manifest.xml` as `SourceLocation`. See "E2E with Word on the web" in §5.3 and [MANUAL_TESTING_AND_DEMO.md](MANUAL_TESTING_AND_DEMO.md) §7.
- **"Request to Airia failed (often CORS…)" in Word on the web:** The add-in (loaded from a tunnel) cannot call the Airia API directly from the browser due to CORS. **Use the Airia proxy:** set `VITE_AIRIA_PROXY_URL=http://localhost:3051/airia` in `apps/word-addin/.env.local`, start `npm run dev --workspace=@tenderwin/airia-proxy`, restart the add-in dev server, then try Draft Answers again. See [MANUAL_TESTING_AND_DEMO.md](MANUAL_TESTING_AND_DEMO.md) §7.
- **"Blocked request. This host (…trycloudflare.com) is not allowed":** Vite is rejecting the tunnel host. The repo’s `apps/word-addin/vite.config.ts` (and `vite.config.js`) set `server.allowedHosts` for `.trycloudflare.com`, `.ngrok-free.app`, `.ngrok.io`, `.loca.lt`. Restart the add-in dev server; if the error persists, ensure no other `vite.config.js` without `allowedHosts` is overriding (e.g. delete a stale compiled `vite.config.js` so Vite uses `vite.config.ts`).
- **No response / 401:** Check API key and agent ID; confirm the add-in (or proxy) sends the right headers and URL.
- **Agent doesn’t use MCP:** In Airia, confirm the TenderWin agent has the SharePoint and Salesforce tools attached and that test prompts in the dashboard return tool results.
- **Wrong or empty text in Word:** Inspect the API response in the add-in; ensure you’re parsing the correct field for “answer text” and inserting it at the selection.
- **Citation widget empty:** Ensure the add-in maps the API’s citation/MCP Apps payload into the component state and that the UI reads that state.

---

## 7. Optional: Ping Expert (Teams) in the E2E flow

The add-in implements the full "Ping Expert" flow:

1. **Add-in:** User clicks "Ping Expert" (enabled after a draft exists). The add-in POSTs to `VITE_TEAMS_BOT_URL/api/handoff` with `{ sessionId, question?, draftText }`, shows "Waiting for expert…", and polls `GET .../api/handoff/status?sessionId=...` every 2–3 seconds.
2. **Teams bot:** The same server exposes `/api/handoff`, `/api/handoff/status`, and **POST /api/messages** (Bot Framework). When the expert in Teams says "Ping Expert," the bot sends an **Adaptive Card** with the latest pending handoff and **Approve** / **Reject** buttons. When the expert clicks Approve, the bot updates the handoff store; the add-in's next poll returns `status: 'approved'` and optional `expertReply`.
3. **Add-in:** When the poll returns `status: 'approved'`, the add-in inserts the expert reply (or draft) into the document and shows "Expert approved."

**To test:** Set `VITE_TEAMS_BOT_URL=http://localhost:3978`, start the Teams bot (`node apps/teams-bot/dist/server.js` after building), run "Draft Answers" then "Ping Expert" in the add-in. In Teams (or Bot Framework Emulator), say "Ping Expert" to receive the card, then click Approve. The add-in updates within a few seconds.

Including this in E2E is optional; the core E2E with Airia is **Word → Add-in → Airia (agent + MCP) → back to Word and citation widget**.

---

## 8. Quick reference

| Goal | Where / what |
|------|----------------|
| Airia signup | [airia.com/register](https://airia.com/register/) |
| Airia docs | [explore.airia.com](https://explore.airia.com/home), [api.airia.ai](https://api.airia.ai/docs/) |
| Hackathon resources | [airia-hackathon.devpost.com/resources](https://airia-hackathon.devpost.com/resources) |
| MCP servers (this repo) | `packages/mcp-sharepoint`, `packages/mcp-salesforce` |
| Add-in env (example) | `apps/word-addin/.env.local`: `VITE_AIRIA_API_URL`, `VITE_AIRIA_API_KEY`, `VITE_AIRIA_AGENT_ID`; for Ping Expert add `VITE_TEAMS_BOT_URL=http://localhost:3978` |
| Sample RFP for E2E | `test-data/sample-rfp-section.txt` or `sample-rfp-full.txt` |
| General manual testing | [MANUAL_TESTING_AND_DEMO.md](MANUAL_TESTING_AND_DEMO.md) |
| Submission and demo | [SUBMISSION_AND_DEMO.md](SUBMISSION_AND_DEMO.md) |

This file focuses only on **setup and testing of the E2E user flow using Airia**. For local UI-only testing without Airia, use [MANUAL_TESTING_AND_DEMO.md](MANUAL_TESTING_AND_DEMO.md).
