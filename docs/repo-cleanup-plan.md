# Repo Cleanup Plan

## Purpose
The goal is to stabilize the repo so that it can be safely rerun from `main` without pulling in stale admin features. This work deliberately stops short of new lesson or admin capabilities and focuses instead on hygiene, documentation, and build reliability.

## Current Clean-up Steps
1. **Repo hygiene.** Removed tracked transient files where they existed and expanded `.gitignore` to capture `.env`, `.tmp-dev-server.*`, local logs, and verification artifacts so they do not accidentally reappear.
2. **Docs reorganization.** Added a lightweight status/plan log plus a dedicated environment contract reference while keeping archival material under `docs/archive/`.
3. **Environment alignment.** Standardized Supabase URL handling around `NEXT_PUBLIC_SUPABASE_URL` plus the service-role key so every lib/helper sees the same contract (the new environment doc spells out the values).
4. **Build stabilization.** Added a basic `.eslintrc.json`, fixed the `personalisaton_hooks` typing in `generate-lesson-logic.ts`, and ensured the pipeline can persist those hooks without TypeScript drift.

## Follow-up Decisions
- Manually close the stale `v0` branch/PR mentioned inside the handover summary.
- Decide whether to discard or supersede the open Codex PR (#14) that currently diverges from `main`.
- Continue to monitor the layout/font warnings uncovered during lint so they do not resurface in CI.
