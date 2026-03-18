-- ═══════════════════════════════════════
-- Session 6: Luminary Scaling Architecture
-- Full lesson generation, Visual Lumi, scoring,
-- spaced repetition, parent dashboard, admin tools,
-- and LA reporting infrastructure.
--
-- Rules: CREATE TABLE for new tables only.
--        ALTER TABLE for columns on existing tables.
--        Never DROP or recreate existing tables.
-- ═══════════════════════════════════════

-- ═══════════════════════════════════════
-- A. ALTERATIONS TO EXISTING TABLES
-- ═══════════════════════════════════════

-- A1. topic_lesson_structures — add missing columns from scaling spec
ALTER TABLE topic_lesson_structures
  ADD COLUMN IF NOT EXISTS game_type text,
  ADD COLUMN IF NOT EXISTS game_content jsonb,
  ADD COLUMN IF NOT EXISTS concept_card_json jsonb,
  ADD COLUMN IF NOT EXISTS realworld_json jsonb,
  ADD COLUMN IF NOT EXISTS common_drop_off_phase text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by text;

-- A2. topics — add columns for lesson generation pipeline
ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS key_concepts text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS common_misconceptions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS real_world_examples text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS year_groups text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS curriculum_objectives text[] DEFAULT '{}';

-- A3. child_topic_progress — add spaced repetition and mastery band columns
ALTER TABLE child_topic_progress
  ADD COLUMN IF NOT EXISTS best_mastery_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attempts_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mastery_band text DEFAULT 'not_grasped'
    CHECK (mastery_band IN ('not_grasped', 'developing', 'secure', 'strong', 'mastered')),
  ADD COLUMN IF NOT EXISTS next_revisit_at date,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;

-- Update status check constraint to include 'mastered'
-- (Postgres doesn't support ALTER CHECK directly, so we add it if the column allows)
-- The existing check is ('locked', 'available', 'in_progress', 'completed')
-- We handle 'mastered' at application level since ALTER CHECK is complex

-- A4. lesson_sessions — add columns for richer session tracking
ALTER TABLE lesson_sessions
  ADD COLUMN IF NOT EXISTS final_mastery_score integer,
  ADD COLUMN IF NOT EXISTS hints_used integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_duration_mins integer,
  ADD COLUMN IF NOT EXISTS final_phase_reached text,
  ADD COLUMN IF NOT EXISTS lumi_messages jsonb,
  ADD COLUMN IF NOT EXISTS images_shown jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS game_results jsonb DEFAULT '[]'::jsonb;

-- A5. children — add columns for enhanced profile
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date;

-- ═══════════════════════════════════════
-- B. NEW TABLES
-- ═══════════════════════════════════════

-- B1. topic_lesson_images — Visual Lumi cached images
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

-- B2. topic_objectives — curriculum objectives per topic
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

-- B3. topic_lumi_context — teaching notes per topic
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

-- B4. spaced_repetition_queue — revisit scheduling
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

-- B5. safety_flags — AI safeguarding
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

-- B6. achievements — achievement definitions
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

-- B7. child_achievements — awarded achievements
CREATE TABLE IF NOT EXISTS child_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  context_json jsonb,
  UNIQUE (child_id, achievement_id)
);

-- B8. lumi_prompt_versions — prompt editor with version history
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

-- B9. admin_activity_log — admin audit trail
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════
-- C. ROW LEVEL SECURITY
-- ═══════════════════════════════════════

ALTER TABLE topic_lesson_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_lumi_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumi_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Public read for reference tables
CREATE POLICY IF NOT EXISTS "Achievements are publicly readable"
  ON achievements FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Topic objectives are publicly readable"
  ON topic_objectives FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Topic images are publicly readable"
  ON topic_lesson_images FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Topic lumi context is publicly readable"
  ON topic_lumi_context FOR SELECT USING (true);

-- Parent access to their children's data
CREATE POLICY IF NOT EXISTS "Parents can view children achievements"
  ON child_achievements FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.parent_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Parents can view children spaced repetition"
  ON spaced_repetition_queue FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.parent_user_id = auth.uid()
    )
  );

