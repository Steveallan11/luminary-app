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

test('admin library hub responds (login or content)', async ({ page }) => {
  await page.goto('/admin/library');
  const libraryHeading = page.getByRole('heading', { name: 'Content Hub' });
  if (await libraryHeading.count()) {
    await expect(libraryHeading).toBeVisible();
    await expect(page.getByRole('button', { name: /lesson library/i })).toBeVisible();
  } else {
    const loginHeading = page.getByRole('heading', { name: /welcome back/i });
    await expect(loginHeading).toBeVisible();
  }
});

test('admin lesson library page responds (login or content)', async ({ page }) => {
  await page.goto('/admin/library/lessons');
  const libraryHeading = page.getByRole('heading', { name: 'Lesson Library' });
  if (await libraryHeading.count()) {
    await expect(libraryHeading).toBeVisible();
  } else {
    const loginHeading = page.getByRole('heading', { name: /welcome back/i });
    await expect(loginHeading).toBeVisible();
  }
});

test('admin content library page responds (login or content)', async ({ page }) => {
  await page.goto('/admin/library/content');
  const contentText = page.getByText('Content Library', { exact: true });
  if (await contentText.count()) {
    await expect(contentText).toBeVisible();
  } else {
    const loginHeading = page.getByRole('heading', { name: /welcome back/i });
    await expect(loginHeading).toBeVisible();
  }
});
