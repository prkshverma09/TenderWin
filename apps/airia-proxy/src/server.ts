/**
 * Minimal Airia proxy for the Word Add-in.
 * Accepts POST /airia with { documentText }, calls Airia API server-side, returns { text, confidence?, sources? }.
 * Use so the add-in avoids CORS (browser → this proxy → Airia).
 *
 * Env: AIRIA_API_URL, AIRIA_API_KEY, AIRIA_AGENT_ID (or VITE_AIRIA_* from add-in .env.local).
 * Loads ../word-addin/.env.local if present (same file as add-in).
 * Port: AIRIA_PROXY_PORT (default 3051).
 */
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const addinEnv = path.resolve(__dirname, '..', '..', 'word-addin', '.env.local');
config({ path: addinEnv });

const PORT = parseInt(process.env.AIRIA_PROXY_PORT ?? '3051', 10);

const baseUrl =
  process.env.AIRIA_API_URL ?? process.env.VITE_AIRIA_API_URL ?? 'https://api.airia.ai';
const apiKey =
  process.env.AIRIA_API_KEY ?? process.env.VITE_AIRIA_API_KEY ?? '';
const agentId =
  process.env.AIRIA_AGENT_ID ?? process.env.VITE_AIRIA_AGENT_ID ?? '';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Allow add-in (localhost:3050) and other common origins
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.get('/', (_req, res) => res.json({ ok: true, service: 'airia-proxy', port: PORT }));
app.options('/airia', (_req, res) => res.sendStatus(204));

app.post('/airia', async (req, res) => {
  if (!apiKey || !agentId) {
    res.status(500).json({
      error: 'Missing AIRIA_API_KEY or AIRIA_AGENT_ID (or VITE_*). Set env or load from add-in .env.local.',
    });
    return;
  }
  const documentText = req.body?.documentText ?? '';
  const pathTemplate =
    process.env.AIRIA_INVOKE_PATH ?? process.env.VITE_AIRIA_INVOKE_PATH ?? '/v1/PipelineExecution/Multipart/{agentId}';
  const invokePath = pathTemplate.replace(/\{agentId\}/g, agentId).replace(/\/\/+/g, '/');
  const invokeUrl = `${baseUrl.replace(/\/$/, '')}${invokePath.startsWith('/') ? '' : '/'}${invokePath}`;
  const authType = (process.env.AIRIA_AUTH_TYPE ?? process.env.VITE_AIRIA_AUTH_TYPE ?? 'X-API-Key').toLowerCase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authType === 'bearer') {
    headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
  } else {
    headers['X-API-Key'] = apiKey;
  }
  try {
    const out = await fetch(invokeUrl, {
      method: 'POST',
      headers,
      // v2 PipelineExecution expects UserInput (not message)
    body: JSON.stringify({ UserInput: documentText }),
    });
    if (!out.ok) {
      let body: string | undefined;
      try {
        body = await out.text();
      } catch {
        body = undefined;
      }
      const detail = body ? (body.slice(0, 200) + (body.length > 200 ? '...' : '')) : undefined;
      res.status(out.status).json({
        error: `Airia API error: ${out.status}`,
        ...(detail && { detail }),
      });
      return;
    }
    const raw = (await out.json()) as unknown;
    let text = '';
    let confidence: number | undefined;
    let sources: Array<{ title: string; snippet: string }> | undefined;

    const extractTextFromArray = (arr: unknown[]): string => {
      const parts: string[] = [];
      for (const s of arr) {
        if (!s || typeof s !== 'object') continue;
        const o = s as Record<string, unknown>;
        const v = (o.Value ?? o.value) as string | undefined;
        if (typeof v === 'string' && v.trim()) parts.push(v.trim());
        else if (o.$type === 'model' || o.StepType === 'AIOperation') {
          for (const key of ['Value', 'value', 'Content', 'content', 'Text', 'text']) {
            if (typeof o[key] === 'string' && (o[key] as string).length > 20) {
              parts.push((o[key] as string).trim());
              break;
            }
          }
        }
      }
      return parts.join('\n\n');
    };

    if (Array.isArray(raw)) {
      text = extractTextFromArray(raw);
    } else if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      if (typeof obj.result === 'string') text = obj.result;
      else if (obj.text != null && typeof obj.text === 'string') text = obj.text;
      else if (obj.content != null && typeof obj.content === 'string') text = obj.content;
      else if (Array.isArray(obj.result)) text = extractTextFromArray(obj.result);
      else if (Array.isArray(obj.value)) text = extractTextFromArray(obj.value);
      else if (Array.isArray(obj.steps)) text = extractTextFromArray(obj.steps);
      else if (obj.result != null && typeof obj.result === 'object' && !Array.isArray(obj.result)) {
        const res = obj.result as Record<string, unknown>;
        if (typeof res.text === 'string') text = res.text;
        else if (typeof res.content === 'string') text = res.content;
        else if (Array.isArray(res.value)) text = extractTextFromArray(res.value);
      }
      if (obj.confidence != null && typeof obj.confidence === 'number') confidence = obj.confidence;
      if (obj.report != null && typeof obj.report === 'object' && (obj.report as Record<string, unknown>).confidence != null) {
        confidence = (obj.report as { confidence: number }).confidence;
      }
      if (Array.isArray(obj.sources)) {
        sources = obj.sources.map((s: { title?: string; snippet?: string }) => ({
          title: s?.title ?? '',
          snippet: s?.snippet ?? '',
        }));
      }
    }

    res.json({
      text,
      confidence,
      sources,
    });
  } catch (e) {
    console.error('[airia-proxy]', e);
    res.status(502).json({ error: String(e instanceof Error ? e.message : e) });
  }
});

app.listen(PORT, () => {
  console.log(`Airia proxy listening on http://localhost:${PORT} (POST /airia)`);
  if (!apiKey || !agentId) {
    console.warn('Warn: AIRIA_API_KEY or AIRIA_AGENT_ID not set. Set env or load add-in .env.local.');
  }
});
