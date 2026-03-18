import {
  Subject,
  Topic,
  Child,
  LessonSession,
  Achievement,
  ChildAchievement,
  Family,
  TopicStatus,
  TopicLessonStructure,
  LessonPhaseTracking,
  LessonPhase,
} from '@/types';

export const MOCK_FAMILY: Family = {
  id: 'family-1',
  parent_user_id: 'parent-1',
  family_name: 'The Rae Family',
  subscription_tier: 'family',
  stripe_customer_id: null,
  subscription_status: 'active',
  subscription_end_date: null,
  created_at: '',
};

export const MOCK_SUBJECTS: Subject[] = [
  { id: '1', name: 'English', slug: 'english', icon_emoji: '📝', colour_hex: '#3B82F6', description: 'Reading, writing, speaking and storytelling', min_year: 1, max_year: 11, is_future_skill: false, created_at: '' },
  { id: '2', name: 'Maths', slug: 'maths', icon_emoji: '🔢', colour_hex: '#8B5CF6', description: 'Numbers, shapes, patterns and problem-solving', min_year: 1, max_year: 11, is_future_skill: false, created_at: '' },
  { id: '3', name: 'Science', slug: 'science', icon_emoji: '🔬', colour_hex: '#10B981', description: 'Exploring the natural and physical world', min_year: 1, max_year: 11, is_future_skill: false, created_at: '' },
  { id: '4', name: 'History', slug: 'history', icon_emoji: '🏛️', colour_hex: '#F59E0B', description: 'Understanding our past and how we got here', min_year: 1, max_year: 11, is_future_skill: false, created_at: '' },
  { id: '5', name: 'Geography', slug: 'geography', icon_emoji: '🌍', colour_hex: '#06B6D4', description: 'Our planet, its places and its people', min_year: 1, max_year: 11, is_future_skill: false, created_at: '' },
  { id: '6', name: 'Art & Design', slug: 'art-design', icon_emoji: '🎨', colour_hex: '#EC4899', description: 'Creating, imagining and expressing yourself', min_year: 1, max_year: 11, is_future_skill: false, created_at: '' },
  { id: '7', name: 'Computing', slug: 'computing', icon_emoji: '💻', colour_hex: '#6366F1', description: 'Digital skills, coding and understanding technology', min_year: 1, max_year: 11, is_future_skill: false, created_at: '' },
  { id: '8', name: 'Music', slug: 'music', icon_emoji: '🎵', colour_hex: '#F97316', description: 'Playing, composing and appreciating music', min_year: 1, max_year: 11, is_future_skill: false, created_at: '' },
  { id: '9', name: 'Languages', slug: 'languages', icon_emoji: '🌐', colour_hex: '#84CC16', description: 'French, Spanish and the world beyond English', min_year: 1, max_year: 11, is_future_skill: false, created_at: '' },
  { id: '10', name: 'AI Literacy', slug: 'ai-literacy', icon_emoji: '🤖', colour_hex: '#A78BFA', description: 'Understanding and using artificial intelligence wisely', min_year: 3, max_year: 11, is_future_skill: true, created_at: '' },
  { id: '11', name: 'Financial Education', slug: 'financial-education', icon_emoji: '💰', colour_hex: '#34D399', description: 'Money, budgeting, saving and how the economy works', min_year: 3, max_year: 11, is_future_skill: true, created_at: '' },
  { id: '12', name: 'Coding & Programming', slug: 'coding-programming', icon_emoji: '🐍', colour_hex: '#60A5FA', description: 'Building real things with code', min_year: 3, max_year: 11, is_future_skill: true, created_at: '' },
  { id: '13', name: 'Entrepreneurship', slug: 'entrepreneurship', icon_emoji: '💼', colour_hex: '#FBBF24', description: 'Ideas, businesses and making things happen', min_year: 5, max_year: 11, is_future_skill: true, created_at: '' },
  { id: '14', name: 'Media Literacy', slug: 'media-literacy', icon_emoji: '📱', colour_hex: '#F87171', description: 'Thinking critically about news, social media and information', min_year: 3, max_year: 11, is_future_skill: true, created_at: '' },
  { id: '15', name: 'Environmental Science', slug: 'environmental-science', icon_emoji: '🌱', colour_hex: '#4ADE80', description: 'Climate, ecosystems and protecting our planet', min_year: 1, max_year: 11, is_future_skill: true, created_at: '' },
];

