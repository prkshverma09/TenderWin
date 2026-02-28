/**
 * Airia integration for TenderWin.
 * Uses VITE_AIRIA_PROXY_URL (preferred) or VITE_AIRIA_API_URL + VITE_AIRIA_API_KEY + VITE_AIRIA_AGENT_ID.
 * If none are set, returns mock data so the add-in works without Airia.
 */
export interface DraftResult {
    text: string;
    confidence?: number;
    sources?: Array<{
        title: string;
        snippet: string;
    }>;
}
/**
 * Draft an RFP answer from document context.
 * Calls your proxy or the Airia API; if no env is set, returns mock data.
 */
export declare function draftFromDocument(documentText: string): Promise<DraftResult>;
/** True if Airia is configured (proxy or direct API). */
export declare function isAiriaConfigured(): boolean;
//# sourceMappingURL=airia.d.ts.map