import { TopicAsset, DiagramComponent, ContentManifest } from '@/types';

// ═══════════════════════════════════════
// MOCK CONTENT ASSETS FOR DEMO
// ═══════════════════════════════════════

export const MOCK_CONCEPT_CARD: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000001',
  topic_id: 'topic-maths-1',
  asset_type: 'concept_card',
  asset_subtype: null,
  title: 'What is a Fraction?',
  content_json: {
    tagline: 'Parts of a whole',
    hook_question: 'If you cut a pizza into 4 equal slices and eat 1, how much is left?',
    definition: 'A fraction tells us how many equal parts of something we have. The bottom number (denominator) tells us how many equal parts the whole is split into. The top number (numerator) tells us how many of those parts we are talking about.',
    image_prompt: 'A colourful pizza cut into 4 equal slices with one slice being lifted out',
  },
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_VIDEO_ASSET: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000002',
  topic_id: 'topic-maths-1',
  asset_type: 'video',
  asset_subtype: null,
  title: 'Understanding Fractions',
  content_json: {
    hook: 'What if I told you that you already use fractions every single day without even knowing it?',
    explanation: 'A fraction is just a way of describing parts of something. Think about sharing a chocolate bar equally with your friend — you each get one half.',
    example: 'Imagine you have a bag of 12 sweets and you want to give a quarter to your friend. A quarter means splitting into 4 equal groups. 12 divided by 4 is 3.',
    closing_question: 'Can you think of something at home that you could split into fractions?',
  },
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_REALWORLD_EVERYDAY: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000003',
  topic_id: 'topic-maths-1',
  asset_type: 'realworld_card',
  asset_subtype: 'everyday',
  title: 'Fractions in the Kitchen',
  content_json: {
    type: 'everyday',
    title: 'Fractions in the Kitchen',
    description: 'Every time someone follows a recipe, they use fractions! Half a cup of flour, a quarter teaspoon of salt, three-quarters of a pint of milk.',
    scenario: 'Your mum is baking a cake and the recipe says to use 3/4 cup of sugar. She needs to measure out three of the four equal parts of a full cup.',
    image_prompt: 'A child helping bake in a kitchen with measuring cups',
  },
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_REALWORLD_INSPIRING: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000004',
  topic_id: 'topic-maths-1',
  asset_type: 'realworld_card',
  asset_subtype: 'inspiring',
  title: 'Fractions in Space!',
  content_json: {
    type: 'inspiring',
    title: 'Fractions in Space!',
    description: 'NASA engineers use fractions constantly when calculating rocket fuel. Getting the fraction wrong by even a tiny amount could mean missing a planet by millions of miles!',
    scenario: 'When the Mars Rover was launched, engineers had to calculate that 2/3 of the fuel would be used in the first stage.',
    image_prompt: 'A rocket in space with fraction calculations floating around it',
  },
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_MATCH_IT: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000005',
  topic_id: 'topic-maths-1',
  asset_type: 'game_questions',
  asset_subtype: 'match_it',
  title: 'Match the Fractions',
  content_json: {
    pairs: [
      { id: '1', left: '1/2', right: 'One half', explanation: '1/2 means one out of two equal parts' },
      { id: '2', left: '1/4', right: 'One quarter', explanation: '1/4 means one out of four equal parts' },
      { id: '3', left: '3/4', right: 'Three quarters', explanation: '3/4 means three out of four equal parts' },
      { id: '4', left: '1/3', right: 'One third', explanation: '1/3 means one out of three equal parts' },
      { id: '5', left: '2/3', right: 'Two thirds', explanation: '2/3 means two out of three equal parts' },
      { id: '6', left: '1/5', right: 'One fifth', explanation: '1/5 means one out of five equal parts' },
      { id: '7', left: '2/5', right: 'Two fifths', explanation: '2/5 means two out of five equal parts' },
      { id: '8', left: '1/10', right: 'One tenth', explanation: '1/10 means one out of ten equal parts' },
    ],
  } as unknown as Record<string, unknown>,
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_SORT_IT: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000006',
  topic_id: 'topic-maths-1',
  asset_type: 'game_questions',
  asset_subtype: 'sort_it',
  title: 'Sort the Fractions',
  content_json: {
    categories: [
      { id: 'c1', name: 'Less than 1/2', colour: '#3B82F6' },
      { id: 'c2', name: 'Equal to 1/2', colour: '#10B981' },
      { id: 'c3', name: 'More than 1/2', colour: '#F59E0B' },
    ],
    items: [
      { id: 'i1', text: '1/4', correct_category: 'c1', explanation: '1/4 is less than 1/2' },
      { id: 'i2', text: '2/4', correct_category: 'c2', explanation: '2/4 simplifies to 1/2' },
      { id: 'i3', text: '3/4', correct_category: 'c3', explanation: '3/4 is more than 1/2' },
      { id: 'i4', text: '1/3', correct_category: 'c1', explanation: '1/3 is less than 1/2' },
      { id: 'i5', text: '2/3', correct_category: 'c3', explanation: '2/3 is more than 1/2' },
      { id: 'i6', text: '5/10', correct_category: 'c2', explanation: '5/10 simplifies to 1/2' },
      { id: 'i7', text: '1/5', correct_category: 'c1', explanation: '1/5 is much less than 1/2' },
      { id: 'i8', text: '4/5', correct_category: 'c3', explanation: '4/5 is much more than 1/2' },
      { id: 'i9', text: '3/6', correct_category: 'c2', explanation: '3/6 simplifies to 1/2' },
    ],
  } as unknown as Record<string, unknown>,
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_FILL_IT: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000007',
  topic_id: 'topic-maths-1',
  asset_type: 'game_questions',
  asset_subtype: 'fill_it',
  title: 'Fill in the Fraction Facts',
  content_json: {
    questions: [
      { id: 'q1', template: 'A fraction has a ___ on top and a ___ on bottom', blanks: [{ position: 0, answer: 'numerator', hint: 'The number of parts you have' }, { position: 1, answer: 'denominator', hint: 'The total number of equal parts' }] },
      { id: 'q2', template: 'If a pizza is cut into 8 slices and you eat 3, you have eaten ___/___', blanks: [{ position: 0, answer: '3', hint: 'How many slices did you eat?' }, { position: 1, answer: '8', hint: 'How many slices was it cut into?' }] },
      { id: 'q3', template: '1/2 is the same as ___/4', blanks: [{ position: 0, answer: '2', hint: 'If you double the bottom, double the top too' }] },
      { id: 'q4', template: 'The fraction 3/3 equals ___', blanks: [{ position: 0, answer: '1', hint: 'If you have all the parts...' }] },
      { id: 'q5', template: 'A ___ fraction has a numerator bigger than its denominator', blanks: [{ position: 0, answer: 'improper', hint: 'It is not a proper fraction' }] },
      { id: 'q6', template: '1/4 of 20 is ___', blanks: [{ position: 0, answer: '5', hint: 'Divide 20 by 4' }] },
    ],
  } as unknown as Record<string, unknown>,
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_TRUE_FALSE: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000008',
  topic_id: 'topic-maths-1',
  asset_type: 'game_questions',
  asset_subtype: 'true_false',
  title: 'Fraction True or False',
  content_json: {
    statements: [
      { id: 's1', statement: '1/2 is bigger than 1/4', is_true: true, explanation: 'Half of something is always more than a quarter of it' },
      { id: 's2', statement: 'The denominator tells us how many parts we have', is_true: false, explanation: 'The denominator tells us how many EQUAL parts the whole is divided into' },
      { id: 's3', statement: '2/4 is the same as 1/2', is_true: true, explanation: 'They are equivalent fractions' },
      { id: 's4', statement: 'A bigger denominator always means a bigger fraction', is_true: false, explanation: 'A bigger denominator means smaller pieces! 1/10 is smaller than 1/2' },
      { id: 's5', statement: '3/3 equals 1 whole', is_true: true, explanation: 'When numerator equals denominator, you have 1 whole' },
      { id: 's6', statement: 'You cannot have a fraction bigger than 1', is_true: false, explanation: 'Improper fractions like 5/3 are bigger than 1' },
      { id: 's7', statement: '1/2 of 10 is 5', is_true: true, explanation: 'Half of 10 is 5' },
      { id: 's8', statement: 'Fractions can only be used with food', is_true: false, explanation: 'Fractions are used everywhere!' },
      { id: 's9', statement: '1/4 is the same as 25%', is_true: true, explanation: 'One quarter is 25 out of 100' },
      { id: 's10', statement: 'The numerator is always smaller than the denominator', is_true: false, explanation: 'In improper fractions the numerator is bigger' },
    ],
  } as unknown as Record<string, unknown>,
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_BUILD_IT: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000009',
  topic_id: 'topic-maths-1',
  asset_type: 'game_questions',
  asset_subtype: 'build_it',
  title: 'Steps to Find a Fraction of a Number',
  content_json: {
    title: 'Put the steps in order to find 3/4 of 20',
    type: 'sequence',
    items: [
      { id: 'b1', content: 'Read the fraction: 3/4 of 20', correct_position: 1 },
      { id: 'b2', content: 'Look at the denominator: 4', correct_position: 2 },
      { id: 'b3', content: 'Divide 20 by 4 to find one quarter: 20 ÷ 4 = 5', correct_position: 3 },
      { id: 'b4', content: 'Look at the numerator: 3', correct_position: 4 },
      { id: 'b5', content: 'Multiply one quarter by 3: 5 × 3 = 15', correct_position: 5 },
      { id: 'b6', content: 'The answer is 15', correct_position: 6 },
    ],
  } as unknown as Record<string, unknown>,
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_QUICK_FIRE: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000010',
  topic_id: 'topic-maths-1',
  asset_type: 'game_questions',
  asset_subtype: 'quick_fire',
  title: 'Fraction Quick Fire',
  content_json: {
    questions: [
      { id: 'q1', question: 'What is 1/4 of 20?', options: ['4', '5', '10', '8'], correct: '5', explanation: '20 ÷ 4 = 5' },
      { id: 'q2', question: 'Which is bigger: 1/3 or 1/5?', options: ['1/3', '1/5', 'They are equal', 'Cannot tell'], correct: '1/3', explanation: 'Fewer parts means bigger pieces' },
      { id: 'q3', question: 'What is 1/2 of 16?', options: ['4', '6', '8', '12'], correct: '8', explanation: '16 ÷ 2 = 8' },
      { id: 'q4', question: '2/4 simplifies to...', options: ['1/4', '1/2', '2/2', '1/3'], correct: '1/2', explanation: 'Divide both by 2' },
      { id: 'q5', question: 'How many thirds make a whole?', options: ['2', '3', '4', '1'], correct: '3', explanation: '3/3 = 1 whole' },
      { id: 'q6', question: 'What is 3/4 of 8?', options: ['4', '5', '6', '3'], correct: '6', explanation: '8 ÷ 4 = 2, then 2 × 3 = 6' },
      { id: 'q7', question: 'Which fraction equals 1?', options: ['1/2', '2/3', '4/4', '3/5'], correct: '4/4', explanation: 'When numerator equals denominator, it equals 1' },
      { id: 'q8', question: '1/10 of 100 is...', options: ['1', '10', '50', '100'], correct: '10', explanation: '100 ÷ 10 = 10' },
      { id: 'q9', question: 'What type of fraction is 5/3?', options: ['Proper', 'Improper', 'Mixed', 'Simple'], correct: 'Improper', explanation: 'Numerator is bigger than denominator' },
      { id: 'q10', question: '1/2 + 1/2 = ?', options: ['1/4', '2/4', '1', '2'], correct: '1', explanation: 'Two halves make a whole' },
    ],
    time_limit: 90,
    question_count: 10,
  } as unknown as Record<string, unknown>,
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_WORKSHEET: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000011',
  topic_id: 'topic-maths-1',
  asset_type: 'worksheet',
  asset_subtype: null,
  title: 'Fractions Worksheet',
  content_json: {
    age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
    subject: 'Maths',
    topic: 'Fractions',
    recall_questions: [
      { q: 'What does the bottom number of a fraction tell us?', lines: 2 },
      { q: 'What is the name for the top number of a fraction?', lines: 2 },
      { q: 'Write three fractions that are equal to 1/2.', lines: 2 },
    ],
    apply_questions: [
      { q: 'A cake has 12 slices. Sarah eats 4. Write this as a fraction of the whole cake.', lines: 3, show_working_space: true },
      { q: 'There are 30 children in a class. 1/5 of them wear glasses. How many children wear glasses?', lines: 4, show_working_space: true },
      { q: 'Tom says 1/3 is bigger than 1/2 because 3 is bigger than 2. Explain why Tom is wrong.', lines: 4, show_working_space: false },
    ],
    create_task: { title: 'Design a Fraction Pizza Menu', description: 'Create a menu for your pizza restaurant. Each pizza must be described using fractions.', space_type: 'lined', lines: 12 },
    reflect_prompts: ['One thing I found tricky about fractions:', 'One thing I am proud of:', 'One question I still have about fractions:'],
  },
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_DIAGRAM_ASSET: TopicAsset = {
  id: 'a0000001-0000-0000-0000-000000000012',
  topic_id: 'topic-maths-1',
  asset_type: 'diagram',
  asset_subtype: 'fraction_bar',
  title: 'Fraction Explorer',
  content_json: { diagram_component_id: 'd0000001-0000-0000-0000-000000000001' },
  file_url: null,
  thumbnail_url: null,
  age_group: '8-11',
  key_stage: 'KS2',
  linked_lesson_id: null,
  status: 'published',
  generation_prompt: null,
  generated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

export const MOCK_FRACTION_BAR_DIAGRAM: DiagramComponent = {
  id: 'd0000001-0000-0000-0000-000000000001',
  diagram_type: 'fraction_bar',
  topic_id: 'topic-maths-1',
  title: 'Explore Fractions',
  data_json: { show_notation: true, max_denominator: 12, allow_comparison: true, initial_denominator: 4 } as unknown as Record<string, unknown>,
  config_json: { primary_colour: '#3B82F6', show_labels: true },
  created_at: '2026-03-01',
};

// All demo assets in one array
export const MOCK_TOPIC_ASSETS: TopicAsset[] = [
  MOCK_CONCEPT_CARD,
  MOCK_VIDEO_ASSET,
  MOCK_REALWORLD_EVERYDAY,
  MOCK_REALWORLD_INSPIRING,
  MOCK_MATCH_IT,
  MOCK_SORT_IT,
  MOCK_FILL_IT,
  MOCK_TRUE_FALSE,
  MOCK_BUILD_IT,
  MOCK_QUICK_FIRE,
  MOCK_WORKSHEET,
  MOCK_DIAGRAM_ASSET,
];

// Build content manifest from assets
export function buildContentManifest(assets: TopicAsset[]): ContentManifest {
  const manifest: ContentManifest = {};
  for (const asset of assets) {
    if (asset.status !== 'published') continue;
    switch (asset.asset_type) {
      case 'concept_card':
        manifest.concept_card = { id: asset.id, title: asset.title };
        break;
      case 'video':
        manifest.video = { id: asset.id, title: asset.title };
        break;
      case 'diagram':
        manifest.diagram = { id: asset.id, title: asset.title, diagram_type: asset.asset_subtype as any };
        break;
      case 'realworld_card':
        if (asset.asset_subtype === 'everyday') manifest.realworld_everyday = { id: asset.id, title: asset.title };
        if (asset.asset_subtype === 'inspiring') manifest.realworld_inspiring = { id: asset.id, title: asset.title };
        break;
      case 'game_questions':
        if (!manifest.game) manifest.game = { id: asset.id, title: asset.title, game_type: asset.asset_subtype as any };
        break;
      case 'worksheet':
        manifest.worksheet = { id: asset.id, title: asset.title };
        break;
      case 'check_questions':
        manifest.check_questions = { id: asset.id, title: asset.title };
        break;
    }
  }
  return manifest;
}

export const MOCK_CONTENT_MANIFEST = buildContentManifest(MOCK_TOPIC_ASSETS);

// Helper to get asset by ID
export function getMockAssetById(id: string): TopicAsset | undefined {
  return MOCK_TOPIC_ASSETS.find(a => a.id === id);
}

// Helper to get mock diagram by ID
export function getMockDiagramById(id: string): DiagramComponent | undefined {
  if (id === MOCK_FRACTION_BAR_DIAGRAM.id) return MOCK_FRACTION_BAR_DIAGRAM;
  return undefined;
}

// Aliases for demo page convenience
export const MOCK_MATCH_GAME_ASSET = MOCK_MATCH_IT;
export const MOCK_TRUE_FALSE_ASSET = MOCK_TRUE_FALSE;
export const MOCK_SORT_GAME_ASSET = MOCK_SORT_IT;
export const MOCK_FILL_GAME_ASSET = MOCK_FILL_IT;
export const MOCK_FRACTION_BAR = MOCK_FRACTION_BAR_DIAGRAM;

// Number line diagram component for demo
export const MOCK_NUMBER_LINE: DiagramComponent = {
  id: 'd0000001-0000-0000-0000-000000000002',
  diagram_type: 'number_line',
  topic_id: 'topic-maths-1',
  title: 'Fractions on a Number Line',
  data_json: {
    min: 0,
    max: 2,
    step: 0.25,
    show_fractions: true,
    show_decimals: false,
    markers: [
      { value: 0.5, label: '1/2' },
      { value: 1, label: '1' },
    ],
    allow_placement: true,
  } as unknown as Record<string, unknown>,
  config_json: { primary_colour: '#3B82F6' },
  created_at: '2026-03-01',
};

