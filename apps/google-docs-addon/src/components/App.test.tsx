import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import App from './App';

vi.mock('../services/airia', () => ({
  draftFromDocument: vi.fn().mockResolvedValue({
    text: 'Mocked text',
    confidence: 92,
    sources: [{ title: 'MCP App Mock Data', snippet: 'Matched with requirements document section 3.2' }],
  }),
}));

vi.mock('../services/document', () => ({
  getDocumentText: vi.fn().mockResolvedValue('Sample RFP section text'),
  insertTextAtSelection: vi.fn().mockResolvedValue(undefined),
}));

const mockRequestHandoff = vi.fn();
const mockGetHandoffStatus = vi.fn();
vi.mock('../services/handoff', () => ({
  requestHandoff: (...args: unknown[]) => mockRequestHandoff(...args),
  getHandoffStatus: (...args: unknown[]) => mockGetHandoffStatus(...args),
}));

describe('App Component', () => {
  beforeEach(() => {
    cleanup();
    mockRequestHandoff.mockReset();
    mockGetHandoffStatus.mockReset();
  });

  it('renders without crashing', () => {
    render(<App />);
  });

  it('contains a Draft Answers button', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /draft answers/i });
    expect(button).toBeInTheDocument();
  });

  it('calls insertTextAtSelection when Draft Answers is clicked', async () => {
    const { insertTextAtSelection } = await import('../services/document');
    render(<App />);
    const button = screen.getByRole('button', { name: /draft answers/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(insertTextAtSelection).toHaveBeenCalledWith('Mocked text');
    });
  });

  it('renders an interactive citation widget with Confidence Score', () => {
    render(<App />);
    const citationWidget = screen.getByTestId('citation-widget');
    expect(citationWidget).toBeInTheDocument();
    expect(screen.getByText(/Confidence Score:/i)).toBeInTheDocument();
  });

  it('makes the citation widget interactive (clicking shows details)', () => {
    render(<App />);
    const citationWidget = screen.getByTestId('citation-widget');
    fireEvent.click(citationWidget);
    expect(screen.getByText(/Source Data/i)).toBeInTheDocument();
  });

  describe('Ping Expert', () => {
    const slackBotUrl = 'http://localhost:3979';

    beforeEach(() => {
      (globalThis as unknown as { __VITE_SLACK_BOT_URL__?: string }).__VITE_SLACK_BOT_URL__ = slackBotUrl;
    });

    it('Ping Expert button exists and is disabled when no citation', () => {
      render(<App />);
      const pingButton = screen.getByRole('button', { name: /ping expert/i });
      expect(pingButton).toBeInTheDocument();
      expect(pingButton).toBeDisabled();
    });

    it('when citation exists, clicking Ping Expert calls requestHandoff with sessionId and draftText', async () => {
      mockRequestHandoff.mockResolvedValue(undefined);
      mockGetHandoffStatus.mockResolvedValue({ status: 'rejected' });
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: /draft answers/i }));
      await waitFor(() => {
        expect(screen.getByTestId('draft-result-text')).toBeInTheDocument();
      });
      const pingButton = screen.getByRole('button', { name: /ping expert/i });
      expect(pingButton).not.toBeDisabled();
      fireEvent.click(pingButton);
      await waitFor(() => {
        expect(mockRequestHandoff).toHaveBeenCalled();
      });
      expect(mockRequestHandoff).toHaveBeenCalledWith(
        slackBotUrl,
        expect.stringMatching(/^[a-z0-9-]+$/i),
        undefined,
        'Mocked text'
      );
    });

    it('when polling returns approved, insertTextAtSelection is called with expertReply', async () => {
      mockRequestHandoff.mockResolvedValue(undefined);
      mockGetHandoffStatus
        .mockResolvedValueOnce({ status: 'pending' })
        .mockResolvedValueOnce({ status: 'approved', expertReply: 'Expert approved text' });
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: /draft answers/i }));
      await waitFor(() => {
        expect(screen.getByTestId('draft-result-text')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /ping expert/i }));
      const { insertTextAtSelection } = await import('../services/document');
      await waitFor(
        () => {
          expect(insertTextAtSelection).toHaveBeenCalledWith('Expert approved text');
        },
        { timeout: 8000 }
      );
      expect(screen.getByText('Expert approved.')).toBeInTheDocument();
    }, 10000);
  });
});
