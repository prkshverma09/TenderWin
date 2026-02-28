# MCP Tools Reference

This document describes each **Model Context Protocol (MCP)** tool and resource implemented in the TenderWin project. These tools are used by the Airia agent to search past proposals (SharePoint) and retrieve client context (Salesforce) when drafting RFP answers in the Word add-in.

---

## Overview

| Package / Server   | Location                    | Purpose |
|--------------------|-----------------------------|--------|
| **SharePoint MCP**  | `packages/mcp-sharepoint`   | Search and read past proposals (titles, client, content). |
| **Salesforce MCP**  | `packages/mcp-salesforce`   | Fetch Account and Opportunity data, and client context. |

Both servers are exposed over HTTP by the **MCP Gateway** (`apps/mcp-gateway`) at:

- **SharePoint:** `http://localhost:3100/sharepoint` (or your ngrok/deployed URL + `/sharepoint`)
- **Salesforce:** `http://localhost:3100/salesforce` (or your ngrok/deployed URL + `/salesforce`)

If **`MCP_GATEWAY_API_KEY`** is set (see root `.env.example`), the gateway requires the **`X-API-Key`** header on requests to `/sharepoint` and `/salesforce`; `GET /health` remains open. When registering these URLs in Airia, configure the API key if your gateway uses it.

The Airia agent connects to these URLs as **Custom MCP Servers** and calls the tools when the user clicks **Draft Answers** in the Word add-in.

### Data files (JSON)

All tool data is stored as JSON under each package’s **`data/`** directory and loaded at server startup:

| Package              | File(s)                                                                 | Description |
|----------------------|-------------------------------------------------------------------------|--------------|
| `mcp-sharepoint`     | `packages/mcp-sharepoint/data/proposals.json`                           | 20 past proposals (`id`, `title`, `client`, `date`, `content`). Fallback: 2-item in-code list if file missing. |
| `mcp-salesforce`     | `packages/mcp-salesforce/data/accounts.json`                            | 19 accounts (id, name, industry, website, billing, revenue, employees, description). Fallback: empty array. |
| `mcp-salesforce`     | `packages/mcp-salesforce/data/opportunities.json`                      | 22 opportunities (id, accountId, name, amount, stageName, closeDate, probability, description). Fallback: empty array. |
| `mcp-salesforce`     | `packages/mcp-salesforce/data/client-context.json`                     | 7 client-context profiles (id, name, version, description, project, environment). Fallback: single default profile. |

Paths are resolved relative to the package (e.g. when the server runs from `dist/`, it loads `../data/<file>.json`). You can edit these JSON files to add or change data without changing code.

---

## 1. SharePoint MCP (`@tenderwin/mcp-sharepoint`)

Server name: `sharepoint-mcp` (version 1.0.0).  
Capabilities: **tools** and **resources**.

### 1.1 Tool: `search_proposals`

**Purpose:** Search past proposals stored in SharePoint by a free-text query. Used by the Airia agent to find relevant past proposals (by title, client name, or content) when drafting an RFP answer.

**Input schema:**

| Argument | Type   | Required | Description |
|----------|--------|----------|-------------|
| `query`  | string | Yes      | Search term matched against proposal **title**, **client**, and **content** (case-insensitive). |

**Where the data lives:** Proposals are loaded from **`packages/mcp-sharepoint/data/proposals.json`** at server startup. The file contains **20 realistic past proposals** (e.g. Cloud Migration, Data Center Upgrade, FedRAMP, Healthcare HIPAA, Financial Services, Retail, Manufacturing, Legal, etc.) with `id`, `title`, `client`, `date`, and `content`. If the file is missing or invalid, the server falls back to a **2-item in-code list** (Cloud Migration Proposal, Data Center Upgrade) so it still starts.

**Behavior:**

- The server filters the loaded list where the `query` string appears (case-insensitive) in:
  - `title`
  - `client`
  - `content`
- Returns a JSON array of matching proposals.

**Output:**

