import {
  AgeGroup,
  ContentManifest,
  GameType,
  LessonPhase,
  ParsedContentSignal,
  ParsedPhaseSignal,
  Topic,
  TopicLessonStructure,
  TopicStatus,
} from '@/types';
import { createClient } from '@supabase/supabase-js';

// Import mock data as fallback only
import {
  MOCK_CHILD,
  MOCK_LESSON_PHASE_TRACKING,
  MOCK_LESSON_STRUCTURES,
  MOCK_TOPICS,
  MOCK_TOPIC_PROGRESS,
} from '@/lib/mock-data';
import { MOCK_TOPIC_ASSETS, MOCK_FRACTION_BAR_DIAGRAM, MOCK_NUMBER_LINE } from '@/lib/mock-content';

// ============================================
// Supabase Client (lazy init)
// ============================================
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) return null;
  
  supabaseClient = createClient(url, key);
  return supabaseClient;
}

// ============================================
// Types
// ============================================
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

export interface ChildData {
  id: string;
  name: string;
  age: number;
  year_group: string;
}

// ============================================
// Age Group Helpers
// ============================================
export function getAgeGroup(age: number): Exclude<AgeGroup, 'all'> {
  if (age <= 7) return '5-7';
  if (age <= 11) return '8-11';
  if (age <= 14) return '12-14';
  return '15-16';
}

// ============================================
// Topic Lookup - Supabase first, then mock
// ============================================
export async function findTopicBySlugAsync(subjectSlug: string, topicSlug: string): Promise<Topic | null> {
  const supabase = getSupabase();
  
  if (supabase) {
    try {
      // First get the subject
      const { data: subject } = await supabase
        .from('subjects')
        .select('id')
        .eq('slug', subjectSlug)
        .single();

      if (subject) {
        // Then get the topic
        const { data: topic, error } = await supabase
          .from('topics')
          .select('*')
          .eq('subject_id', subject.id)
          .eq('slug', topicSlug)
          .single();

        if (!error && topic) {
          return {
            id: topic.id,
            subject_id: topic.subject_id,
            title: topic.title,
            slug: topic.slug,
            description: topic.description,
            key_stage: topic.key_stage,
            year_groups: topic.year_groups || [],
            prerequisites: topic.prerequisites || [],
            learning_objectives: topic.learning_objectives || [],
            display_order: topic.display_order || 0,
          };
        }
      }
    } catch (err) {
      console.warn('Supabase topic lookup failed:', err);
    }
  }

  // Fallback to mock data
  return findTopicBySlug(subjectSlug, topicSlug);
}

// Sync version for backwards compatibility
export function findTopicBySlug(subjectSlug: string, topicSlug: string): Topic | null {
  const topics = MOCK_TOPICS[subjectSlug] || [];
  return topics.find((topic) => topic.slug === topicSlug) ?? null;
}

// ============================================
// Lesson Structure Lookup - Supabase first, then mock
// ============================================
export async function getLessonStructureAsync(topicId: string, childAge: number): Promise<TopicLessonStructure | null> {
  const ageGroup = getAgeGroup(childAge);
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data: structure, error } = await supabase
        .from('topic_lesson_structures')
        .select('*')
        .eq('topic_id', topicId)
        .eq('age_group', ageGroup)
        .eq('status', 'live')
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (!error && structure) {
        return structure as TopicLessonStructure;
      }
    } catch (err) {
      console.warn('Supabase lesson structure lookup failed:', err);
    }
  }

  // Fallback to mock
  return getLessonStructureForTopic(topicId, childAge);
}

// Sync version for backwards compatibility
export function getLessonStructureForTopic(topicId: string, childAge: number): TopicLessonStructure | null {
  const ageGroup = getAgeGroup(childAge);
  const entry = Object.values(MOCK_LESSON_STRUCTURES).find(
    (structure) => structure.topic_id === topicId && structure.age_group === ageGroup && structure.status === 'live'
  );
  return entry ?? null;
}

// ============================================
// Content Manifest Builder
// ============================================
export async function buildContentManifestAsync(topicId: string): Promise<ContentManifest> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data: assets } = await supabase
        .from('topic_assets')
        .select('*')
        .eq('topic_id', topicId);

      if (assets && assets.length > 0) {
        const concept = assets.find((a: any) => a.asset_type === 'concept_card');
        const video = assets.find((a: any) => a.asset_type === 'video');
        const worksheet = assets.find((a: any) => a.asset_type === 'worksheet');
        const checkQuestions = assets.find((a: any) => a.asset_type === 'check_questions');
        const everyday = assets.find((a: any) => a.asset_type === 'realworld_card' && a.asset_subtype === 'everyday');
        const inspiring = assets.find((a: any) => a.asset_type === 'realworld_card' && a.asset_subtype === 'inspiring');
        const game = assets.find((a: any) => a.asset_type === 'game_questions');

        return {
          concept_card: concept ? { id: concept.id, title: concept.title } : undefined,
          video: video ? { id: video.id, title: video.title } : undefined,
          worksheet: worksheet ? { id: worksheet.id, title: worksheet.title } : undefined,
          check_questions: checkQuestions ? { id: checkQuestions.id, title: checkQuestions.title } : undefined,
          realworld_everyday: everyday ? { id: everyday.id, title: everyday.title } : undefined,
          realworld_inspiring: inspiring ? { id: inspiring.id, title: inspiring.title } : undefined,
          game: game ? { id: game.id, title: game.title, game_type: game.asset_subtype || 'match_it' } : undefined,
        };
      }
    } catch (err) {
      console.warn('Supabase asset lookup failed:', err);
    }
  }

  // Fallback to mock
  return buildContentManifest(topicId);
}

