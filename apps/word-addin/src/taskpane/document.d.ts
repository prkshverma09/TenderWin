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
                    body?: {
                        insertText?: (text: string) => void;
                    };
                };
            };
        };
    }
}
/** Get document body text. Returns placeholder when not in Word. */
export declare function getDocumentText(): Promise<string>;
/** Get selection text or paragraph at cursor (for question-at-cursor). */
export declare function getSelectionOrParagraphText(): Promise<string>;
/** Insert text at cursor/selection. Returns true if inserted, false otherwise. */
export declare function insertTextAtSelection(text: string): Promise<boolean>;
//# sourceMappingURL=document.d.ts.map