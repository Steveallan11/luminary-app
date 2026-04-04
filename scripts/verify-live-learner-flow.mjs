import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local' });
loadEnv();

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env ${name}`);
  }
  return value;
}

async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function expectJson(url, init, expectedStatuses) {
  const response = await fetch(url, init);
  const body = await parseJsonResponse(response);

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `${init?.method ?? 'GET'} ${url} returned ${response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`
    );
  }

  return { response, body };
}

async function readSse(url, init) {
  const response = await fetch(url, init);
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${init?.method ?? 'POST'} ${url} returned ${response.status}: ${body}`);
  }

  return body;
}

function buildHeaders(includeCookie = false) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeCookie && process.env.LUMINARY_COOKIE?.trim()) {
    headers.Cookie = process.env.LUMINARY_COOKIE.trim();
  }

  return headers;
}

async function main() {
  const baseUrl = requireEnv('LUMINARY_BASE_URL').replace(/\/$/, '');
  const childId = requireEnv('LUMINARY_CHILD_ID');
  const subjectSlug = requireEnv('LUMINARY_SUBJECT_SLUG');
  const topicSlug = requireEnv('LUMINARY_TOPIC_SLUG');
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const start = await expectJson(
    `${baseUrl}/api/lesson/start`,
    {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({
        child_id: childId,
        subject_slug: subjectSlug,
        topic_slug: topicSlug,
      }),
    },
    [200]
  );

  const topic = start.body?.lesson?.topic;
  const sessionId = start.body?.lesson?.sessionId;
  const topicId = process.env.LUMINARY_TOPIC_ID?.trim() || topic?.id;

  if (!sessionId || !topicId) {
    throw new Error(`Lesson start did not return topic/session identifiers: ${JSON.stringify(start.body)}`);
  }

  const generated = await expectJson(
    `${baseUrl}/api/lesson/generate`,
    {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({
        child_id: childId,
        subject_slug: subjectSlug,
        topic_slug: topicSlug,
        session_id: sessionId,
      }),
    },
    [200, 503]
  );

  const opening = await expectJson(
    `${baseUrl}/api/lumi/opening-message?child_id=${encodeURIComponent(childId)}&subject_slug=${encodeURIComponent(subjectSlug)}&topic_slug=${encodeURIComponent(topicSlug)}&session_id=${encodeURIComponent(sessionId)}`,
    {
      method: 'GET',
      headers: buildHeaders(true),
    },
    [200]
  );

  const chatStream = await readSse(`${baseUrl}/api/lumi/chat`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({
      child_id: childId,
      topic_id: topicId,
      subject_slug: subjectSlug,
      topic_slug: topicSlug,
      session_id: sessionId,
      mastery_score: 20,
      current_phase: 'spark',
      messages: [
        {
          role: 'user',
          content: `Teach me ${topic?.title ?? topicSlug} in one short step and ask one follow-up question.`,
        },
      ],
    }),
  });

  const end = await expectJson(
    `${baseUrl}/api/lumi/session-end`,
    {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({
        child_id: childId,
        topic_id: topicId,
        topic_title: topic?.title ?? topicSlug,
        session_id: sessionId,
        message_count: 2,
        mastery_score: 55,
      }),
    },
    [200]
  );

  const progressGet = await expectJson(
    `${baseUrl}/api/learn/topic-progress?child_id=${encodeURIComponent(childId)}&subject_slug=${encodeURIComponent(subjectSlug)}`,
    {
      method: 'GET',
      headers: buildHeaders(true),
    },
    [200]
  );

  const invalidChild = await expectJson(
    `${baseUrl}/api/lesson/start`,
    {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({
        child_id: '00000000-0000-0000-0000-000000000000',
        subject_slug: subjectSlug,
        topic_slug: topicSlug,
      }),
    },
    [404]
  );

  const invalidSession = await expectJson(
    `${baseUrl}/api/lumi/session-end`,
    {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({
        child_id: childId,
        topic_id: topicId,
        topic_title: topic?.title ?? topicSlug,
        session_id: '00000000-0000-0000-0000-000000000000',
        message_count: 1,
        mastery_score: 10,
      }),
    },
    [404]
  );

  let authFailure = { skipped: true, reason: 'Set both LUMINARY_COOKIE and LUMINARY_FORBIDDEN_CHILD_ID to verify 403 parent ownership rejection.' };
  const forbiddenChildId = process.env.LUMINARY_FORBIDDEN_CHILD_ID?.trim();
  if (process.env.LUMINARY_COOKIE?.trim() && forbiddenChildId) {
    const forbidden = await expectJson(
      `${baseUrl}/api/lesson/start`,
      {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({
          child_id: forbiddenChildId,
          subject_slug: subjectSlug,
          topic_slug: topicSlug,
        }),
      },
      [403]
    );

    authFailure = {
      skipped: false,
      status: forbidden.response.status,
      body: forbidden.body,
    };
  }

  const { data: sessionRow, error: sessionError } = await supabase
    .from('lesson_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    throw new Error(`Supabase lesson_sessions lookup failed: ${sessionError.message}`);
  }

  const { data: progressRow, error: progressError } = await supabase
    .from('child_topic_progress')
    .select('*')
    .eq('child_id', childId)
    .eq('topic_id', topicId)
    .maybeSingle();

  if (progressError) {
    throw new Error(`Supabase child_topic_progress lookup failed: ${progressError.message}`);
  }

  console.log(
    JSON.stringify(
      {
        base_url: baseUrl,
        child_id: childId,
        topic_id: topicId,
        session_id: sessionId,
        lesson_start: start.body,
        lesson_generate: {
          status: generated.response.status,
          body: generated.body,
        },
        opening_message: opening.body,
        lumi_chat_excerpt: chatStream.slice(0, 500),
        session_end: end.body,
        topic_progress: progressGet.body,
        failure_paths: {
          invalid_child: {
            status: invalidChild.response.status,
            body: invalidChild.body,
          },
          invalid_session: {
            status: invalidSession.response.status,
            body: invalidSession.body,
          },
          auth_mismatch: authFailure,
        },
        supabase_rows: {
          lesson_sessions: sessionRow,
          child_topic_progress: progressRow,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
