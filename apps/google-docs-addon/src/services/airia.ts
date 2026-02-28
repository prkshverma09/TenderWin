/**
 * Airia integration for TenderWin Google Docs Add-on.
 * Same contract as Word add-in: VITE_AIRIA_PROXY_URL or VITE_AIRIA_API_*.
 * If none are set, returns mock data.
 */

export interface DraftResult {
  text: string;
  confidence?: number;
  sources?: Array<{ title: string; snippet: string }>;
}

const getEnv = (key: string): string | undefined =>
  typeof import.meta !== 'undefined' && import.meta.env?.[key] != null
    ? String(import.meta.env[key])
    : undefined;

function hasProxyConfig(): boolean {
  return !!getEnv('VITE_AIRIA_PROXY_URL');
}

function hasDirectConfig(): boolean {
  const url = getEnv('VITE_AIRIA_API_URL');
  const key = getEnv('VITE_AIRIA_API_KEY');
  const agentId = getEnv('VITE_AIRIA_AGENT_ID');
  return !!(url && key && agentId);
}

/**
 * Draft an RFP answer from document context.
 */
export async function draftFromDocument(documentText: string): Promise<DraftResult> {
  const proxyUrl = getEnv('VITE_AIRIA_PROXY_URL');
  if (proxyUrl) {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText }),
    });
    if (!res.ok) {
      let msg = `Airia proxy error: ${res.status}`;
      try {
        const body = (await res.json()) as { error?: string; detail?: string };
        if (body.detail) msg += ` — ${body.detail}`;
        else if (body.error && body.error !== msg) msg = body.error;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    return res.json() as Promise<DraftResult>;
  }

  const baseUrl = getEnv('VITE_AIRIA_API_URL');
  const apiKey = getEnv('VITE_AIRIA_API_KEY');
  const agentId = getEnv('VITE_AIRIA_AGENT_ID');
  if (baseUrl && apiKey && agentId) {
    const invokeUrl = `${baseUrl.replace(/\/$/, '')}/v1/PipelineExecution/Multipart/${agentId}`;
    const res = await fetch(invokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ message: documentText }),
    });
    if (!res.ok) throw new Error(`Airia API error: ${res.status}`);
    const data = (await res.json()) as { text?: string; content?: string; confidence?: number; sources?: Array<{ title?: string; snippet?: string }> };
    return {
      text: data.text ?? data.content ?? '',
      confidence: data.confidence,
      sources: data.sources?.map((s) => ({ title: s.title ?? '', snippet: s.snippet ?? '' })),
    };
  }

  return {
    text: '[Mock] Drafted answer based on your document. Set VITE_AIRIA_* to use Airia.',
    confidence: 92,
    sources: [
      { title: 'Past proposal 2025 Q3', snippet: 'Matched with requirements document section 3.2' },
    ],
  };
}

export function isAiriaConfigured(): boolean {
  return hasProxyConfig() || hasDirectConfig();
}
