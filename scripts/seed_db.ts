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
  { name: 'Science', slug: 'science', color: '#10b981' },
  { name: 'Maths', slug: 'maths', color: '#3b82f6' },
  { name: 'English', slug: 'english', color: '#f59e0b' },
  { name: 'History', slug: 'history', color: '#8b5cf6' },
  { name: 'Geography', slug: 'geography', color: '#06b6d4' },
  { name: 'General', slug: 'general', color: '#64748b' },
];

async function seed() {
  console.log('Starting database seeding...');

  // 1. Seed Subjects
  for (const subject of SUBJECTS) {
    const { data, error } = await supabase
      .from('subjects')
      .upsert(subject, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error(`Failed to seed subject ${subject.name}:`, error.message);
    } else {
      console.log(`Seeded subject: ${subject.name} (${data.id})`);
      
      // 2. Seed a "General" topic for each subject to ensure fallback always works
      const { error: topicError } = await supabase
        .from('topics')
        .upsert({
          title: `${subject.name} General`,
          subject_id: data.id,
          slug: `${subject.slug}-general`,
          description: `General topics for ${subject.name}`
        }, { onConflict: 'slug' });

      if (topicError) {
        console.error(`Failed to seed topic for ${subject.name}:`, topicError.message);
      } else {
        console.log(`Seeded general topic for ${subject.name}`);
      }
    }
  }

  console.log('Seeding completed!');
}

seed().catch(console.error);
