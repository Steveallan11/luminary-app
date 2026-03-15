/**
 * Mastery Scoring Logic for Lumi sessions
 *
 * Simple heuristic scoring (no ML needed for MVP):
 * - Each correct response from child: +5 to mastery_score (cap 100)
 * - Each time child uses "I'm stuck": -2 (min 0)
 * - Each time child explains something back correctly: +10
 * - Session completed: +15 bonus
 */

export type MasteryEvent =
  | 'correct_response'
  | 'hint_used'
  | 'explanation_given'
  | 'session_completed';

const MASTERY_DELTAS: Record<MasteryEvent, number> = {
  correct_response: 5,
  hint_used: -2,
  explanation_given: 10,
  session_completed: 15,
};

export function calculateMasteryDelta(event: MasteryEvent): number {
  return MASTERY_DELTAS[event];
}

export function clampMastery(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate XP earned for a session
 * Base: 10 XP
 * + 2 per good answer (approximated from message count)
 * + 5 for completing the session
 */
export function calculateSessionXP(
  messageCount: number,
  completed: boolean
): number {
  const baseXP = 10;
  // Approximate good answers as ~40% of child messages (every other message is child's)
  const childMessages = Math.floor(messageCount / 2);
  const goodAnswerXP = Math.floor(childMessages * 0.4) * 2;
  const completionXP = completed ? 5 : 0;
  return baseXP + goodAnswerXP + completionXP;
}

/**
 * Determine if a child's response indicates correct understanding
 * Simple heuristic: look for Lumi's affirmative patterns in the AI response
 */
export function detectCorrectResponse(lumiResponse: string): boolean {
  const positivePatterns = [
    'exactly',
    'that\'s right',
    'well done',
    'brilliant',
    'perfect',
    'spot on',
    'you got it',
    'fantastic',
    'great thinking',
    'absolutely',
    'correct',
    'nice work',
    'you nailed it',
    'superb',
    'excellent',
  ];
  const lower = lumiResponse.toLowerCase();
  return positivePatterns.some((p) => lower.includes(p));
}

/**
 * Detect if the child explained something back (Lumi asked them to)
 */
export function detectExplanation(lumiResponse: string): boolean {
  const patterns = [
    'great explanation',
    'you explained that really well',
    'love how you put that',
    'that\'s a great way to explain',
    'you understand this',
    'you\'ve got a really good grasp',
  ];
  const lower = lumiResponse.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}