// Sync version
export function buildContentManifest(topicId: string): ContentManifest {
  const assets = MOCK_TOPIC_ASSETS.filter((asset) => asset.topic_id === topicId);
  const diagrams = [MOCK_FRACTION_BAR_DIAGRAM, MOCK_NUMBER_LINE].filter((diagram) => diagram.topic_id === topicId);

  const concept = assets.find((asset) => asset.asset_type === 'concept_card');
  const video = assets.find((asset) => asset.asset_type === 'video');
  const worksheet = assets.find((asset) => asset.asset_type === 'worksheet');
  const checkQuestions = assets.find((asset) => asset.asset_type === 'check_questions');
  const everyday = assets.find((asset) => asset.asset_type === 'realworld_card' && asset.asset_subtype === 'everyday');
  const inspiring = assets.find((asset) => asset.asset_type === 'realworld_card' && asset.asset_subtype === 'inspiring');
  const game = assets.find((asset) => asset.asset_type === 'game_questions');
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

// ============================================
// Async Lesson Start - Primary method for API
// ============================================
export async function startLessonForChildAsync(
  subjectSlug: string, 
  topicSlug: string, 
  child: ChildData
): Promise<LessonStartResult | null> {
  const topic = await findTopicBySlugAsync(subjectSlug, topicSlug);
  if (!topic) return null;

  const structure = await getLessonStructureAsync(topic.id, child.age);
  const ageGroup = getAgeGroup(child.age);
  const sessionId = `lesson-${topic.id}-${Date.now()}`;
  const contentManifest = await buildContentManifestAsync(topic.id);

  if (!structure) {
    return {
      state: 'generating',
      topic,
      ageGroup,
      structure: null,
      sessionId,
      phase: 'spark',
      openingPrompt: `I'm building a fresh ${topic.title} lesson for ${child.name} now.`,
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

// ============================================
// Sync versions for backwards compatibility
// ============================================
export function startLesson(subjectSlug: string, topicSlug: string): LessonStartResult | null {
  return startLessonForChild(subjectSlug, topicSlug, {
    id: MOCK_CHILD.id,
    name: MOCK_CHILD.name,
    age: MOCK_CHILD.age,
    year_group: MOCK_CHILD.year_group,
  });
}

export function startLessonForChild(subjectSlug: string, topicSlug: string, child: ChildData): LessonStartResult | null {
  const topic = findTopicBySlug(subjectSlug, topicSlug);
  if (!topic) return null;

  const structure = getLessonStructureForTopic(topic.id, child.age);
  const ageGroup = getAgeGroup(child.age);
  const sessionId = `lesson-${topic.id}-${Date.now()}`;

  if (!structure) {
    return {
      state: 'generating',
      topic,
      ageGroup,
      structure: null,
      sessionId,
      phase: 'spark',
      openingPrompt: `I'm building a fresh ${topic.title} lesson for ${child.name} now.`,
      estimatedSeconds: 12,
      progressMessage: 'Lumi is weaving together your personalised lesson arc, examples, and practice tasks.',
      contentManifest: buildContentManifest(topic.id),
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
    contentManifest: buildContentManifest(topic.id),
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

// ============================================
// Signal Parsing Helpers
// ============================================
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

  const imageMatches = text.match(/\[IMAGE:(https?:\/\/[^\]]+)\]/g) ?? [];
  for (const match of imageMatches) {
    const [, url] = match.match(/\[IMAGE:(https?:\/\/[^\]]+)\]/) ?? [];
    if (url) {
      const isGif = url.toLowerCase().includes('.gif') || url.toLowerCase().includes('giphy');
      results.push({ url, media_type: isGif ? 'gif' : 'image' });
    }
  }

  const ytMatches = text.match(/\[YOUTUBE:([A-Za-z0-9_-]{6,15})\]/g) ?? [];
  for (const match of ytMatches) {
    const [, videoId] = match.match(/\[YOUTUBE:([A-Za-z0-9_-]{6,15})\]/) ?? [];
    if (videoId) {
      results.push({ url: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`, media_type: 'youtube' });
    }
  }

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
  return { phase };
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
