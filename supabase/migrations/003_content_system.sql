-- ═══════════════════════════════════════
-- Luminary Content System Migration
-- Adds tables for lesson media, knowledge base, admin sessions, and content links
-- ═══════════════════════════════════════

-- 1. LESSON KNOWLEDGE BASE
-- Stores reference materials, documents, and text that Lumi can use during lessons
CREATE TABLE IF NOT EXISTS lesson_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES topic_lesson_structures(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'document', 'url')),
  text_content text,
  file_url text,
  file_name text,
  file_size integer,
  description text,
  extracted_summary text,
  key_concepts text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. LESSON PHASE MEDIA
-- Stores media attachments (images, videos, GIFs) for each lesson phase
CREATE TABLE IF NOT EXISTS lesson_phase_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES topic_lesson_structures(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate')),
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

-- 3. ADMIN TEST SESSIONS
-- Tracks admin testing sessions in the Production Studio
CREATE TABLE IF NOT EXISTS admin_test_sessions (
  id text PRIMARY KEY,
  lesson_id uuid REFERENCES topic_lesson_structures(id) ON DELETE SET NULL,
  admin_email text,
  chat_transcript jsonb DEFAULT '[]'::jsonb,
  admin_notes jsonb DEFAULT '[]'::jsonb,
  refinements_applied jsonb DEFAULT '[]'::jsonb,
  variants_generated jsonb DEFAULT '[]'::jsonb,
  overall_rating integer CHECK (overall_rating IS NULL OR (overall_rating >= 1 AND overall_rating <= 5)),
  feedback_summary text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- 4. LESSON CONTENT LINKS
-- Links topic_assets to specific lesson phases
CREATE TABLE IF NOT EXISTS lesson_content_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES topic_lesson_structures(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES topic_assets(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate')),
  position integer DEFAULT 0,
  lumi_instruction text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lesson_id, asset_id, phase)
);

-- 5. TOPIC ASSETS (if not exists with all columns)
-- This table may exist partially; we add missing columns
DO $$
BEGIN
  -- Create topic_assets if it doesn't exist
  CREATE TABLE IF NOT EXISTS topic_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    asset_type text NOT NULL CHECK (asset_type IN (
      'concept_card',
      'video',
      'worksheet',
      'check_questions',
      'realworld_card',
      'game_questions',
      'diagram'
    )),
    asset_subtype text,
    title text NOT NULL,
    content jsonb NOT NULL DEFAULT '{}',
    key_stage text,
    age_group text CHECK (age_group IS NULL OR age_group IN ('5-7', '8-11', '12-14', '15-16')),
    linked_lesson_id uuid REFERENCES topic_lesson_structures(id) ON DELETE SET NULL,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Add missing columns to topic_assets if they don't exist
ALTER TABLE topic_assets 
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS linked_lesson_id uuid,
  ADD COLUMN IF NOT EXISTS key_stage text,
  ADD COLUMN IF NOT EXISTS age_group text,
  ADD COLUMN IF NOT EXISTS asset_type text,
  ADD COLUMN IF NOT EXISTS content jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_lesson_knowledge_base_lesson ON lesson_knowledge_base(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_knowledge_base_active ON lesson_knowledge_base(lesson_id, is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_lesson_phase_media_lesson ON lesson_phase_media(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_phase_media_phase ON lesson_phase_media(lesson_id, phase);
CREATE INDEX IF NOT EXISTS idx_lesson_content_links_lesson ON lesson_content_links(lesson_id);
CREATE INDEX IF NOT EXISTS idx_topic_assets_topic ON topic_assets(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_assets_type ON topic_assets(topic_id, asset_type);

-- 7. ROW LEVEL SECURITY
ALTER TABLE lesson_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_phase_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_content_links ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users full access for admin operations
-- In production, these should be tightened to specific admin roles
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Authenticated users can manage knowledge base" ON lesson_knowledge_base;
  DROP POLICY IF EXISTS "Authenticated users can manage phase media" ON lesson_phase_media;
  DROP POLICY IF EXISTS "Authenticated users can manage test sessions" ON admin_test_sessions;
  DROP POLICY IF EXISTS "Authenticated users can manage content links" ON lesson_content_links;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Authenticated users can manage knowledge base" 
  ON lesson_knowledge_base FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage phase media" 
  ON lesson_phase_media FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage test sessions" 
  ON admin_test_sessions FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage content links" 
  ON lesson_content_links FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

-- Service role can always access (for API routes)
-- This is handled by Supabase's default service role bypass

-- 8. UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lesson_knowledge_base_updated ON lesson_knowledge_base;
CREATE TRIGGER trg_lesson_knowledge_base_updated
  BEFORE UPDATE ON lesson_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_admin_test_sessions_updated ON admin_test_sessions;
CREATE TRIGGER trg_admin_test_sessions_updated
  BEFORE UPDATE ON admin_test_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
