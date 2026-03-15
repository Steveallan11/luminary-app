-- ═══════════════════════════════════════
-- LUMINARY - Session 3 Schema Additions
-- ═══════════════════════════════════════

-- Add subscription fields to families
ALTER TABLE families ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'family', 'pro'));
ALTER TABLE families ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE families ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'none' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing', 'none'));
ALTER TABLE families ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Add duration_minutes to lesson_sessions
ALTER TABLE lesson_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;

-- ═══════════════════════════════════════
-- ACHIEVEMENTS TABLE
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_emoji TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS child_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, achievement_id)
);

-- RLS for achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are publicly readable" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Parents can view children achievements" ON child_achievements
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage child achievements" ON child_achievements
  FOR ALL USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.parent_user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════
-- SEED ACHIEVEMENTS
-- ═══════════════════════════════════════

-- First Steps badges
INSERT INTO achievements (name, description, icon_emoji, xp_reward, condition_type, condition_value) VALUES
  ('First Step', 'Complete your first lesson', '🐣', 10, 'lessons_completed', 1),
  ('Subject Explorer', 'Try 3 different subjects', '🌍', 15, 'subjects_tried', 3),
  ('Getting Started', 'Earn 50 XP total', '⭐', 10, 'xp_total', 50);

-- Streak badges
INSERT INTO achievements (name, description, icon_emoji, xp_reward, condition_type, condition_value) VALUES
  ('On a Roll', '3-day streak', '🔥', 20, 'streak_days', 3),
  ('Unstoppable', '7-day streak', '💪', 50, 'streak_days', 7),
  ('Legend', '30-day streak', '🏆', 200, 'streak_days', 30);

-- Mastery badges
INSERT INTO achievements (name, description, icon_emoji, xp_reward, condition_type, condition_value) VALUES
  ('Deep Diver', 'Complete all topics in one subject', '🤿', 75, 'subject_completed', 1),
  ('Renaissance Learner', 'Active in 5 different subjects', '🎨', 50, 'subjects_tried', 5),
  ('Future Ready', 'Complete a Future Skills subject', '🚀', 60, 'future_skill_completed', 1);

-- Effort badges
INSERT INTO achievements (name, description, icon_emoji, xp_reward, condition_type, condition_value) VALUES
  ('Perseverance', 'Complete a topic after using hints 3+ times', '🦁', 30, 'perseverance', 1),
  ('Marathon Learner', 'Accumulate 10 hours of learning', '⏱️', 40, 'total_hours', 10),
  ('Night Owl', 'Complete a lesson after 7pm', '🦉', 15, 'night_session', 1);
