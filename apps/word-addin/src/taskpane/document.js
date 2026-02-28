/**
 * Office.js helpers for reading and writing the Word document.
 * Works with Office.context.document when available (e.g. task pane in Word).
 * Safe when Office is undefined (browser or tests).
 *
 * E2E tests: set window.__E2E_DOCUMENT_TEXT__ before clicking Draft Answers to send
 * real RFP content to Airia instead of the placeholder (when not running in Word).
 */
/** Get document body text. Returns placeholder when not in Word. */
export async function getDocumentText() {
    const Office = (typeof globalThis !== 'undefined' ? globalThis : window);
    if (Office?.Word?.run) {
        try {
            const text = await Office.Word.run(async (context) => {
                const ctx = context;
                ctx.document.body.load('text');
                await ctx.sync();
                return ctx.document.body.text ?? '';
            });
            return text;
        }
        catch {
            // Fallback if Word.run fails
        }
    }
    // E2E: allow tests to inject real RFP text so the agent gets real content
    const e2eText = typeof globalThis !== 'undefined' && globalThis.__E2E_DOCUMENT_TEXT__;
    if (typeof e2eText === 'string' && e2eText.length > 0)
        return e2eText;
    return '[Open a document in Word to send its text to Airia.]';
}
/** Get selection or paragraph at cursor (tries paragraph first for cursor-in-question). */
export async function getSelectionOrParagraphText() {
    const Office = (typeof globalThis !== 'undefined' ? globalThis : window);
    if (!Office?.Word?.run)
        return '';
    try {
        const text = await Office.Word.run(async (context) => {
            const ctx = context;
            const selection = ctx.document.getSelection();
            const paras = selection.paragraphs;
            if (paras) {
                try {
                    const first = paras.getFirst();
                    first.load('text');
                    await ctx.sync();
                    const pText = (first.text ?? '').trim();
                    if (pText.length > 0)
                        return pText;
                }
                catch {
                    /* fall through */
                }
            }
            selection.load('text');
            await ctx.sync();
            return (selection.text ?? '').trim();
        });
        return text ?? '';
    }
    catch (e) {
        console.warn('getSelectionOrParagraphText failed:', e);
        return '';
    }
}
/** Insert text at cursor/selection. Returns true if inserted, false otherwise. */
export async function insertTextAtSelection(text) {
    const Office = (typeof globalThis !== 'undefined' ? globalThis : window);
    if (!Office?.Word?.run) {
        console.warn('Word.run not available; cannot insert at cursor.');
        return false;
    }
    if (!text || String(text).trim().length === 0)
        return true;
    try {
        await Office.Word.run(async (context) => {
            const selection = context.document.getSelection();
            const insertLoc = Office.Word?.InsertLocation?.After ?? 'After';
            selection.insertText(text, insertLoc);
            await context.sync();
        });
        return true;
    }
    catch (e) {
        console.warn('insertTextAtSelection failed:', e);
        return false;
    }
}
//# sourceMappingURL=document.js.map