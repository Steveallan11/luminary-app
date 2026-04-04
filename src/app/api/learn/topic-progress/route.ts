import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage, getErrorResponseStatus, getLiveLearnerContext } from '@/lib/live-lesson-data';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { child_id, topic_id, status, mastery_score } = body;

    if (!child_id || !topic_id) {
      return NextResponse.json({ error: 'child_id and topic_id are required' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const context = await getLiveLearnerContext({ childId: child_id, topicId: topic_id });

    const payload: Record<string, unknown> = {
      child_id,
      topic_id,
      status: status || 'in_progress',
      mastery_score: mastery_score || 0,
    };

    if ((status || 'in_progress') === 'completed') {
      payload.completed_at = new Date().toISOString();
    }

    let { error } = await supabase
      .from('child_topic_progress')
      .upsert(payload, { onConflict: 'child_id,topic_id' });

    if (error?.message?.includes('mastery_score')) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.mastery_score;
      const retry = await supabase
        .from('child_topic_progress')
        .upsert(fallbackPayload, { onConflict: 'child_id,topic_id' });
      error = retry.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      source: 'supabase',
      child_id: context.child.id,
      topic_id: context.topic.id,
    });
  } catch (error) {
    console.error('Topic progress update error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to update progress') },
      { status: getErrorResponseStatus(error) }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('child_id');
    const subjectSlug = searchParams.get('subject_slug');

    if (!childId) {
      return NextResponse.json({ error: 'child_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .maybeSingle();

    if (childError) {
      return NextResponse.json({ error: childError.message }, { status: 500 });
    }
    if (!child) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 });
    }

    let { data, error } = await supabase
      .from('child_topic_progress')
      .select('status, mastery_score, topics(slug, subjects(slug))')
      .eq('child_id', childId);

    if (error?.message?.includes('mastery_score')) {
      const fallback = await supabase
        .from('child_topic_progress')
        .select('status, topics(slug, subjects(slug))')
        .eq('child_id', childId);
      data = fallback.data as typeof data;
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const progress: Record<string, { status: string; mastery_score: number }> = {};
    for (const row of data ?? []) {
      const topic = Array.isArray(row.topics) ? row.topics[0] : row.topics;
      const subject = Array.isArray(topic?.subjects) ? topic.subjects[0] : topic?.subjects;
      if (!topic?.slug) continue;
      if (subjectSlug && subject?.slug !== subjectSlug) continue;

      progress[topic.slug] = {
        status: row.status,
        mastery_score: (row as { mastery_score?: number }).mastery_score || 0,
      };
    }

    return NextResponse.json({ progress, source: 'supabase' });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to fetch progress') },
      { status: getErrorResponseStatus(error) }
    );
  }
}
