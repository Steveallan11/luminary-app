import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage, getErrorResponseStatus, getLiveLearnerContext } from '@/lib/live-lesson-data';
import { getAgeGroup } from '@/lib/lesson-runtime';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const childId = body.child_id as string | undefined;
    const subjectSlug = body.subject_slug as string | undefined;
    const topicSlug = body.topic_slug as string | undefined;
    const sessionId = body.session_id as string | undefined;

    if (!childId || !subjectSlug || !topicSlug || !sessionId) {
      return NextResponse.json(
        { error: 'child_id, subject_slug, topic_slug and session_id are required' },
        { status: 400 }
      );
    }

    const context = await getLiveLearnerContext({
      childId,
      subjectSlug,
      topicSlug,
      sessionId,
    });

    if (!context.structure) {
      return NextResponse.json(
        {
          error: 'No live lesson structure is available for this learner/topic yet. Retry after the backend generation job completes.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'live',
      generated_at: new Date().toISOString(),
      lesson: {
        structure: context.structure,
        contentManifest: context.contentManifest,
        openingPrompt:
          context.structure.spark_json?.opening_question ??
          `What do you already know about ${context.topic.title}?`,
      },
      realtime_event: null,
      realtime_payload: {
        session_id: sessionId,
        topic_id: context.topic.id,
        topic_slug: context.topic.slug,
        subject_slug: context.subject.slug,
        age_group: getAgeGroup(context.child.age),
        state: 'live',
        generated_at: new Date().toISOString(),
        content_manifest: context.contentManifest,
        opening_prompt:
          context.structure.spark_json?.opening_question ??
          `What do you already know about ${context.topic.title}?`,
        structure_id: context.structure.id,
        source: 'supabase',
      },
      source: 'supabase',
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to generate lesson') },
      { status: getErrorResponseStatus(error) }
    );
  }
}
