import { test, expect } from '@playwright/test';

test('learn subjects API returns data or error payload', async ({ request }) => {
  const response = await request.get('/api/learn/subjects');
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
  });
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toContain('topic_id');
});
