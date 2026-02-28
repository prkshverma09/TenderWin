import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';

jest.mock('../../services/airia', () => ({
  draftFromDocument: jest.fn().mockResolvedValue({
    text: 'Mocked text',
    confidence: 92,
    sources: [{ title: 'MCP App Mock Data', snippet: 'Matched with requirements document section 3.2' }],
  }),
}));

jest.mock('../document', () => ({
  getDocumentText: jest.fn().mockResolvedValue('Sample RFP section text'),
  insertTextAtSelection: jest.fn().mockResolvedValue(undefined),
}));

const mockRequestHandoff = jest.fn();
const mockGetHandoffStatus = jest.fn();
jest.mock('../../services/handoff', () => ({
  requestHandoff: (...args: unknown[]) => mockRequestHandoff(...args),
  getHandoffStatus: (...args: unknown[]) => mockGetHandoffStatus(...args),
}));

beforeAll(() => {
  (global as any).Office = {
    context: {
      document: {
        body: {
          insertText: jest.fn()
        }
      }
    }
  };
});

beforeEach(() => {
  mockRequestHandoff.mockReset();
  mockGetHandoffStatus.mockReset();
});

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('contains a Draft Answers button', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /draft answers/i });
    expect(button).toBeInTheDocument();
  });

  it('calls insertTextAtSelection (document) when Draft Answers is clicked', async () => {
    const { insertTextAtSelection } = await import('../document');
    render(<App />);
    const button = screen.getByRole('button', { name: /draft answers/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(insertTextAtSelection).toHaveBeenCalledWith('Mocked text');
    });
  });

  it('renders an interactive citation widget with mock MCP App data (Confidence Score)', () => {
    render(<App />);
    const citationWidget = screen.getByTestId('citation-widget');
    expect(citationWidget).toBeInTheDocument();
    const confidenceScore = screen.getByText(/Confidence Score:/i);
    expect(confidenceScore).toBeInTheDocument();
  });

  it('makes the citation widget interactive (e.g. clicking it shows details)', () => {
    render(<App />);
    const citationWidget = screen.getByTestId('citation-widget');
    fireEvent.click(citationWidget);
    const details = screen.getByText(/Source Data/i);
    expect(details).toBeInTheDocument();
  });

  describe('Ping Expert', () => {
    const teamsBotUrl = 'http://localhost:3978';

    beforeEach(() => {
      (globalThis as unknown as { __VITE_TEAMS_BOT_URL__?: string }).__VITE_TEAMS_BOT_URL__ = teamsBotUrl;
    });

    it('Ping Expert button exists and is disabled when no citation', () => {
      render(<App />);
      const pingButton = screen.getByRole('button', { name: /ping expert/i });
      expect(pingButton).toBeInTheDocument();
      expect(pingButton).toBeDisabled();
    });

    it('when citation exists, button is enabled and clicking it calls requestHandoff with sessionId and draftText', async () => {
      mockRequestHandoff.mockResolvedValue(undefined);
      mockGetHandoffStatus.mockResolvedValue({ status: 'rejected' });
      render(<App />);
      const draftButton = screen.getByRole('button', { name: /draft answers/i });
      fireEvent.click(draftButton);
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
        teamsBotUrl,
        expect.stringMatching(/^[a-z0-9-]+$/i),
        undefined,
        'Mocked text'
      );
    });

    it('when polling returns approved, insertTextAtSelection is called with expertReply', async () => {
      jest.useFakeTimers();
      mockRequestHandoff.mockResolvedValue(undefined);
      mockGetHandoffStatus
        .mockResolvedValueOnce({ status: 'pending' })
        .mockResolvedValueOnce({ status: 'approved', expertReply: 'Expert approved text' });
      render(<App />);
      const draftButton = screen.getByRole('button', { name: /draft answers/i });
      fireEvent.click(draftButton);
      await waitFor(() => {
        expect(screen.getByTestId('draft-result-text')).toBeInTheDocument();
      });
      const pingButton = screen.getByRole('button', { name: /ping expert/i });
      fireEvent.click(pingButton);
      const POLL_MS = 2500;
      await act(async () => {
        await jest.advanceTimersByTimeAsync(POLL_MS);
      });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(POLL_MS);
      });
      const { insertTextAtSelection } = await import('../document');
      await waitFor(() => {
        expect(insertTextAtSelection).toHaveBeenCalledWith('Expert approved text');
      });
      await waitFor(() => {
        expect(screen.getByText('Expert approved.')).toBeInTheDocument();
      });
      jest.useRealTimers();
    });
  });
});
