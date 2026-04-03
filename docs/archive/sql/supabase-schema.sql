-- ═══════════════════════════════════════
-- LUMINARY - Supabase Schema
-- ═══════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════

-- Families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 5 AND age <= 16),
  year_group TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'fox',
  learning_mode TEXT NOT NULL DEFAULT 'full_homeschool' CHECK (learning_mode IN ('full_homeschool', 'school_supplement')),
  pin_hash TEXT NOT NULL,
  xp_total INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  streak_last_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_emoji TEXT NOT NULL,
  colour_hex TEXT NOT NULL,
  description TEXT NOT NULL,
  min_year INTEGER DEFAULT 1,
  max_year INTEGER DEFAULT 11,
  is_future_skill BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  key_stage TEXT,
  estimated_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child topic progress
CREATE TABLE child_topic_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
  mastery_score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, topic_id)
);

-- Lesson sessions
CREATE TABLE lesson_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  xp_earned INTEGER DEFAULT 0,
  summary_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_sessions ENABLE ROW LEVEL SECURITY;

-- Families: parents can only see their own family
CREATE POLICY "Parents can view own family" ON families
  FOR SELECT USING (auth.uid() = parent_user_id);
CREATE POLICY "Parents can insert own family" ON families
  FOR INSERT WITH CHECK (auth.uid() = parent_user_id);
CREATE POLICY "Parents can update own family" ON families
  FOR UPDATE USING (auth.uid() = parent_user_id);

-- Children: parents can manage children in their family
CREATE POLICY "Parents can view own children" ON children
  FOR SELECT USING (
    family_id IN (SELECT id FROM families WHERE parent_user_id = auth.uid())
  );
CREATE POLICY "Parents can insert children" ON children
  FOR INSERT WITH CHECK (
    family_id IN (SELECT id FROM families WHERE parent_user_id = auth.uid())
  );
CREATE POLICY "Parents can update own children" ON children
  FOR UPDATE USING (
    family_id IN (SELECT id FROM families WHERE parent_user_id = auth.uid())
  );
CREATE POLICY "Parents can delete own children" ON children
  FOR DELETE USING (
    family_id IN (SELECT id FROM families WHERE parent_user_id = auth.uid())
  );

-- Subjects: readable by everyone
CREATE POLICY "Subjects are publicly readable" ON subjects
  FOR SELECT USING (true);

-- Topics: readable by everyone
CREATE POLICY "Topics are publicly readable" ON topics
  FOR SELECT USING (true);

-- Child topic progress: parents can view/manage their children's progress
CREATE POLICY "Parents can view children progress" ON child_topic_progress
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.parent_user_id = auth.uid()
    )
  );
CREATE POLICY "Parents can manage children progress" ON child_topic_progress
  FOR ALL USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.parent_user_id = auth.uid()
    )
  );

-- Lesson sessions: parents can view their children's sessions
CREATE POLICY "Parents can view children sessions" ON lesson_sessions
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.parent_user_id = auth.uid()
    )
  );
CREATE POLICY "Parents can manage children sessions" ON lesson_sessions
  FOR ALL USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.parent_user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════
-- SEED DATA: SUBJECTS
-- ═══════════════════════════════════════

INSERT INTO subjects (name, slug, icon_emoji, colour_hex, description, min_year, max_year, is_future_skill) VALUES
  ('English', 'english', '📝', '#3B82F6', 'Reading, writing, speaking and storytelling', 1, 11, false),
  ('Maths', 'maths', '🔢', '#8B5CF6', 'Numbers, shapes, patterns and problem-solving', 1, 11, false),
  ('Science', 'science', '🔬', '#10B981', 'Exploring the natural and physical world', 1, 11, false),
  ('History', 'history', '🏛️', '#F59E0B', 'Understanding our past and how we got here', 1, 11, false),
  ('Geography', 'geography', '🌍', '#06B6D4', 'Our planet, its places and its people', 1, 11, false),
  ('Art & Design', 'art-design', '🎨', '#EC4899', 'Creating, imagining and expressing yourself', 1, 11, false),
  ('Computing', 'computing', '💻', '#6366F1', 'Digital skills, coding and understanding technology', 1, 11, false),
  ('Music', 'music', '🎵', '#F97316', 'Playing, composing and appreciating music', 1, 11, false),
  ('Languages', 'languages', '🌐', '#84CC16', 'French, Spanish and the world beyond English', 1, 11, false),
  ('AI Literacy', 'ai-literacy', '🤖', '#A78BFA', 'Understanding and using artificial intelligence wisely', 3, 11, true),
  ('Financial Education', 'financial-education', '💰', '#34D399', 'Money, budgeting, saving and how the economy works', 3, 11, true),
  ('Coding & Programming', 'coding-programming', '🐍', '#60A5FA', 'Building real things with code', 3, 11, true),
  ('Entrepreneurship', 'entrepreneurship', '💼', '#FBBF24', 'Ideas, businesses and making things happen', 5, 11, true),
  ('Media Literacy', 'media-literacy', '📱', '#F87171', 'Thinking critically about news, social media and information', 3, 11, true),
  ('Environmental Science', 'environmental-science', '🌱', '#4ADE80', 'Climate, ecosystems and protecting our planet', 1, 11, true);

