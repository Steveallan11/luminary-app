# Environment Contract

## Supabase
- `NEXT_PUBLIC_SUPABASE_URL` — the canonical Supabase endpoint. All client (browser) helpers, server helpers, and background jobs use this single URL so there is no dual-contract confusion. Even though the prefix begins with `NEXT_PUBLIC`, the value is not exposed in production bundles because only the admin/background code consumes it directly.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the public anon key that browser helpers use for the learner UIs and admin tooling.
- `SUPABASE_SERVICE_ROLE_KEY` — the sensitive service role key that only server code (utility scripts, background jobs and authenticated admin APIs) can read. Never check this key into Git.

## AI providers
- `ANTHROPIC_API_KEY` — powers Lumi’s Claude-based lesson generation, opening messages, and some tutor prompts. Required in production for any AI flow that calls `generateLessonStructure` or `getAnthropicClient`.
- `OPENAI_API_KEY` — used for optional DALL·E 3 image generation in background asset jobs (`generate-lesson-logic.ts` posts to `/api/admin/generate-images`). Keep this key aligned with your OpenAI plan.

## Stripe
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` — the standard Stripe keys used by any payment or subscription server routes.
- `NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID` and `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` — the publishable price IDs referenced by the parent UI when presenting pricing tiers.

## Application metadata
- `NEXT_PUBLIC_APP_URL` — the canonical URL the platform serves from (default `http://localhost:3000` in local dev). Background jobs use this when constructing webhook or image-generation requests.
- Additional `NEXT_PUBLIC_*` envs should only appear if they are consumed by client code; otherwise prefer plain env names for server-only secrets.

## Guidance
1. Never commit a `.env.local` file. Always copy `.env.local.example` and fill the secrets locally.
2. Because `NEXT_PUBLIC_SUPABASE_URL` is now the single source of truth, do not add a separate `SUPABASE_URL` entry in new environments.
3. For CI or deployment, set each of these values in your secret management system (Vercel, Supabase CLI, etc.)—the repository only documents the names and expected formats.
