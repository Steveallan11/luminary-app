import { Subject, Topic, Child, LessonSession } from '@/types';

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

export const MOCK_SESSIONS: LessonSession[] = [
  { id: 's1', child_id: 'child-1', topic_id: 't1', started_at: new Date(Date.now() - 3600000).toISOString(), ended_at: new Date(Date.now() - 2700000).toISOString(), xp_earned: 50, summary_text: 'Completed Letters and Sounds', created_at: '' },
  { id: 's2', child_id: 'child-1', topic_id: 't6', started_at: new Date(Date.now() - 7200000).toISOString(), ended_at: new Date(Date.now() - 6300000).toISOString(), xp_earned: 45, summary_text: 'Completed Counting to 20', created_at: '' },
  { id: 's3', child_id: 'child-1', topic_id: 't11', started_at: new Date(Date.now() - 86400000).toISOString(), ended_at: new Date(Date.now() - 85200000).toISOString(), xp_earned: 60, summary_text: 'Completed Plants and Growing', created_at: '' },
];

// Mock topic progress for demo
export const MOCK_TOPIC_PROGRESS: Record<string, Record<string, 'locked' | 'available' | 'in_progress' | 'completed'>> = {
  english: {
    'letters-and-sounds': 'completed',
    'reading-simple-words': 'completed',
    'writing-your-name': 'in_progress',
    'story-time': 'available',
    'sentence-building': 'locked',
  },
  maths: {
    'counting-to-20': 'completed',
    'addition-basics': 'in_progress',
    'subtraction-basics': 'available',
    'shapes-around-us': 'locked',
    'measuring-length': 'locked',
  },
  science: {
    'plants-and-growing': 'completed',
    'animals-and-habitats': 'available',
    'materials-and-properties': 'locked',
    'seasons-and-weather': 'locked',
    'the-human-body': 'locked',
  },
  history: {
    'my-family-history': 'available',
    'famous-people': 'locked',
    'great-fire-of-london': 'locked',
    'toys-through-time': 'locked',
    'castles-and-knights': 'locked',
  },
  geography: {
    'my-local-area': 'available',
    'maps-and-directions': 'locked',
    'countries-of-the-uk': 'locked',
    'hot-and-cold-places': 'locked',
    'oceans-and-continents': 'locked',
  },
};
