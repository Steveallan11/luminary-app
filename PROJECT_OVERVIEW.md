# Luminary — Project Overview (Internal)

## What this is
Luminary is an AI-powered homeschooling platform for UK children aged 5–16. It has:
- **Child experience**: a cosmic “learning universe” (`/learn`) with subjects → topic maps → a lesson chat with **Lumi**.
- **Parent experience**: dashboards, progress, session history, and report generation.
- **Admin experience**: content tooling, generation workflows, review/approval, and operational dashboards.

The repo in this workspace is the actual app source: `C:\Users\leona\Documents\Luminary\luminary-app`.

## Deployment & environments
- **Production domain**: `https://www.meetlumi.co.uk`
- **Vercel project**: `luminary` (project id in docs: `prj_p5UamFsUBPfSoJa06uQbf6X1x1IV`)
- **Preview deployments**: exist (including branch `claude/audit-build-status-AMqql`), but some preview URLs are protected by Vercel Authentication/SSO.

### Current production issue (as of 2026-03-27)
- `GET https://www.meetlumi.co.uk/api/learn/subjects` returns **500**:
  - `{"error":"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"}`
- Root cause in code: server-side service client used `SUPABASE_URL` while the documented/env-standard variable is `NEXT_PUBLIC_SUPABASE_URL`.
- Fix implemented locally: `src/lib/supabase-service.ts` now accepts **either** `SUPABASE_URL` **or** `NEXT_PUBLIC_SUPABASE_URL`.

## Tech stack (from code)
- **Next.js 14 (App Router)**, React 18, TypeScript (strict)
- **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) for Postgres + auth + storage
- **Anthropic** (`@anthropic-ai/sdk`) for Lumi chat + content generation
- **OpenAI** (`openai`) used for DALL‑E image generation (optional)
- **Stripe** for subscriptions + webhooks
- Tailwind CSS + Framer Motion + Lucide icons

## Key user flows
### Child (learner)
1. **Enter /learn** (requires a learner id stored in local/session storage: `luminary_child_id`)
2. Pick a **subject** → `/learn/[slug]` shows a topic map with sequential unlock.
3. Pick a **topic** → `/learn/[slug]/[topic]` starts a lesson session:
   - Calls `POST /api/lesson/start`
   - Uses `GET /api/lumi/opening-message` for a warm opening
   - Streams tutoring via `POST /api/lumi/chat` (SSE)
   - Ends via `POST /api/lumi/session-end` (mastery + XP + summary)

### Parent
- Uses dashboard routes (e.g. `/parent`) and APIs like `/api/parent/dashboard` and `/api/reports/generate`.

### Admin
- Admin UI under `/admin/*` plus a set of admin API routes under `/api/admin/*` for generation, approval, assets, media, and migrations.

## API surface (high level)
Learning lane:
- `GET /api/learn/subjects` — subjects + topic list + optional progress map (Supabase service role)
- `GET /api/learn/child-profile` — child profile + recent sessions (Supabase service role)
- `POST /api/lesson/start` — starts a lesson session / triggers generation path
- `POST /api/lumi/chat` — streaming Lumi tutor responses (Anthropic)
- `GET /api/lumi/opening-message` — opening message generation

Content + ops:
- `GET /api/admin/run-migrations` / `POST /api/admin/run-migrations` — schema helpers
- `GET/POST/DELETE/PATCH /api/admin/knowledge-base` — lesson knowledge base items (optional Anthropic summarisation)
- `POST /api/admin/upload-file` — uploads lesson KB files to Supabase Storage

Payments:
- `POST /api/stripe/checkout`
- `POST /api/stripe/webhook`

## Data model & migrations
Supabase schema is defined in the SQL files at repo root, including:
- `supabase-schema.sql` (base)
- `supabase-schema-session*.sql` (incremental sessions)
- `supabase-complete-migration.sql` and `supabase-migrations.sql` (helpers)
- Agent system tables: `supabase-agent-system.sql`

Core entities used by the teaching lane include (names referenced in code/docs):
- `subjects`, `topics`
- `children`, `families` (and related parent/profile records)
- `topic_lesson_structures` (lesson “arc” JSON per phase)
- `lesson_sessions`, `child_topic_progress`
- Content library tables (e.g. `topic_assets`, `lesson_content_links`, `lesson_phase_media`)

## Where the important code lives
- Child pages: `src/app/learn/*`
- Learn APIs: `src/app/api/learn/*`
- Lumi APIs: `src/app/api/lumi/*`
- Lesson engine + mock scaffolding: `src/lib/lesson-engine.ts`, `src/lib/mock-data.ts`
- Supabase helpers:
  - Browser: `src/lib/supabase.ts`
  - Server (cookies): `src/lib/supabase-server.ts`
  - Service role: `src/lib/supabase-service.ts`

## Notable branches
- `main` (current local checkout)
- `origin/claude/audit-build-status-AMqql` includes:
  - `/api/admin/seed-lessons` endpoint
  - Supabase-backed versions of `/api/lumi/chat` and `/api/lumi/opening-message`
  - `src/lib/lesson-seed-data.ts` (currently a placeholder array in that branch)

## Local validation status
- Dependencies installed via `npm ci` (pnpm not available in this environment due to Corepack permissions).
- `npm run build` succeeds after:
  - Fixing a TypeScript narrowing issue in `src/app/learn/page.tsx`
  - Making admin API routes lazy-init Supabase/Anthropic clients so missing env vars don’t crash `next build`

## Recommended next actions
1. **Fix prod env or deploy the code fix**:
   - Set `SUPABASE_URL` in Vercel to the same value as `NEXT_PUBLIC_SUPABASE_URL`, **or**
   - Deploy this repo’s change that allows `NEXT_PUBLIC_SUPABASE_URL` to satisfy service-client routes.
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` exists in **Production** env vars (required for `/api/learn/*` service routes).
3. Decide whether to merge the Supabase-backed Lumi changes from `claude/audit-build-status-AMqql` into `main`.

