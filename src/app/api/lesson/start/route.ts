import { NextRequest } from 'next/server';
import { startLessonForChild } from '@/lib/lesson-engine';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { MOCK_CHILD } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subjectSlug = body.subject_slug as string | undefined;
    const topicSlug = body.topic_slug as string | undefined;
    const childId = body.child_id as string | undefined;

    if (!subjectSlug || !topicSlug) {
      return Response.json(
        { error: 'subject_slug and topic_slug are required' },
        { status: 400 }
      );
    }

    // Try to get real child data if childId is provided
    let childData = {
      id: MOCK_CHILD.id,
      name: MOCK_CHILD.name,
      age: MOCK_CHILD.age,
      year_group: MOCK_CHILD.year_group,
    };

    if (childId) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data: child, error } = await supabase
          .from('children')
          .select('id, name, age, year_group')
          .eq('id', childId)
          .single();

        if (!error && child) {
          childData = {
            id: child.id,
            name: child.name,
            age: child.age,
            year_group: child.year_group,
          };
        }
      } catch (err) {
        // Fall back to mock data if database lookup fails
        console.error('Failed to fetch child from database:', err);
      }
    }

    const result = startLessonForChild(subjectSlug, topicSlug, childData);

    if (!result) {
      return Response.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Create lesson session in database if we have a real child
    if (childId && result.topic) {
      try {
        const supabase = await createServerSupabaseClient();
        await supabase
          .from('lesson_sessions')
          .insert({
            id: result.sessionId,
            child_id: childId,
            topic_id: result.topic.id,
            started_at: new Date().toISOString(),
            xp_earned: 0,
            duration_minutes: 0,
          });
      } catch (err) {
        console.error('Failed to create lesson session:', err);
        // Continue anyway - we can still deliver the lesson
      }
    }

    return Response.json({
      child: childData,
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
