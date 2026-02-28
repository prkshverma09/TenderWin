import React, { useState, useRef } from 'react';
import { draftFromDocument, type DraftResult } from '../services/airia';
import { requestHandoff, getHandoffStatus } from '../services/handoff';
import { getDocumentText, insertTextAtSelection } from '../services/document';

const POLL_INTERVAL_MS = 2500;

function getSlackBotUrl(): string {
  const fromGlobal = (globalThis as unknown as { __VITE_SLACK_BOT_URL__?: string }).__VITE_SLACK_BOT_URL__;
  if (typeof fromGlobal === 'string' && fromGlobal) return fromGlobal;
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SLACK_BOT_URL != null) {
    return String(import.meta.env.VITE_SLACK_BOT_URL);
  }
  return '';
}

const App: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [citation, setCitation] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);
  const [lastDraftText, setLastDraftText] = useState('');
  const handoffPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasDraftContext = Boolean(citation?.text || lastDraftText);
  const draftTextForHandoff = citation?.text ?? lastDraftText ?? '';

  const handleDraftAnswers = async () => {
    setError(null);
    setLoading(true);
    try {
      const documentText = await getDocumentText();
      const result = await draftFromDocument(documentText);
      setLastDraftText(result.text);
      await insertTextAtSelection(result.text);
      setCitation(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const isFailedToFetch = /failed to fetch|network error|cors/i.test(message);
      setError(
        isFailedToFetch
          ? 'Request to Airia failed. Use a backend proxy (VITE_AIRIA_PROXY_URL) or run from an HTTPS host that Airia allows.'
          : message
      );
      console.error(e);
      await insertTextAtSelection(`[Error: ${message}]`);
    } finally {
      setLoading(false);
    }
  };

  const handleCitationClick = () => {
    setShowDetails(!showDetails);
  };

  const stopPolling = () => {
    if (handoffPollRef.current) {
      clearInterval(handoffPollRef.current);
      handoffPollRef.current = null;
    }
  };

  const handlePingExpert = async () => {
    const baseUrl = getSlackBotUrl();
    if (!baseUrl) {
      setError('VITE_SLACK_BOT_URL is not set.');
      return;
    }
    setError(null);
    setHandoffMessage('Waiting for expert…');
    const sessionId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36);
    const question: string | undefined = undefined;
    try {
      await requestHandoff(baseUrl, sessionId, question, draftTextForHandoff);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setHandoffMessage(null);
      setError(`Handoff request failed: ${message}`);
      return;
    }
    handoffPollRef.current = setInterval(async () => {
      try {
        const statusRes = await getHandoffStatus(baseUrl, sessionId);
        if (statusRes.status === 'approved') {
          stopPolling();
          const textToInsert = statusRes.expertReply ?? draftTextForHandoff;
          await insertTextAtSelection(textToInsert);
          setHandoffMessage('Expert approved.');
        } else if (statusRes.status === 'rejected') {
          stopPolling();
          setHandoffMessage('Expert declined.');
        }
      } catch (e) {
        stopPolling();
        const message = e instanceof Error ? e.message : String(e);
        setHandoffMessage(null);
        setError(`Handoff status failed: ${message}`);
      }
    }, POLL_INTERVAL_MS);
  };

  React.useEffect(() => () => stopPolling(), []);

  const confidence = citation?.confidence ?? 95;
  const sources = citation?.sources ?? [{ title: 'MCP App Mock Data', snippet: 'Matched with requirements document section 3.2' }];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>TenderWin Google Docs Add-on</h1>

      {error && (
        <div style={{ marginBottom: '12px', padding: '8px', background: '#fee', borderRadius: '4px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleDraftAnswers}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: loading ? '#ccc' : '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Drafting…' : 'Draft Answers'}
        </button>
        <button
          onClick={handlePingExpert}
          disabled={!hasDraftContext || !!handoffMessage}
          style={{
            padding: '10px 15px',
            backgroundColor: !hasDraftContext || handoffMessage ? '#ccc' : '#106ebe',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !hasDraftContext || handoffMessage ? 'not-allowed' : 'pointer',
          }}
        >
          Ping Expert
        </button>
      </div>
      {handoffMessage && (
        <div style={{ marginBottom: '12px', padding: '8px', background: '#e8f4fd', borderRadius: '4px', fontSize: '14px' }}>
          {handoffMessage}
        </div>
      )}

      <div
        data-testid="citation-widget"
        onClick={handleCitationClick}
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          borderRadius: '4px',
          cursor: 'pointer',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3>Citation Widget</h3>
        <p><strong>Confidence Score:</strong> {confidence}%</p>

        {showDetails && (
          <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
            <p><strong>Source Data:</strong> {sources[0]?.title ?? 'MCP App Mock Data'}</p>
            <p>{sources[0]?.snippet ?? 'Matched with requirements document section 3.2'}</p>
          </div>
        )}
      </div>
      {citation?.text != null && citation.text !== '' && (
        <div style={{ marginTop: '12px', padding: '10px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#fafafa', fontSize: '14px' }}>
          <strong>Drafted answer:</strong>
          <p data-testid="draft-result-text" style={{ marginTop: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{citation.text}</p>
        </div>
      )}
    </div>
  );
};

export default App;
