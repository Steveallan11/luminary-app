import { test, expect } from '@playwright/test';

test('admin lesson generation page responds (login or content)', async ({ page }) => {
  await page.goto('/admin/lessons');
  const lessonHeading = page.getByRole('heading', { name: 'Lesson Generation' });
  if (await lessonHeading.count()) {
    await expect(lessonHeading).toBeVisible();
  } else {
    const loginHeading = page.getByRole('heading', { name: /welcome back/i });
    await expect(loginHeading).toBeVisible();
  }
});
