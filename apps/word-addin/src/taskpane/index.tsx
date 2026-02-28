import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

// Expose Vite env for Ping Expert (Teams Bot URL) so App can read it without import.meta in Jest
if (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, unknown> }).env?.VITE_TEAMS_BOT_URL != null) {
  (globalThis as unknown as { __VITE_TEAMS_BOT_URL__?: string }).__VITE_TEAMS_BOT_URL__ = String((import.meta as { env: Record<string, unknown> }).env.VITE_TEAMS_BOT_URL);
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}