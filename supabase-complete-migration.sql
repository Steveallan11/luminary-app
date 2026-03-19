-- ═══════════════════════════════════════
-- Luminary Complete Database Migration
-- Ensures all tables exist and applies scaling updates.
-- ═══════════════════════════════════════

-- 1. CORE TABLES (Ensure these exist first)
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL UNIQUE,
  subscription_status text DEFAULT 'free',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  age integer,
  year_group text,
  avatar text,
  pin_hash text,
  xp integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_active_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon_emoji text,
  colour_hex text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (subject_id, slug)
);

CREATE TABLE IF NOT EXISTS topic_lesson_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  age_group text NOT NULL CHECK (age_group IN ('5-7', '8-11', '12-14', '15-16')),
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'live', 'archived')),
  generation_model text DEFAULT 'claude-sonnet-4-6',
  spark_json jsonb,
  explore_json jsonb,
  anchor_json jsonb,
  practise_json jsonb,
  create_json jsonb,
  check_json jsonb,
  celebrate_json jsonb,
  personalisation_hooks jsonb,
  quality_score integer DEFAULT 0,
  times_delivered integer DEFAULT 0,
  avg_mastery_score double precision,
  auto_improvement_notes text,
  auto_approve_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (topic_id, age_group, version)
);

CREATE TABLE IF NOT EXISTS lesson_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  structure_id uuid REFERENCES topic_lesson_structures(id),
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS child_topic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  status text DEFAULT 'locked',
  created_at timestamptz DEFAULT now(),
  UNIQUE (child_id, topic_id)
);

-- 2. APPLY SCALING ALTERATIONS
ALTER TABLE topic_lesson_structures
  ADD COLUMN IF NOT EXISTS game_type text,
  ADD COLUMN IF NOT EXISTS game_content jsonb,
  ADD COLUMN IF NOT EXISTS concept_card_json jsonb,
  ADD COLUMN IF NOT EXISTS realworld_json jsonb,
  ADD COLUMN IF NOT EXISTS common_drop_off_phase text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by text;

ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS key_concepts text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS common_misconceptions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS real_world_examples text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS year_groups text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS curriculum_objectives text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lesson_generation_status text,
  ADD COLUMN IF NOT EXISTS last_generated_at timestamptz;

ALTER TABLE child_topic_progress
  ADD COLUMN IF NOT EXISTS best_mastery_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attempts_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mastery_band text DEFAULT 'not_grasped'
    CHECK (mastery_band IN ('not_grasped', 'developing', 'secure', 'strong', 'mastered')),
  ADD COLUMN IF NOT EXISTS next_revisit_at date,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;

ALTER TABLE lesson_sessions
  ADD COLUMN IF NOT EXISTS final_mastery_score integer,
  ADD COLUMN IF NOT EXISTS hints_used integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_duration_mins integer,
  ADD COLUMN IF NOT EXISTS final_phase_reached text,
  ADD COLUMN IF NOT EXISTS lumi_messages jsonb,
  ADD COLUMN IF NOT EXISTS images_shown jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS game_results jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prior_knowledge_response text,
  ADD COLUMN IF NOT EXISTS is_revisit boolean DEFAULT false;

-- 3. NEW SCALING TABLES
CREATE TABLE IF NOT EXISTS topic_lesson_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  phase text NOT NULL DEFAULT 'explore',
  source_type text NOT NULL DEFAULT 'wikimedia'
    CHECK (source_type IN ('wikimedia', 'dalle', 'google_arts', 'admin_upload')),
  public_url text NOT NULL,
  storage_path text,
  accuracy_score integer DEFAULT 0
    CHECK (accuracy_score >= 0 AND accuracy_score <= 10),
  accuracy_notes text,
  lumi_instruction text,
  search_query text,
  is_approved boolean DEFAULT false,
  is_blacklisted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS topic_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  objective_code text,
  objective_text text NOT NULL,
  key_stage text NOT NULL,
  subject_area text NOT NULL,
  is_primary boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS topic_lumi_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  age_group text NOT NULL CHECK (age_group IN ('5-7', '8-11', '12-14', '15-16')),
  teaching_approach text,
  key_vocabulary jsonb DEFAULT '[]'::jsonb,
  common_errors jsonb DEFAULT '[]'::jsonb,
  differentiation_notes text,
  visual_suggestions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (topic_id, age_group)
);

CREATE TABLE IF NOT EXISTS spaced_repetition_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  reason text DEFAULT 'spaced_review'
    CHECK (reason IN ('spaced_review', 'low_mastery', 'parent_requested', 'lumi_suggested')),
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (child_id, topic_id, scheduled_date)
);

