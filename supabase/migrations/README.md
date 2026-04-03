# Supabase Migrations

## Active Migrations (Applied to Production)

This directory contains ordered migrations for Luminary's production database.

### Migration Order

1. **`001_complete_schema.sql`** — Complete database schema
   - All core tables: families, children, subjects, topics, lessons
   - Content system: topic_assets, lesson_phase_media, diagrams
   - Gamification: achievements, spaced_repetition_queue
   - Parent/Admin: reports, generation_jobs
   - Status: **APPLIED**

2. **`002_agent_system.sql`** — Agent system tables
   - agent_tasks, agent_logs, business_metrics
   - Required for CEO dashboard and agent orchestration
   - Status: **APPLIED**

## Running Migrations

To apply migrations to a fresh Supabase project:

```bash
# In Supabase SQL Editor, run migrations in order:
psql < supabase/migrations/001_complete_schema.sql
psql < supabase/migrations/002_agent_system.sql
```

## Historical Reference

Older/experimental migrations are archived in `/docs/archive/sql/`:
- `supabase-schema.sql` — Original base schema
- `supabase-schema-session*.sql` — Evolutionary session-based additions
- `supabase-*-fixed.sql` — Point fixes (now incorporated into complete schema)

These are kept for reference only and should NOT be re-run.

## Notes

- The complete schema migration is idempotent (uses `CREATE TABLE IF NOT EXISTS`)
- All migrations have RLS (Row Level Security) policies
- Backup before running migrations on production
