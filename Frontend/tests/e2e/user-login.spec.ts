import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('http://localhost:4200/');
  await page.getByRole('button', { name: '🚀 Get Started' }).click();
  await page.getByRole('button', { name: '🔑 Login' }).click();
  await page.getByRole('textbox', { name: 'Enter your email' }).fill('Prafullabadgujar2512@gmail.com');
  await page.getByRole('textbox', { name: 'Enter your password' }).fill('Password123');
  await page.getByRole('button', { name: '🚀 Sign In' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('app-header')).toBeVisible();
});
