/**
 * Google Apps Script server-side code for the TenderWin add-on.
 * Deploy with clasp; these functions are invoked via google.script.run from the sidebar.
 */

/**
 * Returns the body text of the active document.
 */
function getDocumentText() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  return body.getText();
}

/**
 * Inserts the given text at the cursor position (or replaces selection).
 */
function insertTextAtSelection(text) {
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  if (cursor) {
    const element = cursor.insertText(text);
    if (element) {
      doc.setCursor(doc.newPosition(element, element.getEndOffset()));
    }
  } else {
    const body = doc.getBody();
    body.appendParagraph(text);
  }
}
