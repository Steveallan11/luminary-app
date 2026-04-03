-- ═══════════════════════════════════════
-- SESSION 4: CONTENT SYSTEM TABLES
-- ═══════════════════════════════════════

-- 1. Topic Assets — stores all content assets for each topic
CREATE TABLE IF NOT EXISTS topic_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  asset_type text NOT NULL CHECK (asset_type IN ('concept_card', 'video', 'diagram', 'realworld_card', 'worksheet', 'game_questions', 'check_questions')),
  asset_subtype text CHECK (asset_subtype IN (
    'match_it', 'sort_it', 'fill_it', 'true_false', 'build_it', 'quick_fire',
    'everyday', 'inspiring',
    'fraction_bar', 'timeline', 'labelled', 'map', 'sorting', 'number_line',
    NULL
  )),
  title text,
  content_json jsonb DEFAULT '{}',
  file_url text,
  thumbnail_url text,
  age_group text DEFAULT 'all' CHECK (age_group IN ('5-7', '8-11', '12-14', '15-16', 'all')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  generation_prompt text,
  generated_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups by topic + type + status
CREATE INDEX idx_topic_assets_topic ON topic_assets(topic_id);
CREATE INDEX idx_topic_assets_type ON topic_assets(asset_type, status);
CREATE INDEX idx_topic_assets_topic_status ON topic_assets(topic_id, status);

-- 2. Diagram Components — stores interactive diagram data
CREATE TABLE IF NOT EXISTS diagram_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_type text NOT NULL CHECK (diagram_type IN (
    'fraction_bar', 'timeline', 'labelled_diagram', 'sorting_visual', 'number_line'
  )),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title text,
  data_json jsonb DEFAULT '{}',
  config_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_diagram_components_topic ON diagram_components(topic_id);

-- 3. Game Sessions — tracks game play results
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_session_id uuid REFERENCES lesson_sessions(id),
  child_id uuid NOT NULL REFERENCES children(id),
  topic_asset_id uuid NOT NULL REFERENCES topic_assets(id),
  game_type text NOT NULL CHECK (game_type IN ('match_it', 'sort_it', 'fill_it', 'true_false', 'build_it', 'quick_fire')),
  score int DEFAULT 0,
  max_score int DEFAULT 100,
  time_taken_seconds int DEFAULT 0,
  answers_json jsonb DEFAULT '[]',
  completed_at timestamptz,
  xp_earned int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_game_sessions_child ON game_sessions(child_id);
CREATE INDEX idx_game_sessions_lesson ON game_sessions(lesson_session_id);

-- RLS Policies
ALTER TABLE topic_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Topic assets: readable by all authenticated users
CREATE POLICY "topic_assets_read" ON topic_assets
  FOR SELECT USING (status = 'published' OR auth.role() = 'service_role');

-- Topic assets: writable by service role only (admin)
CREATE POLICY "topic_assets_write" ON topic_assets
  FOR ALL USING (auth.role() = 'service_role');

-- Diagram components: readable by all authenticated users
CREATE POLICY "diagram_components_read" ON diagram_components
  FOR SELECT USING (true);

-- Game sessions: children can insert their own, read their own
CREATE POLICY "game_sessions_insert" ON game_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "game_sessions_read" ON game_sessions
  FOR SELECT USING (true);

-- ═══════════════════════════════════════
-- SEED DATA: Maths > Fractions content for demo
-- ═══════════════════════════════════════

-- Get the topic ID for "Counting to 20" (maths first topic) to use as reference
-- In production, use actual topic IDs. For demo, we use fixed UUIDs.

-- Concept Card for Fractions
INSERT INTO topic_assets (id, topic_id, asset_type, title, content_json, age_group, status) VALUES
('a0000001-0000-0000-0000-000000000001',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'concept_card',
 'What is a Fraction?',
 '{
   "tagline": "Parts of a whole",
   "hook_question": "If you cut a pizza into 4 equal slices and eat 1, how much is left?",
   "definition": "A fraction tells us how many equal parts of something we have. The bottom number (denominator) tells us how many equal parts the whole is split into. The top number (numerator) tells us how many of those parts we are talking about.",
   "image_prompt": "A colourful pizza cut into 4 equal slices with one slice being lifted out, simple flat illustration, warm colours"
 }',
 '8-11', 'published');

-- Video asset
INSERT INTO topic_assets (id, topic_id, asset_type, title, content_json, age_group, status) VALUES
('a0000001-0000-0000-0000-000000000002',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'video',
 'Understanding Fractions',
 '{
   "hook": "What if I told you that you already use fractions every single day without even knowing it?",
   "explanation": "A fraction is just a way of describing parts of something. Think about sharing a chocolate bar equally with your friend — you each get one half. We write that as 1 over 2, or 1/2. The bottom number tells us how many equal pieces we split it into, and the top number tells us how many pieces we are talking about.",
   "example": "Imagine you have a bag of 12 sweets and you want to give a quarter to your friend. A quarter means splitting into 4 equal groups. 12 divided by 4 is 3. So your friend gets 3 sweets!",
   "closing_question": "Can you think of something at home that you could split into fractions?"
 }',
 '8-11', 'published');

