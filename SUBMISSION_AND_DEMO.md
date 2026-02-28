# TenderWin: Submission, Deployment & Demo

Step-by-step outline for deploying TenderWin, publishing to the Airia Community, recording the demo video, and submitting to the [Airia AI Agents Hackathon](https://airia-hackathon.devpost.com/) (deadline: **Mar 19, 2026 @ 11:45pm EDT**).

---

## 1. Prerequisites & Accounts

| Item | Action |
|------|--------|
| **Airia account** | Sign up at [Airia](https://airia.com) (or the URL from [hackathon resources](https://airia-hackathon.devpost.com/resources)). Required for MCP Gateway, Agent Builder, and Community submission. |
| **Airia API key / credentials** | Obtain from Airia dashboard if needed for programmatic access. Store in `.env` (never commit; use `.env.example` as a template). |
| **Microsoft 365 developer account** | For Word Add-in sideloading and Teams bot registration. [Get one](https://developer.microsoft.com/microsoft-365/dev-program) if needed. |
| **Azure account** | For deploying the Teams Bot (and optionally MCP servers) to Azure App Service. Free tier is sufficient for the demo. |
| **Vercel or Netlify account** | For hosting the Word Add-in static assets (free tier is fine). |

---

## 2. Airia Setup

1. **MCP Gateway**
   - In the Airia dashboard, open the MCP Gateway (or equivalent) section.
   - Register the **SharePoint MCP server** (e.g. URL of your deployed `packages/mcp-sharepoint` or a tunneled local URL for the demo).
   - Register the **Salesforce MCP server** (same idea for `packages/mcp-salesforce`).
   - Use the hackathon resources and [Airia MCP docs](https://explore.airia.com/integrations/Tools/mcp) for exact steps.

2. **Agent Builder**
   - Create an agent named **TenderWin**.
   - Configure the flow: RFP extraction → retrieval (via MCP tools) → drafting → formatting.
   - Connect the agent to the Word Add-in (e.g. via API endpoint or embed) so the sidebar can send document context and receive drafted answers and MCP App payloads (citations, confidence score).

3. **Agent Constraints (for the demo)**
   - Add at least one constraint to show enterprise readiness, e.g. “Block access to HR/restricted files” or “Only allow writes to the current Word document.”
   - Note where this appears in the Airia Admin Dashboard so you can show it in the video (see demo script below).

4. **Publish to Airia Community**
   - In Airia, go to the **Community** section.
   - Use **Share Agent** / **Publish to Community**.
   - Fill in: name (**TenderWin**), description, tags.
   - Set visibility to **Public**.
   - **Copy the Community URL** — you will need it for Devpost.

---

## 3. Deployment

### 3.1 Word Add-in

1. Build: `npm run build --workspace=@tenderwin/word-addin` (output in `apps/word-addin/dist/`).
2. Deploy the contents of `dist/` to a static host:
   - **Vercel:** Connect the repo or drag-and-drop `dist/`; set root to `apps/word-addin` and build output to `dist`.
   - **Netlify:** Same idea; publish directory = `apps/word-addin/dist`.
3. Ensure the Add-in is served over **HTTPS**.
4. Update the Word Add-in manifest (e.g. `manifest.xml`) so the **SourceLocation** URL points to the deployed URL (e.g. `https://your-app.vercel.app`).
5. Sideload the Add-in in Word (Desktop or Web) per [Office docs](https://learn.microsoft.com/office/dev/add-ins/testing/sideload-an-office-add-in-on-windows).

### 3.2 Teams Bot

1. Build: `npm run build --workspace=@tenderwin/teams-bot`.
2. In **Azure Portal**, create an **App Service** (Node or similar) and deploy the bot (e.g. `apps/teams-bot` plus `dist/` and dependencies).
3. Configure the Bot Framework resource and **Teams** channel; set the messaging endpoint to your Azure app URL (e.g. `https://your-bot.azurewebsites.net/api/messages`).
4. Create or reuse an **Azure Bot** and a **Teams app** that uses this bot; install the app in a test team for the demo.

### 3.3 MCP Servers (optional for demo)

- For a live demo, either:
  - Deploy `packages/mcp-sharepoint` and `packages/mcp-salesforce` to a host (e.g. Render, Azure) and register their URLs in the Airia MCP Gateway, or
  - Run them locally and expose via a tunnel (e.g. ngrok) and register the tunnel URLs in Airia.

---

## 4. Demo Video (4 minutes max)

**Rules (from Devpost):** Max 4 minutes; hosted on **YouTube** or **Vimeo** (public or unlisted); **real footage** of the agent in action (no slides only); narration or captions recommended.

**Suggested script (from [PRD.md](PRD.md)):**

| Time | Content |
|------|--------|
| **0:00–0:30** | **Hook:** Split screen. Left: rep overwhelmed by many tabs and an RFP. Right: rep opens a Word doc and opens the TenderWin sidebar. |
| **0:30–1:30** | **Core flow:** Show TenderWin scanning the document. User clicks “Draft Answers.” Show text streaming into the Word document. |
| **1:30–2:30** | **MCP Apps:** Focus on the sidebar. Show the interactive widget (confidence score, citations). Click a citation and show the source snippet. Emphasize enterprise-ready, traceable answers (no hallucinations). |
| **2:30–3:15** | **Agent Constraints:** Open the Airia Admin Dashboard. Show the Agent Constraint that restricts access (e.g. no HR/restricted files) or limits writes to the current document. |
| **3:15–4:00** | **Teams handoff:** Trigger “Ping Expert,” show the message in Teams and the expert’s reply, then show the Word document updating. End with one line on impact (time saved, revenue). |

**Before recording:** Test the full flow (Word → Airia → MCP → Word; Word → Teams → expert → Word) and have the Airia Community URL and Devpost submission page open. For the Ping Expert segment: set `VITE_TEAMS_BOT_URL` in `apps/word-addin/.env.local` to your Teams bot URL (e.g. `http://localhost:3978` for local dev, or your deployed bot URL for a live demo).

---

## 5. Devpost Submission Checklist

On [Airia Hackathon – Devpost](https://airia-hackathon.devpost.com/):

1. **Agent name**  
   - **TenderWin**

2. **Project description** (include):
   - **Problem:** B2B teams spend hundreds of hours on RFPs and security questionnaires; context switching and stale documents.
   - **Solution:** TenderWin in Word and Teams: ingest RFP → Airia + MCP Gateway → draft answers in-document; citations and “Ping Expert” in Teams.
   - **Key features:** Context-aware Word Add-in, MCP Apps (citations, confidence), Teams handoff, Agent Constraints.
   - **Technologies:** Airia (Agent Builder, MCP Gateway, MCP Apps), Office.js, Bot Framework, React, MCP servers (SharePoint, Salesforce).
   - **Target users:** Sales, Solutions Engineering, InfoSec, proposal teams.

3. **Demo video**  
   - Upload to YouTube or Vimeo (public or unlisted).  
   - Paste the link in the submission form.

4. **Airia Community URL**  
   - Paste the TenderWin agent’s **Community** link from the Airia Community publish step.

5. **Submit** before **Mar 19, 2026 @ 11:45pm EDT**.

---

## 6. Quick Reference

- **Hackathon:** https://airia-hackathon.devpost.com/
- **Resources (signup, API, design patterns):** https://airia-hackathon.devpost.com/resources
- **Judging:** Technological Implementation, Design, Potential Impact, Quality of Idea
- **Track:** Airia Everywhere (Track 1)
