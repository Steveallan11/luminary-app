import { createClient } from '@supabase/supabase-js';
import { resolveTopic, resolveTopicById, resolveStructure, buildLiveContentManifest } from '@/lib/live-lesson-data';
import { ContentManifest, TopicLessonStructure } from '@/types';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface LessonGenerationReadyPayload {
  session_id: string;
  topic_id: string;
  topic_slug: string;
  subject_slug: string;
  age_group: string;
  state: 'live';
  generated_at: string;
  content_manifest: ContentManifest;
  opening_prompt: string;
  structure_id: string;
  source: 'supabase';
}

export async function publishLessonGenerationReady(params: {
  sessionId: string;
  subjectSlug: string;
  topicSlug: string;
}): Promise<LessonGenerationReadyPayload | null> {
  // First get the resolved topic using live data
  const topicContext = await resolveTopic(params.subjectSlug, params.topicSlug);
  if (!topicContext.topic) return null;

  // Get the lesson structure for this topic and a child age (we'll use a default age for generation)
  // Since we don't have a specific child here, we'll use age 8 as default
  const structure = await resolveStructure(topicContext.topic.id, 8);
  if (!structure) return null;

  // Build the content manifest using live data
  const contentManifest = await buildLiveContentManifest(topicContext.topic.id);

  const payloadBase: LessonGenerationReadyPayload = {
    session_id: params.sessionId,
    topic_id: topicContext.topic.id,
    topic_slug: topicContext.topic.slug,
    subject_slug: topicContext.subject.slug,
    age_group: structure.age_group,
    state: 'live',
    generated_at: new Date().toISOString(),
    content_manifest: contentManifest,
    opening_prompt: structure.spark_json?.opening_question ?? `What do you already know about ${topicContext.topic.title}?`,
    structure_id: structure.id,
    source: 'supabase',
  };

  const supabase = getAdminClient();
  if (!supabase) {
    return null;
  }

  // Upsert the generated lesson structure to the database
  const upsertedStructure = await upsertGeneratedLessonStructure(supabase, topicContext.topic.id, structure);

  const payload: LessonGenerationReadyPayload = {
    ...payloadBase,
    structure_id: upsertedStructure?.id ?? structure.id,
    source: 'supabase',
  };

  try {
    await supabase.from('lesson_generation_events').insert({
      session_id: payload.session_id,
      topic_id: payload.topic_id,
      age_group: payload.age_group,
      status: 'ready',
      payload_json: payload,
      created_at: payload.generated_at,
    });
  } catch {
    // Optional audit trail only.
  }

  try {
    await supabase.channel(`lesson-generation:${topicContext.topic.id}:${payload.age_group}`).send({
      type: 'broadcast',
      event: 'lesson_structure_ready',
      payload,
    });
  } catch {
    // Client will fall back to the HTTP response payload if broadcast fails.
  }

  return payload;
}

async function upsertGeneratedLessonStructure(
  supabase: any,
  topicId: string,
  structure: TopicLessonStructure
): Promise<TopicLessonStructure | null> {
  const record = {
    topic_id: topicId,
    age_group: structure.age_group,
    version: structure.version,
    status: 'live',
    generation_model: structure.generation_model,
    spark_json: structure.spark_json,
    explore_json: structure.explore_json,
    anchor_json: structure.anchor_json,
    practise_json: structure.practise_json,
    create_json: structure.create_json,
    check_json: structure.check_json,
    celebrate_json: structure.celebrate_json,
    personalisation_hooks: structure.personalisation_hooks,
    quality_score: structure.quality_score,
    times_delivered: structure.times_delivered,
    avg_mastery_score: structure.avg_mastery_score,
    auto_improvement_notes: structure.auto_improvement_notes,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('topic_lesson_structures')
    .upsert(record, { onConflict: 'topic_id,age_group,version' })
    .select()
    .single();

  if (error || !data) return null;
  return data as TopicLessonStructure;
}
