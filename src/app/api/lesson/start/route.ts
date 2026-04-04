import { NextRequest } from 'next/server';
import { startLesson } from '@/lib/lesson-engine';
import { getSupabaseServiceClient } from '@/lib/supabase-service';
import { MOCK_CHILD } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subjectSlug = body.subject_slug as string | undefined;
    const topicSlug = body.topic_slug as string | undefined;

    if (!subjectSlug || !topicSlug) {
      return Response.json(
        { error: 'subject_slug and topic_slug are required' },
        { status: 400 }
      );
    }

    const childId = body.child_id as string | undefined;
    const result = await startLesson(subjectSlug, topicSlug, childId);

    if (!result) {
      return Response.json({ error: 'Topic not found' }, { status: 404 });
    }

    let child = MOCK_CHILD;
    if (childId) {
      try {
        const supabase = getSupabaseServiceClient();
        const { data: childData } = await supabase
          .from('children')
          .select('id, name, age, year_group, xp_total, streak_days')
          .eq('id', childId)
          .single();
        if (childData) {
          child = {
            ...child,
            ...childData,
          };
        }
      } catch (error) {
        console.warn('Unable to fetch child profile, falling back to mock child', error);
      }
    }

    return Response.json({
      child,
      lesson: result,
      realtime: {
        channel: `lesson-generation:${result.topic.id}:${result.ageGroup}`,
        enabled: result.state === 'generating',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start lesson';
    return Response.json({ error: message }, { status: 500 });
  }
}
