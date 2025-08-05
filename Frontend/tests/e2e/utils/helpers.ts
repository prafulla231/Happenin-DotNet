import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('http://localhost:4200/');
  await page.getByRole('button', { name: '🚀 Get Started' }).click();
  await page.getByRole('textbox', { name: 'Enter your email' }).fill(email);
  await page.getByRole('textbox', { name: 'Enter your password' }).fill(password);
  await page.getByRole('button', { name: '🚀 Sign In' }).click();

  // Confirm navigation to dashboard
  await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
}

export async function bookEvent(page: Page) {
  const bookButtons = page.getByRole('button', { name: '+ Book Now' });
  const count = await bookButtons.count();
  if (count === 0) throw new Error('No bookable events found.');

  await bookButtons.nth(0).click();

  // Updated to avoid strict mode violation
  await page.getByRole('button', { name: 'Confirm' }).last().click();


  await expect(page.getByRole('button', { name: '✓ Booked' })).toBeVisible();
}
export async function goToAvailableEvents(page: Page) {
  await page.getByRole('button', { name: 'Available Events' }).click();
  await expect(page.getByRole('heading', { name: /Available Events/i })).toBeVisible();
}
