-- Luminary Supabase Migrations
-- Run these in the Supabase SQL Editor if the automatic migration fails

-- ─── 1. lesson_phase_media ───────────────────────────────────────────────────
-- Stores images, videos, GIFs, and text edits attached to lesson phases
-- by admins in the Production Studio.

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

-- Index for fast lookup by lesson + phase
CREATE INDEX IF NOT EXISTS idx_lesson_phase_media_lesson_phase
  ON lesson_phase_media(lesson_id, phase);

-- ─── 2. lesson_knowledge_base ────────────────────────────────────────────────
-- Stores documents, images, videos, and notes that Lumi uses as context
-- during lessons.

CREATE TABLE IF NOT EXISTS lesson_knowledge_base (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES topic_lesson_structures(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'document', 'url')),
  text_content text,
  file_url text,
  file_name text,
  file_size integer,
  description text,
  extracted_summary text,
  key_concepts text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─── 3. admin_test_sessions ──────────────────────────────────────────────────
-- Stores admin test session data: chat transcripts, notes, refinements.

CREATE TABLE IF NOT EXISTS admin_test_sessions (
  id text PRIMARY KEY,
  lesson_id uuid REFERENCES topic_lesson_structures(id) ON DELETE SET NULL,
  admin_email text,
  chat_transcript jsonb DEFAULT '[]'::jsonb,
  admin_notes jsonb DEFAULT '[]'::jsonb,
  refinements_applied jsonb DEFAULT '[]'::jsonb,
  variants_generated jsonb DEFAULT '[]'::jsonb,
  overall_rating integer,
  feedback_summary text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- ─── 4. topic_assets extra columns ──────────────────────────────────────────
-- Adds columns to the existing topic_assets table.

ALTER TABLE topic_assets
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS linked_lesson_id uuid,
  ADD COLUMN IF NOT EXISTS key_stage text,
  ADD COLUMN IF NOT EXISTS age_group text,
  ADD COLUMN IF NOT EXISTS asset_type text,
  ADD COLUMN IF NOT EXISTS content jsonb;
