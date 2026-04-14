import { test, expect } from '@playwright/test';

test('learn subjects API returns data or error payload', async ({ request }) => {
  const response = await request.get('/api/learn/subjects', {
    timeout: 30000,
  });
  const body = await response.json();
  if (response.ok()) {
    expect(body.subjects).toBeDefined();
    expect(Array.isArray(body.subjects)).toBe(true);
  } else {
    expect(body.error).toBeDefined();
  }
});

test('queue generation API rejects missing topic', async ({ request }) => {
  const response = await request.post('/api/admin/queue-generation', {
    data: { type: 'lesson' },
    timeout: 30000,
  });
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toContain('topic_id');
});

test('refine lesson API validates required fields', async ({ request }) => {
  const response = await request.post('/api/admin/refine-lesson', {
    data: {},
  });
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toContain('lesson_id');
});

test('knowledge base API validates lesson id on fetch', async ({ request }) => {
  const response = await request.get('/api/admin/knowledge-base');
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toContain('lesson_id');
});
