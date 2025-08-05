import { test, expect } from '@playwright/test';

test('user can submit contact form', async ({ page }) => {
  await page.goto('http://localhost:4200/');
  await page.getByRole('button', { name: 'Contact' }).click();
  await page.getByRole('textbox', { name: 'Name *' }).fill('Prafulla Badgujar');
  await page.getByRole('textbox', { name: 'Phone Number' }).fill('2423422442');
  await page.getByLabel('Category *').selectOption('technical');
  await page.getByRole('textbox', { name: 'Subject *' }).fill('Need help');
  await page.getByRole('textbox', { name: 'Message *' }).fill('There is an issue with my event registration.');
  await page.getByRole('button', { name: 'Send Message' }).click();
  // await expect(page.locator('app-custom-alert')).toContainText('Message sent');
});