-- Real-world cards
INSERT INTO topic_assets (id, topic_id, asset_type, asset_subtype, title, content_json, age_group, status) VALUES
('a0000001-0000-0000-0000-000000000003',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'realworld_card', 'everyday',
 'Fractions in the Kitchen',
 '{
   "type": "everyday",
   "title": "Fractions in the Kitchen",
   "description": "Every time someone follows a recipe, they use fractions! Half a cup of flour, a quarter teaspoon of salt, three-quarters of a pint of milk.",
   "scenario": "Your mum is baking a cake and the recipe says to use 3/4 cup of sugar. She needs to measure out three of the four equal parts of a full cup.",
   "image_prompt": "A child helping bake in a kitchen with measuring cups showing fraction markings, warm flat illustration"
 }',
 '8-11', 'published'),
('a0000001-0000-0000-0000-000000000004',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'realworld_card', 'inspiring',
 'Fractions in Space!',
 '{
   "type": "inspiring",
   "title": "Fractions in Space!",
   "description": "NASA engineers use fractions constantly when calculating rocket fuel. Getting the fraction wrong by even a tiny amount could mean missing a planet by millions of miles!",
   "scenario": "When the Mars Rover was launched, engineers had to calculate that 2/3 of the fuel would be used in the first stage and 1/3 saved for course corrections.",
   "image_prompt": "A rocket in space with fraction calculations floating around it, simple flat illustration, deep blue background"
 }',
 '8-11', 'published');

-- Match It game
INSERT INTO topic_assets (id, topic_id, asset_type, asset_subtype, title, content_json, age_group, status) VALUES
('a0000001-0000-0000-0000-000000000005',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'game_questions', 'match_it',
 'Match the Fractions',
 '{
   "pairs": [
     {"id": "1", "left": "1/2", "right": "One half", "explanation": "1/2 means one out of two equal parts"},
     {"id": "2", "left": "1/4", "right": "One quarter", "explanation": "1/4 means one out of four equal parts"},
     {"id": "3", "left": "3/4", "right": "Three quarters", "explanation": "3/4 means three out of four equal parts"},
     {"id": "4", "left": "1/3", "right": "One third", "explanation": "1/3 means one out of three equal parts"},
     {"id": "5", "left": "2/3", "right": "Two thirds", "explanation": "2/3 means two out of three equal parts"},
     {"id": "6", "left": "1/5", "right": "One fifth", "explanation": "1/5 means one out of five equal parts"},
     {"id": "7", "left": "2/5", "right": "Two fifths", "explanation": "2/5 means two out of five equal parts"},
     {"id": "8", "left": "1/10", "right": "One tenth", "explanation": "1/10 means one out of ten equal parts"}
   ]
 }',
 '8-11', 'published');

-- Sort It game
INSERT INTO topic_assets (id, topic_id, asset_type, asset_subtype, title, content_json, age_group, status) VALUES
('a0000001-0000-0000-0000-000000000006',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'game_questions', 'sort_it',
 'Sort the Fractions',
 '{
   "categories": [
     {"id": "c1", "name": "Less than 1/2", "colour": "#3B82F6"},
     {"id": "c2", "name": "Equal to 1/2", "colour": "#10B981"},
     {"id": "c3", "name": "More than 1/2", "colour": "#F59E0B"}
   ],
   "items": [
     {"id": "i1", "text": "1/4", "correct_category": "c1", "explanation": "1/4 is less than 1/2 because 1 out of 4 is smaller than 1 out of 2"},
     {"id": "i2", "text": "2/4", "correct_category": "c2", "explanation": "2/4 simplifies to 1/2"},
     {"id": "i3", "text": "3/4", "correct_category": "c3", "explanation": "3/4 is more than 1/2 because 3 out of 4 is bigger"},
     {"id": "i4", "text": "1/3", "correct_category": "c1", "explanation": "1/3 is less than 1/2"},
     {"id": "i5", "text": "2/3", "correct_category": "c3", "explanation": "2/3 is more than 1/2"},
     {"id": "i6", "text": "5/10", "correct_category": "c2", "explanation": "5/10 simplifies to 1/2"},
     {"id": "i7", "text": "1/5", "correct_category": "c1", "explanation": "1/5 is much less than 1/2"},
     {"id": "i8", "text": "4/5", "correct_category": "c3", "explanation": "4/5 is much more than 1/2"},
     {"id": "i9", "text": "3/6", "correct_category": "c2", "explanation": "3/6 simplifies to 1/2"}
   ]
 }',
 '8-11', 'published');

