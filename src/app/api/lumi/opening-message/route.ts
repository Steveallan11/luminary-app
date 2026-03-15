import { NextRequest } from 'next/server';
import { getAnthropicClient, LUMI_MODEL, LUMI_MAX_TOKENS } from '@/lib/anthropic';
import { generateLumiSystemPrompt } from '@/lib/lumi-prompt';
import { MOCK_CHILD, MOCK_SUBJECTS, MOCK_TOPICS } from '@/lib/mock-data';

// Simple in-memory cache for opening messages (5 min TTL)
const cache = new Map<string, { text: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/lumi/opening-message
 *
 * Generates Lumi's opening message for a new lesson.
 * Cached for 5 minutes per child+topic combination.
 */
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

    // Check cache
    const cacheKey = `${child_id}:${subject_slug}:${topic_slug}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(JSON.stringify({ message: cached.text }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch child profile (mock for MVP)
    const child = MOCK_CHILD;

    // Fetch subject and topic
    const subject = MOCK_SUBJECTS.find((s) => s.slug === subject_slug);
    const topics = MOCK_TOPICS[subject_slug];
    const topic = topics?.find((t) => t.slug === topic_slug);

    if (!subject || !topic) {
      return new Response(JSON.stringify({ error: 'Subject or topic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate system prompt
    const systemPrompt = generateLumiSystemPrompt({
      child_name: child.name,
      child_age: child.age,
      subject_name: subject.name,
      topic_title: topic.title,
      topic_description: topic.description,
      previous_struggles: [],
      mastery_score: 0,
    });

    // Call Claude with START_LESSON trigger
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: LUMI_MODEL,
      max_tokens: LUMI_MAX_TOKENS,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: 'START_LESSON',
        },
      ],
    });

    let openingMessage = '';
    if (response.content[0]?.type === 'text') {
      openingMessage = response.content[0].text;
    }

    // Cache the result
    cache.set(cacheKey, { text: openingMessage, timestamp: Date.now() });

    return new Response(JSON.stringify({ message: openingMessage }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Opening message error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
