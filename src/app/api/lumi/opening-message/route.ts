import { NextRequest } from 'next/server';
import { getAnthropicClient, LUMI_MODEL, LUMI_MAX_TOKENS } from '@/lib/anthropic';
import { generateLumiSystemPrompt } from '@/lib/lumi-prompt';
import { MOCK_CHILD, MOCK_SUBJECTS } from '@/lib/mock-data';
import {
  buildContentManifest,
  findTopicBySlug,
  getLessonStructureForTopic,
  startLesson,
  getAgeGroup,
} from '@/lib/lesson-engine';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

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

    // ── Start with mock fallbacks ────────────────────────────────────────────
    let childName = MOCK_CHILD.name;
    let childAge = MOCK_CHILD.age;
    let subject = MOCK_SUBJECTS.find((s) => s.slug === subject_slug) ?? null;
    let topic = findTopicBySlug(subject_slug, topic_slug);
    let structure = topic ? getLessonStructureForTopic(topic.id, childAge) : null;

    // ── Try to load real data from Supabase ──────────────────────────────────
    try {
      const supabase = getSupabaseServiceClient();

      // Load child profile for real name/age
      const { data: childData } = await supabase
        .from('children')
        .select('name, age')
        .eq('id', child_id)
        .single();
      if (childData) {
        childName = childData.name;
        childAge = childData.age;
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

          // Load lesson structure for this child's age group
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

    // ── If still no topic found, fall back to mock startLesson ───────────────
    if (!topic) {
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

      topic = startState.topic;
      structure = startState.structure;
    }

    if (!subject) {
      return new Response(JSON.stringify({ error: 'Subject not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessionId = `lesson-${topic.id}-${Date.now()}`;

    // ── Check cache ──────────────────────────────────────────────────────────
    const cacheKey = `${child_id}:${subject_slug}:${topic_slug}:${childAge}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(
        JSON.stringify({
          message: cached.text,
          state: 'live',
          session_id: sessionId,
          phase: 'spark',
          content_manifest: buildContentManifest(topic.id),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── If no structure available, return generating state ───────────────────
    if (!structure) {
      return new Response(
        JSON.stringify({
          message: `I'm building a fresh ${topic.title} lesson for ${childName} now!`,
          state: 'generating',
          estimated_seconds: 12,
          progress_message: 'Lumi is weaving together your personalised lesson arc, examples, and practice tasks.',
          session_id: sessionId,
          content_manifest: buildContentManifest(topic.id),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Generate opening message via Claude ──────────────────────────────────
    const systemPrompt = generateLumiSystemPrompt({
      child_name: childName,
      child_age: childAge,
      subject_name: subject.name,
      topic_title: topic.title,
      topic_description: topic.description,
      previous_struggles: [],
      mastery_score: 0,
      content_manifest: buildContentManifest(topic.id),
      structure,
      current_phase: 'spark',
    });

    const fallbackOpening = structure.spark_json?.opening_question ?? `What do you already know about ${topic.title}?`;
    let openingMessage = fallbackOpening;

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
      openingMessage = fallbackOpening;
    }

    cache.set(cacheKey, { text: openingMessage, timestamp: Date.now() });

    return new Response(
      JSON.stringify({
        message: openingMessage,
        state: 'live',
        session_id: sessionId,
        phase: 'spark',
        content_manifest: buildContentManifest(topic.id),
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
