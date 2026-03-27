import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learn/subjects?child_id=xxx
 *
 * Returns subjects with topics and (optional) child progress.
 * This route is now REAL-DATA: no silent mock fallbacks.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id');

  try {
    const supabase = getSupabaseServiceClient();

    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (subjectsError) {
      return NextResponse.json({ error: subjectsError.message }, { status: 500 });
    }

    const subjectIds = (subjects || []).map((s: any) => s.id);

    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, subject_id, slug')
      .in('subject_id', subjectIds);

    if (topicsError) {
      return NextResponse.json({ error: topicsError.message }, { status: 500 });
    }

    let progressMap: Record<string, Record<string, { status: string; mastery_score: number }>> = {};

    if (childId && topics && topics.length > 0) {
      const { data: progress, error: progressError } = await supabase
        .from('child_topic_progress')
        .select('topic_id, status, mastery_score')
        .eq('child_id', childId)
        .in('topic_id', topics.map((t: any) => t.id));

      if (progressError) {
        return NextResponse.json({ error: progressError.message }, { status: 500 });
      }

      // Build progress map by subject slug
      for (const p of progress || []) {
        const topic = topics.find((t: any) => t.id === p.topic_id);
        if (!topic) continue;
        const subject = (subjects || []).find((s: any) => s.id === topic.subject_id);
        if (!subject) continue;

        const subjectSlug = subject.slug || subject.id; // fallback if no slug column
        if (!progressMap[subjectSlug]) progressMap[subjectSlug] = {};

        progressMap[subjectSlug][topic.slug] = {
          status: p.status,
          mastery_score: p.mastery_score || 0,
        };
      }
    }

    return NextResponse.json({
      subjects: subjects || [],
      topics: topics || [],
      progress: progressMap,
      source: 'supabase',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

