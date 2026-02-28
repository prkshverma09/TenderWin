/**
 * Google Docs API helpers via google.script.run.
 * Used when the add-on runs inside Google Docs (HtmlService).
 * Tests mock globalThis.google.script.run.
 */

declare global {
  interface Window {
    google?: {
      script: {
        run: {
          withSuccessHandler: (cb: (value: unknown) => void) => {
            getDocumentText: () => void;
            insertTextAtSelection: (text: string) => void;
          };
        };
      };
    };
  }
}

function getGoogleScriptRun() {
  return (globalThis as unknown as { google?: { script: { run: unknown } } }).google?.script?.run;
}

/** Get document body text from the active Google Doc. */
export function getDocumentText(): Promise<string> {
  const run = getGoogleScriptRun();
  if (!run) {
    return Promise.resolve('[Open a document in Google Docs to send its text.]');
  }
  return new Promise((resolve) => {
    (run as { withSuccessHandler: (cb: (v: unknown) => void) => { getDocumentText: () => void } })
      .withSuccessHandler((value: unknown) => resolve(String(value ?? '')))
      .getDocumentText();
  });
}

/** Insert text at the cursor/selection in the active Google Doc. */
export function insertTextAtSelection(text: string): Promise<void> {
  const run = getGoogleScriptRun();
  if (!run) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    (run as { withSuccessHandler: (cb: (v: unknown) => void) => { insertTextAtSelection: (t: string) => void } })
      .withSuccessHandler(() => resolve())
      .insertTextAtSelection(text);
  });
}
