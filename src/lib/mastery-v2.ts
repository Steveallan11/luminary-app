/**
 * Mastery Scoring V2 — Scaling Architecture
 *
 * Implements the full scoring system from the scaling spec:
 * - Anchor phase (explain it back): +20 pts
 * - Each practise question correct: +10 pts
 * - Game score (scaled): +15 pts
 * - Each check question correct: +15 pts
 * - Each hint used: -5 pts
 * - Maximum possible: 100 pts
 *
 * XP Awards:
 * - Each message sent: +3 XP
 * - Phase completed: +10 XP
 * - Game item matched: +8 XP
 * - Anchor nailed: +15 XP
 * - Lesson completed: +25 XP
 * - Perfect mastery (90-100): +50 XP bonus
 */

// ─── Mastery Bands ───────────────────────────────────────────────

export type MasteryBand = 'not_grasped' | 'developing' | 'secure' | 'strong' | 'mastered';

export interface MasteryBandInfo {
  band: MasteryBand;
  label: string;
  min: number;
  max: number;
  colour: string;
  xp_bonus: number;
  revisit_days: number | null;
  description: string;
}

export const MASTERY_BANDS: MasteryBandInfo[] = [
  {
    band: 'not_grasped',
    label: 'Not Grasped',
    min: 0,
    max: 39,
    colour: '#EF4444',
    xp_bonus: 0,
    revisit_days: null, // Stays locked, revisit offered next session
    description: 'Topic stays locked. Lumi flags for parent. Revisit offered next session.',
  },
  {
    band: 'developing',
    label: 'Developing',
    min: 40,
    max: 59,
    colour: '#F59E0B',
    xp_bonus: 10,
    revisit_days: 7,
    description: 'Partial unlock. Spaced repetition in 7 days. Parent notified.',
  },
  {
    band: 'secure',
    label: 'Secure',
    min: 60,
    max: 79,
    colour: '#10B981',
    xp_bonus: 25,
    revisit_days: 14,
    description: 'Topic complete. Next topic unlocked. Revisit in 14 days.',
  },
  {
    band: 'strong',
    label: 'Strong',
    min: 80,
    max: 89,
    colour: '#3B82F6',
    xp_bonus: 40,
    revisit_days: 28,
    description: 'Complete with distinction. Badge awarded. Revisit in 28 days.',
  },
  {
    band: 'mastered',
    label: 'Mastered',
    min: 90,
    max: 100,
    colour: '#8B5CF6',
    xp_bonus: 50,
    revisit_days: 42,
    description: 'Maximum XP. Gold star on map. Revisit in 42 days. Shown in LA report.',
  },
];

export function getMasteryBand(score: number): MasteryBandInfo {
  const clamped = Math.max(0, Math.min(100, score));
  return MASTERY_BANDS.find((b) => clamped >= b.min && clamped <= b.max) ?? MASTERY_BANDS[0];
}

// ─── Mastery Score Calculation ───────────────────────────────────

export interface MasteryInputs {
  anchor_quality: 'poor' | 'partial' | 'good' | 'excellent';
  practise_correct: number;
  practise_total: number;
  game_score: number;
  game_max_score: number;
  check_correct: number;
  check_total: number;
  hints_used: number;
}

export function calculateMasteryScore(inputs: MasteryInputs): number {
  let score = 0;

  // Anchor phase: 0-20 pts
  const anchorScores: Record<string, number> = {
    poor: 0,
    partial: 8,
    good: 15,
    excellent: 20,
  };
  score += anchorScores[inputs.anchor_quality] ?? 0;

  // Practise questions: up to 30 pts (10 per correct, max 3 questions)
  const practisePoints = Math.min(3, inputs.practise_correct) * 10;
  score += practisePoints;

  // Game score: scaled to 15 pts
  if (inputs.game_max_score > 0) {
    score += Math.round((inputs.game_score / inputs.game_max_score) * 15);
  }

  // Check questions: up to 45 pts (15 per correct, max 3 questions)
  const checkPoints = Math.min(3, inputs.check_correct) * 15;
  score += checkPoints;

  // Hints penalty: -5 per hint
  score -= inputs.hints_used * 5;

  return Math.max(0, Math.min(100, score));
}

// ─── XP Calculation ──────────────────────────────────────────────

export interface XPInputs {
  messages_sent: number;
  phases_completed: number;
  game_items_matched: number;
  anchor_nailed: boolean;
  lesson_completed: boolean;
  mastery_score: number;
}

export function calculateSessionXP(inputs: XPInputs): number {
  let xp = 0;

  // Messages: +3 each
  xp += inputs.messages_sent * 3;

  // Phases completed: +10 each
  xp += inputs.phases_completed * 10;

  // Game items matched: +8 each
  xp += inputs.game_items_matched * 8;

  // Anchor nailed: +15
  if (inputs.anchor_nailed) xp += 15;

  // Lesson completed: +25
  if (inputs.lesson_completed) xp += 25;

  // Perfect mastery bonus: +50
  if (inputs.mastery_score >= 90) xp += 50;

  return xp;
}

// ─── Spaced Repetition Scheduling ────────────────────────────────

export function calculateNextRevisitDate(
  masteryScore: number,
  completedAt: Date = new Date()
): Date | null {
  const band = getMasteryBand(masteryScore);
  if (band.revisit_days === null) return null;

  const revisitDate = new Date(completedAt);
  revisitDate.setDate(revisitDate.getDate() + band.revisit_days);
  return revisitDate;
}

// ─── Topic Unlock Logic ──────────────────────────────────────────

export type TopicProgressStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export function determineTopicStatus(masteryScore: number): TopicProgressStatus {
  if (masteryScore >= 60) return 'completed';
  if (masteryScore >= 1) return 'in_progress';
  return 'available';
}

export function shouldUnlockNextTopic(masteryScore: number): boolean {
  return masteryScore >= 60; // Secure band or above
}
