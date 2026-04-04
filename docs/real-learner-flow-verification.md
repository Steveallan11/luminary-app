# Real Learner Flow Verification

This repo now exposes two deterministic checks for the core learner journey:

```bash
npm run verify:env
npm run verify:learner-flow
```

## Required env contract

Set these in `.env.local` before running the verifier or starting a production build:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `ANTHROPIC_API_KEY`
  Required for the `/api/lumi/chat` step.
- `LUMINARY_COOKIE`
  Parent session cookie header used to prove authenticated ownership checks.
- `LUMINARY_FORBIDDEN_CHILD_ID`
  A learner that should reject with `403` for the parent cookie above.

## Required verifier inputs

- `LUMINARY_BASE_URL`
- `LUMINARY_CHILD_ID`
- `LUMINARY_SUBJECT_SLUG`
- `LUMINARY_TOPIC_SLUG`

Optional:

- `LUMINARY_TOPIC_ID`
  Use when you want the verifier to skip deriving the topic id from `/api/lesson/start`.

## What `npm run verify:learner-flow` proves

The script performs one real API cycle:

1. `POST /api/lesson/start`
2. `POST /api/lesson/generate`
3. `GET /api/lumi/opening-message`
4. `POST /api/lumi/chat`
5. `POST /api/lumi/session-end`
6. `GET /api/learn/topic-progress`

It then reads Supabase directly with the service role key to confirm the persisted `lesson_sessions` and `child_topic_progress` rows that match the returned `session_id` and `topic_id`.

## Failure-path coverage

The verifier also checks:

- invalid learner id returns `404`
- invalid session id returns `404`
- authenticated parent mismatch returns `403` when both `LUMINARY_COOKIE` and `LUMINARY_FORBIDDEN_CHILD_ID` are supplied

## Expected output

The script prints one JSON blob containing:

- `child_id`
- `topic_id`
- `session_id`
- route responses
- a Lumi SSE excerpt
- failure-path responses
- Supabase rows proving persisted writes
