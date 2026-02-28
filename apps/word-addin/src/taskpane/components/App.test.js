import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
beforeAll(() => {
    global.Office = {
        context: {
            document: {
                body: {
                    insertText: jest.fn()
                }
            }
        }
    };
});
describe('App Component', () => {
    it('renders without crashing', () => {
        render(_jsx(App, {}));
    });
    it('contains a Draft Answers button', () => {
        render(_jsx(App, {}));
        const button = screen.getByRole('button', { name: /draft answers/i });
        expect(button).toBeInTheDocument();
    });
    it('calls insertTextAtSelection (document) when Draft Answers is clicked', async () => {
        const { insertTextAtSelection } = await import('../document');
        render(_jsx(App, {}));
        const button = screen.getByRole('button', { name: /draft answers/i });
        fireEvent.click(button);
        await waitFor(() => {
            expect(insertTextAtSelection).toHaveBeenCalledWith('Mocked text');
        });
    });
    it('renders an interactive citation widget with mock MCP App data (Confidence Score)', () => {
        render(_jsx(App, {}));
        // Check that citation widget is present
        const citationWidget = screen.getByTestId('citation-widget');
        expect(citationWidget).toBeInTheDocument();
        // Check that it shows mock MCP App data like Confidence Score
        const confidenceScore = screen.getByText(/Confidence Score:/i);
        expect(confidenceScore).toBeInTheDocument();
    });
    it('makes the citation widget interactive (e.g. clicking it shows details)', () => {
        render(_jsx(App, {}));
        const citationWidget = screen.getByTestId('citation-widget');
        // initially details might be hidden, let's just test clicking does something, like toggling a class or showing more info
        fireEvent.click(citationWidget);
        const details = screen.getByText(/Source Data/i);
        expect(details).toBeInTheDocument();
    });
});
//# sourceMappingURL=App.test.js.map