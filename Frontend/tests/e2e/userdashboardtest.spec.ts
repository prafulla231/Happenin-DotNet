import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:4200/');
  await page.getByRole('button', { name: '🚀 Get Started' }).click();
  await page.getByRole('textbox', { name: 'Enter your email' }).click();
  await page
    .getByRole('textbox', { name: 'Enter your email' })
    .fill('rajatmahajan.tech@gmail.com');
  await page.getByRole('textbox', { name: 'Enter your password' }).click();
  await page
    .getByRole('textbox', { name: 'Enter your password' })
    .fill('Password123');
  await page
    .getByRole('textbox', { name: 'Enter your password' })
    .press('Enter');
  await page.getByRole('button', { name: '🚀 Sign In' }).click();
  await page
    .getByRole('button', { name: 'Book now for Canvas Chronicles' })
    .click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
});
