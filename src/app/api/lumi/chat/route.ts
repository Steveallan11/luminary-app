import { NextRequest } from 'next/server';
import { getAnthropicClient, LUMI_MODEL, LUMI_MAX_TOKENS } from '@/lib/anthropic';
import { generateHintPrompt } from '@/lib/lumi-prompt';
import {
  buildLiveLumiPrompt,
  getErrorMessage,
  getErrorResponseStatus,
} from '@/lib/live-lesson-data';
import {
  getNextPhase,
  parseContentSignals,
  parseImageSignals,
  parsePhaseSignal,
  stripAllSignals,
} from '@/lib/lesson-runtime';
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
  admin_mode?: boolean;
  admin_system_prompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const {
      child_id,
      topic_id,
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
      systemPrompt = admin_system_prompt;
      activePhase = current_phase ?? 'spark';
    } else {
      if (!child_id || !topic_id || !subject_slug || !topic_slug || !session_id) {
        return new Response(
          JSON.stringify({ error: 'child_id, topic_id, subject_slug, topic_slug and session_id are required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const livePrompt = await buildLiveLumiPrompt({
        childId: child_id,
        topicId: topic_id,
        subjectSlug: subject_slug,
        topicSlug: topic_slug,
        sessionId: session_id,
        masteryScore: mastery_score,
        currentPhase: current_phase,
        priorKnowledge: prior_knowledge,
      });

      systemPrompt = livePrompt.systemPrompt;
      activePhase = livePrompt.activePhase;
    }

    const claudeMessages: ChatMessage[] = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    if (is_hint && claudeMessages.length > 0) {
      const lastMessage = claudeMessages[claudeMessages.length - 1];
      const hintInstruction = generateHintPrompt(activePhase);
      if (lastMessage.role === 'user') {
        lastMessage.content = `${lastMessage.content}\n\n[SYSTEM: ${hintInstruction}]`;
      } else {
        claudeMessages.push({ role: 'user', content: `[SYSTEM: ${hintInstruction}]` });
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Lumi chat is unavailable because ANTHROPIC_API_KEY is not configured' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              combinedText += event.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }

          const contentSignals = parseContentSignals(combinedText);
          const phaseSignal = parsePhaseSignal(combinedText);
          const imageSignals = parseImageSignals(combinedText);
          const cleanText = stripAllSignals(combinedText);
          const resolvedPhase =
            phaseSignal?.phase ??
            (cleanText.length > 200 ? getNextPhase(activePhase) : activePhase);

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
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: getErrorMessage(error, 'Stream error') })}\n\n`
            )
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
    return new Response(
      JSON.stringify({ error: getErrorMessage(error, 'Internal server error') }),
      {
        status: getErrorResponseStatus(error),
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