-- Admin full access policies (service role bypasses RLS)
CREATE POLICY IF NOT EXISTS "Authenticated users can manage lesson images"
  ON topic_lesson_images FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated users can manage safety flags"
  ON safety_flags FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated users can manage prompt versions"
  ON lumi_prompt_versions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated users can manage admin log"
  ON admin_activity_log FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- D. INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_topic_lesson_images_topic
  ON topic_lesson_images(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_lesson_images_approved
  ON topic_lesson_images(topic_id, is_approved) WHERE NOT is_blacklisted;
CREATE INDEX IF NOT EXISTS idx_topic_objectives_topic
  ON topic_objectives(topic_id);
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_child_date
  ON spaced_repetition_queue(child_id, scheduled_date) WHERE NOT is_completed;
CREATE INDEX IF NOT EXISTS idx_safety_flags_unreviewed
  ON safety_flags(created_at DESC) WHERE NOT is_reviewed;
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_child_topic
  ON lesson_sessions(child_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_child_topic_progress_child
  ON child_topic_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_topic_lesson_structures_topic_status
  ON topic_lesson_structures(topic_id, status);

-- ═══════════════════════════════════════
-- E. SEED DATA: ACHIEVEMENTS
-- ═══════════════════════════════════════

INSERT INTO achievements (slug, title, description, icon_emoji, category, criteria_json, xp_reward) VALUES
  ('first_lesson', 'First Steps', 'Completed your very first lesson', '🎉', 'learning', '{"type": "lessons_completed", "count": 1}', 25),
  ('five_lessons', 'Getting Going', 'Completed 5 lessons', '🚀', 'learning', '{"type": "lessons_completed", "count": 5}', 50),
  ('ten_lessons', 'Knowledge Seeker', 'Completed 10 lessons', '📚', 'learning', '{"type": "lessons_completed", "count": 10}', 100),
  ('first_mastery', 'First Mastery', 'Scored 90%+ on a topic for the first time', '🌟', 'mastery', '{"type": "mastery_score", "min": 90}', 50),
  ('five_masteries', 'Master Mind', 'Scored 90%+ on 5 different topics', '🧠', 'mastery', '{"type": "mastery_count", "min": 90, "count": 5}', 150),
  ('three_day_streak', 'On a Roll', 'Learned for 3 days in a row', '🔥', 'streak', '{"type": "streak_days", "count": 3}', 30),
  ('seven_day_streak', 'Week Warrior', 'Learned for 7 days in a row', '💪', 'streak', '{"type": "streak_days", "count": 7}', 75),
  ('fourteen_day_streak', 'Fortnight Force', 'Learned for 14 days in a row', '⚡', 'streak', '{"type": "streak_days", "count": 14}', 150),
  ('thirty_day_streak', 'Monthly Marvel', 'Learned for 30 days in a row', '👑', 'streak', '{"type": "streak_days", "count": 30}', 300),
  ('two_subjects', 'Explorer', 'Completed lessons in 2 different subjects', '🗺️', 'exploration', '{"type": "subjects_explored", "count": 2}', 40),
  ('four_subjects', 'Renaissance Learner', 'Completed lessons in 4 different subjects', '🎨', 'exploration', '{"type": "subjects_explored", "count": 4}', 100),
  ('perfect_game', 'Game Champion', 'Got a perfect score in a lesson game', '🏆', 'special', '{"type": "perfect_game"}', 40),
  ('no_hints', 'Independent Thinker', 'Completed a lesson without using any hints', '💡', 'special', '{"type": "no_hints_lesson"}', 35),
  ('creative_star', 'Creative Star', 'Wrote an outstanding creative piece in a lesson', '✍️', 'special', '{"type": "creative_excellence"}', 50)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════
-- F. SEED DATA: KS2 TOPICS FOR YEAR 4
-- (Lyla Rae's curriculum — the first batch)
-- ═══════════════════════════════════════

-- Maths KS2 topics
INSERT INTO topics (subject_id, title, slug, description, order_index, key_stage, estimated_minutes)
SELECT s.id, t.title, t.slug, t.description, t.order_index, 'KS2', t.est_mins
FROM subjects s
CROSS JOIN (VALUES
  ('Fractions', 'fractions', 'Understanding fractions as equal parts of a whole', 10, 20),
  ('Times Tables', 'times-tables', 'Recall and use multiplication facts', 11, 18),
  ('2D and 3D Shapes', '2d-3d-shapes', 'Identify and describe properties of shapes', 12, 20),
  ('Decimals', 'decimals', 'Understanding decimal notation and place value', 13, 20),
  ('Area and Perimeter', 'area-perimeter', 'Calculate area and perimeter of simple shapes', 14, 22),
  ('Long Division', 'long-division', 'Divide larger numbers using formal methods', 15, 25)
) AS t(title, slug, description, order_index, est_mins)
WHERE s.slug = 'maths'
AND NOT EXISTS (SELECT 1 FROM topics WHERE topics.slug = t.slug AND topics.subject_id = s.id);

-- English KS2 topics
INSERT INTO topics (subject_id, title, slug, description, order_index, key_stage, estimated_minutes)
SELECT s.id, t.title, t.slug, t.description, t.order_index, 'KS2', t.est_mins
FROM subjects s
CROSS JOIN (VALUES
  ('Powerful Adjectives', 'powerful-adjectives', 'Select and use powerful adjectives to enhance writing', 10, 20),
  ('Story Structure', 'story-structure', 'Understand the four-part story structure', 11, 22),
  ('Punctuation', 'punctuation', 'Use commas, apostrophes, and speech marks correctly', 12, 18),
  ('Figurative Language', 'figurative-language', 'Understand simile, metaphor, and personification', 13, 20),
  ('Persuasive Writing', 'persuasive-writing', 'Write to persuade using rhetorical techniques', 14, 25),
  ('Poetry', 'poetry', 'Read, analyse, and write different forms of poetry', 15, 22)
) AS t(title, slug, description, order_index, est_mins)
WHERE s.slug = 'english'
AND NOT EXISTS (SELECT 1 FROM topics WHERE topics.slug = t.slug AND topics.subject_id = s.id);

-- History KS2 topics
INSERT INTO topics (subject_id, title, slug, description, order_index, key_stage, estimated_minutes)
SELECT s.id, t.title, t.slug, t.description, t.order_index, 'KS2', t.est_mins
FROM subjects s
CROSS JOIN (VALUES
  ('Ancient Egyptians', 'ancient-egyptians', 'Explore the civilisation of Ancient Egypt', 10, 22),
  ('The Tudors', 'the-tudors', 'Life in Tudor England and key figures', 11, 22),
  ('World War II', 'world-war-ii', 'Britain during the Second World War', 12, 25),
  ('Ancient Greeks', 'ancient-greeks', 'Democracy, mythology, and Greek achievements', 13, 22),
  ('The Vikings', 'the-vikings', 'Viking raids, settlements, and legacy in Britain', 14, 22)
) AS t(title, slug, description, order_index, est_mins)
WHERE s.slug = 'history'
AND NOT EXISTS (SELECT 1 FROM topics WHERE topics.slug = t.slug AND topics.subject_id = s.id);

-- Art & Design KS2 topics
INSERT INTO topics (subject_id, title, slug, description, order_index, key_stage, estimated_minutes)
SELECT s.id, t.title, t.slug, t.description, t.order_index, 'KS2', t.est_mins
FROM subjects s
CROSS JOIN (VALUES
  ('Colour Theory', 'colour-theory', 'Primary, secondary, warm, and cool colours', 10, 18),
  ('Van Gogh', 'van-gogh', 'The life and art of Vincent van Gogh', 11, 20),
  ('Drawing Techniques', 'drawing-techniques', 'Shading, perspective, and proportion', 12, 22),
  ('Cubism and Picasso', 'cubism-picasso', 'Understanding cubism through Picasso', 13, 20),
  ('Sculpture', 'sculpture', '3D art forms and sculptural techniques', 14, 22)
) AS t(title, slug, description, order_index, est_mins)
WHERE s.slug = 'art-design'
AND NOT EXISTS (SELECT 1 FROM topics WHERE topics.slug = t.slug AND topics.subject_id = s.id);
