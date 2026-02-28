/**
 * Integration tests for the MCP Gateway.
 * Requires the gateway to be running (e.g. npm run dev in mcp-gateway, or MCP_GATEWAY_PORT=3100).
 * Optional: set MCP_GATEWAY_API_KEY to test unauthorized (401) vs authorized (200).
 */

const BASE =
  process.env.MCP_GATEWAY_PORT != null
    ? `http://localhost:${process.env.MCP_GATEWAY_PORT}`
    : 'http://localhost:3100';

const API_KEY = process.env.MCP_GATEWAY_API_KEY;

describe('MCP Gateway integration', () => {
  describe('GET /health', () => {
    it('returns 200 with status ok and mcp array', async () => {
      const opts: RequestInit = {};
      if (API_KEY) {
        (opts as any).headers = { 'X-API-Key': API_KEY };
      }
      const res = await fetch(`${BASE}/health`, opts);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { status?: string; mcp?: string[] };
      expect(data.status).toBe('ok');
      expect(Array.isArray(data.mcp)).toBe(true);
      expect(data.mcp).toContain('sharepoint');
      expect(data.mcp).toContain('salesforce');
    });
  });

  describe('POST /sharepoint', () => {
    it('routes request and returns 200 or 400 (MCP may require initialize first)', async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      };
      if (API_KEY) headers['X-API-Key'] = API_KEY;
      const body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      };
      const res = await fetch(`${BASE}/sharepoint`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      expect([200, 400]).toContain(res.status);
      const data = (await res.json()) as { result?: { tools?: unknown[] }; error?: unknown };
      if (res.status === 200) {
        expect(data.error).toBeUndefined();
        expect(data.result?.tools).toBeDefined();
      }
    });

    it('routes tool call and returns 200 or 400', async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      };
      if (API_KEY) headers['X-API-Key'] = API_KEY;
      const body = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'search_proposals', arguments: { query: 'Cloud' } },
      };
      const res = await fetch(`${BASE}/sharepoint`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        const data = (await res.json()) as { result?: { content?: unknown[] }; error?: unknown };
        expect(data.error).toBeUndefined();
        expect(data.result?.content).toBeDefined();
      }
    });
  });

  describe('POST /salesforce', () => {
    it('routes request and returns 200 or 400 (MCP may require initialize first)', async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      };
      if (API_KEY) headers['X-API-Key'] = API_KEY;
      const body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      };
      const res = await fetch(`${BASE}/salesforce`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      expect([200, 400]).toContain(res.status);
      const data = (await res.json()) as { result?: { tools?: unknown[] }; error?: unknown };
      if (res.status === 200) {
        expect(data.error).toBeUndefined();
        expect(data.result?.tools).toBeDefined();
      }
    });
  });

  describe('optional API key (when MCP_GATEWAY_API_KEY is set)', () => {
    it('returns 401 for POST /sharepoint without X-API-Key when API key is set', async () => {
      if (!API_KEY) {
        return; // skip when no key configured
      }
      const res = await fetch(`${BASE}/sharepoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
      });
      expect(res.status).toBe(401);
    });

    it('returns 200 for POST /sharepoint with correct X-API-Key when API key is set', async () => {
      if (!API_KEY) {
        return;
      }
      const res = await fetch(`${BASE}/sharepoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
      });
      expect(res.status).toBe(200);
    });
  });
});
