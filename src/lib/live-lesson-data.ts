import { getAgeGroup } from '@/lib/lesson-runtime';
import { generateLumiSystemPrompt } from '@/lib/lumi-prompt';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSupabaseServiceClient } from '@/lib/supabase-service';
import { ContentManifest, LessonPhase, TopicLessonStructure } from '@/types';

type ManifestDiagramType = NonNullable<ContentManifest['diagram']>['diagram_type'];
type ManifestGameType = NonNullable<ContentManifest['game']>['game_type'];

type FamilyRelation = {
  parent_user_id?: string | null;
} | null;

type LiveChildRow = {
  id: string;
  family_id: string;
  name: string;
  age: number;
  year_group: string | null;
  streak_days?: number | null;
  streak_last_date?: string | null;
  last_active_date?: string | null;
  xp_total?: number | null;
  xp?: number | null;
  families?: FamilyRelation | FamilyRelation[] | null;
  [key: string]: unknown;
};

type LiveSubjectRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  colour_hex?: string | null;
};

type LiveTopicRow = {
  id: string;
  subject_id: string;
  title: string;
  slug: string;
  description?: string | null;
  estimated_minutes?: number | null;
  key_stage?: string | null;
  lesson_generation_status?: string | null;
  last_generated_at?: string | null;
  subjects?: LiveSubjectRow | LiveSubjectRow[] | null;
};

type LiveSessionRow = {
  id: string;
  child_id: string;
  topic_id: string;
  [key: string]: unknown;
};

type RouteError = {
  status: number;
  message: string;
};

export type LiveLearnerContext = {
  child: LiveChildRow;
  subject: LiveSubjectRow;
  topic: LiveTopicRow;
  structure: TopicLessonStructure | null;
  session: LiveSessionRow | null;
  contentManifest: ContentManifest;
  knowledgeBase: Array<{
    title: string;
    content_type: string;
    summary: string;
    key_concepts: string[];
  }>;
};

function makeError(status: number, message: string): RouteError {
  return { status, message };
}

export function isRouteError(error: unknown): error is RouteError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'status' in error &&
      'message' in error
  );
}

function isMissingSupabaseConfig(error: unknown) {
  return error instanceof Error && error.message.includes('SUPABASE');
}

