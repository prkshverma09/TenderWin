import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const USE_REAL_AIRIA = process.env.E2E_USE_REAL_AIRIA === '1' || process.env.E2E_USE_REAL_AIRIA === 'true';

/** Real RFP text from repo; no stub. Fails if file missing so we never accidentally run with fake input. */
function loadSampleRfpText(): string {
  const p = path.join(__dirname, '../../test-data/sample-rfp-section.txt');
  if (!fs.existsSync(p)) throw new Error(`Real E2E requires test data: ${p}`);
  return fs.readFileSync(p, 'utf-8');
}

const STUB_RESPONSE = {
  text: 'E2E drafted answer from stub.',
  confidence: 88,
  sources: [{ title: 'E2E Source', snippet: 'E2E snippet for automated test.' }],
};

const E2E_EXPERT_REPLY = 'E2E expert approved text';

test('Word Add-in: Draft Answers works E2E (stubbed Airia)', async ({ page }) => {
  if (USE_REAL_AIRIA) test.skip();

  // Stub Airia API and proxy so the test passes with or without real credentials (avoids CORS/failures)
  await page.route('**/*', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.continue();
    const url = req.url();
    const isAiria =
      url.includes('api.airia.ai') ||
      url.includes('/airia') ||
      url.includes('PipelineExecution');
    if (!isAiria) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(STUB_RESPONSE),
    });
  });

  await page.goto('/');

  await expect(page.locator('h1')).toHaveText('TenderWin Word Add-in');

  const draftButton = page.getByRole('button', { name: 'Draft Answers' });
  await expect(draftButton).toBeVisible();
  await draftButton.click();

  await expect(page.getByRole('button', { name: 'Draft Answers' })).toBeEnabled({ timeout: 15000 });

  await expect(page.getByText(/failed to fetch|Airia (proxy|API) error|Request to Airia failed/i)).not.toBeVisible();

  const citationWidget = page.getByTestId('citation-widget');
  await expect(citationWidget).toBeVisible();
  await expect(citationWidget).toContainText(`Confidence Score: ${STUB_RESPONSE.confidence}%`);

  await citationWidget.click();
  const firstSource = STUB_RESPONSE.sources[0];
  await expect(page.getByText(`Source Data: ${firstSource!.title}`)).toBeVisible();
  await expect(page.getByText(firstSource!.snippet)).toBeVisible();
});

test('Word Add-in: Ping Expert works E2E (stubbed handoff)', async ({ page }) => {
  if (USE_REAL_AIRIA) test.skip();

  let handoffPostBody: { sessionId?: string; question?: string; draftText?: string } | null = null;
  let statusCallCount = 0;

  // Stub handoff: POST returns 200 with sessionId
  await page.route('**/api/handoff', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      try {
        handoffPostBody = req.postDataJSON();
      } catch {
        handoffPostBody = null;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, sessionId: handoffPostBody?.sessionId ?? 'e2e-session' }),
      });
      return;
    }
    return route.continue();
  });

  // Stub handoff status: first call pending, then approved with expertReply
  await page.route('**/api/handoff/status*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    statusCallCount += 1;
    const body =
      statusCallCount === 1
        ? { status: 'pending' }
        : { status: 'approved' as const, expertReply: E2E_EXPERT_REPLY };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  // Stub Airia so Draft Answers works
  await page.route('**/*', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.continue();
    const url = req.url();
    const isAiria =
      url.includes('api.airia.ai') ||
      url.includes('/airia') ||
      url.includes('PipelineExecution');
    if (!isAiria) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(STUB_RESPONSE),
    });
  });

  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('TenderWin Word Add-in');

  const draftButton = page.getByRole('button', { name: 'Draft Answers' });
  await draftButton.click();
  await expect(page.getByRole('button', { name: 'Draft Answers' })).toBeEnabled({ timeout: 15000 });
  await expect(page.getByTestId('draft-result-text')).toContainText(STUB_RESPONSE.text, { timeout: 5000 });

  const pingExpertButton = page.getByTestId('ping-expert-button');
  await expect(pingExpertButton).toBeVisible();
  await pingExpertButton.click();

  await expect(page.getByTestId('expert-approved-message')).toContainText('Expert approved', { timeout: 15000 });
  await expect(page.getByTestId('expert-reply-text')).toContainText(E2E_EXPERT_REPLY);

  expect(handoffPostBody).not.toBeNull();
  expect(handoffPostBody!.sessionId).toBeTruthy();
  expect(handoffPostBody!.draftText === STUB_RESPONSE.text || handoffPostBody!.question).toBeTruthy();
});

test('Word Add-in: Draft Answers works E2E (real Airia)', async ({ page }) => {
  if (!USE_REAL_AIRIA) test.skip();

  // REAL USER FLOW — NO STUBS: real add-in → real proxy → real Airia API.
  // Do not add page.route() or route.fulfill() here. Input = real RFP from test-data.
  const sampleRfp = loadSampleRfpText();
  test.info().annotations.push({
    type: 'Input (RFP sent to Airia)',
    description: sampleRfp.slice(0, 800) + (sampleRfp.length > 800 ? '…' : ''),
  });

  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('TenderWin Word Add-in');

  await page.evaluate((text: string) => {
    (window as unknown as { __E2E_DOCUMENT_TEXT__?: string }).__E2E_DOCUMENT_TEXT__ = text;
  }, sampleRfp);

  const draftButton = page.getByRole('button', { name: 'Draft Answers' });
  await expect(draftButton).toBeVisible();
  await draftButton.click();

  await expect(page.getByRole('button', { name: 'Draft Answers' })).toBeEnabled({ timeout: 60000 });
  await expect(page.getByText(/failed to fetch|Airia (proxy|API) error|Request to Airia failed/i)).not.toBeVisible();

  const citationWidget = page.getByTestId('citation-widget');
  await expect(citationWidget).toBeVisible();
  await expect(citationWidget).toContainText(/Confidence Score:\s*\d+%/);

  // Confirm real Airia response: citation must NOT be the stubbed test values (no mocks).
  const citationContent = await citationWidget.textContent();
  expect(citationContent, 'Must not be stubbed E2E response').not.toContain('E2E drafted answer from stub');
  expect(citationContent, 'Must not show stubbed confidence').not.toContain('E2E Source');
  expect(citationContent, 'Must not show stubbed snippet').not.toContain('E2E snippet for automated test');

  const draftResultEl = page.getByTestId('draft-result-text');
  await expect(draftResultEl).toBeVisible({ timeout: 15000 });
  const draftText = await draftResultEl.textContent();
  expect(draftText, 'Draft must be non-empty').toBeTruthy();
  expect((draftText ?? '').length, 'Draft must be substantive (real agent output)').toBeGreaterThanOrEqual(50);

  expect(draftText, 'Must not be stubbed E2E response').not.toContain('E2E drafted answer from stub');
  expect(draftText, 'Must not be mock response').not.toMatch(/\[Mock\]/i);
  expect(draftText, 'Must not be "open a document" placeholder reply').not.toMatch(/I don't have the ability to open files/i);
  expect(draftText, 'Must not be placeholder input').not.toContain('Open a document in Word to send its text');

  test.info().annotations.push({
    type: 'Output (Airia draft)',
    description: (draftText ?? '').slice(0, 1500) + ((draftText?.length ?? 0) > 1500 ? '…' : ''),
  });

  await citationWidget.click();
  await expect(page.getByText(/Source Data:/)).toBeVisible();
});
