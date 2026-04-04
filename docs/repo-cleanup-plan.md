# Repository Cleanup Plan

## Goals for this sweep
1. Keep the repo pnpm-native and free of secret artifacts.
2. Centralise planning/status documentation inside `docs/` (plus `docs/archive/`) so the root only holds runtime-critical files.
3. Lock the Supabase environment contract and ESLint/build tooling so the main branch stays stable.

## What changed
1. Removed tracked temp files (none remain) and made sure `.gitignore` explicitly blocks `.env`, `.tmp-dev-server.*`, debug logs, verification artifacts, and other temp directories.
2. Added `docs/current-status.md`, `docs/environment.md`, `docs/repo-cleanup-plan.md`, and `docs/archive/README.md` to capture the new mental model and archival policy; moved related artefacts into `docs/archive/`.
3. Introduced `SUPABASE_URL`, documented it in `.env.local.example`/README, and created `@/lib/server-env` so all server helpers (service client, generate-lesson, queue APIs, topic progress, etc.) read the same URL while clients keep using `NEXT_PUBLIC_SUPABASE_URL`.
4. Reworked `src/app/achievements/page.tsx` and `admin/library` hooks so React no longer complains about `setState` in effects; the new ESLint config extends `next/core-web-vitals` but temporarily silences the strict hooks/purity rules that would blow up the existing games and admin components.

## Outstanding housekeeping
1. The game components and the other components that depend on `Date.now`/`Math.random` still trigger the old `react-hooks/purity` rules if we re-enable them — those require a separate refactor when there is bandwidth.
2. We still need to close stale admin PRs (v0 work and `#14`) before they conflict with this cleanup run.
3. Re-run `npx pnpm lint` and `npx pnpm build` after the next round of React cleanups or before a release to confirm nothing regresses.