export function getErrorResponseStatus(error: unknown) {
  if (isRouteError(error)) return error.status;
  if (isMissingSupabaseConfig(error)) return 503;
  return 500;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (isRouteError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function unwrapRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

async function getAuthenticatedParentUserId() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export function getChildXpTotal(child: LiveChildRow) {
  return Number(child.xp_total ?? child.xp ?? 0);
}

export function getChildActiveDate(child: LiveChildRow) {
  return (child.streak_last_date as string | null | undefined) ?? (child.last_active_date as string | null | undefined) ?? null;
}

export function buildChildStatsUpdate(child: LiveChildRow, xpEarned: number, activeDateIso: string, streakDays: number) {
  const update: Record<string, unknown> = { streak_days: streakDays };

  if (Object.prototype.hasOwnProperty.call(child, 'xp_total')) {
    update.xp_total = getChildXpTotal(child) + xpEarned;
  } else if (Object.prototype.hasOwnProperty.call(child, 'xp')) {
    update.xp = getChildXpTotal(child) + xpEarned;
  }

  if (Object.prototype.hasOwnProperty.call(child, 'streak_last_date')) {
    update.streak_last_date = activeDateIso.slice(0, 10);
  } else if (Object.prototype.hasOwnProperty.call(child, 'last_active_date')) {
    update.last_active_date = activeDateIso.slice(0, 10);
  }

  return update;
}

export function buildSessionUpdate(
  session: LiveSessionRow,
  values: {
    endedAt: string;
    xpEarned: number;
    summaryText: string;
    masteryScore: number;
    durationMinutes: number;
    finalPhase?: LessonPhase;
  }
) {
  const update: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(session, 'ended_at')) {
    update.ended_at = values.endedAt;
  }
  if (Object.prototype.hasOwnProperty.call(session, 'xp_earned')) {
    update.xp_earned = values.xpEarned;
  }
  if (Object.prototype.hasOwnProperty.call(session, 'summary_text')) {
    update.summary_text = values.summaryText;
  }
  if (Object.prototype.hasOwnProperty.call(session, 'final_mastery_score')) {
    update.final_mastery_score = values.masteryScore;
  }
  if (Object.prototype.hasOwnProperty.call(session, 'session_duration_mins')) {
    update.session_duration_mins = values.durationMinutes;
  } else if (Object.prototype.hasOwnProperty.call(session, 'duration_minutes')) {
    update.duration_minutes = values.durationMinutes;
  }
  if (Object.prototype.hasOwnProperty.call(session, 'status')) {
    update.status = 'completed';
  }
  if (values.finalPhase && Object.prototype.hasOwnProperty.call(session, 'final_phase_reached')) {
    update.final_phase_reached = values.finalPhase;
  }

  return update;
}

async function resolveChild(childId: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('children')
    .select('*, families(parent_user_id)')
    .eq('id', childId)
    .maybeSingle();

  if (error) throw makeError(500, error.message);
  if (!data) throw makeError(404, 'Learner not found');

  const authUserId = await getAuthenticatedParentUserId();
  const family = unwrapRelation(data.families);
  if (authUserId && family?.parent_user_id && family.parent_user_id !== authUserId) {
    throw makeError(403, 'Learner does not belong to the current authenticated parent');
  }

  return data as LiveChildRow;
}

export async function resolveTopic(subjectSlug: string, topicSlug: string) {
  const supabase = getSupabaseServiceClient();
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id, name, slug')
    .eq('slug', subjectSlug)
    .maybeSingle();

  if (subjectError) throw makeError(500, subjectError.message);
  if (!subject) throw makeError(404, 'Subject not found');

  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('id, subject_id, title, slug, description, estimated_minutes, key_stage, lesson_generation_status, last_generated_at')
    .eq('subject_id', subject.id)
    .eq('slug', topicSlug)
    .maybeSingle();

  if (topicError) throw makeError(500, topicError.message);
  if (!topic) throw makeError(404, 'Topic not found');

  return {
    subject: subject as LiveSubjectRow,
    topic: topic as LiveTopicRow,
  };
}

export async function resolveTopicById(topicId: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('topics')
    .select('id, subject_id, title, slug, description, estimated_minutes, key_stage, lesson_generation_status, last_generated_at, subjects(id, name, slug)')
    .eq('id', topicId)
    .maybeSingle();

  if (error) throw makeError(500, error.message);
  if (!data) throw makeError(404, 'Topic not found');

  const subject = unwrapRelation(data.subjects);
  if (!subject) throw makeError(500, 'Topic is missing subject metadata');

  return {
    subject: subject as LiveSubjectRow,
    topic: data as LiveTopicRow,
  };
}

export async function resolveStructure(topicId: string, childAge: number) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('topic_lesson_structures')
    .select('*')
    .eq('topic_id', topicId)
    .eq('age_group', getAgeGroup(childAge))
    .eq('status', 'live')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw makeError(500, error.message);
  return data as TopicLessonStructure | null;
}

export async function buildLiveContentManifest(topicId: string): Promise<ContentManifest> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('topic_assets')
    .select('id, title, asset_type, asset_subtype, status')
    .eq('topic_id', topicId)
    .eq('status', 'published');

  if (error) {
    if (error.message.toLowerCase().includes('does not exist')) {
      return {};
    }
    throw makeError(500, error.message);
  }

  const manifest: ContentManifest = {};
  for (const asset of data ?? []) {
    if (asset.asset_type === 'concept_card' && !manifest.concept_card) {
      manifest.concept_card = { id: asset.id, title: asset.title };
    }
    if (asset.asset_type === 'video' && !manifest.video) {
      manifest.video = { id: asset.id, title: asset.title };
    }
    if (asset.asset_type === 'worksheet' && !manifest.worksheet) {
      manifest.worksheet = { id: asset.id, title: asset.title };
    }
    if (asset.asset_type === 'check_questions' && !manifest.check_questions) {
      manifest.check_questions = { id: asset.id, title: asset.title };
    }
    if (asset.asset_type === 'diagram' && !manifest.diagram) {
      manifest.diagram = {
        id: asset.id,
        title: asset.title,
        diagram_type: (asset.asset_subtype as ManifestDiagramType) ?? 'labelled_diagram',
      };
    }
    if (asset.asset_type === 'realworld_card' && asset.asset_subtype === 'everyday' && !manifest.realworld_everyday) {
      manifest.realworld_everyday = { id: asset.id, title: asset.title };
    }
    if (asset.asset_type === 'realworld_card' && asset.asset_subtype === 'inspiring' && !manifest.realworld_inspiring) {
      manifest.realworld_inspiring = { id: asset.id, title: asset.title };
    }
    if (asset.asset_type === 'game_questions' && !manifest.game) {
      manifest.game = {
        id: asset.id,
        title: asset.title,
        game_type: (asset.asset_subtype as ManifestGameType) ?? 'match_it',
      };
    }
  }

  return manifest;
}

