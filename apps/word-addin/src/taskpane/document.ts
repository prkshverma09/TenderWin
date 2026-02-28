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

/**
 * Get the text of the current selection, or the paragraph containing the cursor.
 * Used so the agent can answer the specific question at the cursor (e.g. section 3.1).
 * Tries paragraph-at-cursor first so a bare cursor in a question line still gets that text (Word on the web).
 * Returns empty string when not in Word or on error.
 */
export async function getSelectionOrParagraphText(): Promise<string> {
  const Office = (typeof globalThis !== 'undefined' ? globalThis : window) as unknown as {
    Word?: { run: (cb: (ctx: unknown) => Promise<unknown>) => Promise<unknown> };
  };
  if (!Office?.Word?.run) return '';
  try {
    const text = await Office.Word.run(async (context: unknown) => {
      const ctx = context as {
        document: { getSelection: () => { load: (p: string) => void; text?: string; paragraphs?: { getFirst: () => { load: (p: string) => void; text?: string } } } };
        sync: () => Promise<unknown>;
      };
      const selection = ctx.document.getSelection();
      // Prefer paragraph at cursor so "cursor after the question" gives that question (Word on the web)
      const paras = selection.paragraphs;
      if (paras) {
        try {
          const first = paras.getFirst();
          first.load('text');
          await ctx.sync();
          const pText = (first.text ?? '').trim();
          if (pText.length > 0) return pText;
        } catch {
          /* fall through to selection text */
        }
      }
      selection.load('text');
      await ctx.sync();
      const selText = (selection.text ?? '').trim();
      return selText;
    });
    return (text as string) ?? '';
  } catch (e) {
    console.warn('getSelectionOrParagraphText failed:', e);
    return '';
  }
}

/**
 * Insert text at the current cursor/selection using Word JS API.
 * Uses context.document.getSelection().insertText(text, InsertLocation.after) so the draft
 * appears where the user placed the cursor (e.g. after an RFP question).
 * @returns true if insertion succeeded, false otherwise (e.g. Word not available or API error).
 */
export async function insertTextAtSelection(text: string): Promise<boolean> {
  const Office = (typeof globalThis !== 'undefined' ? globalThis : window) as unknown as {
    Word?: {
      run: (cb: (ctx: unknown) => Promise<unknown>) => Promise<unknown>;
      InsertLocation?: { After?: string; End?: string };
    };
  };
  if (!Office?.Word?.run) {
    console.warn('Word.run not available; cannot insert at cursor.');
    return false;
  }
  if (!text || text.trim().length === 0) return true;
  try {
    await Office.Word.run(async (context: unknown) => {
      const ctx = context as {
        document: { getSelection: () => { insertText: (t: string, loc: string) => void; load: (p: string) => void }; sync: () => Promise<unknown> };
      };
      const selection = ctx.document.getSelection();
      const insertLoc = (Office as { Word?: { InsertLocation?: { After?: string } } }).Word?.InsertLocation?.After ?? 'After';
      selection.insertText(text, insertLoc);
      await ctx.sync();
    });
    return true;
  } catch (e) {
    console.warn('insertTextAtSelection failed:', e);
    return false;
  }
}
