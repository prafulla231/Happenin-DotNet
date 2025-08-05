import { test, expect } from '@playwright/test';
import { login } from '../utils/helpers';

test('organizer can create a new event', async ({ page }) => {
  await login(page, 'organizer@example.com', 'Password123');
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('textbox', { name: 'Event Title' }).fill('Playwright E2E Test Event');
  await page.getByRole('textbox', { name: 'Description' }).fill('This event was created by an automated Playwright test.');
  await page.getByRole('combobox', { name: 'Category' }).selectOption('Workshop');
  await page.getByRole('spinbutton', { name: 'Price' }).fill('100');
  await page.getByRole('spinbutton', { name: 'Max Registrations' }).fill('50');
  await page.getByRole('textbox', { name: 'Venue' }).fill('Test Venue');
  await page.getByRole('textbox', { name: 'City' }).fill('Test City');
  await page.getByRole('textbox', { name: 'State' }).fill('Test State');
  await page.getByRole('textbox', { name: 'Address' }).fill('123 Test Street');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Event created successfully')).toBeVisible();
});
