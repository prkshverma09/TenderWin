/**
 * Handoff to Teams expert for review/approval of draft text.
 * POST /api/handoff to request handoff, GET /api/handoff/status?sessionId= to poll.
 */

export type HandoffStatus = 'pending' | 'approved' | 'rejected';

export interface HandoffStatusResponse {
  status: HandoffStatus;
  expertReply?: string;
}

/**
 * Request handoff: POST to baseUrl/api/handoff with sessionId, optional question, draftText.
 */
export async function requestHandoff(
  baseUrl: string,
  sessionId: string,
  question?: string,
  draftText?: string
): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/handoff`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, question, draftText }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Handoff request failed: ${res.status}${body ? ` — ${body}` : ''}`);
  }
}

/**
 * Poll handoff status: GET baseUrl/api/handoff/status?sessionId=...
 */
export async function getHandoffStatus(
  baseUrl: string,
  sessionId: string
): Promise<HandoffStatusResponse> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/handoff/status?sessionId=${encodeURIComponent(sessionId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Handoff status failed: ${res.status}${body ? ` — ${body}` : ''}`);
  }
  return res.json() as Promise<HandoffStatusResponse>;
}
