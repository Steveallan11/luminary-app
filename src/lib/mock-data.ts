import { Subject, Topic, Child, LessonSession, Achievement, ChildAchievement, Family, TopicStatus } from '@/types';

export const MOCK_FAMILY: Family = {
  id: 'family-1',
  parent_user_id: 'parent-1',
  family_name: 'The Smith Family',
  subscription_tier: 'free',
  stripe_customer_id: null,
  subscription_status: 'none',
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
    { id: 't1', subject_id: '1', title: 'Letters and Sounds', slug: 'letters-and-sounds', description: 'Learn the alphabet and phonics basics', order_index: 1, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't2', subject_id: '1', title: 'Reading Simple Words', slug: 'reading-simple-words', description: 'Start reading three-letter words', order_index: 2, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't3', subject_id: '1', title: 'Writing Your Name', slug: 'writing-your-name', description: 'Practice forming letters and writing your name', order_index: 3, key_stage: 'KS1', estimated_minutes: 20, created_at: '' },
    { id: 't4', subject_id: '1', title: 'Story Time', slug: 'story-time', description: 'Listen to and discuss simple stories', order_index: 4, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't5', subject_id: '1', title: 'Sentence Building', slug: 'sentence-building', description: 'Create simple sentences with capital letters and full stops', order_index: 5, key_stage: 'KS1', estimated_minutes: 20, created_at: '' },
  ],
  maths: [
    { id: 't6', subject_id: '2', title: 'Counting to 20', slug: 'counting-to-20', description: 'Count objects and numbers up to 20', order_index: 1, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't7', subject_id: '2', title: 'Addition Basics', slug: 'addition-basics', description: 'Add numbers together using objects and pictures', order_index: 2, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't8', subject_id: '2', title: 'Subtraction Basics', slug: 'subtraction-basics', description: 'Take away and find the difference', order_index: 3, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't9', subject_id: '2', title: 'Shapes Around Us', slug: 'shapes-around-us', description: 'Identify circles, squares, triangles and rectangles', order_index: 4, key_stage: 'KS1', estimated_minutes: 20, created_at: '' },
    { id: 't10', subject_id: '2', title: 'Measuring Length', slug: 'measuring-length', description: 'Compare and measure using non-standard units', order_index: 5, key_stage: 'KS1', estimated_minutes: 20, created_at: '' },
  ],
  science: [
    { id: 't11', subject_id: '3', title: 'Plants and Growing', slug: 'plants-and-growing', description: 'Discover how plants grow and what they need', order_index: 1, key_stage: 'KS1', estimated_minutes: 20, created_at: '' },
    { id: 't12', subject_id: '3', title: 'Animals and Habitats', slug: 'animals-and-habitats', description: 'Learn about different animals and where they live', order_index: 2, key_stage: 'KS1', estimated_minutes: 20, created_at: '' },
    { id: 't13', subject_id: '3', title: 'Materials and Properties', slug: 'materials-and-properties', description: 'Explore different materials and their uses', order_index: 3, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't14', subject_id: '3', title: 'Seasons and Weather', slug: 'seasons-and-weather', description: 'Understand the four seasons and weather patterns', order_index: 4, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't15', subject_id: '3', title: 'The Human Body', slug: 'the-human-body', description: 'Learn about body parts and senses', order_index: 5, key_stage: 'KS1', estimated_minutes: 20, created_at: '' },
  ],
  history: [
    { id: 't16', subject_id: '4', title: 'My Family History', slug: 'my-family-history', description: 'Explore your own family timeline', order_index: 1, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't17', subject_id: '4', title: 'Famous People', slug: 'famous-people', description: 'Learn about important historical figures', order_index: 2, key_stage: 'KS1', estimated_minutes: 20, created_at: '' },
    { id: 't18', subject_id: '4', title: 'The Great Fire of London', slug: 'great-fire-of-london', description: 'Discover what happened in 1666', order_index: 3, key_stage: 'KS1', estimated_minutes: 20, created_at: '' },
    { id: 't19', subject_id: '4', title: 'Toys Through Time', slug: 'toys-through-time', description: 'How toys have changed over the years', order_index: 4, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't20', subject_id: '4', title: 'Castles and Knights', slug: 'castles-and-knights', description: 'Life in medieval times', order_index: 5, key_stage: 'KS2', estimated_minutes: 20, created_at: '' },
  ],
  geography: [
    { id: 't21', subject_id: '5', title: 'My Local Area', slug: 'my-local-area', description: 'Explore the geography around your home', order_index: 1, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't22', subject_id: '5', title: 'Maps and Directions', slug: 'maps-and-directions', description: 'Learn to read simple maps', order_index: 2, key_stage: 'KS1', estimated_minutes: 20, created_at: '' },
    { id: 't23', subject_id: '5', title: 'Countries of the UK', slug: 'countries-of-the-uk', description: 'England, Scotland, Wales and Northern Ireland', order_index: 3, key_stage: 'KS1', estimated_minutes: 15, created_at: '' },
    { id: 't24', subject_id: '5', title: 'Hot and Cold Places', slug: 'hot-and-cold-places', description: 'Discover different climates around the world', order_index: 4, key_stage: 'KS1', estimated_minutes: 20, created_at: '' },
    { id: 't25', subject_id: '5', title: 'Oceans and Continents', slug: 'oceans-and-continents', description: 'The seven continents and five oceans', order_index: 5, key_stage: 'KS2', estimated_minutes: 20, created_at: '' },
  ],
};

