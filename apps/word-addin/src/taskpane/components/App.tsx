import React, { useState } from 'react';
import { draftFromDocument, type DraftResult } from '../../services/airia';
import { getDocumentText, insertTextAtSelection } from '../document';

const App: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [citation, setCitation] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDraftAnswers = async () => {
    setError(null);
    setLoading(true);
    try {
      const documentText = await getDocumentText();
      const result = await draftFromDocument(documentText);
      await insertTextAtSelection(result.text);
      setCitation(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const isFailedToFetch = /failed to fetch|network error|cors/i.test(message);
      setError(
        isFailedToFetch
          ? 'Request to Airia failed (often CORS when calling from localhost). Use a backend proxy (VITE_AIRIA_PROXY_URL) or run the add-in from an HTTPS host that Airia allows.'
          : message
      );
      console.error(e);
      // Fallback insert so user sees something
      await insertTextAtSelection(`[Error: ${message}]`);
    } finally {
      setLoading(false);
    }
  };

  const handleCitationClick = () => {
    setShowDetails(!showDetails);
  };

  const confidence = citation?.confidence ?? 95;
  const sources = citation?.sources ?? [{ title: 'MCP App Mock Data', snippet: 'Matched with requirements document section 3.2' }];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>TenderWin Word Add-in</h1>

      {error && (
        <div style={{ marginBottom: '12px', padding: '8px', background: '#fee', borderRadius: '4px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
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
      </div>

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
