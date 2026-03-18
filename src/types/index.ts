export type Avatar = 'fox' | 'owl' | 'dragon' | 'robot' | 'unicorn';
export type LearningMode = 'full_homeschool' | 'school_supplement';
export type TopicStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type SubscriptionTier = 'free' | 'family' | 'pro';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'none';

// Session 4: Content asset types
export type AssetType = 'concept_card' | 'video' | 'diagram' | 'realworld_card' | 'worksheet' | 'game_questions' | 'check_questions';
export type AssetSubtype =
  | 'match_it' | 'sort_it' | 'fill_it' | 'true_false' | 'build_it' | 'quick_fire'
  | 'everyday' | 'inspiring'
  | 'fraction_bar' | 'timeline' | 'labelled' | 'map' | 'sorting' | 'number_line';
export type GameType = 'match_it' | 'sort_it' | 'fill_it' | 'true_false' | 'build_it' | 'quick_fire';
export type DiagramType = 'fraction_bar' | 'timeline' | 'labelled_diagram' | 'sorting_visual' | 'number_line';
export type AssetStatus = 'draft' | 'published' | 'archived';
export type AgeGroup = '5-7' | '8-11' | '12-14' | '15-16' | 'all';
export type LessonStructureStatus = 'generating' | 'live' | 'archived';
export type LessonPhase = 'spark' | 'explore' | 'anchor' | 'practise' | 'create' | 'check' | 'celebrate';

export interface Family {
  id: string;
  parent_user_id: string;
  family_name: string;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_end_date: string | null;
  created_at: string;
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  age: number;
  year_group: string;
  avatar: Avatar;
  learning_mode: LearningMode;
  pin_hash: string;
  xp_total: number;
  streak_days: number;
  streak_last_date: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  icon_emoji: string;
  colour_hex: string;
  description: string;
  min_year: number;
  max_year: number;
  is_future_skill: boolean;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  title: string;
  slug: string;
  description: string;
  order_index: number;
  key_stage: string;
  estimated_minutes: number;
  created_at: string;
  lesson_generation_status?: string | null;
  last_generated_at?: string | null;
}

export interface ChildTopicProgress {
  id: string;
  child_id: string;
  topic_id: string;
  status: TopicStatus;
  mastery_score: number;
  completed_at: string | null;
  created_at: string;
}

export interface LessonSession {
  id: string;
  child_id: string;
  topic_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  xp_earned: number;
  summary_text: string | null;
  created_at: string;
  structure_id?: string | null;
  prior_knowledge_response?: string | null;
  is_revisit?: boolean;
}

export interface LessonPhaseConcept {
  id: string;
  title: string;
  explanation: string;
  analogy: string;
  real_example: string;
  check_question: string;
  common_mistake: string;
}

export interface LessonPractiseQuestion {
  id: string;
  question: string;
  difficulty: number;
  correct_answer: string;
  explanation: string;
  hint: string;
}

export interface LessonCheckQuestion {
  type: string;
  question: string;
  what_correct_looks_like: string;
}

export interface LessonStructureContent {
  spark: {
    hook_type: string;
    hook_content: string;
    opening_question: string;
    expected_responses: string[];
    prior_knowledge_integration: string;
  };
  explore: {
    concepts: LessonPhaseConcept[];
    sequence_notes: string;
  };
  anchor: {
    method: string;
    prompt: string;
    mastery_indicators: string[];
    fallback_approach: string;
  };
  practise: {
    questions: LessonPractiseQuestion[];
  };
  create: {
    task_type: string;
    brief: string;
    scaffolding: string;
    real_world_connection: string;
    interest_placeholder: string;
  };
  check: {
    questions: LessonCheckQuestion[];
  };
  celebrate: {
    fun_fact: string;
    next_topic_teaser: string;
    praise_templates: string[];
  };
  personalisation_hooks?: Record<string, unknown>;
}