export const MOCK_CHILD: Child = {
  id: 'child-1',
  family_id: 'family-1',
  name: 'Oliver',
  age: 7,
  year_group: 'Year 3',
  avatar: 'fox',
  learning_mode: 'full_homeschool',
  pin_hash: '',
  xp_total: 1250,
  streak_days: 5,
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
    avatar: 'unicorn',
    learning_mode: 'full_homeschool',
    pin_hash: '',
    xp_total: 780,
    streak_days: 3,
    streak_last_date: new Date().toISOString().split('T')[0],
    created_at: '',
  },
];

// Generate richer session data for the past 28 days
function generateMockSessions(): LessonSession[] {
  const sessions: LessonSession[] = [];
  const now = Date.now();
  const topicIds = ['t1', 't2', 't3', 't6', 't7', 't11', 't12', 't16', 't21'];
  const summaries = [
    'Explored phonics patterns and letter combinations',
    'Practised reading three-letter words with confidence',
    'Worked on letter formation and name writing',
    'Counted objects up to 20 using different strategies',
    'Added numbers using visual aids and number lines',
    'Discovered how plants grow from seeds',
    'Learned about animal habitats and food chains',
    'Explored family history through timeline activities',
    'Mapped the local area and identified key features',
  ];

  for (let day = 0; day < 28; day++) {
    // 60% chance of activity on any given day
    if (Math.random() > 0.6 && day > 0) continue;
    const sessionsToday = day < 7 ? Math.ceil(Math.random() * 3) : Math.ceil(Math.random() * 2);
    for (let s = 0; s < sessionsToday; s++) {
      const hourOffset = 9 + Math.floor(Math.random() * 10); // 9am-7pm
      const startMs = now - day * 86400000 + hourOffset * 3600000;
      const durationMins = 10 + Math.floor(Math.random() * 15);
      const idx = Math.floor(Math.random() * topicIds.length);
      sessions.push({
        id: `s-${day}-${s}`,
        child_id: 'child-1',
        topic_id: topicIds[idx],
        started_at: new Date(startMs).toISOString(),
        ended_at: new Date(startMs + durationMins * 60000).toISOString(),
        duration_minutes: durationMins,
        xp_earned: 15 + Math.floor(Math.random() * 50),
        summary_text: summaries[idx],
        created_at: new Date(startMs).toISOString(),
      });
    }
  }
  return sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

export const MOCK_SESSIONS: LessonSession[] = generateMockSessions();

// Mock topic progress for demo
export const MOCK_TOPIC_PROGRESS: Record<string, Record<string, { status: TopicStatus; mastery_score: number }>> = {
  english: {
    'letters-and-sounds': { status: 'completed', mastery_score: 92 },
    'reading-simple-words': { status: 'completed', mastery_score: 78 },
    'writing-your-name': { status: 'in_progress', mastery_score: 45 },
    'story-time': { status: 'available', mastery_score: 0 },
    'sentence-building': { status: 'locked', mastery_score: 0 },
  },
  maths: {
    'counting-to-20': { status: 'completed', mastery_score: 88 },
    'addition-basics': { status: 'in_progress', mastery_score: 35 },
    'subtraction-basics': { status: 'available', mastery_score: 0 },
    'shapes-around-us': { status: 'locked', mastery_score: 0 },
    'measuring-length': { status: 'locked', mastery_score: 0 },
  },
  science: {
    'plants-and-growing': { status: 'completed', mastery_score: 85 },
    'animals-and-habitats': { status: 'in_progress', mastery_score: 20 },
    'materials-and-properties': { status: 'locked', mastery_score: 0 },
    'seasons-and-weather': { status: 'locked', mastery_score: 0 },
    'the-human-body': { status: 'locked', mastery_score: 0 },
  },
  history: {
    'my-family-history': { status: 'completed', mastery_score: 75 },
    'famous-people': { status: 'available', mastery_score: 0 },
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

// Mock achievements data
export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', name: 'First Step', description: 'Complete your first lesson', icon_emoji: '🐣', xp_reward: 10, condition_type: 'lessons_completed', condition_value: 1, created_at: '' },
  { id: 'a2', name: 'Subject Explorer', description: 'Try 3 different subjects', icon_emoji: '🌍', xp_reward: 15, condition_type: 'subjects_tried', condition_value: 3, created_at: '' },
  { id: 'a3', name: 'Getting Started', description: 'Earn 50 XP total', icon_emoji: '⭐', xp_reward: 10, condition_type: 'xp_total', condition_value: 50, created_at: '' },
  { id: 'a4', name: 'On a Roll', description: '3-day streak', icon_emoji: '🔥', xp_reward: 20, condition_type: 'streak_days', condition_value: 3, created_at: '' },
  { id: 'a5', name: 'Unstoppable', description: '7-day streak', icon_emoji: '💪', xp_reward: 50, condition_type: 'streak_days', condition_value: 7, created_at: '' },
  { id: 'a6', name: 'Legend', description: '30-day streak', icon_emoji: '🏆', xp_reward: 200, condition_type: 'streak_days', condition_value: 30, created_at: '' },
  { id: 'a7', name: 'Deep Diver', description: 'Complete all topics in one subject', icon_emoji: '🤿', xp_reward: 75, condition_type: 'subject_completed', condition_value: 1, created_at: '' },
  { id: 'a8', name: 'Renaissance Learner', description: 'Active in 5 different subjects', icon_emoji: '🎨', xp_reward: 50, condition_type: 'subjects_tried', condition_value: 5, created_at: '' },
  { id: 'a9', name: 'Future Ready', description: 'Complete a Future Skills subject', icon_emoji: '🚀', xp_reward: 60, condition_type: 'future_skill_completed', condition_value: 1, created_at: '' },
  { id: 'a10', name: 'Perseverance', description: 'Complete a topic after using hints 3+ times', icon_emoji: '🦁', xp_reward: 30, condition_type: 'perseverance', condition_value: 1, created_at: '' },
  { id: 'a11', name: 'Marathon Learner', description: 'Accumulate 10 hours of learning', icon_emoji: '⏱️', xp_reward: 40, condition_type: 'total_hours', condition_value: 10, created_at: '' },
  { id: 'a12', name: 'Night Owl', description: 'Complete a lesson after 7pm', icon_emoji: '🦉', xp_reward: 15, condition_type: 'night_session', condition_value: 1, created_at: '' },
];

// Oliver has earned some achievements
export const MOCK_CHILD_ACHIEVEMENTS: ChildAchievement[] = [
  { id: 'ca1', child_id: 'child-1', achievement_id: 'a1', earned_at: new Date(Date.now() - 86400000 * 20).toISOString() },
  { id: 'ca2', child_id: 'child-1', achievement_id: 'a2', earned_at: new Date(Date.now() - 86400000 * 15).toISOString() },
  { id: 'ca3', child_id: 'child-1', achievement_id: 'a3', earned_at: new Date(Date.now() - 86400000 * 18).toISOString() },
  { id: 'ca4', child_id: 'child-1', achievement_id: 'a4', earned_at: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 'ca5', child_id: 'child-1', achievement_id: 'a5', earned_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'ca6', child_id: 'child-1', achievement_id: 'a12', earned_at: new Date(Date.now() - 86400000 * 1).toISOString() },
];
