import { test, expect } from '@playwright/test';

test('Word Add-in: Draft Answers and verify citation widget', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');

  // Verify initial state
  await expect(page.locator('h1')).toHaveText('TenderWin Word Add-in');

  // Find and click the 'Draft Answers' button
  const draftButton = page.getByRole('button', { name: 'Draft Answers' });
  await expect(draftButton).toBeVisible();
  await draftButton.click();

  // Verify the citation widget is shown
  const citationWidget = page.getByTestId('citation-widget');
  await expect(citationWidget).toBeVisible();
  
  // Verify citation details aren't shown initially
  await expect(page.getByText('Source Data: MCP App Mock Data')).not.toBeVisible();

  // Click citation widget to expand details
  await citationWidget.click();

  // Verify details are now visible
  await expect(page.getByText('Source Data: MCP App Mock Data')).toBeVisible();
  await expect(page.getByText('Matched with requirements document section 3.2')).toBeVisible();
});
