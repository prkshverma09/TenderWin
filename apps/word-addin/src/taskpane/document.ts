/**
 * Office.js helpers for reading and writing the Word document.
 * Works with Office.context.document when available (e.g. task pane in Word).
 * Safe when Office is undefined (browser or tests).
 *
 * E2E tests: set window.__E2E_DOCUMENT_TEXT__ before clicking Draft Answers to send
 * real RFP content to Airia instead of the placeholder (when not running in Word).
 */

declare global {
  interface Window {
    __E2E_DOCUMENT_TEXT__?: string;
    Office?: {
      context?: {
        document?: {
          body?: { insertText?: (text: string) => void };
        };
      };
    };
  }
}

/** Get document body text. Returns placeholder when not in Word. */
export async function getDocumentText(): Promise<string> {
  const Office = (typeof globalThis !== 'undefined' ? globalThis : window) as unknown as {
    Word?: { run: (cb: (ctx: unknown) => Promise<unknown>) => Promise<unknown> };
  };
  if (Office?.Word?.run) {
    try {
      const text = await Office.Word.run(async (context: unknown) => {
        const ctx = context as { document: { body: { load: (p: string) => void; text: string }; sync: () => Promise<unknown> } };
        ctx.document.body.load('text');
        await ctx.sync();
        return ctx.document.body.text ?? '';
      });
      return text as string;
    } catch {
      // Fallback if Word.run fails
    }
  }
  // E2E: allow tests to inject real RFP text so the agent gets real content
  const e2eText = typeof globalThis !== 'undefined' && (globalThis as unknown as { __E2E_DOCUMENT_TEXT__?: string }).__E2E_DOCUMENT_TEXT__;
  if (typeof e2eText === 'string' && e2eText.length > 0) return e2eText;
  return '[Open a document in Word to send its text to Airia.]';
}

/** Insert text at cursor/selection. Uses Office.context.document.body.insertText when available. */
export async function insertTextAtSelection(text: string): Promise<void> {
  const office = (typeof globalThis !== 'undefined' ? globalThis : window) as unknown as {
    Office?: { context?: { document?: { body?: { insertText?: (t: string) => void } } } };
  };
  const insertText = office?.Office?.context?.document?.body?.insertText;
  if (insertText) {
    insertText(text);
    return;
  }
  console.warn('Office.context.document.body.insertText not available.');
}
