import {
  AgeGroup,
  ContentManifest,
  GameType,
  LessonPhase,
  ParsedContentSignal,
  ParsedPhaseSignal,
  Topic,
  TopicAsset,
  TopicLessonStructure,
  TopicStatus,
} from '@/types';
import {
  MOCK_CHILD,
  MOCK_LESSON_PHASE_TRACKING,
  MOCK_LESSON_STRUCTURES,
  MOCK_TOPICS,
  MOCK_TOPIC_PROGRESS,
} from '@/lib/mock-data';
import { MOCK_TOPIC_ASSETS, MOCK_FRACTION_BAR_DIAGRAM, MOCK_NUMBER_LINE } from '@/lib/mock-content';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

function logLessonFallback(message: string, error?: unknown) {
  console.warn(`[lesson-engine] ${message}`, error instanceof Error ? error.message : error ?? '');
}

export interface LessonStartResult {
  state: 'live' | 'generating';
  topic: Topic;
  ageGroup: Exclude<AgeGroup, 'all'>;
  structure: TopicLessonStructure | null;
  sessionId: string;
  phase: LessonPhase;
  openingPrompt: string;
  estimatedSeconds?: number;
  progressMessage?: string;
  contentManifest?: ContentManifest;
}

export interface GeneratedLessonEnvelope {
  structure: TopicLessonStructure;
  contentManifest: ContentManifest;
  openingPrompt: string;
}

export function getAgeGroup(age: number): Exclude<AgeGroup, 'all'> {
  if (age <= 7) return '5-7';
  if (age <= 11) return '8-11';
  if (age <= 14) return '12-14';
  return '15-16';
}

type SupabaseServiceClient = ReturnType<typeof getSupabaseServiceClient>;

async function fetchChildProfile(
  supabase: SupabaseServiceClient,
  childId: string
): Promise<{ name?: string; age?: number }> {
  const { data } = await supabase
    .from('children')
    .select('name, age')
    .eq('id', childId)
    .maybeSingle();
  return data ?? {};
}

async function fetchTopicFromSupabase(
  supabase: SupabaseServiceClient,
  subjectSlug: string,
  topicSlug: string
): Promise<Topic | null> {
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', subjectSlug)
    .maybeSingle();
  if (!subject?.id) return null;

  const { data: topic } = await supabase
    .from('topics')
    .select('id, subject_id, title, slug, description, order_index, key_stage, estimated_minutes, created_at')
    .eq('subject_id', subject.id)
    .eq('slug', topicSlug)
    .maybeSingle();

  return topic ?? null;
}

