# Adding your custom MCP servers (SharePoint & Salesforce) in Airia

Your TenderWin MCP gateway exposes two servers at `https://YOUR_NGROK_URL/sharepoint` and `https://YOUR_NGROK_URL/salesforce`. Airia’s docs describe adding these as **remote MCP servers** (by URL), not from the catalog.

## Where to add them in the UI

**Look for the "Connect to Custom MCP Server" modal**—that is where you add by URL. Do not use "Create new deployment" (catalog only).

**Use the Tools Library, not “AI Model → MCP Servers → Create new deployment”.**

1. Go to your **Tools Library** (project-level **Tools** in the sidebar).
2. In the modal: enter the **URL**. Leave **Credential type** as Custom Headers with Key/Value empty unless your gateway needs auth. Click **Connect MCP Server**. (If you see a different entry point, look for **“Add Remote MCP Server”** (or similar: “Add by URL”, “Custom MCP”, “Remote MCP”).
3. Use that to add each URL:
   - `https://YOUR_NGROK_URL/sharepoint`
   - `https://YOUR_NGROK_URL/salesforce`
   - https://vexillate-unconfusably-dana.ngrok-free.dev/sharepoint
   - https://vexillate-unconfusably-dana.ngrok-free.dev/salesforce
4. After adding, fetch the tools and add them to your project. Then attach those tools to your TenderWin agent (e.g. from the agent’s Tools / MCP section).

Reference: [Custom MCP Servers](https://explore.airia.com/integrations/Tools/add-a-mcp-server) and [Extend Agents with MCP](https://explore.airia.com/integrations/Tools/mcp).

## If your UI doesn’t show “Add Remote MCP Server”

- Try **Tools → Create New Tool** and look for an option like “Remote MCP” or “Custom URL”.
- Or go to **Gateway → MCP Gateway → Server Management** and see if there is an “Add custom server” or “Add by URL” option (the doc mentions a catalog of 175+ apps; custom URL may be in the same area).
- Airia’s layout can differ by plan or version; if you still don’t see it, ask in the [hackathon Discord](https://airia-hackathon.devpost.com/) or contact Airia support.

## API for adding MCP servers

**There is no documented public REST API** in the Airia docs for registering MCP servers by URL. The [Airia API docs](https://api.airia.ai/docs/) and the [Explore OpenAPI index](https://explore.airia.com/api-reference/openapi.json) do not expose an endpoint for “create MCP deployment” or “register remote MCP server”. Adding custom MCP servers is done through the UI (Tools Library → Add Remote MCP Server) or via an undocumented/private API. For an API-based workflow, you’d need to ask Airia (support or hackathon) whether they have a non-public API or plan to add one.
