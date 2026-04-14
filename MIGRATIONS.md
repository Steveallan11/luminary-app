# Database Migrations Guide

This guide explains how to run database migrations for Luminary's Supabase database.

## Migration Files

The migrations are stored in `supabase/migrations/`:

1. **001_complete_schema.sql** — Core tables: families, children, subjects, topics, lessons, sessions, progress
2. **002_agent_system.sql** — Agent-related tables for content generation
3. **003_lesson_phase_media.sql** — Media storage for lesson phases (images, videos, GIFs, text edits)

## Running Migrations

### Option 1: Programmatic Migration (Recommended for Vercel)

The app includes an auto-migration endpoint that creates missing tables on demand.

**Via API:**
```bash
curl -X POST https://your-app.vercel.app/api/admin/run-migrations
```

**Via Next.js CLI (local):**
```bash
curl -X POST http://localhost:3000/api/admin/run-migrations
```

This will:
- Check which tables exist
- Create any missing tables (lesson_knowledge_base, admin_test_sessions, lesson_phase_media, lesson_content_links)
- Add missing columns to existing tables
- Return status for each table

**Response Example:**
```json
{
  "success": true,
  "results": [
    {
      "name": "lesson_phase_media",
      "status": "already_exists",
      "exists": true
    },
    {
      "name": "lesson_knowledge_base",
      "status": "needs_creation"
    }
  ]
}
```

### Option 2: Manual Migration (Supabase SQL Editor)

If programmatic migration fails, run SQL manually:

1. Go to your Supabase project → **SQL Editor**
2. Create new query
3. Copy & paste the migration SQL:

```sql
-- From supabase/migrations/003_lesson_phase_media.sql
CREATE TABLE IF NOT EXISTS lesson_phase_media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES topic_lesson_structures(id) ON DELETE CASCADE,
  phase text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'gif', 'youtube', 'text_edit')),
  url text,
  thumbnail text,
  title text,
  source text,
  lumi_instruction text,
  display_order integer DEFAULT 0,
  phase_text_override jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_phase_media_lesson_id ON lesson_phase_media(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_phase_media_active ON lesson_phase_media(is_active);
```

4. Click **Run**

### Option 3: Supabase CLI

If using Supabase CLI:

```bash
supabase db push
```

This pushes all migrations from `supabase/migrations/` to your Supabase project.

## Verifying Migrations

### Check Migration Status
```bash
curl http://localhost:3000/api/admin/run-migrations
```

### Verify in Supabase UI
1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Expected Tables
- ✅ families
- ✅ children
- ✅ subjects
- ✅ topics
- ✅ topic_lesson_structures
- ✅ lesson_sessions
- ✅ child_topic_progress
- ✅ lesson_knowledge_base
- ✅ admin_test_sessions
- ✅ lesson_phase_media
- ✅ lesson_content_links
- ✅ topic_assets

## Troubleshooting

### "table does not exist" error in lesson-media routes

**Cause:** `lesson_phase_media` table hasn't been created yet

**Fix:**
1. Run migration via `/api/admin/run-migrations` endpoint
2. Or manually create the table using the SQL above

### "Foreign key constraint violation"

**Cause:** `topic_lesson_structures` table doesn't exist or the lesson_id doesn't exist

**Fix:**
1. Ensure all migrations ran in order (001 → 002 → 003)
2. Create a lesson before adding media to it

### RLS (Row Level Security) Errors

If you get permission errors:
1. Check if RLS is enabled on the table
2. Ensure your Supabase service role key is in `.env.local`
3. Use the service role client for admin operations (which the app does automatically)

## Development Workflow

1. **Local development:**
   ```bash
   pnpm dev
   # Migrations auto-run on first use of the /api/admin/run-migrations endpoint
   ```

2. **Testing:**
   - POST to `http://localhost:3000/api/admin/run-migrations`
   - Check response for success

3. **Production (Vercel):**
   - Migrations run automatically on first POST to `/api/admin/run-migrations`
   - Safe to call multiple times (idempotent)
   - No downtime required

## Notes

- Migrations are **idempotent** — safe to run multiple times
- Use `IF NOT EXISTS` clauses to avoid errors
- Each migration should be **atomic** (one logical change)
- Always test in a development database first
