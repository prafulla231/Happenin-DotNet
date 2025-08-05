import { test, expect } from '@playwright/test';
import { login } from '../utils/helpers';

test('user can successfully log in', async ({ page }) => {
  await login(page, 'rajatmahajan.tech@gmail.com', 'Password123');

  // Validate dashboard is loaded
  await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
});
