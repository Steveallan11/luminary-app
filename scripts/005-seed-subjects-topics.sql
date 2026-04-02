-- Seed initial subjects and topics for MVP
-- Run this AFTER the base schema migrations

-- ============================================
-- SUBJECTS
-- ============================================
INSERT INTO subjects (id, name, slug, description, icon, color, curriculum_tags, display_order)
VALUES 
  ('subj-maths', 'Maths', 'maths', 'Numbers, shapes, and problem solving', 'calculator', '#3B82F6', ARRAY['number', 'algebra', 'geometry', 'statistics'], 1),
  ('subj-english', 'English', 'english', 'Reading, writing, and communication', 'book-open', '#10B981', ARRAY['reading', 'writing', 'grammar', 'comprehension'], 2),
  ('subj-science', 'Science', 'science', 'Exploring the natural world', 'flask-conical', '#8B5CF6', ARRAY['biology', 'chemistry', 'physics'], 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description;

-- ============================================
-- MATHS TOPICS (Key Stage 2 focus for MVP)
-- ============================================
INSERT INTO topics (id, subject_id, title, slug, description, key_stage, year_groups, prerequisites, learning_objectives, display_order)
VALUES
  -- Fractions
  ('topic-fractions-intro', 'subj-maths', 'Introduction to Fractions', 'fractions-intro', 
   'Understanding what fractions are and how to represent them',
   'KS2', ARRAY['Year 3', 'Year 4'],
   ARRAY[]::text[],
   ARRAY['Understand that a fraction represents part of a whole', 'Identify the numerator and denominator', 'Represent fractions visually'],
   1),
  
  ('topic-fractions-equivalent', 'subj-maths', 'Equivalent Fractions', 'equivalent-fractions',
   'Finding fractions that represent the same value',
   'KS2', ARRAY['Year 4', 'Year 5'],
   ARRAY['fractions-intro'],
   ARRAY['Recognise equivalent fractions', 'Find equivalent fractions by multiplying or dividing', 'Simplify fractions to their lowest terms'],
   2),

  ('topic-fractions-add-sub', 'subj-maths', 'Adding and Subtracting Fractions', 'fractions-add-sub',
   'Operations with fractions that have the same denominator',
   'KS2', ARRAY['Year 5', 'Year 6'],
   ARRAY['fractions-intro', 'equivalent-fractions'],
   ARRAY['Add fractions with the same denominator', 'Subtract fractions with the same denominator', 'Add fractions with different denominators'],
   3),

  -- Multiplication
  ('topic-times-tables', 'subj-maths', 'Times Tables', 'times-tables',
   'Learning multiplication facts up to 12x12',
   'KS2', ARRAY['Year 3', 'Year 4'],
   ARRAY[]::text[],
   ARRAY['Recall multiplication facts for 2, 5, and 10', 'Learn times tables up to 12x12', 'Understand the relationship between multiplication and division'],
   4),

  ('topic-multiplication-methods', 'subj-maths', 'Multiplication Methods', 'multiplication-methods',
   'Different ways to multiply larger numbers',
   'KS2', ARRAY['Year 4', 'Year 5'],
   ARRAY['times-tables'],
   ARRAY['Use the grid method for multiplication', 'Use the column method for multiplication', 'Estimate answers to check calculations'],
   5),

  -- Division
  ('topic-division-intro', 'subj-maths', 'Introduction to Division', 'division-intro',
   'Understanding division as sharing and grouping',
   'KS2', ARRAY['Year 3', 'Year 4'],
   ARRAY['times-tables'],
   ARRAY['Understand division as sharing equally', 'Understand division as grouping', 'Use multiplication facts to divide'],
   6),

  -- Decimals
  ('topic-decimals-intro', 'subj-maths', 'Introduction to Decimals', 'decimals-intro',
   'Understanding decimal notation and place value',
   'KS2', ARRAY['Year 4', 'Year 5'],
   ARRAY['fractions-intro'],
   ARRAY['Understand tenths and hundredths', 'Read and write decimal numbers', 'Order decimal numbers'],
   7),

  -- Percentages
  ('topic-percentages-intro', 'subj-maths', 'Introduction to Percentages', 'percentages-intro',
   'Understanding percentages as parts of 100',
   'KS2', ARRAY['Year 5', 'Year 6'],
   ARRAY['fractions-intro', 'decimals-intro'],
   ARRAY['Understand that percent means out of 100', 'Convert between fractions, decimals and percentages', 'Find simple percentages of amounts'],
   8)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description;

-- ============================================
-- ENGLISH TOPICS
-- ============================================
INSERT INTO topics (id, subject_id, title, slug, description, key_stage, year_groups, prerequisites, learning_objectives, display_order)
VALUES
  ('topic-punctuation-basics', 'subj-english', 'Punctuation Basics', 'punctuation-basics',
   'Using full stops, capital letters, and question marks',
   'KS2', ARRAY['Year 3', 'Year 4'],
   ARRAY[]::text[],
   ARRAY['Use capital letters correctly', 'End sentences with the correct punctuation', 'Use question marks and exclamation marks'],
   1),

  ('topic-sentence-types', 'subj-english', 'Types of Sentences', 'sentence-types',
   'Statements, questions, commands, and exclamations',
   'KS2', ARRAY['Year 3', 'Year 4'],
   ARRAY['punctuation-basics'],
   ARRAY['Identify different sentence types', 'Write statements and questions', 'Use commands and exclamations effectively'],
   2),

  ('topic-paragraphs', 'subj-english', 'Writing in Paragraphs', 'paragraphs',
   'Organising ideas into clear paragraphs',
   'KS2', ARRAY['Year 4', 'Year 5'],
   ARRAY['sentence-types'],
   ARRAY['Understand why we use paragraphs', 'Start a new paragraph for a new idea', 'Use topic sentences'],
   3),

  ('topic-reading-comprehension', 'subj-english', 'Reading Comprehension', 'reading-comprehension',
   'Understanding and analyzing what you read',
   'KS2', ARRAY['Year 4', 'Year 5', 'Year 6'],
   ARRAY[]::text[],
   ARRAY['Identify main ideas in a text', 'Make inferences from the text', 'Find evidence to support answers'],
   4),

  ('topic-creative-writing', 'subj-english', 'Creative Writing', 'creative-writing',
   'Writing imaginative stories and descriptions',
   'KS2', ARRAY['Year 4', 'Year 5', 'Year 6'],
   ARRAY['paragraphs'],
   ARRAY['Plan a story with a beginning, middle, and end', 'Use descriptive language', 'Create interesting characters'],
   5)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description;

-- ============================================
-- SCIENCE TOPICS
-- ============================================
INSERT INTO topics (id, subject_id, title, slug, description, key_stage, year_groups, prerequisites, learning_objectives, display_order)
VALUES
  ('topic-living-things', 'subj-science', 'Living Things', 'living-things',
   'Understanding what makes something alive',
   'KS2', ARRAY['Year 3', 'Year 4'],
   ARRAY[]::text[],
   ARRAY['Identify the characteristics of living things', 'Classify living things into groups', 'Understand basic life processes'],
   1),

  ('topic-human-body', 'subj-science', 'The Human Body', 'human-body',
   'Learning about our bodies and how they work',
   'KS2', ARRAY['Year 3', 'Year 4'],
   ARRAY['living-things'],
   ARRAY['Identify major organs', 'Understand the skeleton and muscles', 'Learn about the digestive system'],
   2),

  ('topic-materials', 'subj-science', 'Materials and Their Properties', 'materials',
   'Exploring different materials and what they can do',
   'KS2', ARRAY['Year 4', 'Year 5'],
   ARRAY[]::text[],
   ARRAY['Identify different materials', 'Describe properties of materials', 'Choose materials for different purposes'],
   3),

  ('topic-forces', 'subj-science', 'Forces and Motion', 'forces',
   'Understanding pushes, pulls, and movement',
   'KS2', ARRAY['Year 5', 'Year 6'],
   ARRAY[]::text[],
   ARRAY['Identify forces acting on objects', 'Understand gravity and air resistance', 'Investigate friction'],
   4),

  ('topic-electricity', 'subj-science', 'Electricity', 'electricity',
   'Learning about circuits and how electricity works',
   'KS2', ARRAY['Year 4', 'Year 6'],
   ARRAY[]::text[],
   ARRAY['Identify components in a circuit', 'Construct simple circuits', 'Understand conductors and insulators'],
   5)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description;

-- ============================================
-- SAMPLE LESSON STRUCTURE (Fractions Intro)
-- This gives one working lesson out of the box
-- ============================================
INSERT INTO topic_lesson_structures (
  id, topic_id, age_group, key_stage, version, status,
  spark_json, explore_json, anchor_json, practise_json, check_json, create_json, celebrate_json,
  quality_score, teaching_approach, differentiation_notes
)
VALUES (
  'lesson-fractions-intro-8-11',
  'topic-fractions-intro',
  '8-11',
  'KS2',
  1,
  'live',
  '{
    "opening_question": "If you had a pizza and wanted to share it equally with a friend, how would you describe the piece each person gets?",
    "hook_type": "real_world",
    "visual_prompt": "Imagine cutting a pizza into equal slices",
    "discussion_points": ["What does fair sharing mean?", "How do we know the pieces are equal?"]
  }'::jsonb,
  '{
    "concepts": [
      {"id": 1, "title": "Parts of a Whole", "explanation": "A fraction shows how many equal parts we have out of the total number of parts."},
      {"id": 2, "title": "Numerator", "explanation": "The top number tells us how many parts we have."},
      {"id": 3, "title": "Denominator", "explanation": "The bottom number tells us how many equal parts the whole is divided into."}
    ],
    "examples": [
      {"visual": "1/2 of a circle shaded", "explanation": "One out of two equal parts is shaded"},
      {"visual": "3/4 of a rectangle shaded", "explanation": "Three out of four equal parts are shaded"}
    ]
  }'::jsonb,
  '{
    "key_points": [
      "The denominator tells us the total number of equal parts",
      "The numerator tells us how many parts we are talking about",
      "The line between them is called the fraction bar"
    ],
    "memory_aids": ["Think of the denominator as the DOWN number - it goes down below the line"],
    "common_misconceptions": ["A bigger denominator does not mean a bigger fraction"]
  }'::jsonb,
  '{
    "questions": [
      {"id": 1, "text": "What fraction of this shape is shaded if 2 out of 4 parts are coloured?", "answer": "2/4 or 1/2", "difficulty": "easy"},
      {"id": 2, "text": "In the fraction 3/5, what does the 5 tell us?", "answer": "The whole is divided into 5 equal parts", "difficulty": "medium"},
      {"id": 3, "text": "Write a fraction to show 3 equal parts out of 8", "answer": "3/8", "difficulty": "medium"}
    ]
  }'::jsonb,
  '{
    "questions": [
      {"id": 1, "text": "What is the numerator in 5/8?", "options": ["5", "8"], "correct": "5"},
      {"id": 2, "text": "If a cake is cut into 6 equal pieces and you eat 2, what fraction have you eaten?", "answer": "2/6"},
      {"id": 3, "text": "Draw a rectangle and shade 3/4 of it", "type": "drawing"}
    ],
    "pass_threshold": 70
  }'::jsonb,
  '{
    "activity": "Create your own fraction poster showing different fractions using pictures of food, shapes, or objects from your home",
    "extension": "Can you find fractions in real life? Look around your home and write down 3 examples"
  }'::jsonb,
  '{
    "summary": "Today you learned that fractions show parts of a whole. The numerator tells us how many parts we have, and the denominator tells us how many equal parts there are in total.",
    "next_steps": "Next time we will learn about equivalent fractions - different fractions that show the same amount!",
    "encouragement": "You have taken your first steps into the world of fractions. Well done!"
  }'::jsonb,
  85,
  'visual_concrete',
  'Use physical objects like pizza slices or chocolate bars for tactile learners'
)
ON CONFLICT (id) DO UPDATE SET
  status = 'live',
  quality_score = 85;

-- Grant necessary permissions
GRANT SELECT ON subjects TO authenticated, anon;
GRANT SELECT ON topics TO authenticated, anon;
GRANT SELECT ON topic_lesson_structures TO authenticated, anon;