async function resolveSession(sessionId: string, childId: string, topicId: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('lesson_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) throw makeError(500, error.message);
  if (!data) throw makeError(404, 'Lesson session not found');
  if (data.child_id !== childId || data.topic_id !== topicId) {
    throw makeError(400, 'Session does not match learner or topic context');
  }

  return data as LiveSessionRow;
}

async function resolveKnowledgeBase(topicId: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('lesson_knowledge_base')
    .select('title, content_type, text_content, extracted_summary, key_concepts, is_active')
    .eq('lesson_id', topicId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) {
    throw makeError(500, error.message);
  }

  return (data ?? []).map((item: any) => ({
    title: String(item.title ?? 'Untitled resource'),
    content_type: String(item.content_type ?? 'text'),
    summary: String(item.extracted_summary ?? item.text_content ?? '').slice(0, 500),
    key_concepts: Array.isArray(item.key_concepts) ? item.key_concepts.map((c: unknown) => String(c)) : [],
  }));
}

export async function getLiveLearnerContext(input: {
  childId: string;
  subjectSlug?: string;
  topicSlug?: string;
  topicId?: string;
  sessionId?: string;
}) {
  const child = await resolveChild(input.childId);
  const topicContext = input.topicId
    ? await resolveTopicById(input.topicId)
    : await resolveTopic(input.subjectSlug ?? '', input.topicSlug ?? '');
  const structure = await resolveStructure(topicContext.topic.id, child.age);
  const contentManifest = await buildLiveContentManifest(topicContext.topic.id);
  const knowledgeBase = await resolveKnowledgeBase(topicContext.topic.id);
  const session = input.sessionId
    ? await resolveSession(input.sessionId, child.id, topicContext.topic.id)
    : null;

  return {
    child,
    subject: topicContext.subject,
    topic: topicContext.topic,
    structure,
    session,
    contentManifest,
    knowledgeBase,
  } satisfies LiveLearnerContext;
}

export async function createLiveLessonSession(input: {
  childId: string;
  subjectSlug: string;
  topicSlug: string;
}) {
  const context = await getLiveLearnerContext(input);
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('lesson_sessions')
    .insert({
      child_id: context.child.id,
      topic_id: context.topic.id,
    })
    .select('*')
    .single();

  if (error) throw makeError(500, error.message);

  return {
    ...context,
    session: data as LiveSessionRow,
    ageGroup: getAgeGroup(context.child.age),
    openingPrompt:
      context.structure?.spark_json?.opening_question ??
      `What do you already know about ${context.topic.title}?`,
  };
}

export async function buildLiveLumiPrompt(input: {
  childId: string;
  topicId?: string;
  subjectSlug: string;
  topicSlug: string;
  sessionId: string;
  masteryScore?: number;
  currentPhase?: LessonPhase;
  priorKnowledge?: string;
}) {
  const context = await getLiveLearnerContext({
    childId: input.childId,
    topicId: input.topicId,
    subjectSlug: input.subjectSlug,
    topicSlug: input.topicSlug,
    sessionId: input.sessionId,
  });

  return {
    context,
    activePhase: input.currentPhase ?? 'spark',
    systemPrompt: generateLumiSystemPrompt({
      child_name: context.child.name,
      child_age: context.child.age,
      subject_name: context.subject.name,
      topic_title: context.topic.title,
      topic_description: context.topic.description ?? '',
      previous_struggles: input.priorKnowledge ? [input.priorKnowledge] : [],
      mastery_score: input.masteryScore ?? 0,
      content_manifest: context.contentManifest,
      knowledge_base_entries: context.knowledgeBase,
      structure: context.structure,
      current_phase: input.currentPhase ?? 'spark',
    }),
  };
}
