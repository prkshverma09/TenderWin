/**
 * MCP HTTP Gateway – exposes SharePoint and Salesforce MCP servers over HTTP
 * for Airia (or any MCP client) to connect via Streamable HTTP transport.
 *
 * Endpoints:
 *   POST/GET /sharepoint  – SharePoint MCP (past proposals)
 *   POST/GET /salesforce  – Salesforce MCP (client context)
 *
 * Run: npm run dev   (or npm run start after build)
 * Port: 3100 (or MCP_GATEWAY_PORT)
 */
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SharePointServer } from '@tenderwin/mcp-sharepoint';
import { createServer as createSalesforceServer } from '@tenderwin/mcp-salesforce';

const PORT = parseInt(process.env.MCP_GATEWAY_PORT ?? '3100', 10);

const app = express();
app.use(express.json({ limit: '1mb' }));

function defaultSessionIdGenerator(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

// Stateless: each request gets a new transport and server instance
async function handleSharePoint(req: express.Request, res: express.Response) {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: defaultSessionIdGenerator });
  const mcp = new SharePointServer();
  await mcp.server.connect(transport as Parameters<SharePointServer['server']['connect']>[0]);
  await transport.handleRequest(req, res, req.body as Record<string, unknown>);
}

async function handleSalesforce(req: express.Request, res: express.Response) {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: defaultSessionIdGenerator });
  const server = createSalesforceServer();
  await server.connect(transport as Parameters<ReturnType<typeof createSalesforceServer>['connect']>[0]);
  await transport.handleRequest(req, res, req.body as Record<string, unknown>);
}

app.all('/sharepoint', (req, res) => handleSharePoint(req, res).catch((err) => {
  console.error('[SharePoint MCP]', err);
  res.status(500).json({ error: String(err?.message ?? err) });
}));

app.all('/salesforce', (req, res) => handleSalesforce(req, res).catch((err) => {
  console.error('[Salesforce MCP]', err);
  res.status(500).json({ error: String(err?.message ?? err) });
}));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mcp: ['sharepoint', 'salesforce'] });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP Gateway listening on http://0.0.0.0:${PORT}`);
  console.log(`  SharePoint MCP: http://localhost:${PORT}/sharepoint`);
  console.log(`  Salesforce MCP:  http://localhost:${PORT}/salesforce`);
  console.log(`  Health:          http://localhost:${PORT}/health`);
});

server.on('error', (err: Error & { code?: string }) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Either:`);
    console.error(`  1. Stop the other process: lsof -i :${PORT}  then  kill <PID>`);
    console.error(`  2. Use another port: MCP_GATEWAY_PORT=3101 npm run mcp:gateway\n`);
  }
  throw err;
});
