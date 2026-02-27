# Product Requirements Document (PRD): TenderWin

**Hackathon Track:** Track 1 (Airia Everywhere)
**Tagline:** The autonomous RFP architect that lives where your sales team works.

## 1. Overview & Problem Statement

**The Problem:** B2B Sales, Solutions Engineering, and InfoSec teams spend hundreds of hours manually responding to massive Requests for Proposals (RFPs) and Security Questionnaires. They waste time switching tabs, searching through stale SharePoint folders, and copy-pasting from old documents.
**The Solution:** **TenderWin** is an Airia-powered enterprise agent embedded directly into Microsoft Word and Microsoft Teams. It autonomously ingests blank RFPs, securely queries the enterprise's historic knowledge base via the Airia MCP Gateway, and drafts highly accurate, context-aware responses directly into the document.

## 2. Alignment with Hackathon Judging Criteria

* **Airia Everywhere (Track 1 Fit):** TenderWin operates natively inside Microsoft Word (via a task pane Add-in) and MS Teams. The user never has to log into a separate AI dashboard.
* **Technological Implementation:** Utilizes **Airia MCP Gateway** for secure enterprise data retrieval and **Airia MCP Apps** to render interactive UI components (source citations, confidence scores) directly inside the chat interface.
* **Design & UX:** Eliminates context switching. Offers a frictionless, "invisible" AI experience that augments existing human workflows.
* **Potential Impact:** Direct, measurable ROI for enterprises by reducing RFP response times from weeks to hours.

---

## 3. Core Features & User Flow

### Feature 1: The "Context-Aware" Word Add-in

* **Flow:** A user opens a 50-page RFP in Microsoft Word. They open the TenderWin sidebar (powered by Airia).
* **Action:** The agent reads the entire document structure, identifies all unanswered questions, and adds them to a processing queue.
* **Output:** The agent drafts answers directly into the Word document at the cursor's location.

### Feature 2: Interactive Citation UI (via Airia MCP Apps)

* **Flow:** When TenderWin generates an answer, it doesn't just output plain text. Using Airia's new **MCP Apps** capability, the agent returns an interactive UI widget inside the chat sidebar.
* **Action:** The widget displays a "Confidence Score" (e.g., 92%) and clickable citations.
* **Output:** The user clicks a citation, and the MCP App expands to show the exact snippet from the past 2025 Q3 Proposal used to generate the answer, completely eliminating hallucinations.

### Feature 3: Conversational Refinement via Teams/Slack

* **Flow:** If an answer requires technical input from an engineer, the sales rep clicks "Ping Expert."
* **Action:** TenderWin automatically messages the engineer in MS Teams: *"Hey Sarah, I am drafting a response for the Acme Corp RFP regarding our database encryption. Does this draft look accurate?"*
* **Output:** Sarah replies in Teams. TenderWin updates the MS Word document in real-time.

---

## 4. System Architecture & Tech Stack

To score maximum points, the architecture must demonstrate a deep understanding of Airia's enterprise security posture.

### Frontend (The "Everywhere" Layer)

* **Microsoft Word Add-in:** Built using React and the Office JavaScript API. Provides the sidebar interface.
* **Microsoft Teams Bot:** Built using the Bot Framework to handle conversational hand-offs.

### Middleware & AI Orchestration (The Airia Layer)

* **Airia Agent Builder:** Used to orchestrate the core logic and multi-step prompt chains (Extraction -> Retrieval -> Drafting -> Formatting).
* **Airia MCP Gateway:** Acts as the secure reverse proxy between the TenderWin agent and the enterprise's data sources.
* *Server 1:* SharePoint/Google Drive MCP Server (for fetching past proposals).
* *Server 2:* Salesforce MCP Server (for fetching current client context).


* **Airia MCP Apps Integration:** Used to render the interactive React-based citation components directly within the Word Add-in chat interface.

### Infrastructure & Data

* **LLM Engine:** Model-agnostic routing via Airia (e.g., routing complex legal questions to Claude 3.5 Sonnet, and basic formatting to GPT-4o).
* **Vector Database:** Pinecone or Qdrant for semantic search of past RFPs.

---

## 5. Security & Governance (Winning the Enterprise Pitch)

Airia's judges are heavily focused on security. TenderWin will implement **Airia Agent Constraints** to prove it is enterprise-ready:

1. **Data Exfiltration Prevention:** An Agent Constraint policy is applied at the infrastructure layer ensuring TenderWin can *only* write data to the specific Word document open in the user's active session. It is hard-blocked from emailing data externally.
2. **Access Control (RBAC):** TenderWin uses the MCP Gateway's OAuth pass-through. If a junior sales rep asks TenderWin to reference a highly confidential internal M&A document to answer an RFP, the Airia Gateway blocks the retrieval because the user's underlying Entra ID/Active Directory credentials do not have permission.
3. **Audit Trail:** Every query TenderWin makes to SharePoint is logged in the Airia Governance Dashboard for compliance review.

---

## 6. Hackathon Demo Strategy (The 4-Minute Video)

The Devpost rules explicitly state: *"a demo video of maximum 4 minutes showing your agent in action (no PowerPoint slides, real footage only)."* Here is the script for the winning demo:

* **0:00 - 0:30 (The Hook):** Start with the screen split. On the left, a frantic sales rep drowning in 20 tabs trying to answer a massive RFP. On the right, a calm rep opening a blank Word doc and clicking the "TenderWin" sidebar.
* **0:30 - 1:30 (The Core Magic):** Show TenderWin autonomously scanning the document. Have the user click "Draft Answers." Show the text magically streaming into the Word document.
* **1:30 - 2:30 (The Airia Flex - MCP Apps):** Highlight the sidebar. Point out the interactive MCP Apps widget. Click a citation to show how TenderWin proves its work. Emphasize that *this* is why it's enterprise-ready (zero hallucinations).
* **2:30 - 3:15 (The Airia Flex - Agent Constraints):** Open the Airia Admin Dashboard. Show the judges the specific "Agent Constraint" you configured that prevents the agent from reading restricted HR files.
* **3:15 - 4:00 (The Teams Handoff & Conclusion):** Show the seamless handoff to MS Teams to get an engineer's approval, watch the Word doc update live, and conclude with the business impact (time saved, revenue won).

### Next Steps for Implementation:

1. **Set up the Airia Free Account:** Initialize the MCP Gateway and set up a dummy SharePoint/Notion integration.
2. **Build the Word Add-in Scaffold:** Use Yeoman generator for Office Add-ins (`yo office`) with React.
3. **Configure the Agent:** Use Airia's low-code builder to define the RFP extraction instructions and connect it to the Word API.