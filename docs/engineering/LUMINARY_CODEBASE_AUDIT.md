# Luminary Codebase Audit

## SECTION 1: TECH STACK

The repository is a **Next.js 14** application, not Vite or Create React App. The `package.json` declares `next` at version `^14.2.35`, with `react` and `react-dom` both declared at `^19.2.4`, and the standard scripts are `next dev`, `next build`, and `next start`.[1] The routing model is the **App Router**, confirmed by the presence of `src/app/...` route segments such as `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/learn/[slug]/page.tsx`, and multiple `route.ts` handlers under `src/app/api`.[2]

The styling system is **Tailwind CSS v4**, configured through `@tailwindcss/postcss` in `postcss.config.js`, with global styling defined in `src/app/globals.css` and component styling implemented primarily through Tailwind utility classes.[1] [4] There is no evidence of styled-components, CSS Modules, or a separate design token system. Animation is handled with **Framer Motion** (`framer-motion` at `^12.36.0`), which is used across the learner-facing experience and the landing page interactions.[1]

The UI icon library is **Lucide React** (`lucide-react` at `^0.577.0`). Drag-and-drop support exists through **dnd-kit** packages (`@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`), which are used by the interactive game and diagram systems added in Session 4.[1] PDF-related functionality is split across two stacks: **jsPDF** plus `jspdf-autotable` for report generation, and `@react-pdf/renderer` as an installed dependency, although the codebase currently uses HTML/print or jsPDF-style generation patterns rather than a fully integrated React PDF rendering pipeline.[1] [15]

Supabase is the database and auth platform. The browser client is initialised in `src/lib/supabase.ts` with `createBrowserClient`, while the server-side client is initialised in `src/lib/supabase-server.ts` with `createServerClient` and Next.js cookies integration.[5] [6] No ORM is present; database access patterns are intended to use the **Supabase JavaScript client** directly.

There are already two AI integrations. The first is **Anthropic Claude**, via `@anthropic-ai/sdk`, wrapped in `src/lib/anthropic.ts`, and used by Lumi-related API routes such as `/api/lumi/chat`, `/api/lumi/opening-message`, and `/api/lumi/session-end`.[1] [7] [16] The second is **OpenAI**, via the `openai` package, added for the Session 4 image generation route `/api/admin/generate-images` that targets DALL·E-style image generation.[1] [24]

There is **no global state management library** such as Zustand, Redux, MobX, or Jotai in `package.json`, and the inspected components rely on local component state with React hooks instead.[1] Likewise, there is **no form library** such as React Hook Form or Formik; forms are hand-built with React state and custom input components such as `src/components/ui/Input.tsx`.[1] [35]

| Area | Confirmed implementation |
|---|---|
| Framework | Next.js `^14.2.35` with App Router [1] [2] |
| UI styling | Tailwind CSS v4 via `@tailwindcss/postcss` [1] [4] |
| Animation | Framer Motion `^12.36.0` [1] |
| Icons | Lucide React `^0.577.0` [1] |
| Drag-and-drop | dnd-kit packages [1] |
| Database/Auth | Supabase JS + Supabase SSR [1] [5] [6] |
| AI | Anthropic Claude + OpenAI image generation [1] [7] [24] |
| Payments | Stripe + `@stripe/stripe-js` [1] [14] |
| State management | React local state only [1] |
| Form library | None detected [1] |

## SECTION 2: DATABASE SCHEMA

The codebase contains three SQL schema files: `supabase-schema.sql`, `supabase-schema-session3.sql`, and `supabase-schema-session4.sql`.[8] [9] [10] The main schema file defines the core homeschooling platform entities, while Session 3 extends that model for subscriptions and achievements, and Session 4 adds richer content-production entities.

The **core tables** defined in `supabase-schema.sql` are `families`, `children`, `subjects`, `topics`, `child_progress`, and `learning_sessions`.[8] The `families` table stores parent-level identity and subscription information. The `children` table stores child profiles, avatar choices, year groups, PIN hashes, and XP/streak counters. `subjects` and `topics` model the curriculum hierarchy. `child_progress` links children to topics and records progression state. `learning_sessions` logs individual learning sessions, durations, mastery, and XP changes.[8]

The **Session 3 schema** adds achievements and billing metadata. Specifically, `supabase-schema-session3.sql` introduces `achievements` and `child_achievements`, while also extending `families` with `stripe_customer_id`, `subscription_tier`, and `subscription_status` fields if they do not already exist.[9] This file is additive rather than a complete replacement schema, so the final logical schema is the union of the base schema and later session files.

The **Session 4 schema** introduces content-generation infrastructure. `supabase-schema-session4.sql` defines `topic_assets`, `diagram_components`, and `game_results`.[10] These support authored or generated learning assets, reusable interactive diagrams, and per-game performance tracking.

The following table consolidates the tables present in the SQL files, their columns, key relationships, and row-level security status as declared in the schema scripts.

