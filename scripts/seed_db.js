const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
  console.error('Missing or placeholder Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SUBJECTS = [
  { name: 'Science', slug: 'science' },
  { name: 'Maths', slug: 'maths' },
  { name: 'English', slug: 'english' },
  { name: 'History', slug: 'history' },
  { name: 'Geography', slug: 'geography' },
  { name: 'General', slug: 'general' },
];

async function seed() {
  console.log('Starting database seeding (insert only)...');

  for (const subject of SUBJECTS) {
    // Try to find or create subject
    let subjectId;
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('slug', subject.slug)
      .single();

    if (existingSubject) {
      subjectId = existingSubject.id;
      console.log(`Subject exists: ${subject.name} (${subjectId})`);
    } else {
      const { data: newSubject, error: subError } = await supabase
        .from('subjects')
        .insert(subject)
        .select()
        .single();
      
      if (subError) {
        console.error(`Failed to create subject ${subject.name}:`, subError.message);
        continue;
      }
      subjectId = newSubject.id;
      console.log(`Created subject: ${subject.name} (${subjectId})`);
    }

    // Try to find or create topic
    const topicSlug = `${subject.slug}-general`;
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', topicSlug)
      .single();

    if (existingTopic) {
      console.log(`Topic exists for ${subject.name}`);
    } else {
      const { error: topicError } = await supabase
        .from('topics')
        .insert({
          title: `${subject.name} General`,
          subject_id: subjectId,
          slug: topicSlug
        });

      if (topicError) {
        console.error(`Failed to create topic for ${subject.name}:`, topicError.message);
      } else {
        console.log(`Created general topic for ${subject.name}`);
      }
    }
  }

  console.log('Seeding completed!');
}

seed().catch(console.error);