export const MOCK_TOPICS: Record<string, Topic[]> = {
  english: [
    { id: 't1', subject_id: '1', title: 'Letters and Sounds', slug: 'letters-and-sounds', description: 'Learn the alphabet and phonics basics', order_index: 1, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: 'live', last_generated_at: new Date().toISOString() },
    { id: 't2', subject_id: '1', title: 'Reading Simple Words', slug: 'reading-simple-words', description: 'Start reading three-letter words', order_index: 2, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: 'live', last_generated_at: new Date().toISOString() },
    { id: 't3', subject_id: '1', title: 'Writing Your Name', slug: 'writing-your-name', description: 'Practice forming letters and writing your name', order_index: 3, key_stage: 'KS1', estimated_minutes: 20, created_at: '', lesson_generation_status: 'generating', last_generated_at: null },
    { id: 't4', subject_id: '1', title: 'Story Time', slug: 'story-time', description: 'Listen to and discuss simple stories', order_index: 4, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't5', subject_id: '1', title: 'Sentence Building', slug: 'sentence-building', description: 'Create simple sentences with capital letters and full stops', order_index: 5, key_stage: 'KS1', estimated_minutes: 20, created_at: '', lesson_generation_status: null, last_generated_at: null },
  ],
  maths: [
    { id: 't6', subject_id: '2', title: 'Counting to 20', slug: 'counting-to-20', description: 'Count objects and numbers up to 20', order_index: 1, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: 'live', last_generated_at: new Date().toISOString() },
    { id: 't7', subject_id: '2', title: 'Addition Basics', slug: 'addition-basics', description: 'Add numbers together using objects and pictures', order_index: 2, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: 'live', last_generated_at: new Date().toISOString() },
    { id: 't8', subject_id: '2', title: 'Subtraction Basics', slug: 'subtraction-basics', description: 'Take away and find the difference', order_index: 3, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: 'live', last_generated_at: new Date().toISOString() },
    { id: 't9', subject_id: '2', title: 'Shapes Around Us', slug: 'shapes-around-us', description: 'Identify circles, squares, triangles and rectangles', order_index: 4, key_stage: 'KS1', estimated_minutes: 20, created_at: '', lesson_generation_status: 'generating', last_generated_at: null },
    { id: 't10', subject_id: '2', title: 'Measuring Length', slug: 'measuring-length', description: 'Compare and measure using non-standard units', order_index: 5, key_stage: 'KS1', estimated_minutes: 20, created_at: '', lesson_generation_status: null, last_generated_at: null },
  ],
  science: [
    { id: 't11', subject_id: '3', title: 'Plants and Growing', slug: 'plants-and-growing', description: 'Discover how plants grow and what they need', order_index: 1, key_stage: 'KS1', estimated_minutes: 20, created_at: '', lesson_generation_status: 'live', last_generated_at: new Date().toISOString() },
    { id: 't12', subject_id: '3', title: 'Animals and Habitats', slug: 'animals-and-habitats', description: 'Learn about different animals and where they live', order_index: 2, key_stage: 'KS1', estimated_minutes: 20, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't13', subject_id: '3', title: 'Materials and Properties', slug: 'materials-and-properties', description: 'Explore different materials and their uses', order_index: 3, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't14', subject_id: '3', title: 'Seasons and Weather', slug: 'seasons-and-weather', description: 'Understand the four seasons and weather patterns', order_index: 4, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't15', subject_id: '3', title: 'The Human Body', slug: 'the-human-body', description: 'Learn about body parts and senses', order_index: 5, key_stage: 'KS1', estimated_minutes: 20, created_at: '', lesson_generation_status: null, last_generated_at: null },
  ],
  history: [
    { id: 't16', subject_id: '4', title: 'My Family History', slug: 'my-family-history', description: 'Explore your own family timeline', order_index: 1, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't17', subject_id: '4', title: 'Famous People', slug: 'famous-people', description: 'Learn about important historical figures', order_index: 2, key_stage: 'KS1', estimated_minutes: 20, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't18', subject_id: '4', title: 'The Great Fire of London', slug: 'great-fire-of-london', description: 'Discover what happened in 1666', order_index: 3, key_stage: 'KS1', estimated_minutes: 20, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't19', subject_id: '4', title: 'Toys Through Time', slug: 'toys-through-time', description: 'How toys have changed over the years', order_index: 4, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't20', subject_id: '4', title: 'Castles and Knights', slug: 'castles-and-knights', description: 'Life in medieval times', order_index: 5, key_stage: 'KS2', estimated_minutes: 20, created_at: '', lesson_generation_status: null, last_generated_at: null },
  ],
  geography: [
    { id: 't21', subject_id: '5', title: 'My Local Area', slug: 'my-local-area', description: 'Explore the geography around your home', order_index: 1, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't22', subject_id: '5', title: 'Maps and Directions', slug: 'maps-and-directions', description: 'Learn to read simple maps', order_index: 2, key_stage: 'KS1', estimated_minutes: 20, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't23', subject_id: '5', title: 'Countries of the UK', slug: 'countries-of-the-uk', description: 'England, Scotland, Wales and Northern Ireland', order_index: 3, key_stage: 'KS1', estimated_minutes: 15, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't24', subject_id: '5', title: 'Hot and Cold Places', slug: 'hot-and-cold-places', description: 'Discover different climates around the world', order_index: 4, key_stage: 'KS1', estimated_minutes: 20, created_at: '', lesson_generation_status: null, last_generated_at: null },
    { id: 't25', subject_id: '5', title: 'Oceans and Continents', slug: 'oceans-and-continents', description: 'The seven continents and five oceans', order_index: 5, key_stage: 'KS2', estimated_minutes: 20, created_at: '', lesson_generation_status: null, last_generated_at: null },
  ],
};

