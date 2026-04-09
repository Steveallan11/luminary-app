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
  getAgeGroup,
} from '@/lib/lesson-engine';
import { getSupabaseServiceClient } from '@/lib/supabase-service';
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
      child_id,
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
      // Admin test mode: use the provided system prompt directly
      systemPrompt = admin_system_prompt;
      activePhase = current_phase ?? 'spark';
    } else {
      // ── Start with mock fallbacks ────────────────────────────────────────
      let childName = MOCK_CHILD.name;
      let childAge = MOCK_CHILD.age;
      let subject = MOCK_SUBJECTS.find((s) => s.slug === subject_slug) ?? null;
      let topic = findTopicBySlug(subject_slug, topic_slug);
      let structure = topic ? getLessonStructureForTopic(topic.id, childAge) : null;

      // ── Try to load real data from Supabase ──────────────────────────────
      try {
        const supabase = getSupabaseServiceClient();

        // Load child profile for real name/age
        if (child_id) {
          const { data: childData } = await supabase
            .from('children')
            .select('name, age')
            .eq('id', child_id)
            .single();
          if (childData) {
            childName = childData.name;
            childAge = childData.age;
          }
        }

        // Load subject
        const { data: subjectData } = await supabase
          .from('subjects')
          .select('*')
          .eq('slug', subject_slug)
          .single();

        if (subjectData) {
          subject = subjectData;

          // Load topic
          const { data: topicData } = await supabase
            .from('topics')
            .select('*')
            .eq('subject_id', subjectData.id)
            .eq('slug', topic_slug)
            .single();

          if (topicData) {
            topic = topicData;

            // Load lesson structure
            const ageGroup = getAgeGroup(childAge);
            const { data: structureData } = await supabase
              .from('topic_lesson_structures')
              .select('*')
              .eq('topic_id', topicData.id)
              .eq('age_group', ageGroup)
              .eq('status', 'live')
              .order('version', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (structureData) structure = structureData;
          }
        }
      } catch {
        // Supabase unavailable — mock fallbacks already set above
      }

      if (!subject || !topic) {
        return new Response(JSON.stringify({ error: 'Subject or topic not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const phaseTracking = getMockPhaseTracking(session_id);
      activePhase = current_phase ?? phaseTracking.current_phase;
      const contentManifest = topic ? buildContentManifest(topic.id) : undefined;

      systemPrompt = generateLumiSystemPrompt({
        child_name: childName,
        child_age: childAge,
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

    // If no OpenRouter API key, return a mock stream so the UI doesn't crash
    if (!process.env.OPENROUTER_API_KEY) {
      const lastUserMsg = messages[messages.length - 1]?.content ?? '';
      const mockResponses = [
        `Hey there! ✨ Great question! I'm Lumi, your learning buddy. I can see you're thinking about "${lastUserMsg.slice(0, 40)}..." — that's brilliant! To get me fully powered up, an OpenRouter API key needs to be added to the environment. But the app is working perfectly! 🚀`,
        `Ooh, I love that you're curious! 🌟 Once the OpenRouter API key is connected, I'll be able to give you a proper answer and take you through the full lesson. You're going to love it!`,
        `Great thinking! 💡 I'm running in demo mode right now — the real Lumi is even more fun and will walk you through everything step by step. Almost there!`,
      ];
      const mockText = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      const encoder2 = new TextEncoder();
      const mockStream = new ReadableStream({
        async start(controller) {
          const words = mockText.split(' ');
          for (const word of words) {
            controller.enqueue(encoder2.encode(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`));
            await new Promise((r) => setTimeout(r, 25));
          }
          controller.enqueue(encoder2.encode(`data: ${JSON.stringify({ phase: activePhase })}\n\n`));
          controller.enqueue(encoder2.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(mockStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
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
