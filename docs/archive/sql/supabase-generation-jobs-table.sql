-- Create generation_jobs table for background job tracking
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('lesson', 'content')),
  topic_id TEXT NOT NULL,
  asset_types TEXT[] DEFAULT NULL,
  age_group TEXT NOT NULL,
  key_stage TEXT NOT NULL,
  title TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  brief JSONB DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  result_id UUID DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON generation_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_type ON generation_jobs(type);

-- Enable RLS
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Admins can view all generation jobs" ON generation_jobs;
CREATE POLICY "Admins can view all generation jobs" ON generation_jobs
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can create generation jobs" ON generation_jobs;
CREATE POLICY "Admins can create generation jobs" ON generation_jobs
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update generation jobs" ON generation_jobs;
CREATE POLICY "Admins can update generation jobs" ON generation_jobs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add columns to topic_lesson_structures for linking
ALTER TABLE topic_lesson_structures
ADD COLUMN IF NOT EXISTS linked_content_ids UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS generation_job_id UUID DEFAULT NULL;

-- Add columns to topic_assets for linking
ALTER TABLE topic_assets
ADD COLUMN IF NOT EXISTS linked_lesson_ids UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS generation_job_id UUID DEFAULT NULL;

-- Create a view for unified library
CREATE OR REPLACE VIEW unified_library AS
SELECT
  id,
  'lesson' as type,
  title,
  subject_name as subject,
  NULL as topic,
  age_group,
  key_stage,
  status,
  quality_score,
  created_at,
  linked_content_ids as linked_items,
  generation_job_id
FROM topic_lesson_structures
UNION ALL
SELECT
  id,
  'content' as type,
  title,
  NULL as subject,
  topic_id as topic,
  age_group,
  key_stage,
  status,
  NULL as quality_score,
  created_at,
  linked_lesson_ids as linked_items,
  generation_job_id
FROM topic_assets;
