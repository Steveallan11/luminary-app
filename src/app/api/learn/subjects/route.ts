import { NextRequest, NextResponse } from 'next/server';
import { MOCK_SUBJECTS, MOCK_TOPICS, MOCK_TOPIC_PROGRESS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learn/subjects?child_id=xxx
 *
 * Returns subjects with topic counts and progress.
 * Tries Supabase first, falls back to mock data if unavailable.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id');

  // Try Supabase if env vars are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (!subjectsError && subjects && subjects.length > 0) {
        // Fetch topic counts per subject
        const { data: topics } = await supabase
          .from('topics')
          .select('id, subject_id, slug')
          .in('subject_id', subjects.map((s) => s.id));

        // Fetch child progress if child_id provided
        let progressMap: Record<string, Record<string, { status: string; mastery_score: number }>> = {};
        if (childId && topics) {
          const { data: progress } = await supabase
            .from('child_topic_progress')
            .select('topic_id, status, mastery_score')
            .eq('child_id', childId)
            .in('topic_id', topics.map((t) => t.id));

          if (progress) {
            // Build progress map by subject slug
            for (const p of progress) {
              const topic = topics.find((t) => t.id === p.topic_id);
              if (!topic) continue;
              const subject = subjects.find((s) => s.id === topic.subject_id);
              if (!subject) continue;
              if (!progressMap[subject.slug]) progressMap[subject.slug] = {};
              progressMap[subject.slug][topic.slug] = {
                status: p.status,
                mastery_score: p.mastery_score || 0,
              };
            }
          }
        }

        return NextResponse.json({
          subjects,
          topics: topics || [],
          progress: progressMap,
          source: 'supabase',
        });
      }
    } catch (err) {
      console.warn('Supabase subjects fetch failed, using mock data:', err);
    }
  }

  // Fallback to mock data
  const mockProgress: Record<string, Record<string, { status: string; mastery_score: number }>> = {};
  for (const [slug, topicProgress] of Object.entries(MOCK_TOPIC_PROGRESS)) {
    mockProgress[slug] = {};
    for (const [topicSlug, progress] of Object.entries(topicProgress)) {
      mockProgress[slug][topicSlug] = progress;
    }
  }

  const allTopics = Object.values(MOCK_TOPICS).flat();

  return NextResponse.json({
    subjects: MOCK_SUBJECTS,
    topics: allTopics,
    progress: mockProgress,
    source: 'mock',
  });
}
