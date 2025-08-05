import { test, expect } from '@playwright/test';

test('user should log in, view event, and submit contact form', async ({ page }) => {
  await page.goto('http://localhost:4200/');

  // Navigate to login
  await page.getByRole('button', { name: '🚀 Get Started' }).click();
  await page.getByRole('button', { name: '🔑 Login' }).click();

  // Fill login form
  await page.getByRole('textbox', { name: 'Enter your email' }).fill('Prafullabadgujar2512@gmail.com');
  await page.getByRole('textbox', { name: 'Enter your password' }).fill('Password123');
  await page.getByRole('button', { name: '🚀 Sign In' }).click();

  // Dismiss alert (if it appears)
  await page.getByRole('button', { name: 'OK' }).click();

  // View event details
  await page.locator('div:nth-child(2) .view-details-btn').click();

  // Share and dismiss alert
  await page.getByRole('button', { name: '📋 Share' }).click();
  await page.locator('app-custom-alert').getByRole('button', { name: '✕' }).click();
  await page.locator('app-custom-alert').getByRole('button', { name: 'Confirm' }).click();

  // Go to Contact page
  await page.getByRole('button', { name: 'Contact' }).click();

  // Fill contact form
  await page.getByRole('textbox', { name: 'Name *' }).fill('Prafulla Badgujar');
  await page.getByRole('textbox', { name: 'Phone Number' }).fill('2423422442');
  await page.getByLabel('Category *').selectOption('technical');
  await page.getByRole('textbox', { name: 'Subject *' }).fill('Need help');
  await page.getByRole('textbox', { name: 'Message *' }).fill('There is an issue with my event registration.');

  // Submit form
  await page.getByRole('button', { name: 'Send Message' }).click();

  // Assert success or success alert (if applicable)
  // await expect(page.locator('app-custom-alert')).toContainText('Message sent');
});
