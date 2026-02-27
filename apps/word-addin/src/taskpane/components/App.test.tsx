import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

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

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('contains a Draft Answers button', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /draft answers/i });
    expect(button).toBeInTheDocument();
  });

  it('calls Office.context.document.body.insertText when Draft Answers is clicked', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /draft answers/i });
    fireEvent.click(button);
    expect((global as any).Office.context.document.body.insertText).toHaveBeenCalledWith('Mocked text');
  });

  it('renders an interactive citation widget with mock MCP App data (Confidence Score)', () => {
    render(<App />);
    // Check that citation widget is present
    const citationWidget = screen.getByTestId('citation-widget');
    expect(citationWidget).toBeInTheDocument();

    // Check that it shows mock MCP App data like Confidence Score
    const confidenceScore = screen.getByText(/Confidence Score:/i);
    expect(confidenceScore).toBeInTheDocument();
  });

  it('makes the citation widget interactive (e.g. clicking it shows details)', () => {
    render(<App />);
    const citationWidget = screen.getByTestId('citation-widget');
    
    // initially details might be hidden, let's just test clicking does something, like toggling a class or showing more info
    fireEvent.click(citationWidget);
    
    const details = screen.getByText(/Source Data/i);
    expect(details).toBeInTheDocument();
  });
});
