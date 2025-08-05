import { test } from '@playwright/test';
import { adminLogin, approvePendingEvent } from '../utils/admin-helpers.ts';

test('admin can approve a pending event', async ({ page }) => {
  await adminLogin(page, );
  await approvePendingEvent(page);
});
