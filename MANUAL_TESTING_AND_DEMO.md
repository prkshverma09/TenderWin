# Manual Testing and Demo Guide – TenderWin

This document describes how to run the project locally, what test data to use, how to manually test each part, and how to run a repeatable demo for the hackathon.

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js 18+** | `node -v` and `npm -v` |
| **npm** | Used for install and scripts (no pnpm required) |
| **Browser** | Chrome or Edge for task pane UI testing |
| **Microsoft Word (optional)** | For testing the add-in inside Word (requires add-in manifest and sideload; see below) |
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

1. Add an Office Add-in manifest that points `SourceLocation` to `https://localhost:3050` (or your deployed URL). See [Office Add-ins docs](https://learn.microsoft.com/office/dev/add-ins/develop/add-in-manifests) and [SUBMISSION_AND_DEMO.md](SUBMISSION_AND_DEMO.md).
2. Sideload the add-in in Word (Desktop or Web) per [sideload instructions](https://learn.microsoft.com/office/dev/add-ins/testing/sideload-an-office-add-in-on-windows).
3. Open a document that contains the sample RFP text (e.g. from `test-data/sample-rfp-section.txt`) and use the task pane.

### 4.2 Teams bot (handoff API)

The bot server exposes a **handoff** endpoint only (no Bot Framework HTTP endpoint in this repo). You can test that endpoint manually.

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
- To test the handoff:

```bash
curl -X POST http://localhost:3978/api/handoff \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: `200 OK` and a JSON body like `{ "success": true, "message": "Handoff received and proactive message triggered" }`.

Full bot conversation (e.g. “Ping Expert” and adaptive cards) is covered by **unit tests** (`npm test --workspace=@tenderwin/teams-bot`). End-to-end with Teams would require wiring the bot to an HTTP endpoint and using the Bot Framework Emulator or a real Teams app.

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
| 2 | Open http://localhost:3050 in Chrome or Edge. | Page shows “TenderWin Word Add-in,” “Draft Answers” button, and “Citation Widget” with “Confidence Score: 95%.” |
| 3 | Click “Draft Answers.” | Console or mock shows insert; in Word (if used) text would be inserted at cursor. |
| 4 | Click the citation widget. | Section expands and shows “Source Data: MCP App Mock Data” and “Matched with requirements document section 3.2.” |
| 5 | Click the citation again. | Section collapses. |

### 5.2 Word Add-in with Word (if sideloaded)

| Step | Action | Expected result |
|------|--------|------------------|
| 1 | Open Word and sideload the TenderWin add-in (manifest points to dev server or deployed URL). | Task pane opens. |
| 2 | Paste `test-data/sample-rfp-section.txt` into the document. | Document shows RFP-style questions. |
| 3 | Place cursor where an answer should go (e.g. under 3.1). | Cursor is ready for insertion. |
| 4 | In the task pane, click “Draft Answers.” | Mock answer is inserted (e.g. “Mocked text”) at the cursor. |
| 5 | Check the citation widget. | Confidence score and expandable source details are visible. |

### 5.3 Teams bot handoff API

| Step | Action | Expected result |
|------|--------|------------------|
| 1 | Start the Teams bot server (see 4.2). | Server listening on port 3978. |
| 2 | Send `POST /api/handoff` with empty body (see curl above). | Response 200 and JSON with `success: true`. |
| 3 | Send with invalid method (e.g. GET). | 404 or 405 as implemented. |

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

---

## 8. Quick reference

| Goal | Command or location |
|------|----------------------|
| Install and build | `npm install` then `npm run build` (from root) |
| Run Word add-in (UI) | `npm run dev --workspace=@tenderwin/word-addin` → http://localhost:3050 |
| Run Teams bot server | `node apps/teams-bot/dist/server.js` (after build) |
| Test handoff API | `curl -X POST http://localhost:3978/api/handoff -H "Content-Type: application/json" -d '{}'` |
| Run all unit tests | `npm run test` (from root) |
| Sample RFP for Word | `test-data/sample-rfp-section.txt` or `test-data/sample-rfp-full.txt` |
| Demo and submission steps | [SUBMISSION_AND_DEMO.md](SUBMISSION_AND_DEMO.md) |