export const MOCK_CHILD: Child = {
  id: 'child-lyla',
  family_id: 'family-1',
  name: 'Lyla Rae',
  age: 8,
  year_group: 'Year 4',
  avatar: 'unicorn',
  learning_mode: 'full_homeschool',
  pin_hash: '',
  xp_total: 240,
  streak_days: 4,
  streak_last_date: new Date().toISOString().split('T')[0],
  created_at: '',
};

export const MOCK_CHILDREN: Child[] = [
  MOCK_CHILD,
  {
    id: 'child-2',
    family_id: 'family-1',
    name: 'Amelia',
    age: 10,
    year_group: 'Year 5',
    avatar: 'owl',
    learning_mode: 'school_supplement',
    pin_hash: '',
    xp_total: 780,
    streak_days: 3,
    streak_last_date: new Date().toISOString().split('T')[0],
    created_at: '',
  },
];

function generateMockSessions(): LessonSession[] {
  const sessions: LessonSession[] = [];
  const now = Date.now();
  const topicIds = ['t6', 't7', 't8', 't11', 't1'];
  const summaries = [
    'Counted in steps and explained how to spot patterns to 20',
    'Solved addition stories using drawings and number bonds',
    'Practised subtraction by comparing what was left',
    'Explored what plants need and how roots help them grow',
    'Investigated how letters and sounds work together in words',
  ];

  for (let day = 0; day < 21; day++) {
    if (Math.random() > 0.65 && day > 0) continue;
    const sessionsToday = day < 7 ? Math.ceil(Math.random() * 2) : 1;
    for (let s = 0; s < sessionsToday; s++) {
      const hourOffset = 9 + Math.floor(Math.random() * 8);
      const startMs = now - day * 86400000 + hourOffset * 3600000;
      const durationMins = 12 + Math.floor(Math.random() * 14);
      const idx = Math.floor(Math.random() * topicIds.length);
      sessions.push({
        id: `s-${day}-${s}`,
        child_id: MOCK_CHILD.id,
        topic_id: topicIds[idx],
        started_at: new Date(startMs).toISOString(),
        ended_at: new Date(startMs + durationMins * 60000).toISOString(),
        duration_minutes: durationMins,
        xp_earned: 18 + Math.floor(Math.random() * 35),
        summary_text: summaries[idx],
        created_at: new Date(startMs).toISOString(),
        structure_id: idx < 3 ? 'structure-maths-year4' : 'structure-english-year4',
        prior_knowledge_response: 'I know a bit already and I like using drawings.',
        is_revisit: day % 5 === 0,
      });
    }
  }

  return sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

export const MOCK_SESSIONS: LessonSession[] = generateMockSessions();

export const MOCK_TOPIC_PROGRESS: Record<string, Record<string, { status: TopicStatus; mastery_score: number }>> = {
  english: {
    'letters-and-sounds': { status: 'completed', mastery_score: 91 },
    'reading-simple-words': { status: 'in_progress', mastery_score: 58 },
    'writing-your-name': { status: 'available', mastery_score: 0 },
    'story-time': { status: 'locked', mastery_score: 0 },
    'sentence-building': { status: 'locked', mastery_score: 0 },
  },
  maths: {
    'counting-to-20': { status: 'completed', mastery_score: 93 },
    'addition-basics': { status: 'completed', mastery_score: 81 },
    'subtraction-basics': { status: 'in_progress', mastery_score: 49 },
    'shapes-around-us': { status: 'available', mastery_score: 0 },
    'measuring-length': { status: 'locked', mastery_score: 0 },
  },
  science: {
    'plants-and-growing': { status: 'completed', mastery_score: 85 },
    'animals-and-habitats': { status: 'available', mastery_score: 0 },
    'materials-and-properties': { status: 'locked', mastery_score: 0 },
    'seasons-and-weather': { status: 'locked', mastery_score: 0 },
    'the-human-body': { status: 'locked', mastery_score: 0 },
  },
  history: {
    'my-family-history': { status: 'available', mastery_score: 0 },
    'famous-people': { status: 'locked', mastery_score: 0 },
    'great-fire-of-london': { status: 'locked', mastery_score: 0 },
    'toys-through-time': { status: 'locked', mastery_score: 0 },
    'castles-and-knights': { status: 'locked', mastery_score: 0 },
  },
  geography: {
    'my-local-area': { status: 'available', mastery_score: 0 },
    'maps-and-directions': { status: 'locked', mastery_score: 0 },
    'countries-of-the-uk': { status: 'locked', mastery_score: 0 },
    'hot-and-cold-places': { status: 'locked', mastery_score: 0 },
    'oceans-and-continents': { status: 'locked', mastery_score: 0 },
  },
};

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', name: 'First Orbit', description: 'Complete your first lesson', icon_emoji: '🚀', xp_reward: 20, condition_type: 'lessons_completed', condition_value: 1, created_at: '' },
  { id: 'a2', name: 'Curious Streak', description: 'Learn for 3 days in a row', icon_emoji: '🔥', xp_reward: 30, condition_type: 'streak_days', condition_value: 3, created_at: '' },
  { id: 'a3', name: 'Maths Spark', description: 'Reach 80% mastery in 2 maths topics', icon_emoji: '🔢', xp_reward: 35, condition_type: 'subject_mastery', condition_value: 2, created_at: '' },
];

