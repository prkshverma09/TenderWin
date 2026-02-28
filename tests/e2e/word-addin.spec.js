"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const USE_REAL_AIRIA = process.env.E2E_USE_REAL_AIRIA === '1' || process.env.E2E_USE_REAL_AIRIA === 'true';
/** Real RFP text from repo; no stub. Fails if file missing so we never accidentally run with fake input. */
function loadSampleRfpText() {
    const p = path.join(__dirname, '../../test-data/sample-rfp-section.txt');
    if (!fs.existsSync(p))
        throw new Error(`Real E2E requires test data: ${p}`);
    return fs.readFileSync(p, 'utf-8');
}
const STUB_RESPONSE = {
    text: 'E2E drafted answer from stub.',
    confidence: 88,
    sources: [{ title: 'E2E Source', snippet: 'E2E snippet for automated test.' }],
};
(0, test_1.test)('Word Add-in: Draft Answers works E2E (stubbed Airia)', async ({ page }) => {
    if (USE_REAL_AIRIA)
        test_1.test.skip();
    // Stub Airia API and proxy so the test passes with or without real credentials (avoids CORS/failures)
    await page.route('**/*', async (route) => {
        const req = route.request();
        if (req.method() !== 'POST')
            return route.continue();
        const url = req.url();
        const isAiria = url.includes('api.airia.ai') ||
            url.includes('/airia') ||
            url.includes('PipelineExecution');
        if (!isAiria)
            return route.continue();
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(STUB_RESPONSE),
        });
    });
    await page.goto('/');
    await (0, test_1.expect)(page.locator('h1')).toHaveText('TenderWin Word Add-in');
    const draftButton = page.getByRole('button', { name: 'Draft Answers' });
    await (0, test_1.expect)(draftButton).toBeVisible();
    await draftButton.click();
    await (0, test_1.expect)(page.getByRole('button', { name: 'Draft Answers' })).toBeEnabled({ timeout: 15000 });
    await (0, test_1.expect)(page.getByText(/failed to fetch|Airia (proxy|API) error|Request to Airia failed/i)).not.toBeVisible();
    const citationWidget = page.getByTestId('citation-widget');
    await (0, test_1.expect)(citationWidget).toBeVisible();
    await (0, test_1.expect)(citationWidget).toContainText(`Confidence Score: ${STUB_RESPONSE.confidence}%`);
    await citationWidget.click();
    await (0, test_1.expect)(page.getByText(`Source Data: ${STUB_RESPONSE.sources[0].title}`)).toBeVisible();
    await (0, test_1.expect)(page.getByText(STUB_RESPONSE.sources[0].snippet)).toBeVisible();
});
(0, test_1.test)('Word Add-in: Draft Answers works E2E (real Airia)', async ({ page }) => {
    if (!USE_REAL_AIRIA)
        test_1.test.skip();
    // REAL USER FLOW — NO STUBS: real add-in → real proxy → real Airia API.
    // Do not add page.route() or route.fulfill() here. Input = real RFP from test-data.
    const sampleRfp = loadSampleRfpText();
    test_1.test.info().annotations.push({
        type: 'Input (RFP sent to Airia)',
        description: sampleRfp.slice(0, 800) + (sampleRfp.length > 800 ? '…' : ''),
    });
    await page.goto('/');
    await (0, test_1.expect)(page.locator('h1')).toHaveText('TenderWin Word Add-in');
    await page.evaluate((text) => {
        window.__E2E_DOCUMENT_TEXT__ = text;
    }, sampleRfp);
    const draftButton = page.getByRole('button', { name: 'Draft Answers' });
    await (0, test_1.expect)(draftButton).toBeVisible();
    await draftButton.click();
    await (0, test_1.expect)(page.getByRole('button', { name: 'Draft Answers' })).toBeEnabled({ timeout: 60000 });
    await (0, test_1.expect)(page.getByText(/failed to fetch|Airia (proxy|API) error|Request to Airia failed/i)).not.toBeVisible();
    const citationWidget = page.getByTestId('citation-widget');
    await (0, test_1.expect)(citationWidget).toBeVisible();
    await (0, test_1.expect)(citationWidget).toContainText(/Confidence Score:\s*\d+%/);
    // Confirm real Airia response: citation must NOT be the stubbed test values (no mocks).
    const citationContent = await citationWidget.textContent();
    (0, test_1.expect)(citationContent, 'Must not be stubbed E2E response').not.toContain('E2E drafted answer from stub');
    (0, test_1.expect)(citationContent, 'Must not show stubbed confidence').not.toContain('E2E Source');
    (0, test_1.expect)(citationContent, 'Must not show stubbed snippet').not.toContain('E2E snippet for automated test');
    const draftResultEl = page.getByTestId('draft-result-text');
    await (0, test_1.expect)(draftResultEl).toBeVisible({ timeout: 15000 });
    const draftText = await draftResultEl.textContent();
    (0, test_1.expect)(draftText, 'Draft must be non-empty').toBeTruthy();
    (0, test_1.expect)((draftText ?? '').length, 'Draft must be substantive (real agent output)').toBeGreaterThanOrEqual(50);
    (0, test_1.expect)(draftText, 'Must not be stubbed E2E response').not.toContain('E2E drafted answer from stub');
    (0, test_1.expect)(draftText, 'Must not be mock response').not.toMatch(/\[Mock\]/i);
    (0, test_1.expect)(draftText, 'Must not be "open a document" placeholder reply').not.toMatch(/I don't have the ability to open files/i);
    (0, test_1.expect)(draftText, 'Must not be placeholder input').not.toContain('Open a document in Word to send its text');
    test_1.test.info().annotations.push({
        type: 'Output (Airia draft)',
        description: (draftText ?? '').slice(0, 1500) + ((draftText?.length ?? 0) > 1500 ? '…' : ''),
    });
    await citationWidget.click();
    await (0, test_1.expect)(page.getByText(/Source Data:/)).toBeVisible();
});
//# sourceMappingURL=word-addin.spec.js.map