export interface TopicLessonStructure {
  id: string;
  topic_id: string;
  age_group: Exclude<AgeGroup, 'all'>;
  version: number;
  status: LessonStructureStatus;
  generation_model: string | null;
  spark_json: LessonStructureContent['spark'] | null;
  explore_json: LessonStructureContent['explore'] | null;
  anchor_json: LessonStructureContent['anchor'] | null;
  practise_json: LessonStructureContent['practise'] | null;
  create_json: LessonStructureContent['create'] | null;
  check_json: LessonStructureContent['check'] | null;
  celebrate_json: LessonStructureContent['celebrate'] | null;
  personalisation_hooks: Record<string, unknown> | null;
  quality_score: number;
  times_delivered: number;
  avg_mastery_score: number | null;
  auto_improvement_notes: string | null;
  auto_approve_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonPhaseTracking {
  id: string;
  session_id: string;
  current_phase: LessonPhase;
  phase_started_at: string;
  objectives_covered: string[];
  mastery_signals: Record<string, unknown>;
  phase_history: Array<{ phase: LessonPhase; entered_at: string; exited_at?: string; reason?: string }>;
  hints_used: number;
  practise_responses: Record<string, unknown>[];
  check_responses: Record<string, unknown>[];
  final_mastery_score: number | null;
  content_assets_shown: string[];
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
  created_at: string;
}

export interface ChildAchievement {
  id: string;
  child_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

// Session 4: Content types
export interface TopicAsset {
  id: string;
  topic_id: string;
  asset_type: AssetType;
  asset_subtype: AssetSubtype | null;
  title: string;
  content_json: Record<string, unknown>;
  file_url: string | null;
  thumbnail_url: string | null;
  age_group: AgeGroup;
  status: AssetStatus;
  generation_prompt: string | null;
  generated_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiagramComponent {
  id: string;
  diagram_type: DiagramType;
  topic_id: string;
  title: string;
  data_json: Record<string, unknown>;
  config_json: Record<string, unknown>;
  created_at: string;
}

export interface GameSession {
  id: string;
  lesson_session_id: string;
  child_id: string;
  topic_asset_id: string;
  game_type: GameType;
  score: number;
  max_score: number;
  time_taken_seconds: number;
  answers_json: GameAnswer[];
  completed_at: string;
  xp_earned: number;
  created_at: string;
}

export interface GameAnswer {
  question_id: string;
  child_answer: string;
  correct_answer: string;
  is_correct: boolean;
  time_taken: number;
}

// Game data structures
export interface MatchItData {
  pairs: { id: string; left: string; right: string; explanation: string }[];
}

export interface SortItData {
  categories: { id: string; name: string; colour: string }[];
  items: { id: string; text: string; correct_category: string; explanation: string }[];
}

export interface FillItData {
  questions: {
    id: string;
    template: string;
    blanks: { position: number; answer: string; hint: string }[];
    context?: string;
  }[];
}

export interface TrueFalseData {
  statements: { id: string; statement: string; is_true: boolean; explanation: string }[];
}

export interface BuildItData {
  title: string;
  type: 'sequence' | 'timeline' | 'sentence';
  items: { id: string; content: string; correct_position: number }[];
}

export interface QuickFireData {
  questions: {
    id: string;
    question: string;
    options: string[];
    correct: string;
    explanation: string;
  }[];
  time_limit: number;
  question_count: number;
}

// Diagram data structures
export interface FractionBarData {
  show_notation: boolean;
  max_denominator: number;
  allow_comparison: boolean;
  initial_denominator?: number;
}

export interface TimelineData {
  events: {
    id: string;
    date: string;
    title: string;
    description: string;
    image_url?: string;
  }[];
  eras?: { name: string; start: string; end: string; colour: string }[];
  is_ordering_exercise: boolean;
}

export interface LabelledDiagramData {
  image_url: string;
  hotspots: {
    id: string;
    x: number;
    y: number;
    radius: number;
    label: string;
    description: string;
  }[];
}

export interface SortingVisualData {
  groups: { id: string; name: string; colour: string }[];
  items: { id: string; text: string; initial_group?: string }[];
}

export interface NumberLineData {
  min: number;
  max: number;
  step: number;
  show_fractions: boolean;
  show_decimals: boolean;
  markers?: { value: number; label: string }[];
  allow_placement: boolean;
}

// Worksheet data structure
export interface WorksheetData {
  age_group: AgeGroup;
  subject: string;
  topic: string;
  recall_questions: { q: string; lines: number }[];
  apply_questions: { q: string; lines: number; show_working_space: boolean }[];
  create_task: { title: string; description: string; space_type: string; lines: number };
  reflect_prompts: string[];
}

// Game component props
export interface GameProps {
  asset: TopicAsset;
  childAge: number;
  subjectColour: string;
  onComplete: (result: GameResult) => void;
}

export interface GameResult {
  score: number;
  maxScore: number;
  timeTaken: number;
  answersJson: GameAnswer[];
  xpEarned: number;
}

// Diagram component props
export interface DiagramProps {
  diagram: DiagramComponent;
  subjectColour: string;
  onComplete?: () => void;
}

// Content manifest for Lumi
export interface ContentManifest {
  concept_card?: { id: string; title: string };
  video?: { id: string; title: string };
  diagram?: { id: string; title: string; diagram_type: DiagramType };
  realworld_everyday?: { id: string; title: string };
  realworld_inspiring?: { id: string; title: string };
  game?: { id: string; title: string; game_type: GameType };
  worksheet?: { id: string; title: string };
  check_questions?: { id: string; title: string };
}

export interface ParsedContentSignal {
  type: string;
  id: string;
}

export interface ParsedPhaseSignal {
  phase: LessonPhase;
}

// XP Level System
export interface XPLevel {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
}

export const XP_LEVELS: XPLevel[] = [
  { level: 1, name: 'Curious', minXP: 0, maxXP: 99 },
  { level: 2, name: 'Explorer', minXP: 100, maxXP: 299 },
  { level: 3, name: 'Scholar', minXP: 300, maxXP: 599 },
  { level: 4, name: 'Master', minXP: 600, maxXP: 999 },
  { level: 5, name: 'Luminary', minXP: 1000, maxXP: Infinity },
];

export function getXPLevel(xp: number): XPLevel {
  return XP_LEVELS.find((l) => xp >= l.minXP && xp <= l.maxXP) || XP_LEVELS[0];
}

export function getXPProgress(xp: number): { current: number; needed: number; percent: number } {
  const level = getXPLevel(xp);
  if (level.maxXP === Infinity) return { current: xp - level.minXP, needed: 0, percent: 100 };
  const current = xp - level.minXP;
  const needed = level.maxXP - level.minXP + 1;
  return { current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) };
}

// Subscription tier limits
export const TIER_LIMITS = {
  free: { maxSubjects: 3, maxChildren: 1, maxSessionsPerWeek: 3, pdfReports: false },
  family: { maxSubjects: 15, maxChildren: 3, maxSessionsPerWeek: Infinity, pdfReports: true },
  pro: { maxSubjects: 15, maxChildren: 5, maxSessionsPerWeek: Infinity, pdfReports: true },
} as const;

export const LESSON_PHASES: LessonPhase[] = ['spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate'];

export const AVATARS: { value: Avatar; label: string; emoji: string }[] = [
  { value: 'fox', label: 'Fox', emoji: '🦊' },
  { value: 'owl', label: 'Owl', emoji: '🦉' },
  { value: 'dragon', label: 'Dragon', emoji: '🐉' },
  { value: 'robot', label: 'Robot', emoji: '🤖' },
  { value: 'unicorn', label: 'Unicorn', emoji: '🦄' },
];

export const YEAR_GROUPS = [
  'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
  'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11',
];

export const AVATAR_EMOJI_MAP: Record<Avatar, string> = {
  fox: '🦊',
  owl: '🦉',
  dragon: '🐉',
  robot: '🤖',
  unicorn: '🦄',
};