async function fetchStructureFromSupabase(
  supabase: SupabaseServiceClient,
  topicId: string,
  ageGroup: Exclude<AgeGroup, 'all'>
): Promise<TopicLessonStructure | null> {
  const { data } = await supabase
    .from('topic_lesson_structures')
    .select('*')
    .eq('topic_id', topicId)
    .eq('age_group', ageGroup)
    .eq('status', 'live')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

async function fetchTopicAssetsFromSupabase(
  supabase: SupabaseServiceClient,
  topicId: string
): Promise<TopicAsset[]> {
  const { data, error } = await supabase
    .from('topic_assets')
    .select('*')
    .eq('topic_id', topicId)
    .eq('status', 'published');
  if (error || !data) return [];
  return data as TopicAsset[];
}

export function findTopicBySlug(subjectSlug: string, topicSlug: string): Topic | null {
  const topics = MOCK_TOPICS[subjectSlug] || [];
  return topics.find((topic) => topic.slug === topicSlug) ?? null;
}

export function getLessonStructureForTopic(topicId: string, childAge: number): TopicLessonStructure | null {
  const ageGroup = getAgeGroup(childAge);
  const entry = Object.values(MOCK_LESSON_STRUCTURES).find(
    (structure) => structure.topic_id === topicId && structure.age_group === ageGroup && structure.status === 'live'
  );
  return entry ?? null;
}

export function buildContentManifest(topicId: string, assets?: TopicAsset[]): ContentManifest {
  const availableAssets = assets ?? MOCK_TOPIC_ASSETS.filter((asset) => asset.topic_id === topicId);
  const diagrams = [MOCK_FRACTION_BAR_DIAGRAM, MOCK_NUMBER_LINE].filter((diagram) => diagram.topic_id === topicId);

  const concept = availableAssets.find((asset) => asset.asset_type === 'concept_card');
  const video = availableAssets.find((asset) => asset.asset_type === 'video');
  const worksheet = availableAssets.find((asset) => asset.asset_type === 'worksheet');
  const checkQuestions = availableAssets.find((asset) => asset.asset_type === 'check_questions');
  const everyday = availableAssets.find((asset) => asset.asset_type === 'realworld_card' && asset.asset_subtype === 'everyday');
  const inspiring = availableAssets.find((asset) => asset.asset_type === 'realworld_card' && asset.asset_subtype === 'inspiring');
  const game = availableAssets.find((asset) => asset.asset_type === 'game_questions');
  const linkedDiagram = diagrams[0];

  return {
    concept_card: concept ? { id: concept.id, title: concept.title } : undefined,
    video: video ? { id: video.id, title: video.title } : undefined,
    worksheet: worksheet ? { id: worksheet.id, title: worksheet.title } : undefined,
    check_questions: checkQuestions ? { id: checkQuestions.id, title: checkQuestions.title } : undefined,
    realworld_everyday: everyday ? { id: everyday.id, title: everyday.title } : undefined,
    realworld_inspiring: inspiring ? { id: inspiring.id, title: inspiring.title } : undefined,
    game: game
      ? { id: game.id, title: game.title, game_type: ((game.asset_subtype as GameType | null) ?? 'match_it') }
      : undefined,
    diagram: linkedDiagram ? { id: linkedDiagram.id, title: linkedDiagram.title, diagram_type: linkedDiagram.diagram_type } : undefined,
  };
}

export async function startLesson(
  subjectSlug: string,
  topicSlug: string,
  childId?: string
): Promise<LessonStartResult | null> {
  let topic = findTopicBySlug(subjectSlug, topicSlug);
  let childAge = MOCK_CHILD.age;
  let childName = MOCK_CHILD.name;
  let ageGroup = getAgeGroup(childAge);
  let structure: TopicLessonStructure | null = topic ? getLessonStructureForTopic(topic.id, childAge) : null;
  let manifestAssets: TopicAsset[] | undefined;

  try {
    const supabase = getSupabaseServiceClient();

    if (childId) {
      const profile = await fetchChildProfile(supabase, childId);
      if (typeof profile.age === 'number') {
        childAge = profile.age;
        ageGroup = getAgeGroup(childAge);
      }
      if (profile.name) {
        childName = profile.name;
      }
    }

    const remoteTopic = await fetchTopicFromSupabase(supabase, subjectSlug, topicSlug);
    if (remoteTopic) {
      topic = remoteTopic;
      structure = null;
    }

    if (topic) {
      const supaStructure = await fetchStructureFromSupabase(supabase, topic.id, ageGroup);
      if (supaStructure) {
        structure = supaStructure;
      }
      manifestAssets = await fetchTopicAssetsFromSupabase(supabase, topic.id);
    }
  } catch (error) {
    logLessonFallback('Supabase lesson fetch failed, falling back to mock data', error);
  }

  if (!topic) return null;

  if (!structure) {
    structure = getLessonStructureForTopic(topic.id, childAge);
  }

  const contentManifest = buildContentManifest(topic.id, manifestAssets);
  const sessionId = `lesson-${topic.id}-${Date.now()}`;

  if (!structure) {
    return {
      state: 'generating',
      topic,
      ageGroup,
      structure: null,
      sessionId,
      phase: 'spark',
      openingPrompt: `I'm building a fresh ${topic.title} lesson for ${childName} now.`,
      estimatedSeconds: 12,
      progressMessage: 'Lumi is weaving together your personalised lesson arc, examples, and practice tasks.',
      contentManifest,
    };
  }

  return {
    state: 'live',
    topic,
    ageGroup,
    structure,
    sessionId,
    phase: 'spark',
    openingPrompt: structure.spark_json?.opening_question ?? `What do you already know about ${topic.title}?`,
    contentManifest,
  };
}



export function generateLessonEnvelope(subjectSlug: string, topicSlug: string): GeneratedLessonEnvelope | null {
  const topic = findTopicBySlug(subjectSlug, topicSlug);
  if (!topic) return null;

  const structure =
    getLessonStructureForTopic(topic.id, MOCK_CHILD.age) ??
    Object.values(MOCK_LESSON_STRUCTURES)[0];

  return {
    structure,
    contentManifest: buildContentManifest(topic.id),
    openingPrompt:
      structure.spark_json?.opening_question ?? `Before we begin, what do you already notice about ${topic.title}?`,
  };
}

export function parseContentSignals(text: string): ParsedContentSignal[] {
  const matches = text.match(/\[CONTENT:([a-z_]+):([^\]]+)\]/g) ?? [];
  return matches.map((match) => {
    const [, type, id] = match.match(/\[CONTENT:([a-z_]+):([^\]]+)\]/) ?? [];
    return { type, id };
  }).filter((entry) => entry.type && entry.id);
}

