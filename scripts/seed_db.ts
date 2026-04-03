import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
  console.error('Missing or placeholder Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SUBJECTS = [
  { name: 'Science', slug: 'science', icon_emoji: '🔬', colour_hex: '#10b981' },
  { name: 'Maths', slug: 'maths', icon_emoji: '🔢', colour_hex: '#3b82f6' },
  { name: 'English', slug: 'english', icon_emoji: '📚', colour_hex: '#f59e0b' },
];

// Topics for MVP (2 per subject)
const TOPICS_BY_SUBJECT: Record<string, Array<{ title: string; slug: string; description: string }>> = {
  'maths': [
    { title: 'Number Sense', slug: 'number-sense', description: 'Understanding numbers, counting, place value' },
    { title: 'Fractions', slug: 'fractions', description: 'Introduction to fractions and parts of a whole' },
  ],
  'english': [
    { title: 'Phonics', slug: 'phonics', description: 'Sound recognition and phonetic awareness' },
    { title: 'Reading', slug: 'reading', description: 'Building reading skills and comprehension' },
  ],
  'science': [
    { title: 'Life Cycles', slug: 'life-cycles', description: 'Understanding growth and change in living things' },
    { title: 'States of Matter', slug: 'states-of-matter', description: 'Solid, liquid, and gas properties' },
  ],
};

async function seed() {
  console.log('Starting database seeding for MVP lessons...');

  // 1. Seed Subjects
  for (const subject of SUBJECTS) {
    const { data, error } = await supabase
      .from('subjects')
      .upsert(subject, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error(`Failed to seed subject ${subject.name}:`, error.message);
      continue;
    }

    console.log(`✓ Seeded subject: ${subject.name} (${data.id})`);

    // 2. Seed Topics for this subject
    const topics = TOPICS_BY_SUBJECT[subject.slug];
    if (topics) {
      for (const topic of topics) {
        const { data: topicData, error: topicError } = await supabase
          .from('topics')
          .upsert(
            {
              title: topic.title,
              subject_id: data.id,
              slug: topic.slug,
              description: topic.description,
              order_index: topics.indexOf(topic),
              key_stage: '2', // KS2 for MVP
              estimated_minutes: 20,
            },
            { onConflict: 'subject_id,slug' }
          )
          .select()
          .single();

        if (topicError) {
          console.error(`Failed to seed topic ${topic.title}:`, topicError.message);
        } else {
          console.log(`  ✓ Seeded topic: ${topic.title} (${topicData.id})`);
        }
      }
    }
  }

  console.log('\n✓ Seeding completed!');
  console.log('\nNext step: Generate lesson structures for each topic using the admin API');
  console.log('Topics ready for lesson generation:');
  console.log('  - Maths: Number Sense, Fractions');
  console.log('  - English: Phonics, Reading');
  console.log('  - Science: Life Cycles, States of Matter');
}

seed().catch(console.error);
