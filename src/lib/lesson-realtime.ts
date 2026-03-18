import { createClient } from '@supabase/supabase-js';
import { buildContentManifest, findTopicBySlug, generateLessonEnvelope, getAgeGroup, getLessonStructureForTopic } from '@/lib/lesson-engine';
import { MOCK_CHILD } from '@/lib/mock-data';
import { TopicLessonStructure } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
  content_manifest: ReturnType<typeof buildContentManifest>;
  opening_prompt: string;
  structure_id: string;
  source: 'supabase' | 'mock';
}

export async function publishLessonGenerationReady(params: {
  sessionId: string;
  subjectSlug: string;
  topicSlug: string;
}): Promise<LessonGenerationReadyPayload | null> {
  const topic = findTopicBySlug(params.subjectSlug, params.topicSlug);
  if (!topic) return null;

  const generated = generateLessonEnvelope(params.subjectSlug, params.topicSlug);
  if (!generated) return null;

  const payloadBase: LessonGenerationReadyPayload = {
    session_id: params.sessionId,
    topic_id: topic.id,
    topic_slug: params.topicSlug,
    subject_slug: params.subjectSlug,
    age_group: getAgeGroup(MOCK_CHILD.age),
    state: 'live',
    generated_at: new Date().toISOString(),
    content_manifest: generated.contentManifest,
    opening_prompt: generated.openingPrompt,
    structure_id: generated.structure.id,
    source: 'mock',
  };

  const supabase = getAdminClient();
  if (!supabase) {
    return payloadBase;
  }

  const structure = await upsertGeneratedLessonStructure(supabase, topic.id, generated.structure);

  const payload: LessonGenerationReadyPayload = {
    ...payloadBase,
    structure_id: structure?.id ?? generated.structure.id,
    source: structure ? 'supabase' : 'mock',
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
    await supabase.channel(`lesson-generation:${topic.id}:${payload.age_group}`).send({
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
