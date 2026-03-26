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
import {
  MOCK_CHILD,
  MOCK_LESSON_PHASE_TRACKING,
  MOCK_LESSON_STRUCTURES,
  MOCK_TOPICS,
  MOCK_TOPIC_PROGRESS,
} from '@/lib/mock-data';
import { MOCK_TOPIC_ASSETS, MOCK_FRACTION_BAR_DIAGRAM, MOCK_NUMBER_LINE } from '@/lib/mock-content';

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

export interface ChildData {
  id: string;
  name: string;
  age: number;
  year_group: string;
}

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
