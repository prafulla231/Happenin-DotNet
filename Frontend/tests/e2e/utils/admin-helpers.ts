import test, { Page, expect } from '@playwright/test';
import { testEnv } from '../env';

export async function adminLogin(page: Page) {
  await page.goto(testEnv.baseUrl);
  await page.getByRole('button', { name: '🚀 Get Started' }).click();
  await page.getByRole('textbox', { name: 'Enter your email' }).fill(testEnv.admin.email);
  await page.getByRole('textbox', { name: 'Enter your password' }).fill(testEnv.admin.password);
  await page.getByRole('button', { name: '🚀 Sign In' }).click();
}

export async function approvePendingEvent(page: Page) {
  await page.getByRole('button', { name: 'Review Pending', exact: true }).click();

  // Wait for event cards to load
  await page.waitForSelector('.event-actions', { timeout: 5000 });

  // Grab all "Approve event" buttons using CSS
  const approveButtons = page.locator('.event-actions button', { hasText: 'Approve event' });
  const count = await approveButtons.count();

  if (count === 0) {
    console.log('❌ No event to approve. Possibly a selector issue or no data.');
    return;
  }

  console.log(`✅ Found ${count} approve button(s). Proceeding...`);

  // Click the first approve button
  await approveButtons.first().click();

  // Confirm the action
  await page.getByRole('button', { name: 'Confirm' }).click();

  // Verify success
  // await expect(page.getByText(/approved|success|done/i)).toBeVisible({ timeout: 5000 }).catch(() => {
  //   console.log("⚠️ Couldn't find success message.");
  // });
}

export async function denyPendingEvent(page: Page) {
  await page.getByRole('button', { name: 'Review Pending', exact: true }).click();
  // Wait for event cards to load
  await page.waitForSelector('.event-actions', { timeout: 5000 });
  // Use a robust selector for the deny/reject button
  const denyButtons = page.locator('.event-actions button', { hasText: /deny|reject/i });
  const count = await denyButtons.count();
  if (count === 0) {
    console.log('❌ No event to deny. Possibly a selector issue or no data.');
    return;
  }
  // console.log(`✅ Found ${count} deny button(s). Proceeding...`);
  await denyButtons.first().click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  // Optionally, check for a success message or UI update
  // await expect(page.getByText(/denied|rejected|success|done/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
}
