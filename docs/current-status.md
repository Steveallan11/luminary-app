# Current Status — 4 April 2026

## Build & stack
- Next.js 14 with the App Router, TypeScript 5.9, and Tailwind 4.2 running under `pnpm@10.32.1` keeps the client, admin and API layers aligned with the existing `next.config.js` settings (remote image patterns and Manus dev origin allowances).
- Supabase is the primary datastore; browser helpers rely on `createBrowserClient`, server helpers use `createServerClient`, and the background job (`generate-lesson-logic.ts`) writes to `topic_lesson_structures` plus the `lesson_generation_events` stream.

## Runtime signals
- The lesson generation pipeline posts to the `lesson_generation_events` channel and the littler `lesson-realtime.ts` helper subscribes to that channel so the admin UI can watch when topics finish generating. The child dashboard is supposed to consume the prepared structures, but the PIN/login issues noted during early QA still block a full end-to-end validation of those hooks.
- Environment variables are now unified around `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` plus `SUPABASE_SERVICE_ROLE_KEY` (see the environment contract doc).

## Outstanding warnings and risks
- `next lint` previously prompted for configuration because no `.eslintrc.json` existed; the new lint config prevents interactive prompts, but the layout font delivery still needs a follow-up audit.
- Lesson generation still needs manual sign-off on the `v0` branch and Codex PR #14 before merging; closing those is part of the remaining manual cleanup.
