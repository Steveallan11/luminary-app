import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/learn/topic-progress
 *
 * Upserts child topic progress in Supabase.
 * Body: { child_id, topic_id, status, mastery_score, xp_earned }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { child_id, topic_id, status, mastery_score, xp_earned } = body;

    if (!child_id || !topic_id) {
      return NextResponse.json({ error: 'child_id and topic_id are required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Upsert topic progress
      const { error: progressError } = await supabase
        .from('child_topic_progress')
        .upsert({
          child_id,
          topic_id,
          status: status || 'in_progress',
          mastery_score: mastery_score || 0,
          last_accessed_at: new Date().toISOString(),
        }, { onConflict: 'child_id,topic_id' });

      if (progressError) {
        console.warn('Progress upsert error:', progressError);
      }

      // Update child XP and streak if xp_earned provided
      if (xp_earned && xp_earned > 0) {
        const { data: child } = await supabase
          .from('children')
          .select('xp_total, streak_days, last_active_at')
          .eq('id', child_id)
          .single();

        if (child) {
          const lastActive = child.last_active_at ? new Date(child.last_active_at) : null;
          const today = new Date();
          const isNewDay = !lastActive || lastActive.toDateString() !== today.toDateString();
          const isConsecutiveDay = lastActive
            ? (today.getTime() - lastActive.getTime()) < 48 * 60 * 60 * 1000
            : false;

          await supabase
            .from('children')
            .update({
              xp_total: (child.xp_total || 0) + xp_earned,
              streak_days: isNewDay ? (isConsecutiveDay ? (child.streak_days || 0) + 1 : 1) : child.streak_days,
              last_active_at: today.toISOString(),
            })
            .eq('id', child_id);
        }
      }

      return NextResponse.json({ success: true, source: 'supabase' });
    }

    // No Supabase — return success (mock mode)
    return NextResponse.json({ success: true, source: 'mock' });
  } catch (error) {
    console.error('Topic progress update error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}

/**
 * GET /api/learn/topic-progress?child_id=xxx&subject_slug=yyy
 *
 * Returns topic progress for a child in a subject.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id');
  const subjectSlug = searchParams.get('subject_slug');

  if (!childId) {
    return NextResponse.json({ error: 'child_id is required' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      let query = supabase
        .from('child_topic_progress')
        .select('*, topics(slug, subject_id, subjects(slug))')
        .eq('child_id', childId);

      const { data: progress, error } = await query;

      if (!error && progress) {
        // Build progress map by topic slug
        const progressMap: Record<string, { status: string; mastery_score: number }> = {};
        for (const p of progress) {
          const topicSlug = p.topics?.slug;
          const sSlug = p.topics?.subjects?.slug;
          if (!topicSlug) continue;
          if (subjectSlug && sSlug !== subjectSlug) continue;
          progressMap[topicSlug] = {
            status: p.status,
            mastery_score: p.mastery_score || 0,
          };
        }
        return NextResponse.json({ progress: progressMap, source: 'supabase' });
      }
    } catch (err) {
      console.warn('Progress fetch failed:', err);
    }
  }

  // Mock fallback
  const { MOCK_TOPIC_PROGRESS } = await import('@/lib/mock-data');
  const progress = subjectSlug ? MOCK_TOPIC_PROGRESS[subjectSlug] || {} : {};
  return NextResponse.json({ progress, source: 'mock' });
}