export function stripSignals(text: string): string {
  return text
    .replace(/\[CONTENT:[^\]]+\]/g, '')
    .replace(/\[PHASE:[^\]]+\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface ParsedImageSignal {
  url: string;
  media_type?: 'image' | 'gif' | 'youtube';
  title?: string;
}

export function parseImageSignals(text: string): ParsedImageSignal[] {
  const results: ParsedImageSignal[] = [];

  // [IMAGE:url] — standard image or GIF
  const imageMatches = text.match(/\[IMAGE:(https?:\/\/[^\]]+)\]/g) ?? [];
  for (const match of imageMatches) {
    const [, url] = match.match(/\[IMAGE:(https?:\/\/[^\]]+)\]/) ?? [];
    if (url) {
      const isGif = url.toLowerCase().includes('.gif') || url.toLowerCase().includes('giphy');
      results.push({ url, media_type: isGif ? 'gif' : 'image' });
    }
  }

  // [YOUTUBE:videoId] — YouTube embed
  const ytMatches = text.match(/\[YOUTUBE:([A-Za-z0-9_-]{6,15})\]/g) ?? [];
  for (const match of ytMatches) {
    const [, videoId] = match.match(/\[YOUTUBE:([A-Za-z0-9_-]{6,15})\]/) ?? [];
    if (videoId) {
      results.push({ url: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`, media_type: 'youtube' });
    }
  }

  // [GIF:url] — explicit GIF signal
  const gifMatches = text.match(/\[GIF:(https?:\/\/[^\]]+)\]/g) ?? [];
  for (const match of gifMatches) {
    const [, url] = match.match(/\[GIF:(https?:\/\/[^\]]+)\]/) ?? [];
    if (url) results.push({ url, media_type: 'gif' });
  }

  return results;
}

export function stripAllSignals(text: string): string {
  return text
    .replace(/\[CONTENT:[^\]]+\]/g, '')
    .replace(/\[PHASE:[^\]]+\]/g, '')
    .replace(/\[IMAGE:[^\]]+\]/g, '')
    .replace(/\[YOUTUBE:[^\]]+\]/g, '')
    .replace(/\[GIF:[^\]]+\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parsePhaseSignal(text: string): ParsedPhaseSignal | null {
  const match = text.match(/\[PHASE:([a-z]+)\]/);
  if (!match) return null;
  const phase = match[1] as LessonPhase;
  return {
    phase,
  };
}

export function getNextPhase(currentPhase: LessonPhase): LessonPhase {
  const order: LessonPhase[] = ['spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate'];
  const currentIndex = order.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === order.length - 1) return 'celebrate';
  return order[currentIndex + 1];
}

export function inferTopicStatus(mastery: number): TopicStatus {
  if (mastery >= 80) return 'completed';
  if (mastery >= 30) return 'in_progress';
  return 'available';
}

export function getMockPhaseTracking(sessionId: string) {
  return MOCK_LESSON_PHASE_TRACKING[sessionId] ?? {
    id: `phase-${sessionId}`,
    session_id: sessionId,
    current_phase: 'spark' as LessonPhase,
    phase_started_at: new Date().toISOString(),
    objectives_covered: [],
    mastery_signals: {},
    phase_history: [{ phase: 'spark' as LessonPhase, entered_at: new Date().toISOString() }],
    hints_used: 0,
    practise_responses: [],
    check_responses: [],
    final_mastery_score: null,
    content_assets_shown: [],
    created_at: new Date().toISOString(),
  };
}

export function getTopicProgress(subjectSlug: string, topicSlug: string) {
  return MOCK_TOPIC_PROGRESS[subjectSlug]?.[topicSlug] ?? { status: 'available' as TopicStatus, mastery_score: 0 };
}