export const MOCK_CHILD_ACHIEVEMENTS: ChildAchievement[] = [
  { id: 'ca1', child_id: MOCK_CHILD.id, achievement_id: 'a1', earned_at: new Date().toISOString(), achievement: MOCK_ACHIEVEMENTS[0] },
  { id: 'ca2', child_id: MOCK_CHILD.id, achievement_id: 'a2', earned_at: new Date().toISOString(), achievement: MOCK_ACHIEVEMENTS[1] },
];

export const MOCK_LESSON_STRUCTURES: Record<string, TopicLessonStructure> = {
  'maths:counting-to-20:8-11': {
    id: 'structure-maths-year4',
    topic_id: 't6',
    age_group: '8-11',
    version: 1,
    status: 'live',
    generation_model: 'claude-sonnet-4-6',
    spark_json: {
      hook_type: 'scenario',
      hook_content: 'Lyla, imagine you are helping a toy shop organise 20 glitter stars into neat groups for the display window.',
      opening_question: 'If you had to count the stars quickly, what pattern or strategy might help you?',
      expected_responses: ['counting on', 'groups of 2', 'groups of 5'],
      prior_knowledge_integration: 'If Lyla mentions skip counting or grouping, praise that and build from it immediately.',
    },
    explore_json: {
      concepts: [
        {
          id: 'exp-1',
          title: 'Counting in sensible groups',
          explanation: 'Grouping objects into equal sets can make counting quicker and more accurate.',
          analogy: 'It is like packing pencils into bundles instead of counting one by one.',
          real_example: 'Egg boxes and muffin trays help us count in groups.',
          check_question: 'Why might counting in fives be faster than counting in ones?',
          common_mistake: 'Losing track and double-counting an item.',
        },
      ],
      sequence_notes: 'Start with concrete objects, then move to imagined groups and spoken patterns.',
    },
    anchor_json: {
      method: 'teach_back',
      prompt: 'Can you teach Lumi how you would count 20 counters if they were in equal rows?',
      mastery_indicators: ['explains grouping', 'uses accurate counting language', 'checks final total'],
      fallback_approach: 'Offer a half-complete worked example using groups of 2 or 5.',
    },
    practise_json: {
      questions: [
        {
          id: 'p1',
          question: 'There are 4 rows with 5 stars in each row. How many stars are there altogether?',
          difficulty: 1,
          correct_answer: '20',
          explanation: 'Four groups of five make twenty.',
          hint: 'Try skip counting in fives: 5, 10, 15, 20.',
        },
        {
          id: 'p2',
          question: 'If 20 counters are split into 2 equal groups, how many are in each group?',
          difficulty: 2,
          correct_answer: '10',
          explanation: 'Half of twenty is ten.',
          hint: 'Think about what two equal tens make together.',
        },
      ],
    },
    create_json: {
      task_type: 'design',
      brief: 'Design your own way to organise 20 objects so someone else can count them quickly.',
      scaffolding: 'Use circles, stars, or squares and label the groups clearly.',
      real_world_connection: 'Shop displays and classroom trays often organise objects in groups.',
      interest_placeholder: 'Ask Lyla whether she would prefer to organise toys, sweets, or stickers.',
    },
    check_json: {
      questions: [
        {
          type: 'explain',
          question: 'Explain one fast strategy for counting 20 objects.',
          what_correct_looks_like: 'Mentions grouping or skip counting with a clear reason.',
        },
      ],
    },
    celebrate_json: {
      fun_fact: 'A twenty-sided shape is called an icosagon.',
      next_topic_teaser: 'Next we can use number patterns to help with addition too.',
      praise_templates: ['You spotted a smart pattern there!', 'That was careful mathematical thinking.'],
    },
    personalisation_hooks: {
      interests: ['unicorns', 'crafts'],
      energy_boosts: ['mini challenge', 'praise and sparkle'],
    },
    quality_score: 92,
    times_delivered: 12,
    avg_mastery_score: 83,
    auto_improvement_notes: 'Add one more Year 4 reasoning prompt in version 2.',
    auto_approve_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export const MOCK_LESSON_PHASE_TRACKING: Record<string, LessonPhaseTracking> = {
  'session-demo': {
    id: 'phase-demo',
    session_id: 'session-demo',
    current_phase: 'explore',
    phase_started_at: new Date().toISOString(),
    objectives_covered: ['count-groups'],
    mastery_signals: { confidence: 'growing', explanation_quality: 0.6 },
    phase_history: [
      { phase: 'spark', entered_at: new Date(Date.now() - 240000).toISOString(), exited_at: new Date(Date.now() - 120000).toISOString(), reason: 'prior knowledge captured' },
      { phase: 'explore', entered_at: new Date(Date.now() - 120000).toISOString() },
    ],
    hints_used: 0,
    practise_responses: [],
    check_responses: [],
    final_mastery_score: null,
    content_assets_shown: ['concept-fractions-1'],
    created_at: new Date().toISOString(),
  },
};

export const LESSON_PHASE_LABELS: Record<LessonPhase, string> = {
  spark: 'Spark',
  explore: 'Explore',
  anchor: 'Anchor',
  practise: 'Practise',
  create: 'Create',
  check: 'Check',
  celebrate: 'Celebrate',
};
