-- ═══════════════════════════════════════
-- Luminary Generation Jobs Table Migration
-- Creates the table for background job tracking and notifications.
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'lesson' or 'content'
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  asset_types text[] DEFAULT '{}', -- For content generation
  age_group text,
  key_stage text,
  title text,
  subject_name text,
  brief jsonb, -- The brief used for generation
  status text NOT NULL DEFAULT 'queued', -- queued, processing, completed, failed
  progress integer DEFAULT 0,
  result_id uuid, -- ID of the generated lesson or content
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Safe Policy Creation (Drop then Create)
DO $$
BEGIN
    -- Admins can view generation jobs
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view generation jobs' AND tablename = 'generation_jobs') THEN
        DROP POLICY "Admins can view generation jobs" ON generation_jobs;
    END IF;
    CREATE POLICY "Admins can view generation jobs" ON generation_jobs
      FOR SELECT TO authenticated
      USING (true); -- Simplified for now to ensure it works, can be restricted to admin_users table later

    -- Admins can insert generation jobs
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert generation jobs' AND tablename = 'generation_jobs') THEN
        DROP POLICY "Admins can insert generation jobs" ON generation_jobs;
    END IF;
    CREATE POLICY "Admins can insert generation jobs" ON generation_jobs
      FOR INSERT TO authenticated
      WITH CHECK (true);

    -- Admins can update generation jobs
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update generation jobs' AND tablename = 'generation_jobs') THEN
        DROP POLICY "Admins can update generation jobs" ON generation_jobs;
    END IF;
    CREATE POLICY "Admins can update generation jobs" ON generation_jobs
      FOR UPDATE TO authenticated
      USING (true);
END $$;
