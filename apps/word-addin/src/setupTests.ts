import '@testing-library/jest-dom';

// Mock Office.js
global.Office = {
  onReady: jest.fn().mockImplementation((callback) => {
    callback({ host: 'Word', platform: 'PC' });
    return Promise.resolve();
  }),
  context: {
    document: {
      url: 'mock_url'
    }
  }
} as any;