- MCP response `content` with `type: "text"` and a JSON string of the matching proposals. Each proposal has:
  - `id` – proposal ID
  - `title` – proposal title
  - `client` – client name
  - `date` – date string
  - `content` – snippet or full content

**Example (conceptual):**

- **Input:** `{ "query": "cloud migration" }`
- **Output:** Array of proposals whose title, client, or content contains “cloud migration”.

**Current implementation note:** Data is **realistic JSON** (20 proposals). For production, replace the file load with real SharePoint/Graph API calls.

---

### 1.2 Resources (SharePoint)

The SharePoint server also exposes **resources** (list + read), so an MCP client can list and read proposal documents by URI.

#### List resources

- **Handler:** `ListResourcesRequestSchema`
- **Returns:** A list of resource descriptors:
  - **URI:** `sharepoint://proposals/{id}` (e.g. `sharepoint://proposals/1`)
  - **name:** e.g. `SharePoint Proposal: Cloud Migration Proposal`
  - **description:** e.g. `Past proposal for TechCorp on 2025-01-15`
  - **mimeType:** `application/json`

#### Read resource

- **Handler:** `ReadResourceRequestSchema`
- **Input:** `uri` – must match `sharepoint://proposals/{id}`.
- **Behavior:** Looks up the proposal by `id` in the same loaded list (from `data/proposals.json`) used by `search_proposals`.
- **Returns:** JSON object for that proposal (`id`, `title`, `client`, `date`, `content`).
- **Errors:** Invalid URI format or unknown `id` returns an MCP error.

---

## 2. Salesforce MCP (`@tenderwin/mcp-salesforce`)

Server name: `mcp-salesforce` (version 1.0.0).  
Capabilities: **tools** only.

**Where the data lives:** All data is loaded from JSON files under **`packages/mcp-salesforce/data/`** at server startup:

- **`accounts.json`** – 19 accounts (TechCorp, GlobalNet, FinServe, MedData, RetailMax, etc.) with `id`, `name`, `industry`, `website`, `phone`, `billingCity`, `billingCountry`, `annualRevenue`, `numberOfEmployees`, `description`.
- **`opportunities.json`** – 22 opportunities linked to accounts by `accountId`, with `id`, `name`, `amount`, `stageName`, `closeDate`, `probability`, `description`.
- **`client-context.json`** – 7 client-context profiles (`test-client`, `default`, `e2e`, `airia-demo`, `techcorp`, `finserve`, `meddata`) with `id`, `name`, `version`, `description`, `project`, `environment`.

If a file is missing, the server uses a minimal fallback (empty arrays for accounts/opportunities; a single default profile for client-context) so it still starts.

### 2.1 Tool: `fetch_account`

**Purpose:** Fetch Account data from Salesforce for a given Account ID. Used to pull client/account details when the agent needs context about the RFP issuer or related account.

**Input schema:**

| Argument | Type   | Required | Description |
|----------|--------|----------|-------------|
| `id`     | string | Yes      | Salesforce Account ID. |

**Behavior:**

- Accepts an Account `id` (string). Looks up the account in `data/accounts.json`.
- If found: returns the full account object (`id`, `name`, `industry`, `website`, `phone`, `billingCity`, `billingCountry`, `annualRevenue`, `numberOfEmployees`, `description`).
- If not found: returns a fallback `{ id, name: "Mock Account {id}" }`.

**Output:**

- MCP response `content` with `type: "text"` and a JSON string (full account or fallback).

**Current implementation note:** Data comes from **`data/accounts.json`** (19 accounts). Unknown IDs return a fallback object. For production, wire to the Salesforce REST/Composite API.

---

### 2.2 Tool: `fetch_opportunity`

**Purpose:** Fetch Opportunity data from Salesforce for a given Opportunity ID. Used when the agent needs deal/opportunity context (e.g. value, stage) related to the RFP.

**Input schema:**

