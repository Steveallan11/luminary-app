export type Avatar = 'fox' | 'owl' | 'dragon' | 'robot' | 'unicorn';
export type LearningMode = 'full_homeschool' | 'school_supplement';
export type TopicStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface Family {
  id: string;
  parent_user_id: string;
  family_name: string;
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
  xp_earned: number;
  summary_text: string | null;
  created_at: string;
}

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
