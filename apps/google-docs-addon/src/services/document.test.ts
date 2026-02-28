import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDocumentText, insertTextAtSelection } from './document';

declare global {
  interface Window {
    google?: {
      script: {
        run: {
          withSuccessHandler: (cb: (value: unknown) => void) => { getDocumentText: () => void; insertTextAtSelection: (_: string) => void };
        };
      };
    };
  }
}

describe('document service', () => {
  const mockRun = {
    withSuccessHandler: (cb: (value: unknown) => void) => ({
      getDocumentText: () => {
        cb('sample doc text');
      },
      insertTextAtSelection: (_text: string) => {
        cb(undefined);
      },
    }),
  };

  beforeEach(() => {
    (globalThis as unknown as { google?: { script: { run: typeof mockRun } } }).google = { script: { run: mockRun } };
  });

  afterEach(() => {
    delete (globalThis as unknown as { google?: unknown }).google;
  });

  it('getDocumentText returns text from google.script.run', async () => {
    const text = await getDocumentText();
    expect(text).toBe('sample doc text');
  });

  it('insertTextAtSelection calls google.script.run and resolves', async () => {
    await expect(insertTextAtSelection('inserted text')).resolves.toBeUndefined();
  });
});