| Argument | Type   | Required | Description |
|----------|--------|----------|-------------|
| `id`     | string | Yes      | Salesforce Opportunity ID. |

**Behavior:**

- Accepts an Opportunity `id` (string). Looks up the opportunity in `data/opportunities.json`.
- If found: returns the full opportunity object (`id`, `accountId`, `name`, `amount`, `stageName`, `closeDate`, `probability`, `description`).
- If not found: returns a fallback `{ id, amount: 10000 }`.

**Output:**

- MCP response `content` with `type: "text"` and a JSON string (full opportunity or fallback).

**Current implementation note:** Data comes from **`data/opportunities.json`** (22 opportunities). Unknown IDs return a fallback. For production, connect to the Salesforce Opportunity API.

---

### 2.3 Tool: `get_client_context`

**Purpose:** Get the “client context” that the server has extracted or received (e.g. client name, version, or other metadata). Used by the agent to understand which client or application is calling, for personalization or scoping.

**Input schema:**

| Argument | Type   | Required | Description |
|----------|--------|----------|-------------|
| `id`     | string | No       | Client context profile id (e.g. `test-client`, `default`, `airia-demo`). If omitted, returns `test-client` profile. |

**Behavior:**

- Looks up the profile in `data/client-context.json` by `id`. If `id` is omitted (or from `request.params._meta.clientId`), defaults to `test-client`.
- Returns the full profile object: `id`, `name`, `version`, `description`, `project`, `environment`.

**Output:**

- MCP response `content` with `type: "text"` and a JSON string of the selected client-context profile.

**Current implementation note:** Data comes from **`data/client-context.json`** (7 profiles). A production version could derive context from the MCP client or session.

---

## 3. How These Tools Are Used in TenderWin

1. **User action:** In the Word add-in, the user selects RFP text (or uses the full document) and clicks **Draft Answers**.
2. **Add-in:** Sends the document text to the Airia proxy, which calls the Airia API (v2 PipelineExecution) with that text as `UserInput`.
3. **Airia agent:** The TenderWin agent (with instructions to use “connected tools”) may:
   - Call **`search_proposals`** with a query derived from the RFP (e.g. “data encryption”, “compliance”) to find relevant past proposals.
   - Call **`get_client_context`** to get client/project context.
   - Optionally call **`fetch_account`** or **`fetch_opportunity`** if it has IDs (e.g. from context or the RFP).
4. **Response:** The agent drafts an answer (and optional citations) and returns it; the add-in inserts the draft and shows the citation widget.

The MCP Gateway must be running (and exposed via ngrok or similar when using Airia in the cloud) and the two custom MCP servers (SharePoint and Salesforce) must be added in Airia’s **Connect to Custom MCP Server** flow using the gateway URLs above. See [E2E_SETUP_AND_TEST_WITH_AIRIA.md](../E2E_SETUP_AND_TEST_WITH_AIRIA.md) and [AIRIA_ADD_CUSTOM_MCP.md](AIRIA_ADD_CUSTOM_MCP.md) for setup.

---

## 4. Summary Table

| Server     | Tool / Resource           | Input                    | Output / Purpose |
|-----------|---------------------------|--------------------------|------------------|
| SharePoint | **search_proposals**     | `query` (string)         | JSON array of proposals matching the query (title, client, content). |
| SharePoint | **Resources**            | List: — ; Read: `uri`    | List proposal URIs; read one proposal by `sharepoint://proposals/{id}`. |
| Salesforce | **fetch_account**       | `id` (string)            | JSON: Account from data/accounts.json (19 accounts). |
| Salesforce | **fetch_opportunity**    | `id` (string)            | JSON: Opportunity from data/opportunities.json (22 opportunities). |
| Salesforce | **get_client_context**   | `id` (optional)          | JSON: Client context profile from data/client-context.json (7 profiles). |

All tools load **realistic data from JSON** in each package’s **`data/`** folder. Replacing these with real SharePoint and Salesforce API calls (with proper authentication and env configuration) is required for production use.
