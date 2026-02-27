import React, { useState } from 'react';

const App: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);

  const handleDraftAnswers = () => {
    // Draft answers logic here
    console.log('Draft Answers clicked');
    try {
      // @ts-ignore
      Office.context.document.body.insertText('Mocked text');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCitationClick = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>TenderWin Word Add-in</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleDraftAnswers}
          style={{
            padding: '10px 15px',
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Draft Answers
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
          backgroundColor: '#f9f9f9'
        }}
      >
        <h3>Citation Widget</h3>
        <p><strong>Confidence Score:</strong> 95%</p>
        
        {showDetails && (
          <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
            <p><strong>Source Data:</strong> MCP App Mock Data</p>
            <p>Matched with requirements document section 3.2</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
