import { NextRequest } from 'next/server';
import { getAnthropicClient, LUMI_MODEL, LUMI_MAX_TOKENS } from '@/lib/anthropic';
import { generateHintPrompt, generateLumiSystemPrompt } from '@/lib/lumi-prompt';
import { MOCK_CHILD, MOCK_SUBJECTS } from '@/lib/mock-data';
import {
  buildContentManifest,
  findTopicBySlug,
  getLessonStructureForTopic,
  getMockPhaseTracking,
  getNextPhase,
  parseContentSignals,
  parsePhaseSignal,
  parseImageSignals,
  stripAllSignals,
} from '@/lib/lesson-engine';
import { LessonPhase } from '@/types';

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
  current_phase?: LessonPhase;
  prior_knowledge?: string;
  // Admin test mode
  admin_mode?: boolean;
  admin_system_prompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const {
      subject_slug,
      topic_slug,
      messages,
      is_hint,
      mastery_score,
      session_id,
      current_phase,
      prior_knowledge,
      admin_mode,
      admin_system_prompt,
    } = body;

    let systemPrompt: string;
    let activePhase: LessonPhase;

    if (admin_mode && admin_system_prompt) {
      // Admin test mode: use the provided system prompt directly, skip mock data lookup
      systemPrompt = admin_system_prompt;
      activePhase = current_phase ?? 'spark';
    } else {
      // Normal child mode: use mock data and generate standard Lumi prompt
      const child = MOCK_CHILD;
      const subject = MOCK_SUBJECTS.find((s) => s.slug === subject_slug);
      const topic = findTopicBySlug(subject_slug, topic_slug);

      if (!subject || !topic) {
        return new Response(JSON.stringify({ error: 'Subject or topic not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const phaseTracking = getMockPhaseTracking(session_id);
      activePhase = current_phase ?? phaseTracking.current_phase;
      const structure = getLessonStructureForTopic(topic.id, child.age);
      const contentManifest = buildContentManifest(topic.id);

      systemPrompt = generateLumiSystemPrompt({
        child_name: child.name,
        child_age: child.age,
        subject_name: subject.name,
        topic_title: topic.title,
        topic_description: topic.description,
        previous_struggles: prior_knowledge ? [prior_knowledge] : [],
        mastery_score: mastery_score ?? 0,
        content_manifest: contentManifest,
        structure,
        current_phase: activePhase,
      });
    }

    const claudeMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (is_hint && claudeMessages.length > 0) {
      const lastMsg = claudeMessages[claudeMessages.length - 1];
      const hintInstruction = generateHintPrompt(activePhase);
      if (lastMsg.role === 'user') {
        lastMsg.content = `${lastMsg.content}\n\n[SYSTEM: ${hintInstruction}]`;
      } else {
        claudeMessages.push({ role: 'user', content: `[SYSTEM: ${hintInstruction}]` });
      }
    }

    const client = getAnthropicClient();
    const stream = await client.messages.stream({
      model: LUMI_MODEL,
      max_tokens: LUMI_MAX_TOKENS,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let combinedText = '';

          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              combinedText += event.delta.text;
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }

          const contentSignals = parseContentSignals(combinedText);
          const phaseSignal = parsePhaseSignal(combinedText);
          const imageSignals = parseImageSignals(combinedText);
          const cleanText = stripAllSignals(combinedText);
          const resolvedPhase = phaseSignal?.phase ?? (cleanText.length > 200 ? getNextPhase(activePhase) : activePhase);

          if (cleanText !== combinedText) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ replace_text: cleanText })}\n\n`)
            );
          }

          if (contentSignals.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content_signals: contentSignals })}\n\n`)
            );
          }

          if (imageSignals.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ image_signals: imageSignals })}\n\n`)
            );
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ phase: resolvedPhase })}\n\n`)
          );
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
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
