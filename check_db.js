const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.log('Checking database for lessons and jobs...');

  // 1. Check generation_jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('generation_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (jobsError) {
    console.error('Error fetching jobs:', jobsError.message);
  } else {
    console.log('Recent Generation Jobs:', JSON.stringify(jobs, null, 2));
  }

  // 2. Check topic_lesson_structures
  const { data: lessons, error: lessonsError } = await supabase
    .from('topic_lesson_structures')
    .select('id, status, created_at, topic_id')
    .order('created_at', { ascending: false })
    .limit(5);

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError.message);
  } else {
    console.log('Recent Lessons:', JSON.stringify(lessons, null, 2));
  }

  // 3. Check topics
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('id, title, subject_id')
    .ilike('title', '%Science%')
    .limit(5);

  if (topicsError) {
    console.error('Error fetching topics:', topicsError.message);
  } else {
    console.log('Science Topics:', JSON.stringify(topics, null, 2));
  }
}

check().catch(console.error);
