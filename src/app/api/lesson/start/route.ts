import { NextRequest } from 'next/server';
import { startLesson } from '@/lib/lesson-engine';
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

    const result = startLesson(subjectSlug, topicSlug);

    if (!result) {
      return Response.json({ error: 'Topic not found' }, { status: 404 });
    }

    return Response.json({
      child: {
        id: MOCK_CHILD.id,
        name: MOCK_CHILD.name,
        age: MOCK_CHILD.age,
        year_group: MOCK_CHILD.year_group,
      },
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
