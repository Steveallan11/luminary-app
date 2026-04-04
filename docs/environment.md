# Environment Contract

## Tooling
- Node.js 20.x+ (the CI job uses 20.4.0); `pnpm@10.32.1` is the only supported package manager, so run `npx pnpm install` immediately after cloning and before executing other scripts.
- Use `npx pnpm lint` and `npx pnpm build` to verify the Next.js bundle; lint now runs through `eslint.config.cjs` based on `next/core-web-vitals` with the current rule set (see the config for the temporary rule relaxations).

## Supabase configuration
- **Server helpers** (API routes, service clients, scripts): use `SUPABASE_URL`. The helper `@/lib/server-env` exports `getServerSupabaseUrl()` which falls back to `NEXT_PUBLIC_SUPABASE_URL` for local scripts but otherwise throws if the server URL is missing.
- **Browser helpers** (client components, `'use client'` pages) continue to read `NEXT_PUBLIC_SUPABASE_URL` and `_ANON_KEY` so the public client works per Next.js conventions.
- `.env.local.example` now lists both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`, plus the usual `SUPABASE_SERVICE_ROLE_KEY`, Anthropic, OpenAI, Stripe, and `NEXT_PUBLIC_APP_URL`. Copy it to `.env.local` and keep it out of Git.

## Local and CI notes
- `.env`/`.env.local` remain ignored (`.gitignore` now explicitly guards `.env`, `.tmp-dev-server.*`, debug logs, and verification artifacts). Do not commit secrets.
- The CI build job now seeds both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` so server helpers have the non-public URL during workflow runs.
- Scripts in `scripts/` and manual Node commands should prefer `process.env.SUPABASE_URL` but fall back to `NEXT_PUBLIC_SUPABASE_URL` for local demos; see `scripts/check_db.js` and `scripts/seed_db.*` for examples.
