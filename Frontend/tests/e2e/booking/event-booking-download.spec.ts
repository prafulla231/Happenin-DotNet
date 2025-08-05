import { test, expect } from '@playwright/test';
import { login, bookEvent, goToAvailableEvents } from '../utils/helpers';

test('user can book an event and download ticket', async ({ page }) => {
  await login(page, 'rajatmahajan.tech@gmail.com', 'Password123');
  await goToAvailableEvents(page);
  await bookEvent(page);

  // OPTIONAL: Assert or simulate ticket download
  await page.getByRole('button', { name: /Download Ticket/i }).click();
  // Add check for download or success message if applicable
});
