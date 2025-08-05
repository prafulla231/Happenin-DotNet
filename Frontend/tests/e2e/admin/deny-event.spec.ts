import { test } from '@playwright/test';
import { adminLogin, denyPendingEvent } from '../utils/admin-helpers';

test('admin can deny a pending event', async ({ page }) => {
  await adminLogin(page); // Uses process admin variables from env
  await denyPendingEvent(page);
});