CREATE TABLE IF NOT EXISTS safety_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id uuid REFERENCES lesson_sessions(id) ON DELETE SET NULL,
  flag_type text NOT NULL DEFAULT 'content'
    CHECK (flag_type IN ('content', 'behaviour', 'wellbeing', 'technical')),
  severity text NOT NULL DEFAULT 'low'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message_content text,
  ai_response text,
  context_json jsonb,
  is_reviewed boolean DEFAULT false,
  reviewed_by text,
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon_emoji text NOT NULL DEFAULT '⭐',
  category text NOT NULL DEFAULT 'learning'
    CHECK (category IN ('learning', 'streak', 'mastery', 'exploration', 'special')),
  criteria_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  xp_reward integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS child_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  context_json jsonb,
  UNIQUE (child_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS lumi_prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key text NOT NULL DEFAULT 'global',
  subject_override text,
  prompt_text text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT false,
  created_by text,
  notes text,
  token_estimate integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- 4. ROW LEVEL SECURITY & POLICIES
ALTER TABLE topic_lesson_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_lumi_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumi_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Safe Policy Creation (Drop then Create)
DO $$
BEGIN
    -- Achievements
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Achievements are publicly readable') THEN
        DROP POLICY "Achievements are publicly readable" ON achievements;
    END IF;
    -- Topic objectives
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Topic objectives are publicly readable') THEN
        DROP POLICY "Topic objectives are publicly readable" ON topic_objectives;
    END IF;
    -- Topic images
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Topic images are publicly readable') THEN
        DROP POLICY "Topic images are publicly readable" ON topic_lesson_images;
    END IF;
    -- Topic lumi context
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Topic lumi context is publicly readable') THEN
        DROP POLICY "Topic lumi context is publicly readable" ON topic_lumi_context;
    END IF;
    -- Child achievements
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view children achievements') THEN
        DROP POLICY "Parents can view children achievements" ON child_achievements;
    END IF;
    -- Spaced repetition
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view children spaced repetition') THEN
        DROP POLICY "Parents can view children spaced repetition" ON spaced_repetition_queue;
    END IF;
    -- Lesson images management
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage lesson images') THEN
        DROP POLICY "Authenticated users can manage lesson images" ON topic_lesson_images;
    END IF;
    -- Safety flags management
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage safety flags') THEN
        DROP POLICY "Authenticated users can manage safety flags" ON safety_flags;
    END IF;
    -- Prompt versions management
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage prompt versions') THEN
        DROP POLICY "Authenticated users can manage prompt versions" ON lumi_prompt_versions;
    END IF;
    -- Admin log management
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage admin log') THEN
        DROP POLICY "Authenticated users can manage admin log" ON admin_activity_log;
    END IF;
END $$;

CREATE POLICY "Achievements are publicly readable" ON achievements FOR SELECT USING (true);
CREATE POLICY "Topic objectives are publicly readable" ON topic_objectives FOR SELECT USING (true);
CREATE POLICY "Topic images are publicly readable" ON topic_lesson_images FOR SELECT USING (true);
CREATE POLICY "Topic lumi context is publicly readable" ON topic_lumi_context FOR SELECT USING (true);

CREATE POLICY "Parents can view children achievements" ON child_achievements FOR SELECT USING (
  child_id IN (SELECT c.id FROM children c JOIN families f ON c.family_id = f.id WHERE f.parent_user_id = auth.uid())
);

CREATE POLICY "Parents can view children spaced repetition" ON spaced_repetition_queue FOR SELECT USING (
  child_id IN (SELECT c.id FROM children c JOIN families f ON c.family_id = f.id WHERE f.parent_user_id = auth.uid())
);

CREATE POLICY "Authenticated users can manage lesson images" ON topic_lesson_images FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage safety flags" ON safety_flags FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage prompt versions" ON lumi_prompt_versions FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage admin log" ON admin_activity_log FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_topic_lesson_images_topic ON topic_lesson_images(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_lesson_images_approved ON topic_lesson_images(topic_id, is_approved) WHERE NOT is_blacklisted;
CREATE INDEX IF NOT EXISTS idx_topic_objectives_topic ON topic_objectives(topic_id);
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_child_date ON spaced_repetition_queue(child_id, scheduled_date) WHERE NOT is_completed;
CREATE INDEX IF NOT EXISTS idx_safety_flags_unreviewed ON safety_flags(created_at DESC) WHERE NOT is_reviewed;
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_child_topic ON lesson_sessions(child_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_child_topic_progress_child ON child_topic_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_topic_lesson_str_topic ON topic_lesson_structures(topic_id);