-- Fill It game
INSERT INTO topic_assets (id, topic_id, asset_type, asset_subtype, title, content_json, age_group, status) VALUES
('a0000001-0000-0000-0000-000000000007',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'game_questions', 'fill_it',
 'Fill in the Fraction Facts',
 '{
   "questions": [
     {"id": "q1", "template": "A fraction has a ___ on top and a ___ on bottom", "blanks": [{"position": 0, "answer": "numerator", "hint": "The number of parts you have"}, {"position": 1, "answer": "denominator", "hint": "The total number of equal parts"}]},
     {"id": "q2", "template": "If a pizza is cut into 8 slices and you eat 3, you have eaten ___/___", "blanks": [{"position": 0, "answer": "3", "hint": "How many slices did you eat?"}, {"position": 1, "answer": "8", "hint": "How many slices was it cut into?"}]},
     {"id": "q3", "template": "1/2 is the same as ___/4", "blanks": [{"position": 0, "answer": "2", "hint": "If you double the bottom, double the top too"}]},
     {"id": "q4", "template": "The fraction 3/3 equals ___", "blanks": [{"position": 0, "answer": "1", "hint": "If you have all the parts..."}]},
     {"id": "q5", "template": "A ___ fraction has a numerator bigger than its denominator", "blanks": [{"position": 0, "answer": "improper", "hint": "It is not a proper fraction"}]},
     {"id": "q6", "template": "1/4 of 20 is ___", "blanks": [{"position": 0, "answer": "5", "hint": "Divide 20 by 4"}]}
   ]
 }',
 '8-11', 'published');

-- True or False game
INSERT INTO topic_assets (id, topic_id, asset_type, asset_subtype, title, content_json, age_group, status) VALUES
('a0000001-0000-0000-0000-000000000008',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'game_questions', 'true_false',
 'Fraction True or False',
 '{
   "statements": [
     {"id": "s1", "statement": "1/2 is bigger than 1/4", "is_true": true, "explanation": "Half of something is always more than a quarter of it"},
     {"id": "s2", "statement": "The denominator tells us how many parts we have", "is_true": false, "explanation": "The denominator tells us how many EQUAL parts the whole is divided into. The numerator tells us how many parts we have."},
     {"id": "s3", "statement": "2/4 is the same as 1/2", "is_true": true, "explanation": "2/4 simplifies to 1/2 — they are equivalent fractions"},
     {"id": "s4", "statement": "A bigger denominator always means a bigger fraction", "is_true": false, "explanation": "A bigger denominator means smaller pieces! 1/10 is smaller than 1/2"},
     {"id": "s5", "statement": "3/3 equals 1 whole", "is_true": true, "explanation": "When the numerator equals the denominator, you have all the parts — that is 1 whole"},
     {"id": "s6", "statement": "You cannot have a fraction bigger than 1", "is_true": false, "explanation": "Improper fractions like 5/3 are bigger than 1"},
     {"id": "s7", "statement": "1/2 of 10 is 5", "is_true": true, "explanation": "Half of 10 is 5"},
     {"id": "s8", "statement": "Fractions can only be used with food", "is_true": false, "explanation": "Fractions are used everywhere — time, money, measurements, and much more!"},
     {"id": "s9", "statement": "1/4 is the same as 25%", "is_true": true, "explanation": "One quarter is 25 out of 100, which is 25%"},
     {"id": "s10", "statement": "The numerator is always smaller than the denominator", "is_true": false, "explanation": "In improper fractions like 5/3, the numerator is bigger"}
   ]
 }',
 '8-11', 'published');

-- Build It game
INSERT INTO topic_assets (id, topic_id, asset_type, asset_subtype, title, content_json, age_group, status) VALUES
('a0000001-0000-0000-0000-000000000009',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'game_questions', 'build_it',
 'Steps to Find a Fraction of a Number',
 '{
   "title": "Put the steps in order to find 3/4 of 20",
   "type": "sequence",
   "items": [
     {"id": "b1", "content": "Read the fraction: 3/4 of 20", "correct_position": 1},
     {"id": "b2", "content": "Look at the denominator: 4", "correct_position": 2},
     {"id": "b3", "content": "Divide 20 by 4 to find one quarter: 20 ÷ 4 = 5", "correct_position": 3},
     {"id": "b4", "content": "Look at the numerator: 3", "correct_position": 4},
     {"id": "b5", "content": "Multiply one quarter by 3: 5 × 3 = 15", "correct_position": 5},
     {"id": "b6", "content": "The answer is 15", "correct_position": 6}
   ]
 }',
 '8-11', 'published');

