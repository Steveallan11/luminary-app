import { NextRequest, NextResponse } from 'next/server';
import { createLiveLessonSession, getErrorMessage, getErrorResponseStatus } from '@/lib/live-lesson-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const childId = body.child_id as string | undefined;
    const subjectSlug = body.subject_slug as string | undefined;
    const topicSlug = body.topic_slug as string | undefined;

    if (!childId || !subjectSlug || !topicSlug) {
      return NextResponse.json(
        { error: 'child_id, subject_slug and topic_slug are required' },
        { status: 400 }
      );
    }

    const result = await createLiveLessonSession({
      childId,
      subjectSlug,
      topicSlug,
    });

    return NextResponse.json({
      child: {
        id: result.child.id,
        name: result.child.name,
        age: result.child.age,
        year_group: result.child.year_group,
      },
      lesson: {
        state: result.structure ? 'live' : 'generating',
        topic: result.topic,
        ageGroup: result.ageGroup,
        structure: result.structure,
        sessionId: result.session.id,
        phase: 'spark',
        openingPrompt: result.openingPrompt,
        estimatedSeconds: result.structure ? undefined : 12,
        progressMessage: result.structure
          ? undefined
          : 'Lumi is preparing a lesson structure for this learner and topic in Supabase.',
        contentManifest: result.contentManifest,
      },
      realtime: {
        channel: `lesson-generation:${result.topic.id}:${result.ageGroup}`,
        enabled: !result.structure,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to start lesson') },
      { status: getErrorResponseStatus(error) }
    );
  }
}