-- ═══════════════════════════════════════
-- SEED DATA: SAMPLE TOPICS
-- ═══════════════════════════════════════

-- English topics
INSERT INTO topics (subject_id, title, slug, description, order_index, key_stage, estimated_minutes) VALUES
  ((SELECT id FROM subjects WHERE slug = 'english'), 'Letters and Sounds', 'letters-and-sounds', 'Learn the alphabet and phonics basics', 1, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'english'), 'Reading Simple Words', 'reading-simple-words', 'Start reading three-letter words', 2, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'english'), 'Writing Your Name', 'writing-your-name', 'Practice forming letters and writing your name', 3, 'KS1', 20),
  ((SELECT id FROM subjects WHERE slug = 'english'), 'Story Time', 'story-time', 'Listen to and discuss simple stories', 4, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'english'), 'Sentence Building', 'sentence-building', 'Create simple sentences with capital letters and full stops', 5, 'KS1', 20);

-- Maths topics
INSERT INTO topics (subject_id, title, slug, description, order_index, key_stage, estimated_minutes) VALUES
  ((SELECT id FROM subjects WHERE slug = 'maths'), 'Counting to 20', 'counting-to-20', 'Count objects and numbers up to 20', 1, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'maths'), 'Addition Basics', 'addition-basics', 'Add numbers together using objects and pictures', 2, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'maths'), 'Subtraction Basics', 'subtraction-basics', 'Take away and find the difference', 3, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'maths'), 'Shapes Around Us', 'shapes-around-us', 'Identify circles, squares, triangles and rectangles', 4, 'KS1', 20),
  ((SELECT id FROM subjects WHERE slug = 'maths'), 'Measuring Length', 'measuring-length', 'Compare and measure using non-standard units', 5, 'KS1', 20);

-- Science topics
INSERT INTO topics (subject_id, title, slug, description, order_index, key_stage, estimated_minutes) VALUES
  ((SELECT id FROM subjects WHERE slug = 'science'), 'Plants and Growing', 'plants-and-growing', 'Discover how plants grow and what they need', 1, 'KS1', 20),
  ((SELECT id FROM subjects WHERE slug = 'science'), 'Animals and Habitats', 'animals-and-habitats', 'Learn about different animals and where they live', 2, 'KS1', 20),
  ((SELECT id FROM subjects WHERE slug = 'science'), 'Materials and Properties', 'materials-and-properties', 'Explore different materials and their uses', 3, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'science'), 'Seasons and Weather', 'seasons-and-weather', 'Understand the four seasons and weather patterns', 4, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'science'), 'The Human Body', 'the-human-body', 'Learn about body parts and senses', 5, 'KS1', 20);

-- History topics
INSERT INTO topics (subject_id, title, slug, description, order_index, key_stage, estimated_minutes) VALUES
  ((SELECT id FROM subjects WHERE slug = 'history'), 'My Family History', 'my-family-history', 'Explore your own family timeline', 1, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'history'), 'Famous People', 'famous-people', 'Learn about important historical figures', 2, 'KS1', 20),
  ((SELECT id FROM subjects WHERE slug = 'history'), 'The Great Fire of London', 'great-fire-of-london', 'Discover what happened in 1666', 3, 'KS1', 20),
  ((SELECT id FROM subjects WHERE slug = 'history'), 'Toys Through Time', 'toys-through-time', 'How toys have changed over the years', 4, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'history'), 'Castles and Knights', 'castles-and-knights', 'Life in medieval times', 5, 'KS2', 20);

-- Geography topics
INSERT INTO topics (subject_id, title, slug, description, order_index, key_stage, estimated_minutes) VALUES
  ((SELECT id FROM subjects WHERE slug = 'geography'), 'My Local Area', 'my-local-area', 'Explore the geography around your home', 1, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'geography'), 'Maps and Directions', 'maps-and-directions', 'Learn to read simple maps', 2, 'KS1', 20),
  ((SELECT id FROM subjects WHERE slug = 'geography'), 'Countries of the UK', 'countries-of-the-uk', 'England, Scotland, Wales and Northern Ireland', 3, 'KS1', 15),
  ((SELECT id FROM subjects WHERE slug = 'geography'), 'Hot and Cold Places', 'hot-and-cold-places', 'Discover different climates around the world', 4, 'KS1', 20),
  ((SELECT id FROM subjects WHERE slug = 'geography'), 'Oceans and Continents', 'oceans-and-continents', 'The seven continents and five oceans', 5, 'KS2', 20);