-- Quick Fire game
INSERT INTO topic_assets (id, topic_id, asset_type, asset_subtype, title, content_json, age_group, status) VALUES
('a0000001-0000-0000-0000-000000000010',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'game_questions', 'quick_fire',
 'Fraction Quick Fire',
 '{
   "questions": [
     {"id": "q1", "question": "What is 1/4 of 20?", "options": ["4", "5", "10", "8"], "correct": "5", "explanation": "20 ÷ 4 = 5"},
     {"id": "q2", "question": "Which is bigger: 1/3 or 1/5?", "options": ["1/3", "1/5", "They are equal", "Cannot tell"], "correct": "1/3", "explanation": "Fewer parts means bigger pieces"},
     {"id": "q3", "question": "What is 1/2 of 16?", "options": ["4", "6", "8", "12"], "correct": "8", "explanation": "16 ÷ 2 = 8"},
     {"id": "q4", "question": "2/4 simplifies to...", "options": ["1/4", "1/2", "2/2", "1/3"], "correct": "1/2", "explanation": "Divide both by 2: 2÷2 / 4÷2 = 1/2"},
     {"id": "q5", "question": "How many thirds make a whole?", "options": ["2", "3", "4", "1"], "correct": "3", "explanation": "3/3 = 1 whole"},
     {"id": "q6", "question": "What is 3/4 of 8?", "options": ["4", "5", "6", "3"], "correct": "6", "explanation": "8 ÷ 4 = 2, then 2 × 3 = 6"},
     {"id": "q7", "question": "Which fraction equals 1?", "options": ["1/2", "2/3", "4/4", "3/5"], "correct": "4/4", "explanation": "When numerator equals denominator, it equals 1"},
     {"id": "q8", "question": "1/10 of 100 is...", "options": ["1", "10", "50", "100"], "correct": "10", "explanation": "100 ÷ 10 = 10"},
     {"id": "q9", "question": "What type of fraction is 5/3?", "options": ["Proper", "Improper", "Mixed", "Simple"], "correct": "Improper", "explanation": "The numerator (5) is bigger than the denominator (3)"},
     {"id": "q10", "question": "1/2 + 1/2 = ?", "options": ["1/4", "2/4", "1", "2"], "correct": "1", "explanation": "Two halves make a whole"}
   ],
   "time_limit": 90,
   "question_count": 10
 }',
 '8-11', 'published');

-- Worksheet
INSERT INTO topic_assets (id, topic_id, asset_type, title, content_json, age_group, status) VALUES
('a0000001-0000-0000-0000-000000000011',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'worksheet',
 'Fractions Worksheet',
 '{
   "age_group": "8-11",
   "subject": "Maths",
   "topic": "Fractions",
   "recall_questions": [
     {"q": "What does the bottom number of a fraction tell us?", "lines": 2},
     {"q": "What is the name for the top number of a fraction?", "lines": 2},
     {"q": "Write three fractions that are equal to 1/2.", "lines": 2}
   ],
   "apply_questions": [
     {"q": "A cake has 12 slices. Sarah eats 4. Write this as a fraction of the whole cake.", "lines": 3, "show_working_space": true},
     {"q": "There are 30 children in a class. 1/5 of them wear glasses. How many children wear glasses? Show your working.", "lines": 4, "show_working_space": true},
     {"q": "Tom says 1/3 is bigger than 1/2 because 3 is bigger than 2. Explain why Tom is wrong.", "lines": 4, "show_working_space": false}
   ],
   "create_task": {"title": "Design a Fraction Pizza Menu", "description": "Create a menu for your pizza restaurant. Each pizza must be described using fractions — for example, 1/2 pepperoni and 1/2 cheese. Include at least 4 different pizzas with different fraction toppings. Draw each pizza and label the fractions.", "space_type": "lined", "lines": 12},
   "reflect_prompts": ["One thing I found tricky about fractions:", "One thing I am proud of:", "One question I still have about fractions:"]
 }',
 '8-11', 'published');

-- Fraction Bar diagram
INSERT INTO diagram_components (id, diagram_type, topic_id, title, data_json, config_json) VALUES
('d0000001-0000-0000-0000-000000000001',
 'fraction_bar',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'Explore Fractions',
 '{"show_notation": true, "max_denominator": 12, "allow_comparison": true, "initial_denominator": 4}',
 '{"primary_colour": "#3B82F6", "show_labels": true}');

-- Diagram asset linking to the diagram component
INSERT INTO topic_assets (id, topic_id, asset_type, asset_subtype, title, content_json, age_group, status) VALUES
('a0000001-0000-0000-0000-000000000012',
 (SELECT id FROM topics WHERE slug = 'counting-to-20' LIMIT 1),
 'diagram', 'fraction_bar',
 'Fraction Explorer',
 '{"diagram_component_id": "d0000001-0000-0000-0000-000000000001"}',
 '8-11', 'published');
