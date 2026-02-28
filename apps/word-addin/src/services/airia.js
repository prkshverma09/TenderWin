/**
 * Airia integration for TenderWin.
 * Uses VITE_AIRIA_PROXY_URL (preferred) or VITE_AIRIA_API_URL + VITE_AIRIA_API_KEY + VITE_AIRIA_AGENT_ID.
 * If none are set, returns mock data so the add-in works without Airia.
 */
const getEnv = (key) => typeof import.meta !== 'undefined' && import.meta.env?.[key] != null
    ? String(import.meta.env[key])
    : undefined;
function hasProxyConfig() {
    return !!getEnv('VITE_AIRIA_PROXY_URL');
}
function hasDirectConfig() {
    const url = getEnv('VITE_AIRIA_API_URL');
    const key = getEnv('VITE_AIRIA_API_KEY');
    const agentId = getEnv('VITE_AIRIA_AGENT_ID');
    return !!(url && key && agentId);
}
/**
 * Draft an RFP answer from document context.
 * Calls your proxy or the Airia API; if no env is set, returns mock data.
 */
export async function draftFromDocument(documentText) {
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
                const body = (await res.json());
                if (body.detail)
                    msg += ` — ${body.detail}`;
                else if (body.error && body.error !== msg)
                    msg = body.error;
            }
            catch {
                /* ignore */
            }
            throw new Error(msg);
        }
        return res.json();
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
        if (!res.ok)
            throw new Error(`Airia API error: ${res.status}`);
        const data = (await res.json());
        return {
            text: data.text ?? data.content ?? '',
            confidence: data.confidence,
            sources: data.sources?.map((s) => ({ title: s.title ?? '', snippet: s.snippet ?? '' })),
        };
    }
    // Mock when no Airia config (for local UI testing)
    return {
        text: '[Mock] Drafted answer based on your document. Set VITE_AIRIA_* in .env.local to use Airia.',
        confidence: 92,
        sources: [
            { title: 'Past proposal 2025 Q3', snippet: 'Matched with requirements document section 3.2' },
        ],
    };
}
/** True if Airia is configured (proxy or direct API). */
export function isAiriaConfigured() {
    return hasProxyConfig() || hasDirectConfig();
}
//# sourceMappingURL=airia.js.map