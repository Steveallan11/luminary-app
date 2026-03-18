import { NextRequest } from 'next/server';
import { generateLessonEnvelope } from '@/lib/lesson-engine';

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

    const generated = generateLessonEnvelope(subjectSlug, topicSlug);

    if (!generated) {
      return Response.json({ error: 'Topic not found' }, { status: 404 });
    }

    return Response.json({
      status: 'live',
      generated_at: new Date().toISOString(),
      lesson: generated,
      realtime_event: 'lesson_structure_ready',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate lesson';
    return Response.json({ error: message }, { status: 500 });
  }
}
