import { NextRequest } from 'next/server';
import { getAnthropicClient, LUMI_MODEL, LUMI_MAX_TOKENS } from '@/lib/anthropic';
import { generateLumiSystemPrompt, generateHintPrompt } from '@/lib/lumi-prompt';
import { MOCK_CHILD, MOCK_SUBJECTS, MOCK_TOPICS } from '@/lib/mock-data';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  child_id: string;
  topic_id: string;
  subject_slug: string;
  topic_slug: string;
  messages: ChatMessage[];
  session_id: string;
  is_hint?: boolean;
  mastery_score?: number;
}

/**
 * POST /api/lumi/chat
 *
 * Streams a response from Claude as Lumi the AI tutor.
 * Uses the child's profile and topic context to generate a personalised system prompt.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { child_id, subject_slug, topic_slug, messages, is_hint, mastery_score } = body;

    // Fetch child profile (using mock data for MVP; replace with Supabase query)
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

    // Generate dynamic system prompt
    const systemPrompt = generateLumiSystemPrompt({
      child_name: child.name,
      child_age: child.age,
      subject_name: subject.name,
      topic_title: topic.title,
      topic_description: topic.description,
      previous_struggles: [], // Would come from Supabase in production
      mastery_score: mastery_score ?? 0,
    });

    // Build messages array for Claude
    const claudeMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // If hint requested, add hint instruction to the last user message
    if (is_hint && claudeMessages.length > 0) {
      const lastMsg = claudeMessages[claudeMessages.length - 1];
      if (lastMsg.role === 'user') {
        lastMsg.content = `${lastMsg.content}\n\n[SYSTEM: ${generateHintPrompt()}]`;
      } else {
        claudeMessages.push({
          role: 'user',
          content: `[SYSTEM: ${generateHintPrompt()}]`,
        });
      }
    }

    // Call Anthropic with streaming
    const client = getAnthropicClient();

    const stream = await client.messages.stream({
      model: LUMI_MODEL,
      max_tokens: LUMI_MAX_TOKENS,
      system: systemPrompt,
      messages: claudeMessages,
    });

    // Create a ReadableStream that forwards the Anthropic stream
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }
          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Lumi chat error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
