# Manual Testing and Demo Guide – TenderWin

This document describes how to run the project locally, what test data to use, how to manually test each part, and how to run a repeatable demo for the hackathon.

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js 18+** | `node -v` and `npm -v` |
| **npm** | Used for install and scripts (no pnpm required) |
| **Browser** | Chrome or Edge for task pane UI testing |
| **Microsoft Word (optional)** | For testing inside Word: use **Word on the web** at [office.com](https://office.com) with a free Microsoft account (no Office 365), or Word desktop on Windows/Mac (see sideload steps below). |
| **Postman or curl** | For calling the Teams bot handoff API |
| **Airia account (optional)** | For end-to-end testing with real MCP Gateway and Agent Builder |

---

## 2. Test Data for the Demo

### Do we need test data?

- **Word Add-in:** Yes. You need document content that looks like an RFP so “Draft Answers” and the citation widget make sense.
- **MCP servers (SharePoint / Salesforce):** No. They use **built-in mock data** inside the packages. No extra files or downloads required for unit or manual checks.
- **Teams bot:** No test data files. You exercise the “Ping Expert” flow via the API or (when wired) the Bot Framework Emulator.

### Use provided sample data (recommended)

The repo includes ready-made RFP-style text in **`test-data/`**:

| File | Use case |
|------|----------|
| **`test-data/sample-rfp-section.txt`** | Short section (security + technical). Paste into Word for a quick test. |
| **`test-data/sample-rfp-full.txt`** | Full RFP-style document. Use for a longer, more realistic demo. |

**How to use:** Open a new Word document, paste the contents of one of these files, then open the TenderWin task pane and click “Draft Answers.”

### Generate your own

- Use [HubSpot RFP templates](https://offers.hubspot.com/rfp-templates) (Word/PDF/Google Docs), [LawDepot RFP generator](https://lawdepot.com/us/business/request-for-proposals), or [LegalTemplates RFP](https://legaltemplates.net/form/request-for-proposal/).
- Export or copy sections into Word so the add-in has clear “questions” or sections to answer.

### Download from the internet

- You can use public RFP examples (e.g. government or education) if you have the right to use them for your demo.
- Prefer Word or copy-pasteable text; convert PDF to Word if needed.
- For the hackathon, the provided `test-data` files are enough to show the flow.

More detail: **[test-data/README.md](test-data/README.md)**.

---

## 3. One-time setup

From the **repository root**:

```bash
npm install
npm run build
```

This installs dependencies and builds all packages (Word add-in, Teams bot, MCP servers). Run again after pulling changes.

---

## 4. Running the components

### 4.1 Word Add-in (task pane UI)

The add-in is a React app served by Vite. You can test it in a browser without Word.

**Terminal 1 – from repo root:**

```bash
npm run dev --workspace=@tenderwin/word-addin
```

- App is at **http://localhost:3050**
- You should see “TenderWin Word Add-in,” a “Draft Answers” button, and the citation widget (confidence score; click to expand details).
- “Draft Answers” currently inserts mock text (no Airia call yet); this is enough for UI and manual flow testing.

**Optional – test inside Microsoft Word:**

1. Add an Office Add-in manifest that points `SourceLocation` to your add-in URL (e.g. `https://localhost:3050` with HTTPS, or a deployed URL). See [Office Add-ins docs](https://learn.microsoft.com/office/dev/add-ins/develop/add-in-manifests) and [SUBMISSION_AND_DEMO.md](SUBMISSION_AND_DEMO.md).
2. Sideload the add-in in Word:
   - **Word on the web (no Office 365 subscription needed):** Go to [office.com](https://office.com), sign in with a **free Microsoft account** (Outlook.com, etc.), open **Word** and create or open a document. Then **Home → Add-ins → More Settings → Upload My Add-in**, browse to your manifest `.xml` file, and upload. The add-in must be served over **HTTPS** (e.g. use [ngrok](https://ngrok.com) to expose your dev server: `ngrok http 3050`, then set the manifest’s `SourceLocation` to the ngrok HTTPS URL). See [Sideload to Office on the web](https://learn.microsoft.com/office/dev/add-ins/testing/sideload-office-add-ins-for-testing). Manifest is stored in browser storage; re-upload if you clear cache or switch browsers.
   - **Windows (Word desktop):** [Sideload on Windows](https://learn.microsoft.com/office/dev/add-ins/testing/sideload-an-office-add-in-on-windows).
   - **Word for Mac:** [Sideload on Mac](https://learn.microsoft.com/office/dev/add-ins/testing/sideload-an-office-add-in-on-mac) — copy the manifest into `~/Library/Containers/com.microsoft.Word/Data/Documents/wef`, then in Word use **Home → Add-ins** and select your add-in. Use the **traditional XML manifest** format (unified manifest sideload is not supported on Mac). Requires Word for Mac (Office 365).
3. Open a document that contains the sample RFP text (e.g. from `test-data/sample-rfp-section.txt`) and use the task pane.

#### Test in Word on the web (no Office 365 required)

You can run the add-in inside **Word on the web** using a **free Microsoft account** (Outlook.com, live.com, etc.). Word on the web requires the add-in to be loaded over **HTTPS**, so use a tunnel (e.g. ngrok) to expose your local dev server.

**What you do next:**

1. **Terminal 1:** `npm run dev --workspace=@tenderwin/word-addin`
2. **Terminal 2:** Expose the add-in over HTTPS. **Recommended:** `npx cloudflared@latest tunnel --url http://localhost:3050` (no password page). Or `npm run ngrok:addin` / `npx ngrok http 3050`. Copy the HTTPS URL.
3. In **`apps/word-addin/manifest.xml`**, set `<SourceLocation DefaultValue="https://YOUR-TUNNEL-URL/" />` (e.g. `https://xxx.trycloudflare.com/`). If you see "Blocked request" in Word, the add-in’s `vite.config.ts` allows `.trycloudflare.com` and other tunnel domains; restart the dev server and ensure no stale `vite.config.js` overrides it.
4. **For Draft Answers with Airia:** Set **`VITE_AIRIA_PROXY_URL=http://localhost:3051/airia`** in `apps/word-addin/.env.local` and start the proxy: **`npm run dev --workspace=@tenderwin/airia-proxy`** (in another terminal). Restart the add-in dev server after changing env.
5. In Word on the web: **Home → Add-ins → More Settings → Upload My Add-in** → select **`apps/word-addin/manifest.xml`**.
6. Use **Home → Add-ins → TenderWin** and test **Draft Answers** (and **Ping Expert** if the Teams bot is running).

**Before you start:**

- A free Microsoft account (no Microsoft 365 subscription).
- An Office Add-in **manifest** (`.xml`) for Word. The repo includes **`apps/word-addin/manifest.xml`** (traditional XML format). For Word on the web you must set its **`SourceLocation`** to your ngrok HTTPS URL (see step 3).
- **Tunnel** so the add-in is served over HTTPS. **Recommended:** `npx cloudflared@latest tunnel --url http://localhost:3050` (no password page). Or `npx ngrok http 3050` from [ngrok.com](https://ngrok.com).

**Steps:**

1. **Start the add-in dev server** (Terminal 1):
   ```bash
   npm run dev --workspace=@tenderwin/word-addin
   ```
   Leave it running. The app is at http://localhost:3050.

2. **Expose the dev server over HTTPS** (Terminal 2):
   ```bash
   npx cloudflared@latest tunnel --url http://localhost:3050
   ```
   (Recommended; no password page.) Or `npm run ngrok:addin` / `npx ngrok http 3050`. Copy the **HTTPS** URL (e.g. `https://xxx.trycloudflare.com`).

3. **Point the manifest at the HTTPS URL.**  
   Open **`apps/word-addin/manifest.xml`** and set the **`SourceLocation`** `DefaultValue` to your ngrok HTTPS URL with a trailing slash (e.g. `https://abc123.ngrok-free.app/`). The add-in is served from the root path. Save the file.

4. **Open Word on the web:**  
   Go to [office.com](https://office.com), sign in with your Microsoft account, and open **Word**. Create a **new blank document** or open an existing one.

5. **Sideload the add-in:**  
   In Word, go to **Home → Add-ins → More Settings**. In the **Office Add-ins** dialog, choose **Upload My Add-in**, browse to **`apps/word-addin/manifest.xml`**, and select **Upload**. The TenderWin add-in should appear in the list and the task pane may open automatically.

6. **Test the add-in:**  
   If the task pane is not open, use **Home → Add-ins** and select TenderWin. Paste content from `test-data/sample-rfp-section.txt` into the document, place the cursor where you want an answer, then click **Draft Answers**. You should see mock text inserted (or an Airia response if the proxy is running and `VITE_AIRIA_PROXY_URL` is set). Check the citation widget (confidence score; click to expand). For **Draft Answers with Airia**, you must run the Airia proxy (`npm run dev --workspace=@tenderwin/airia-proxy`) and set `VITE_AIRIA_PROXY_URL=http://localhost:3051/airia` in `.env.local` to avoid CORS errors. Optionally test **Ping Expert** if the Teams bot is running and `VITE_TEAMS_BOT_URL` is set.

**Notes:**

- The sideloaded manifest is stored in your **browser’s local storage**. If you clear cache or use a different browser, repeat step 5 to upload the manifest again.
- If you restart ngrok, the HTTPS URL changes; update the manifest (step 3) and re-upload it (step 5).
- Official reference: [Sideload Office Add-ins to Office on the web](https://learn.microsoft.com/office/dev/add-ins/testing/sideload-office-add-ins-for-testing).

### 4.2 Teams bot (handoff API and Bot Framework)

The Teams bot server runs in a single process and exposes: **POST /api/handoff** (body: `{ sessionId, question?, draftText }` → `{ success: true, sessionId }`), **GET /api/handoff/status?sessionId=...** (returns `{ status, expertReply? }`: `pending` | `approved` | `rejected`), and **POST /api/messages** (Bot Framework; bot sends an Adaptive Card when the expert says "Ping Expert" and updates the handoff store on approve). You can test the handoff API manually.

**Terminal 2 – from repo root:**

```bash
npm run build --workspace=@tenderwin/teams-bot
node apps/teams-bot/dist/server.js
```

Or from `apps/teams-bot`:

```bash
npm run build
node dist/server.js
```

- Server listens on **http://localhost:3978** (or `PORT` if set).
- To test the handoff API:

```bash
# POST handoff (sessionId required)
curl -X POST http://localhost:3978/api/handoff \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-1","draftText":"Sample draft answer."}'
# Expected: 200 and { "success": true, "sessionId": "test-1" }

# GET status
curl "http://localhost:3978/api/handoff/status?sessionId=test-1"
# Expected: 200 and { "status": "pending" } (or "approved"/"rejected" after expert action)
```

Full bot conversation ("Ping Expert", Adaptive Card, approve/reject) is covered by **unit tests** (`npm test --workspace=@tenderwin/teams-bot`). For end-to-end with the add-in: set `VITE_TEAMS_BOT_URL=http://localhost:3978` in `apps/word-addin/.env.local`, then use "Ping Expert" in the add-in and approve in Teams (or Bot Framework Emulator).

### 4.3 MCP servers (SharePoint and Salesforce)

They use **stdio** transport and are intended to be driven by the Airia MCP Gateway or by tests. You do **not** need to run them as standalone HTTP services for basic manual testing.

**Verify they work:**

```bash
npm test --workspace=@tenderwin/mcp-sharepoint
npm test --workspace=@tenderwin/mcp-salesforce
```

All tests should pass. Mock data (e.g. “Cloud Migration Proposal,” “TechCorp,” “GlobalNet” for SharePoint; mock Account/Opportunity for Salesforce) is inside the packages. For a live demo with Airia, you would register these MCP servers (or your deployed versions) in the Airia Gateway.

---

## 5. Manual test cases

### 5.1 Word Add-in (browser only)

| Step | Action | Expected result |
|------|--------|------------------|
| 1 | Start the add-in dev server (see 4.1). | Vite runs; no errors. |
| 2 | Open http://localhost:3050 in Chrome or Edge. | Page shows “TenderWin Word Add-in,” “Draft Answers” button, “Ping Expert” button (disabled until there is draft context), and “Citation Widget” with “Confidence Score: 95%.” |
| 3 | Click “Draft Answers.” | Console or mock shows insert; in Word (if used) text would be inserted at cursor. “Ping Expert” becomes enabled. |
| 4 | Click the citation widget. | Section expands and shows “Source Data: MCP App Mock Data” and “Matched with requirements document section 3.2.” |
| 5 | Click the citation again. | Section collapses. |
| 6 | (Optional) With Teams bot running and `VITE_TEAMS_BOT_URL` set, click “Ping Expert.” | Add-in shows “Waiting for expert…”; when the expert approves in Teams, add-in shows “Expert approved.” and inserts the reply into the document. |

### 5.2 Word Add-in with Word (if sideloaded)

| Step | Action | Expected result |
|------|--------|------------------|
| 1 | Open Word and sideload the TenderWin add-in (manifest points to dev server or deployed URL). | Task pane opens. |
| 2 | Paste `test-data/sample-rfp-section.txt` into the document. | Document shows RFP-style questions. |
| 3 | Place cursor where an answer should go (e.g. under 3.1). | Cursor is ready for insertion. |
| 4 | In the task pane, click “Draft Answers.” | Mock answer is inserted (e.g. “Mocked text”) at the cursor. |
| 5 | Check the citation widget. | Confidence score and expandable source details are visible. |

#### 5.2.1 Test steps: Word on the web

Use these steps when testing in **Word on the web** at [office.com](https://office.com) (free Microsoft account). Ensure the add-in is exposed over HTTPS (e.g. localtunnel or ngrok) and the manifest `SourceLocation` is set; see Section 4.1 “Test in Word on the web.”

| Step | Action | Expected result |
|------|--------|------------------|
| 1 | Go to [office.com](https://office.com), sign in, open **Word**, create or open a document. | Word on the web opens with a document. |
| 2 | **Home → Add-ins → More Settings → Upload My Add-in** → select **`apps/word-addin/manifest.xml`** (if not already sideloaded). | Add-in appears in the list; task pane may open. |
| 3 | If the task pane is not open: **Home → Add-ins** → select **TenderWin**. | TenderWin task pane opens; “Draft Answers” and citation widget visible. |
| 4 | Paste content from `test-data/sample-rfp-section.txt` into the document. | Document shows RFP-style questions. |
| 5 | Place the cursor where an answer should go (e.g. under 3.1). | Cursor is ready for insertion. |
| 6 | In the task pane, click **“Draft Answers.”** | Mock answer is inserted at the cursor (or Airia response if wired). |
| 7 | Check the citation widget. | Confidence score and expandable source details are visible. |
| 8 | (Optional) With Teams bot running and `VITE_TEAMS_BOT_URL` set, click **“Ping Expert.”** | Add-in shows “Waiting for expert…”; after approval in Teams, “Expert approved.” and reply inserted. |

### 5.3 Teams bot handoff API

| Step | Action | Expected result |
|------|--------|------------------|
| 1 | Start the Teams bot server (see 4.2). | Server listening on port 3978. |
| 2 | Send `POST /api/handoff` with body `{ "sessionId": "s1", "draftText": "Draft." }`. | Response 200 and `{ "success": true, "sessionId": "s1" }`. |
| 3 | Send `GET /api/handoff/status?sessionId=s1`. | Response 200 and `{ "status": "pending" }` (or `approved`/`rejected` if the expert already responded in Teams). |
| 4 | Send `POST /api/handoff` without `sessionId`. | Response 400. |

### 5.4 MCP servers (via unit tests)

| Step | Action | Expected result |
|------|--------|------------------|
| 1 | Run `npm test --workspace=@tenderwin/mcp-sharepoint`. | All tests pass (e.g. search_proposals, resources). |
| 2 | Run `npm test --workspace=@tenderwin/mcp-salesforce`. | All tests pass (fetch_account, fetch_opportunity, get_client_context). |

---

## 6. Demo runbook (for hackathon video or live demo)

Use this for a **repeatable 4-minute demo** with the same test data and flow.

### Before you start

- [ ] `npm install` and `npm run build` at repo root.
- [ ] Sample RFP in Word: paste **`test-data/sample-rfp-full.txt`** (or `sample-rfp-section.txt`) into a new Word document and save.
- [ ] Word Add-in dev server: `npm run dev --workspace=@tenderwin/word-addin` (or use deployed URL).
- [ ] If you show Word: manifest configured and add-in sideloaded; task pane opens without errors.
- [ ] Optional: Airia dashboard open to show Agent Constraints; Teams open if you demonstrate “Ping Expert.”

### Demo flow (align with PRD and SUBMISSION_AND_DEMO)

1. **Hook (0:00–0:30)**  
   - Show the problem: many tabs / scattered docs vs. one Word doc with TenderWin.  
   - Open the RFP document and the TenderWin task pane.

2. **Core flow (0:30–1:30)**  
   - Briefly show the RFP content (from `test-data`).  
   - Click “Draft Answers.”  
   - Show text appearing in the document (mock or live Airia response).

3. **Citation and trust (1:30–2:30)**  
   - Point to the citation widget and confidence score.  
   - Click a citation and show the source snippet / “MCP App Mock Data.”  
   - Say that this makes answers traceable and enterprise-ready (no hallucinations).

4. **Security (2:30–3:15)**  
   - Open Airia Admin Dashboard and show the Agent Constraint (e.g. block HR files or restrict writes to current document).

5. **Teams and impact (3:15–4:00)**  
   - Trigger “Ping Expert” (via add-in or Teams); show the message and approval.  
   - Mention that the Word doc can update from expert feedback.  
   - One line on impact: e.g. “Cut RFP response time from weeks to hours.”

### Test data used in the demo

- **Document in Word:** Content from **`test-data/sample-rfp-full.txt`** (or the shorter `sample-rfp-section.txt`).
- **MCP / backend:** Built-in mocks in the MCP packages; no extra download. For a live Airia demo, use your configured MCP Gateway and agent.

---

## 7. Troubleshooting

| Issue | What to try |
|-------|-------------|
| Word add-in page blank at localhost:3050 | Confirm Vite is running and no port conflict; try a hard refresh. |
| “Draft Answers” does nothing in Word | Confirm Office.js is loaded and the manifest SourceLocation matches the dev server (or HTTPS). Check browser console for errors. |
| Teams bot server fails to start | Check that port 3978 is free; set `PORT` if needed. |
| MCP tests fail | Run `npm run build` in the relevant package, then `npm test` again. |
| E2E Playwright fails | Start the Word add-in dev server first, or run with `reuseExistingServer: true` and ensure nothing else is on port 3050. |
| **ngrok add-in fails (ERR_NGROK_334)** | Ngrok free tier allows **one active tunnel** at a time. If ngrok is already running for the MCP gateway (port 3100), you can't also run `ngrok:addin` (port 3050). **For E2E with Airia:** swapping tunnels does **not** work—when you click "Draft Answers," Airia must reach MCP, so both add-in (Word) and MCP (Airia) need to be reachable at the same time. **Options:** (1) **Recommended:** Keep ngrok for MCP (3100); use a second tunnel for the add-in only (see "localtunnel password page" below for cloudflared alternative). (2) **Paid ngrok:** Run two ngrok tunnels (3050 and 3100) with a paid plan. (3) **Single tunnel:** Use a reverse proxy that serves add-in and MCP on one port, then expose that port with one ngrok (see E2E doc). |
| **Localtunnel shows "Tunnel Password" page in Word** | Localtunnel often shows an interstitial asking for a "tunnel password" (your public IP). Word loads the add-in in an iframe and gets that page instead of your app. **Fix:** Use **Cloudflare Quick Tunnels** for the add-in instead: run `npx cloudflared@latest tunnel --url http://localhost:3050` (or install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) and run `cloudflared tunnel --url http://localhost:3050`). Use the printed `https://*.trycloudflare.com` URL as `SourceLocation` in the manifest. No password page. |
| **"Request to Airia failed (often CORS…)" in Word on the web** | When the add-in loads from a tunnel (e.g. Cloudflare), calling the Airia API directly from the browser is blocked by CORS. **Fix:** Use the **Airia proxy** so the add-in calls your proxy and the proxy calls Airia. In `apps/word-addin/.env.local` set **`VITE_AIRIA_PROXY_URL=http://localhost:3051/airia`**. Keep `VITE_AIRIA_API_KEY` and `VITE_AIRIA_AGENT_ID` there (the proxy reads them). Start the proxy: **`npm run dev --workspace=@tenderwin/airia-proxy`** (or `npm run build --workspace=@tenderwin/airia-proxy` then `node apps/airia-proxy/dist/server.js`). Restart the add-in dev server, then try Draft Answers again. |
| **"Blocked request. This host (…trycloudflare.com) is not allowed"** | Vite is rejecting the tunnel host. The repo’s `apps/word-addin/vite.config.ts` and `vite.config.js` set `server.allowedHosts` for `.trycloudflare.com`, `.ngrok-free.app`, `.ngrok.io`, `.loca.lt`. Restart the add-in dev server. If the error persists, ensure no stale `vite.config.js` without `allowedHosts` is overriding (e.g. update or remove it so `vite.config.ts` is used). |
| **"Airia API error: 401"** | The proxy is calling Airia but Airia rejected the request. In the **Airia dashboard** (TenderWin agent → View API Info) confirm the **API key**, **invoke path**, and **auth type**. In `apps/word-addin/.env.local`: set `VITE_AIRIA_API_KEY` and `VITE_AIRIA_AGENT_ID`; if the dashboard says Bearer auth use `AIRIA_AUTH_TYPE=Bearer`, otherwise remove it or use `X-API-Key`; if the invoke path differs set `AIRIA_INVOKE_PATH=/path/{agentId}`. **Restart the airia-proxy** after any change. |
---

## 8. Quick reference

| Goal | Command or location |
|------|----------------------|
| Install and build | `npm install` then `npm run build` (from root) |
| Run Word add-in (UI) | `npm run dev --workspace=@tenderwin/word-addin` → http://localhost:3050 |
| Run Airia proxy (for Word on the web + Airia) | `npm run dev --workspace=@tenderwin/airia-proxy` → http://localhost:3051; set `VITE_AIRIA_PROXY_URL=http://localhost:3051/airia` in `apps/word-addin/.env.local` |
| Run Teams bot server | `node apps/teams-bot/dist/server.js` (after build) |
| Test handoff API | `curl -X POST http://localhost:3978/api/handoff -H "Content-Type: application/json" -d '{"sessionId":"test-1","draftText":"Draft."}'` then `curl "http://localhost:3978/api/handoff/status?sessionId=test-1"` |
| Ping Expert from add-in | Set `VITE_TEAMS_BOT_URL=http://localhost:3978` in `apps/word-addin/.env.local`; run bot and add-in; click Draft Answers then Ping Expert; approve in Teams. |
| Run all unit tests | `npm run test` (from root) |
| Sample RFP for Word | `test-data/sample-rfp-section.txt` or `test-data/sample-rfp-full.txt` |
| Demo and submission steps | [SUBMISSION_AND_DEMO.md](SUBMISSION_AND_DEMO.md) |
