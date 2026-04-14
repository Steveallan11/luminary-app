import { test, expect } from '@playwright/test';

test('learn overview page loads without crashing', async ({ page }) => {
  await page.goto('/learn');
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('main')).toBeVisible();
});
