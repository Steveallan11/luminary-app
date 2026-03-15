export type Avatar = 'fox' | 'owl' | 'dragon' | 'robot' | 'unicorn';
export type LearningMode = 'full_homeschool' | 'school_supplement';
export type TopicStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type SubscriptionTier = 'free' | 'family' | 'pro';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'none';

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