| Table | Columns and types | Foreign keys | RLS |
|---|---|---|---|
| `families` | `id uuid primary key`, `parent_email text unique not null`, `family_name text not null`, `created_at timestamptz default now()`, plus Session 3 additions `stripe_customer_id text`, `subscription_tier text`, `subscription_status text` [8] [9] | Referenced by `children.family_id` [8] | Enabled in base schema [8] |
| `children` | `id uuid primary key`, `family_id uuid not null`, `name text not null`, `age integer not null`, `year_group text not null`, `avatar text not null`, `pin_hash text not null`, `xp integer default 0`, `streak_days integer default 0`, `last_active_date date`, `created_at timestamptz default now()` [8] | `family_id -> families.id` [8] | Enabled [8] |
| `subjects` | `id text primary key`, `name text not null`, `description text`, `icon_emoji text`, `colour_hex text`, `display_order integer` [8] | Referenced by `topics.subject_id` [8] | Enabled [8] |
| `topics` | `id uuid primary key`, `subject_id text not null`, `slug text not null`, `title text not null`, `description text`, `difficulty integer default 1`, `estimated_minutes integer default 10`, `display_order integer`, `created_at timestamptz default now()` [8] | `subject_id -> subjects.id` [8] | Enabled [8] |
| `child_progress` | `id uuid primary key`, `child_id uuid not null`, `topic_id uuid not null`, `status text not null`, `mastery integer default 0`, `xp_earned integer default 0`, `last_completed_at timestamptz`, `updated_at timestamptz default now()` [8] | `child_id -> children.id`, `topic_id -> topics.id` [8] | Enabled [8] |
| `learning_sessions` | `id uuid primary key`, `child_id uuid not null`, `topic_id uuid not null`, `started_at timestamptz default now()`, `ended_at timestamptz`, `duration_minutes integer`, `messages jsonb`, `hints_used integer default 0`, `mastery_delta integer default 0`, `xp_earned integer default 0`, `completed boolean default false` [8] | `child_id -> children.id`, `topic_id -> topics.id` [8] | Enabled [8] |
| `achievements` | `id uuid primary key`, `slug text unique not null`, `name text not null`, `description text not null`, `icon text not null`, `xp_reward integer default 0`, `created_at timestamptz default now()` [9] | Referenced by `child_achievements.achievement_id` [9] | Enabled in Session 3 schema [9] |
| `child_achievements` | `id uuid primary key`, `child_id uuid not null`, `achievement_id uuid not null`, `earned_at timestamptz default now()` [9] | `child_id -> children.id`, `achievement_id -> achievements.id` [9] | Enabled [9] |
| `topic_assets` | `id uuid primary key`, `topic_id uuid not null`, `asset_type text not null`, `asset_subtype text`, `title text not null`, `content_json jsonb not null`, `file_url text`, `thumbnail_url text`, `age_group text not null`, `status text not null default 'draft'`, `generation_prompt text`, `generated_at timestamptz`, `reviewed_by text`, `reviewed_at timestamptz`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` [10] | `topic_id -> topics.id` [10] | Enabled [10] |
| `diagram_components` | `id uuid primary key`, `topic_id uuid not null`, `diagram_type text not null`, `title text not null`, `config_json jsonb not null`, `created_at timestamptz default now()` [10] | `topic_id -> topics.id` [10] | Enabled [10] |
| `game_results` | `id uuid primary key`, `child_id uuid not null`, `topic_id uuid not null`, `asset_id uuid`, `game_type text not null`, `score integer not null`, `max_score integer not null`, `time_taken integer not null`, `completed_at timestamptz default now()`, `xp_earned integer default 0` [10] | `child_id -> children.id`, `topic_id -> topics.id`, `asset_id -> topic_assets.id` [10] | Enabled [10] |

Several important notes arise from the schema audit. First, **no table named `topic_lesson_structures` exists** in any SQL file.[8] [9] [10] Second, **no table named `lesson_phase_tracking` exists** either.[8] [9] [10] Third, `topic_assets` does exist, but it was added in Session 4 rather than the original core schema.[10] These absences are directly relevant to the requested “what’s missing” analysis later in this report.

## SECTION 3: AUTH SYSTEM

The authentication system is a mixture of planned Supabase auth, local demo-mode UX, and a separate admin allowlist flow. Parent signup is handled by `src/app/auth/signup/page.tsx`, which presents a family-name and parent-email signup form using local React state and the custom `Input` and `Button` components.[28] Parent login is handled by `src/app/auth/login/page.tsx`, which supports multiple modes: standard parent login, child login via PIN, and an admin entry mode triggered by the `mode=admin` query parameter.[27]

Child login is implemented as a **PIN-based flow** in the login page itself. The page exposes a child selector and a four-digit PIN step in the UI layer, but this remains primarily demo-oriented in the current implementation; it does not show a fully wired server-side PIN verification pipeline against Supabase auth sessions.[27] The child profile model includes a `pin_hash` column on `children`, which means the data model supports secure child PIN checking, but the audit did not find a complete production-grade verification route dedicated to child PIN login.[8] Instead, the login page coordinates the UX locally and routes the user to the learner area.

Session state for Supabase-authenticated server operations is intended to be accessed through `src/lib/supabase-server.ts`, which uses `createServerClient` and the Next.js cookies API to bind request cookies into the Supabase SSR client.[6] Browser-side access is through `src/lib/supabase.ts` via `createBrowserClient`.[5] However, the currently inspected user-facing flows do not yet show a fully consistent end-to-end parent session lifecycle wired across all pages. This is one of the structural gaps in the current codebase.

Admin access is separate from parent/child auth. The admin system is implemented in `src/lib/admin-auth.ts`, `src/app/api/admin/login/route.ts`, and `src/app/admin/layout.tsx`.[11] [12] [29] The admin helper defines a cookie-backed session approach and an email allowlist. The login route starts an admin session for the allowlisted email `steveallan2018@gmail.com`, and the admin layout protects all `/admin/*` pages by checking the session and redirecting non-admin users back to the login flow.[11] [12] [29]

Post-login routing is therefore split into three patterns. Parent-facing entry points route toward `/parent`, child-facing flows route toward `/learn`, and admin access routes toward `/admin/content`.[27] [29] Protected routes currently exist primarily for the admin area, implemented at the layout level in `src/app/admin/layout.tsx`.[29] The learner and parent areas are not protected with the same rigor; they are currently accessible as app pages without a universal middleware or top-level auth guard.

| Auth area | File(s) | Current implementation |
|---|---|---|
| Parent signup | `src/app/auth/signup/page.tsx` [28] | Client-side form UI for family creation |
| Parent login | `src/app/auth/login/page.tsx` [27] | Multi-mode login page with parent, child, and admin entry UX |
| Child login | `src/app/auth/login/page.tsx` + `children.pin_hash` schema [27] [8] | PIN-based UX exists; production verification flow appears incomplete |
| Onboarding | `src/app/auth/onboarding/page.tsx` [30] | Collects first child details such as name, age/year group, avatar, and PIN |
| Supabase session access | `src/lib/supabase.ts`, `src/lib/supabase-server.ts` [5] [6] | Browser and SSR clients are prepared |
| Admin login | `src/lib/admin-auth.ts`, `src/app/api/admin/login/route.ts`, `src/app/admin/layout.tsx` [11] [12] [29] | Cookie-based allowlist session with route protection |

## SECTION 4: COMPONENTS & PAGES

The application currently contains a broad set of pages under the App Router. The primary page routes identified in `src/app` are `/`, `/auth/login`, `/auth/signup`, `/auth/onboarding`, `/learn`, `/learn/[slug]`, `/learn/[slug]/[topic]`, `/parent`, `/progress`, `/achievements`, `/profile`, `/pricing`, `/demo`, and `/admin/content`, alongside framework pages such as `/robots.txt` and `/sitemap.xml`.[2] The app also defines global loading, error, and not-found boundaries in `src/app/loading.tsx`, `src/app/error.tsx`, and `src/app/not-found.tsx`.[2]

The major learner-facing and platform components span layout/navigation, content rendering, mini-games, diagrams, UI primitives, and admin preview tooling. The child navigation system is implemented in `src/components/layout/ChildNav.tsx`, while the parent navigation is in `src/components/layout/ParentNav.tsx`; `src/components/layout/ChildLayout.tsx` wraps learner-facing experiences.[36] [37] [38] Curriculum entry points are rendered through `src/components/child/SubjectCard.tsx`.[39]

The Session 2 and Session 4 work introduced a significant content presentation layer. `src/components/content/ContentRenderer.tsx` is the top-level dispatcher for learner content blocks and interprets content signals into components such as `ConceptCard`, `RealWorldCard`, and `VideoPlayer`.[22] `src/components/diagrams/DiagramRenderer.tsx` selects among diagram implementations including `FractionBar`, `Timeline`, `LabelledDiagram`, `SortingVisual`, and `NumberLine`.[21] `src/components/games/GameRenderer.tsx` selects among interactive games including `MatchItGame`, `SortItGame`, `FillItGame`, `TrueFalseGame`, `BuildItGame`, and `QuickFireGame`.[20]

The most important chat/conversation UI is on `src/app/learn/[slug]/[topic]/page.tsx`, which implements the full Lumi lesson interface with streaming AI responses, hint controls, timers, and session completion summaries.[18] This page is the central conversation surface for Lumi. Subject navigation and topic progression are primarily handled by `/learn` and `/learn/[slug]`, with the latter presenting a learning map and sequential topic unlocking behavior.[17] [18]

The following table lists the significant routes and their purpose.

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` [26] | Marketing landing page with starfield, hero, feature sections, and call-to-action |
| `/auth/login` | `src/app/auth/login/page.tsx` [27] | Unified login surface for parent, child PIN, and admin access |
| `/auth/signup` | `src/app/auth/signup/page.tsx` [28] | Parent/family account signup UI |
| `/auth/onboarding` | `src/app/auth/onboarding/page.tsx` [30] | First-child onboarding flow with avatar and PIN setup |
| `/learn` | `src/app/learn/page.tsx` [17] | Child home dashboard showing subject cards, streak, and XP |
| `/learn/[slug]` | `src/app/learn/[slug]/page.tsx` [18] | Subject learning map with mastery and unlock states |
| `/learn/[slug]/[topic]` | `src/app/learn/[slug]/[topic]/page.tsx` [19] | Full Lumi chat lesson interface |
| `/parent` | `src/app/parent/page.tsx` [31] | Parent dashboard with live stats, activity feed, and heatmap |
| `/progress` | `src/app/progress/page.tsx` [32] | Cross-subject progress overview |
| `/achievements` | `src/app/achievements/page.tsx` [33] | Gamification dashboard with badges and level progression |
| `/profile` | `src/app/profile/page.tsx` [34] | Child profile, streak, XP, and learning preferences |
| `/pricing` | `src/app/pricing/page.tsx` [25] | Stripe subscription tiers and upgrade CTAs |
| `/demo` | `src/app/demo/page.tsx` [40] | Demonstration page for games, diagrams, worksheets, and rich content |
| `/admin/content` | `src/app/admin/content/page.tsx` [23] | Admin dashboard for content coverage, AI generation, and review |

The following table lists the most significant React components and gives a one-sentence description of each.

| Component | File | Description |
|---|---|---|
| `Starfield` | `src/components/ui/Starfield.tsx` [41] | Renders the animated cosmic background used across the premium visual theme |
| `Button` | `src/components/ui/Button.tsx` [35] | Shared button primitive with variant and size styling |
| `Card` | `src/components/ui/Card.tsx` [42] | Shared container component for glassmorphism-style content cards |
| `Input` | `src/components/ui/Input.tsx` [35] | Shared labeled input primitive for forms |
| `ChildNav` | `src/components/layout/ChildNav.tsx` [36] | Provides child-facing bottom-tab and navigation behavior |
| `ParentNav` | `src/components/layout/ParentNav.tsx` [37] | Provides parent dashboard navigation and logout/section switching UI |
| `ChildLayout` | `src/components/layout/ChildLayout.tsx` [38] | Wraps learner pages with consistent navigation and spacing |
| `SubjectCard` | `src/components/child/SubjectCard.tsx` [39] | Displays subject progress, iconography, and learner entry points |
| `UpgradeModal` | `src/components/ui/UpgradeModal.tsx` [43] | Displays soft paywall messaging for subscription restrictions |
| `Skeleton`, `SubjectCardSkeleton`, `DashboardSkeleton`, `LessonChatSkeleton` | `src/components/ui/Skeleton.tsx` [44] | Provide shimmer-based loading placeholders for multiple app surfaces |
| `EmptyState` | `src/components/ui/EmptyState.tsx` [45] | Displays contextual empty-state messaging for missing data |
| `ErrorState` | `src/components/ui/ErrorState.tsx` [46] | Displays reusable error UI with retry affordances |
| `ContentRenderer` | `src/components/content/ContentRenderer.tsx` [22] | Interprets content signals and dispatches learner-facing content blocks |
| `ConceptCard` | `src/components/content/ConceptCard.tsx` [47] | Renders a structured explainer card with hook, definition, and supporting details |
| `RealWorldCard` | `src/components/content/RealWorldCard.tsx` [48] | Shows real-world or inspiring scenarios linked to the lesson concept |
| `VideoPlayer` | `src/components/content/VideoPlayer.tsx` [49] | Custom video player with app-themed controls |
| `DiagramRenderer` | `src/components/diagrams/DiagramRenderer.tsx` [21] | Chooses and renders the appropriate interactive diagram component |
| `FractionBar` | `src/components/diagrams/FractionBar.tsx` [50] | Interactive fraction bar visualization |
| `Timeline` | `src/components/diagrams/Timeline.tsx` [51] | Interactive chronological diagram renderer |
| `LabelledDiagram` | `src/components/diagrams/LabelledDiagram.tsx` [52] | Tap-to-reveal labelled visual component |
| `SortingVisual` | `src/components/diagrams/SortingVisual.tsx` [53] | Interactive sorting diagram for classification tasks |
| `NumberLine` | `src/components/diagrams/NumberLine.tsx` [54] | Interactive number line diagram |
| `GameRenderer` | `src/components/games/GameRenderer.tsx` [20] | Dispatches to the appropriate mini-game component based on asset subtype |
| `GameWrapper` | `src/components/games/GameWrapper.tsx` [55] | Provides common game chrome such as timers, progress, and completion hooks |
| `GameResults` | `src/components/games/GameResults.tsx` [56] | Displays end-of-game score, timing, and reward summary |
| `MatchItGame` | `src/components/games/MatchItGame.tsx` [57] | Pair-matching mini-game |
| `SortItGame` | `src/components/games/SortItGame.tsx` [58] | Sorting mini-game using draggable items |
| `FillItGame` | `src/components/games/FillItGame.tsx` [59] | Fill-in-the-blank mini-game |
| `TrueFalseGame` | `src/components/games/TrueFalseGame.tsx` [60] | True/false quiz mini-game |
| `BuildItGame` | `src/components/games/BuildItGame.tsx` [61] | Order/construct mini-game |
| `QuickFireGame` | `src/components/games/QuickFireGame.tsx` [62] | Timed rapid-response quiz mini-game |
| `AdminAssetPreview` | `src/components/admin/AdminAssetPreview.tsx` [13] | Renders either the real learner-facing asset component or a structured fallback preview inside the admin review flow |

## SECTION 5: API ROUTES

The repository contains a substantial API surface under `src/app/api`. These routes cover Lumi chat, admin tooling, worksheet generation, game result recording, PDF reports, Stripe checkout, Stripe webhooks, and admin session start.[2] The Lumi routes are the most central to the educational interaction layer, while the admin and billing routes support content operations and commercialisation.

| Route path | File | Purpose | External API calls |
|---|---|---|---|
| `/api/admin/login` | `src/app/api/admin/login/route.ts` [12] | Starts an admin cookie session for an allowlisted email | No external API call; uses local admin helper |
| `/api/admin/generate-content` | `src/app/api/admin/generate-content/route.ts` [24] | Generates topic assets for selected asset types, using Claude when `ANTHROPIC_API_KEY` exists and demo payloads otherwise | Anthropic Claude when key is configured |
| `/api/admin/generate-images` | `src/app/api/admin/generate-images/route.ts` [24] | Generates supporting imagery for assets via OpenAI image APIs | OpenAI |
| `/api/content/generate-worksheet` | `src/app/api/content/generate-worksheet/route.ts` [63] | Produces worksheet output for a content asset/topic | Internal logic; may support print/PDF-style content generation |
| `/api/content/game-result` | `src/app/api/content/game-result/route.ts` [64] | Records game scores and XP payloads for completed mini-games | Intended for Supabase persistence, but implementation is primarily app-side/demo-oriented |
| `/api/lumi/chat` | `src/app/api/lumi/chat/route.ts` [16] | Main Lumi lesson chat endpoint with streaming AI responses and system prompt assembly | Anthropic Claude |
| `/api/lumi/opening-message` | `src/app/api/lumi/opening-message/route.ts` [65] | Generates Lumi’s opening lesson message, with fallback when API is unavailable | Anthropic Claude |
| `/api/lumi/session-end` | `src/app/api/lumi/session-end/route.ts` [66] | Generates the end-of-session summary, XP/mastery output, and progress update payload | Anthropic Claude and intended Supabase progress update hooks |
| `/api/reports/generate` | `src/app/api/reports/generate/route.ts` [15] | Generates a Local Authority style educational progress report with AI narrative | Anthropic Claude for narrative generation |
| `/api/stripe/checkout` | `src/app/api/stripe/checkout/route.ts` [14] | Creates a Stripe Checkout session for subscription purchase | Stripe |
| `/api/stripe/webhook` | `src/app/api/stripe/webhook/route.ts` [67] | Receives and validates Stripe webhook events | Stripe |

A notable absence is that there is **no `/api/lesson/generate` route** and **no `/api/lesson/start` route** anywhere in the repository.[2] This directly maps to the requested missing-feature checklist.

## SECTION 6: SUPABASE INTEGRATION

Supabase is initialised in two places. `src/lib/supabase.ts` exports the browser-side client using `createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)`, while `src/lib/supabase-server.ts` exports a server-side helper using `createServerClient` and cookies from `next/headers`.[5] [6] This is the correct broad pattern for Next.js App Router with Supabase SSR, but the rest of the codebase does not yet consistently exploit this infrastructure for all authentication and data-fetching flows.

The audit did **not** identify any clear use of a **Supabase service role key** in the inspected application code. The environment files include placeholders for standard public Supabase keys, Anthropic keys, Stripe keys, and OpenAI keys, but a service-role-specific server admin client was not found in the inspected files.[3] [5] [6] That means the current codebase appears to avoid privileged Supabase server operations, or at least has not yet implemented them explicitly.

There are also **no existing Supabase Realtime subscriptions** in the inspected code. The route and component inventory did not show any use of `channel`, `on`, `subscribe`, or similar realtime patterns from `@supabase/supabase-js`, and no realtime hook or listener utility exists in `src/lib` or `src/components`.[5] [6] This is especially important because the requested future work explicitly mentions Realtime integration for lesson generation completion.

Environment variables are structured around `.env.local` and `.env.local.example`.[3] The keys implied by the utilities and API routes include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_APP_URL`.[3] [5] [6] [7] [14] The browser-safe keys use the `NEXT_PUBLIC_` prefix, while secrets such as Anthropic and Stripe server credentials are read server-side in route handlers or utility modules.

| Question | Finding |
|---|---|
| Where is the client instantiated? | `src/lib/supabase.ts` and `src/lib/supabase-server.ts` [5] [6] |
| Is a service role key used? | No explicit usage found in inspected files [5] [6] |
| Any Realtime subscriptions? | None found [5] [6] |
| Environment structure | `.env.local` and `.env.local.example` with public and server-only keys [3] |

## SECTION 7: AI / LUMI INTEGRATION

Yes, there is already an existing **Lumi chat implementation**. The core chat UI lives in `src/app/learn/[slug]/[topic]/page.tsx`, while the model-facing utilities live in `src/lib/anthropic.ts`, `src/lib/lumi-prompt.ts`, and `src/lib/mastery.ts`, and the runtime endpoints are `/api/lumi/chat`, `/api/lumi/opening-message`, and `/api/lumi/session-end`.[7] [16] [18] [65] [66] This is not a placeholder-only system anymore; it is a real lesson-chat layer with streaming, hinting, session metrics, and summary generation.

The AI model currently targeted is **Anthropic Claude**, specifically the Sonnet line. The code references Claude via the Anthropic SDK and Session 2 documentation explicitly referenced `claude-sonnet-4-20250514`/Sonnet variants in the generation logic.[7] [16] [24] There is also an OpenAI integration, but that is used for admin image generation rather than Lumi’s tutoring dialogue.[24]

The system prompt is currently structured dynamically in `src/lib/lumi-prompt.ts`. That file assembles a prompt based on child age, subject, topic, safety constraints, and, after Session 4, content manifest injection and content signal instructions.[7] It already contains teaching-method guidance and child-safety guardrails, but it does **not** yet implement the requested **7-phase lesson arc phase controller** described in the new requirements.[7]

Streaming is present. `/api/lumi/chat` is implemented as a streaming route, and the learner lesson page uses a streaming chat interface with word-by-word or incremental rendering behavior.[16] [19] The opening-message route separately generates Lumi’s first utterance, and the session-end route composes the summary and completion response.[65] [66]

Messages are **not clearly persisted to Supabase as a durable chat transcript** in the currently inspected application code. The schema does include a `messages jsonb` column on `learning_sessions`, which indicates the data model anticipates saved transcripts or session payloads.[8] However, the code audit does not show a fully implemented persistence pipeline that reliably writes each chat exchange into Supabase in real time. The current system appears to use in-memory client state during the session and summarize/update at the end.[16] [19] [66]

The Session 4 content pipeline added **content signal processing** infrastructure through `ContentRenderer`, but that is still partial when measured against the new requested requirements. The content renderer can interpret content assets and admin previews, yet the exact requirement of stripping `[CONTENT:xxx]` markers inline from Lumi responses and rendering them in the chat stream appears only partially realised rather than comprehensively implemented as a lesson orchestration protocol.[22]

## SECTION 8: GAPS — WHAT'S MISSING

Based on the codebase audit, the following requested items do **not yet exist** or are only partially implemented.

| Requested item | Status | Evidence |
|---|---|---|
| `topic_lesson_structures` table | Missing | Not present in any schema SQL file [8] [9] [10] |
| `lesson_phase_tracking` table | Missing | Not present in any schema SQL file [8] [9] [10] |
| `topic_assets` table | Already exists | Added in `supabase-schema-session4.sql` [10] |
| 7-phase lesson arc phase controller in system prompt | Missing | `src/lib/lumi-prompt.ts` has dynamic prompting but no 7-phase controller structure [7] |
| Lesson generation engine (`POST /api/lesson/generate`) | Missing | No such route exists under `src/app/api` [2] |
| Lesson start router (`POST /api/lesson/start`) | Missing | No such route exists under `src/app/api` [2] |
| Lumi preparation screen for first-time generation | Missing | Learner lesson page contains lesson chat UI, but no dedicated generation/preparation waiting screen was identified [19] |
| Phase signal processing (`[PHASE:xxx]` stripping) | Missing | No dedicated phase-signal parser found in learner lesson stack [7] [19] |
| Content signal processing (`[CONTENT:xxx]` inline render) | Partial | Content rendering exists, but not a fully evidenced inline parser/stripper protocol in Lumi chat responses [22] [19] |
| Concept card component shown at lesson start | Partial/exists | `ConceptCard` exists, but the audit does not confirm it is automatically shown at lesson start in the Lumi chat flow [47] [19] |
| Built-in game components (Match It, Fill It, True or False, Sort It) | Already exists | Present under `src/components/games` [57] [58] [59] [60] |
| XP floating animation | Missing | No dedicated floating XP reward animation component found; only XP counters and summaries exist [19] [33] |
| Session complete screen with confetti | Partial/exists | Session end summary exists, and achievements page uses celebratory visuals, but a dedicated lesson completion confetti implementation is not clearly isolated or reusable [19] [33] |
| Lyla Rae child profile (name 8, Year 4) | Missing | No hard-coded or seeded child named Lyla Rae was identified in mock data [17] [38] |
| Supabase Realtime integration for lesson generation completion | Missing | No realtime subscriptions found in codebase [5] [6] |

The largest strategic gap is that the current Lumi system is still fundamentally **session-chat driven**, whereas the next requested build requires a **lesson orchestration layer** with cached lesson structures, phase progression, generation lifecycle tracking, and realtime completion signals. The existing code provides useful foundations, but not the required architecture for that workflow.

## SECTION 9: NAMING CONVENTIONS

The naming conventions are relatively consistent. File naming follows the conventions naturally encouraged by Next.js App Router: route files are named `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, and `route.ts`, while reusable components are usually in **PascalCase filenames** such as `SubjectCard.tsx`, `ContentRenderer.tsx`, `MatchItGame.tsx`, and `AdminAssetPreview.tsx`.[2] [13] [20] [21] [39]

Component naming is consistently **PascalCase** at the exported symbol level, for example `ChildNav`, `ParentNav`, `GameRenderer`, `ConceptCard`, and `AdminContentPage`.[23] [36] [37] [47] API route directories use **kebab-case or lower-case segment naming**, such as `generate-content`, `generate-images`, `game-result`, `opening-message`, and `session-end`.[2] This is consistent with REST-style route naming in Next.js App Router.

Database access patterns are intended to use the **Supabase JavaScript client**, not raw SQL inside the application and not an ORM. Raw SQL is only present in the schema files and seed/setup scripts.[5] [6] [8] [9] [10] CSS naming is overwhelmingly Tailwind utility-based, with a few shared semantic class groupings inside component implementations, but not BEM or CSS-module-style local class naming.[4] [35]

| Area | Naming pattern |
|---|---|
| Route files | Next.js convention files: `page.tsx`, `layout.tsx`, `route.ts` [2] |
| Route segments | Lower-case and kebab-case folder names such as `generate-content`, `session-end`, `not-found` [2] |
| Components | PascalCase filenames and exports, e.g. `GameRenderer`, `UpgradeModal` [20] [43] |
| Utilities | Lower-case or kebab-like helper files in `src/lib`, e.g. `admin-auth.ts`, `mock-data.ts`, `lumi-prompt.ts` [7] [11] |
| Database queries | Supabase JS client pattern, no ORM [5] [6] |
| CSS classes | Tailwind utility classes in JSX [4] |

## SECTION 10: RISKS & CONFLICTS

Several implementation risks stand out from the current state of the codebase. The first is **architectural split-brain between demo-mode data and real backend data**. Many pages are richly implemented visually, but significant portions of the app still rely on `mock-data.ts` and `mock-content.ts` for rendering and demo behaviour rather than fully live Supabase reads and writes.[17] [18] [23] [38] This means future features can appear implemented while still lacking production data integrity.

The second risk is **partial auth consistency**. The app has Supabase client utilities, local login UX, and a separate cookie-based admin auth system, but not a single coherent authentication and authorisation model across parent, child, and admin personas.[5] [6] [11] [27] [29] Adding lesson orchestration or realtime generation features without first deciding which identity/session model governs them could create conflicts.

The third risk is **content schema looseness**. The Session 4 admin tooling already needed a fallback preview system because generated content does not always match the expected learner-facing schemas.[13] [23] [24] If the next build depends on deterministic rendering of lesson phases and inline content assets, the prompt contracts and asset validation layer will need to be stricter than they are now.

The fourth risk is **absence of lesson lifecycle tables and realtime support**. The requested future work assumes a generation cache, phase tracking, and realtime completion notifications, but none of these foundations currently exist.[5] [6] [8] [9] [10] That means the next session will be additive at both the database and runtime orchestration layers, not just UI enhancement.

The fifth risk is **billing integration incompleteness**. Stripe checkout and webhook endpoints exist, but the webhook handler still contains comments such as “In production: Update families table in Supabase,” indicating that subscription status changes are not fully persisted yet.[14] [67] This could conflict with any new feature gating tied to tier enforcement.

Finally, there is a **runtime stability note** around dynamic rendering. Earlier build output for `/api/lumi/opening-message` showed a Next.js dynamic server usage warning caused by reading `request.url`, which suggests some API handlers may still require explicit dynamic route configuration or cleanup for production-hardening.[65]

## SUMMARY TABLE

| Already exists | Needs to be built |
|---|---|
| Next.js 14 App Router foundation | `topic_lesson_structures` table |
| Tailwind, Framer Motion, Lucide UI system | `lesson_phase_tracking` table |
| Supabase browser/server client utilities | `/api/lesson/generate` |
| Lumi chat UI and Anthropic-backed chat routes | `/api/lesson/start` |
| Opening message and session-end endpoints | 7-phase lesson arc controller in Lumi prompt |
| Topic assets content system | Phase signal parsing and stripping |
| Concept card, real-world card, video player | Robust inline content signal parsing in Lumi chat |
| Built-in mini-games (Match It, Sort It, Fill It, True/False, Build It, Quick Fire) | First-time lesson generation preparation screen |
| Interactive diagrams and renderers | Supabase Realtime integration for generation completion |
| Parent dashboard, achievements, progress, pricing | Production-grade unified auth/session model |
| Admin content dashboard and generation tools | Strict schema validation for generated learning assets |
| Stripe checkout/webhook scaffolding | Fully persisted subscription updates |

## References

[1]: /home/ubuntu/luminary/package.json "luminary/package.json"
[2]: /home/ubuntu/luminary/src/app "luminary/src/app route inventory"
[3]: /home/ubuntu/luminary/.env.local.example "luminary/.env.local.example"
[4]: /home/ubuntu/luminary/src/app/globals.css "luminary/src/app/globals.css"
[5]: /home/ubuntu/luminary/src/lib/supabase.ts "luminary/src/lib/supabase.ts"
[6]: /home/ubuntu/luminary/src/lib/supabase-server.ts "luminary/src/lib/supabase-server.ts"
[7]: /home/ubuntu/luminary/src/lib/lumi-prompt.ts "luminary/src/lib/lumi-prompt.ts"
[8]: /home/ubuntu/luminary/supabase-schema.sql "luminary/supabase-schema.sql"
[9]: /home/ubuntu/luminary/supabase-schema-session3.sql "luminary/supabase-schema-session3.sql"
[10]: /home/ubuntu/luminary/supabase-schema-session4.sql "luminary/supabase-schema-session4.sql"
[11]: /home/ubuntu/luminary/src/lib/admin-auth.ts "luminary/src/lib/admin-auth.ts"
[12]: /home/ubuntu/luminary/src/app/api/admin/login/route.ts "luminary/src/app/api/admin/login/route.ts"
[13]: /home/ubuntu/luminary/src/components/admin/AdminAssetPreview.tsx "luminary/src/components/admin/AdminAssetPreview.tsx"
[14]: /home/ubuntu/luminary/src/app/api/stripe/checkout/route.ts "luminary/src/app/api/stripe/checkout/route.ts"
[15]: /home/ubuntu/luminary/src/app/api/reports/generate/route.ts "luminary/src/app/api/reports/generate/route.ts"
[16]: /home/ubuntu/luminary/src/app/api/lumi/chat/route.ts "luminary/src/app/api/lumi/chat/route.ts"
[17]: /home/ubuntu/luminary/src/app/learn/page.tsx "luminary/src/app/learn/page.tsx"
[18]: /home/ubuntu/luminary/src/app/learn/[slug]/page.tsx "luminary/src/app/learn/[slug]/page.tsx"
[19]: /home/ubuntu/luminary/src/app/learn/[slug]/[topic]/page.tsx "luminary/src/app/learn/[slug]/[topic]/page.tsx"
[20]: /home/ubuntu/luminary/src/components/games/GameRenderer.tsx "luminary/src/components/games/GameRenderer.tsx"
[21]: /home/ubuntu/luminary/src/components/diagrams/DiagramRenderer.tsx "luminary/src/components/diagrams/DiagramRenderer.tsx"
[22]: /home/ubuntu/luminary/src/components/content/ContentRenderer.tsx "luminary/src/components/content/ContentRenderer.tsx"
[23]: /home/ubuntu/luminary/src/app/admin/content/page.tsx "luminary/src/app/admin/content/page.tsx"
[24]: /home/ubuntu/luminary/src/app/api/admin/generate-content/route.ts "luminary/src/app/api/admin/generate-content/route.ts"
[25]: /home/ubuntu/luminary/src/app/pricing/page.tsx "luminary/src/app/pricing/page.tsx"
[26]: /home/ubuntu/luminary/src/app/page.tsx "luminary/src/app/page.tsx"
[27]: /home/ubuntu/luminary/src/app/auth/login/page.tsx "luminary/src/app/auth/login/page.tsx"
[28]: /home/ubuntu/luminary/src/app/auth/signup/page.tsx "luminary/src/app/auth/signup/page.tsx"
[29]: /home/ubuntu/luminary/src/app/admin/layout.tsx "luminary/src/app/admin/layout.tsx"
[30]: /home/ubuntu/luminary/src/app/auth/onboarding/page.tsx "luminary/src/app/auth/onboarding/page.tsx"
[31]: /home/ubuntu/luminary/src/app/parent/page.tsx "luminary/src/app/parent/page.tsx"
[32]: /home/ubuntu/luminary/src/app/progress/page.tsx "luminary/src/app/progress/page.tsx"
[33]: /home/ubuntu/luminary/src/app/achievements/page.tsx "luminary/src/app/achievements/page.tsx"
[34]: /home/ubuntu/luminary/src/app/profile/page.tsx "luminary/src/app/profile/page.tsx"
[35]: /home/ubuntu/luminary/src/components/ui/Input.tsx "luminary/src/components/ui/Input.tsx"
[36]: /home/ubuntu/luminary/src/components/layout/ChildNav.tsx "luminary/src/components/layout/ChildNav.tsx"
[37]: /home/ubuntu/luminary/src/components/layout/ParentNav.tsx "luminary/src/components/layout/ParentNav.tsx"
[38]: /home/ubuntu/luminary/src/lib/mock-data.ts "luminary/src/lib/mock-data.ts"
[39]: /home/ubuntu/luminary/src/components/child/SubjectCard.tsx "luminary/src/components/child/SubjectCard.tsx"
[40]: /home/ubuntu/luminary/src/app/demo/page.tsx "luminary/src/app/demo/page.tsx"
[41]: /home/ubuntu/luminary/src/components/ui/Starfield.tsx "luminary/src/components/ui/Starfield.tsx"
[42]: /home/ubuntu/luminary/src/components/ui/Card.tsx "luminary/src/components/ui/Card.tsx"
[43]: /home/ubuntu/luminary/src/components/ui/UpgradeModal.tsx "luminary/src/components/ui/UpgradeModal.tsx"
[44]: /home/ubuntu/luminary/src/components/ui/Skeleton.tsx "luminary/src/components/ui/Skeleton.tsx"
[45]: /home/ubuntu/luminary/src/components/ui/EmptyState.tsx "luminary/src/components/ui/EmptyState.tsx"
[46]: /home/ubuntu/luminary/src/components/ui/ErrorState.tsx "luminary/src/components/ui/ErrorState.tsx"
[47]: /home/ubuntu/luminary/src/components/content/ConceptCard.tsx "luminary/src/components/content/ConceptCard.tsx"
[48]: /home/ubuntu/luminary/src/components/content/RealWorldCard.tsx "luminary/src/components/content/RealWorldCard.tsx"
[49]: /home/ubuntu/luminary/src/components/content/VideoPlayer.tsx "luminary/src/components/content/VideoPlayer.tsx"
[50]: /home/ubuntu/luminary/src/components/diagrams/FractionBar.tsx "luminary/src/components/diagrams/FractionBar.tsx"
[51]: /home/ubuntu/luminary/src/components/diagrams/Timeline.tsx "luminary/src/components/diagrams/Timeline.tsx"
[52]: /home/ubuntu/luminary/src/components/diagrams/LabelledDiagram.tsx "luminary/src/components/diagrams/LabelledDiagram.tsx"
[53]: /home/ubuntu/luminary/src/components/diagrams/SortingVisual.tsx "luminary/src/components/diagrams/SortingVisual.tsx"
[54]: /home/ubuntu/luminary/src/components/diagrams/NumberLine.tsx "luminary/src/components/diagrams/NumberLine.tsx"
[55]: /home/ubuntu/luminary/src/components/games/GameWrapper.tsx "luminary/src/components/games/GameWrapper.tsx"
[56]: /home/ubuntu/luminary/src/components/games/GameResults.tsx "luminary/src/components/games/GameResults.tsx"
[57]: /home/ubuntu/luminary/src/components/games/MatchItGame.tsx "luminary/src/components/games/MatchItGame.tsx"
[58]: /home/ubuntu/luminary/src/components/games/SortItGame.tsx "luminary/src/components/games/SortItGame.tsx"
[59]: /home/ubuntu/luminary/src/components/games/FillItGame.tsx "luminary/src/components/games/FillItGame.tsx"
[60]: /home/ubuntu/luminary/src/components/games/TrueFalseGame.tsx "luminary/src/components/games/TrueFalseGame.tsx"
[61]: /home/ubuntu/luminary/src/components/games/BuildItGame.tsx "luminary/src/components/games/BuildItGame.tsx"
[62]: /home/ubuntu/luminary/src/components/games/QuickFireGame.tsx "luminary/src/components/games/QuickFireGame.tsx"
[63]: /home/ubuntu/luminary/src/app/api/content/generate-worksheet/route.ts "luminary/src/app/api/content/generate-worksheet/route.ts"
[64]: /home/ubuntu/luminary/src/app/api/content/game-result/route.ts "luminary/src/app/api/content/game-result/route.ts"
[65]: /home/ubuntu/luminary/src/app/api/lumi/opening-message/route.ts "luminary/src/app/api/lumi/opening-message/route.ts"
[66]: /home/ubuntu/luminary/src/app/api/lumi/session-end/route.ts "luminary/src/app/api/lumi/session-end/route.ts"
[67]: /home/ubuntu/luminary/src/app/api/stripe/webhook/route.ts "luminary/src/app/api/stripe/webhook/route.ts"
