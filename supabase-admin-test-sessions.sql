-- Admin Test Sessions Table
-- Run this in your Supabase SQL Editor to enable session saving in Admin Test Mode

CREATE TABLE IF NOT EXISTS admin_test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES topic_lesson_structures(id) ON DELETE CASCADE,
  admin_email text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  chat_transcript jsonb DEFAULT '[]'::jsonb,
  admin_notes jsonb DEFAULT '[]'::jsonb,
  refinements_applied jsonb DEFAULT '[]'::jsonb,
  variants_generated jsonb DEFAULT '[]'::jsonb,
  overall_rating integer CHECK (overall_rating BETWEEN 1 AND 5),
  feedback_summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_test_sessions_lesson_id ON admin_test_sessions(lesson_id);

-- Enable Row Level Security
ALTER TABLE admin_test_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "Service role full access" ON admin_test_sessions
  FOR ALL USING (true);
