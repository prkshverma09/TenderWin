# Airia agent checklist for TenderWin

Use this to confirm your **TenderWin** agent in the Airia dashboard is set up so the Word add-in and E2E (real Airia) work. No code changes are required in the repo if this is done.

## 1. Instructions / system prompt

**Where:** Agent → Instructions (or System prompt)

**What to do:** Tell the agent it receives **RFP document text or section text** from the user. It should use connected tools (SharePoint, Salesforce) to draft a **concise answer** suitable for insertion into a Word document.

**Example prompt:**
> You are TenderWin. The user will send you RFP questions or document sections. Use the connected tools to search past proposals (SharePoint) and get client context (Salesforce). Draft a concise, accurate answer suitable for insertion into a Word document.

---

## 2. Tools attached

**Where:** Agent → Tools (or Integrations / Capabilities / Connected tools)

**What to do:** After you have **registered** the SharePoint and Salesforce MCP servers in Airia (Tools → MCP → Integrations), open your **TenderWin** agent and in its **Tools** section **add** or **enable** the tools from those two integrations. For step-by-step “register then attach” instructions, see [E2E_SETUP_AND_TEST_WITH_AIRIA.md](../E2E_SETUP_AND_TEST_WITH_AIRIA.md) Section 4.2 (Register the MCP servers) and Section 4.3 (Attach the SharePoint and Salesforce tools to the TenderWin agent). Without attaching these tools, the agent won't call your MCP gateway and citations won't use real data.

---

## 3. MCP servers registered and reachable

**Where:** Tools / MCP / Integrations in Airia

**What to do:** Ensure the **SharePoint** and **Salesforce** server URLs point to your running gateway (ngrok HTTPS or deployed URL). If they're not reachable, the agent will fail or return no tool results.

---

## 4. Agent ID and API key

**Where:** Agent → Settings → View API Info (or Interfaces)

**What to do:**
- Copy the **Agent ID** and **API key** (and the **invoke URL path** if the dashboard shows one).
- Put them in `apps/word-addin/.env.local`:
  - `VITE_AIRIA_AGENT_ID=<agent-id>`
  - `VITE_AIRIA_API_KEY=<api-key>`
- If the dashboard shows a different **auth** (e.g. `Authorization: Bearer <key>`), add:
  - `AIRIA_AUTH_TYPE=Bearer`
- If the dashboard shows a different **invoke path**, add:
  - `AIRIA_INVOKE_PATH=/exact/path/from/dashboard/{agentId}`

---

## 5. Response shape (optional)

The add-in expects a **main answer text** and optionally **confidence** and **sources**. The proxy maps Airia's `text` or `content` to the drafted answer. Keep the agent's main reply as the drafted answer; if your Airia API returns the reply in another field, the proxy may need to be updated.

---

## 6. Constraints (optional, for demo)

**Where:** Admin / Governance in Airia

**What to do:** Add an agent constraint (e.g. block HR files or limit writes) so you can show security in the demo video.

---

You do **not** need to create a separate agent for testing vs production; one TenderWin agent with the above is enough for both the add-in and E2E.

---

## 7. Ping Expert (optional)

**Where:** `apps/word-addin/.env.local`

**What to do:** To use the "Ping Expert" button in the add-in (handoff to Teams, Adaptive Card approve/reject), set **`VITE_TEAMS_BOT_URL`** to your Teams bot base URL (e.g. `http://localhost:3978` for local dev, or your deployed bot URL). See [E2E_SETUP_AND_TEST_WITH_AIRIA.md](../E2E_SETUP_AND_TEST_WITH_AIRIA.md) Section 7.
