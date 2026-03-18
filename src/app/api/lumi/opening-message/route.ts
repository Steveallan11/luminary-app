import { NextRequest } from 'next/server';
import { getAnthropicClient, LUMI_MODEL, LUMI_MAX_TOKENS } from '@/lib/anthropic';
import { generateLumiSystemPrompt } from '@/lib/lumi-prompt';
import { MOCK_CHILD, MOCK_SUBJECTS } from '@/lib/mock-data';
import { buildContentManifest, findTopicBySlug, getLessonStructureForTopic, startLesson } from '@/lib/lesson-engine';

const cache = new Map<string, { text: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const child_id = searchParams.get('child_id');
    const subject_slug = searchParams.get('subject_slug');
    const topic_slug = searchParams.get('topic_slug');

    if (!child_id || !subject_slug || !topic_slug) {
      return new Response(
        JSON.stringify({ error: 'Missing child_id, subject_slug, or topic_slug' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const startState = startLesson(subject_slug, topic_slug);
    if (!startState) {
      return new Response(JSON.stringify({ error: 'Topic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (startState.state === 'generating') {
      return new Response(
        JSON.stringify({
          message: startState.openingPrompt,
          state: 'generating',
          estimated_seconds: startState.estimatedSeconds,
          progress_message: startState.progressMessage,
          session_id: startState.sessionId,
          content_manifest: startState.contentManifest,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cacheKey = `${child_id}:${subject_slug}:${topic_slug}:${MOCK_CHILD.age}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(
        JSON.stringify({
          message: cached.text,
          state: 'live',
          session_id: startState.sessionId,
          phase: startState.phase,
          content_manifest: startState.contentManifest,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const subject = MOCK_SUBJECTS.find((s) => s.slug === subject_slug);
    const topic = findTopicBySlug(subject_slug, topic_slug);
    const structure = topic ? getLessonStructureForTopic(topic.id, MOCK_CHILD.age) : null;

    if (!subject || !topic) {
      return new Response(JSON.stringify({ error: 'Subject or topic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = generateLumiSystemPrompt({
      child_name: MOCK_CHILD.name,
      child_age: MOCK_CHILD.age,
      subject_name: subject.name,
      topic_title: topic.title,
      topic_description: topic.description,
      previous_struggles: [],
      mastery_score: 0,
      content_manifest: buildContentManifest(topic.id),
      structure,
      current_phase: 'spark',
    });

    let openingMessage = startState.openingPrompt;

    try {
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: LUMI_MODEL,
        max_tokens: LUMI_MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'START_LESSON' }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (textBlock && 'text' in textBlock && textBlock.text.trim()) {
        openingMessage = textBlock.text;
      }
    } catch {
      openingMessage = startState.openingPrompt;
    }

    cache.set(cacheKey, { text: openingMessage, timestamp: Date.now() });

    return new Response(
      JSON.stringify({
        message: openingMessage,
        state: 'live',
        session_id: startState.sessionId,
        phase: startState.phase,
        content_manifest: startState.contentManifest,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
