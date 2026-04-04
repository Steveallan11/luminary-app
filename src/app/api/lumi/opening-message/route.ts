import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, LUMI_MAX_TOKENS, LUMI_MODEL } from '@/lib/anthropic';
import { generateLumiSystemPrompt } from '@/lib/lumi-prompt';
import { getErrorMessage, getErrorResponseStatus, getLiveLearnerContext } from '@/lib/live-lesson-data';

const cache = new Map<string, { text: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('child_id');
    const subjectSlug = searchParams.get('subject_slug');
    const topicSlug = searchParams.get('topic_slug');
    const sessionId = searchParams.get('session_id') ?? undefined;

    if (!childId || !subjectSlug || !topicSlug) {
      return NextResponse.json(
        { error: 'Missing child_id, subject_slug, or topic_slug' },
        { status: 400 }
      );
    }

    const context = await getLiveLearnerContext({
      childId,
      subjectSlug,
      topicSlug,
      sessionId,
    });

    const defaultMessage =
      context.structure?.spark_json?.opening_question ??
      `What do you already know about ${context.topic.title}?`;

    const cacheKey = `${context.child.id}:${context.subject.slug}:${context.topic.slug}:${context.child.age}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        message: cached.text,
        state: context.structure ? 'live' : 'generating',
        session_id: sessionId ?? null,
        phase: 'spark',
        content_manifest: context.contentManifest,
      });
    }

    let openingMessage = defaultMessage;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const client = getAnthropicClient();
        const response = await client.messages.create({
          model: LUMI_MODEL,
          max_tokens: LUMI_MAX_TOKENS,
          system: generateLumiSystemPrompt({
            child_name: context.child.name,
            child_age: context.child.age,
            subject_name: context.subject.name,
            topic_title: context.topic.title,
            topic_description: context.topic.description ?? '',
            previous_struggles: [],
            mastery_score: 0,
            content_manifest: context.contentManifest,
            structure: context.structure,
            current_phase: 'spark',
          }),
          messages: [{ role: 'user', content: 'START_LESSON' }],
        });

        const textBlock = response.content.find((block) => block.type === 'text');
        if (textBlock?.type === 'text' && textBlock.text.trim()) {
          openingMessage = textBlock.text;
        }
      } catch {
        openingMessage = defaultMessage;
      }
    }

    cache.set(cacheKey, { text: openingMessage, timestamp: Date.now() });

    return NextResponse.json({
      message: openingMessage,
      state: context.structure ? 'live' : 'generating',
      session_id: sessionId ?? null,
      phase: 'spark',
      content_manifest: context.contentManifest,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal server error') },
      { status: getErrorResponseStatus(error) }
    );
  }
}
