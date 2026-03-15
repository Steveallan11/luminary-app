/**
 * Achievement Checker
 *
 * Checks if a child has earned any new achievements after a lesson session.
 * In production, this queries Supabase. For MVP, uses mock data.
 */

import { Achievement, ChildAchievement } from '@/types';
import { MOCK_ACHIEVEMENTS, MOCK_CHILD_ACHIEVEMENTS, MOCK_SESSIONS, MOCK_TOPIC_PROGRESS, MOCK_SUBJECTS, MOCK_CHILD } from './mock-data';

interface AchievementCheckContext {
  child_id: string;
  lessonsCompleted: number;
  subjectsTried: number;
  xpTotal: number;
  streakDays: number;
  subjectsCompleted: number;
  futureSkillCompleted: boolean;
  totalHours: number;
  isNightSession: boolean;
  usedHints: number;
  topicCompletedWithHints: boolean;
}

function buildContext(childId: string): AchievementCheckContext {
  const child = MOCK_CHILD;
  const sessions = MOCK_SESSIONS.filter((s) => s.child_id === childId);

  // Count lessons completed
  const lessonsCompleted = sessions.length;

  // Count distinct subjects tried
  const subjectsTried = new Set<string>();
  const topicToSubject: Record<string, string> = {};
  for (const [slug, topics] of Object.entries(MOCK_TOPIC_PROGRESS)) {
    for (const [topicSlug, progress] of Object.entries(topics)) {
      if (progress.status !== 'locked') {
        subjectsTried.add(slug);
      }
    }
  }

  // Count subjects with all topics completed
  let subjectsCompleted = 0;
  let futureSkillCompleted = false;
  for (const [slug, topics] of Object.entries(MOCK_TOPIC_PROGRESS)) {
    const allCompleted = Object.values(topics).every((t) => t.status === 'completed');
    if (allCompleted) {
      subjectsCompleted++;
      const subject = MOCK_SUBJECTS.find((s) => s.slug === slug);
      if (subject?.is_future_skill) futureSkillCompleted = true;
    }
  }

  // Total hours
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const totalHours = totalMinutes / 60;

  // Night session check (after 7pm)
  const lastSession = sessions[0];
  const isNightSession = lastSession ? new Date(lastSession.started_at).getHours() >= 19 : false;

  return {
    child_id: childId,
    lessonsCompleted,
    subjectsTried: subjectsTried.size,
    xpTotal: child.xp_total,
    streakDays: child.streak_days,
    subjectsCompleted,
    futureSkillCompleted,
    totalHours,
    isNightSession,
    usedHints: 0,
    topicCompletedWithHints: false,
  };
}

function checkCondition(achievement: Achievement, ctx: AchievementCheckContext): boolean {
  switch (achievement.condition_type) {
    case 'lessons_completed':
      return ctx.lessonsCompleted >= achievement.condition_value;
    case 'subjects_tried':
      return ctx.subjectsTried >= achievement.condition_value;
    case 'xp_total':
      return ctx.xpTotal >= achievement.condition_value;
    case 'streak_days':
      return ctx.streakDays >= achievement.condition_value;
    case 'subject_completed':
      return ctx.subjectsCompleted >= achievement.condition_value;
    case 'future_skill_completed':
      return ctx.futureSkillCompleted;
    case 'perseverance':
      return ctx.topicCompletedWithHints;
    case 'total_hours':
      return ctx.totalHours >= achievement.condition_value;
    case 'night_session':
      return ctx.isNightSession;
    default:
      return false;
  }
}

export function checkAndAwardAchievements(childId: string): Achievement[] {
  const ctx = buildContext(childId);
  const earnedIds = new Set(
    MOCK_CHILD_ACHIEVEMENTS.filter((ca) => ca.child_id === childId).map((ca) => ca.achievement_id)
  );

  const newlyEarned: Achievement[] = [];

  for (const achievement of MOCK_ACHIEVEMENTS) {
    if (earnedIds.has(achievement.id)) continue;
    if (checkCondition(achievement, ctx)) {
      newlyEarned.push(achievement);
      // In production, insert into child_achievements table
      MOCK_CHILD_ACHIEVEMENTS.push({
        id: `ca-new-${Date.now()}-${achievement.id}`,
        child_id: childId,
        achievement_id: achievement.id,
        earned_at: new Date().toISOString(),
      });
    }
  }

  return newlyEarned;
}

/**
 * Get achievement progress description for locked achievements
 */
export function getAchievementProgress(achievement: Achievement, childId: string): string {
  const ctx = buildContext(childId);

  switch (achievement.condition_type) {
    case 'lessons_completed':
      return `${ctx.lessonsCompleted}/${achievement.condition_value} lessons`;
    case 'subjects_tried':
      return `${ctx.subjectsTried}/${achievement.condition_value} subjects`;
    case 'xp_total':
      return `${ctx.xpTotal}/${achievement.condition_value} XP`;
    case 'streak_days':
      return `${ctx.streakDays}/${achievement.condition_value} day streak`;
    case 'subject_completed':
      return `${ctx.subjectsCompleted}/${achievement.condition_value} subject completed`;
    case 'total_hours':
      return `${ctx.totalHours.toFixed(1)}/${achievement.condition_value} hours`;
    case 'future_skill_completed':
      return ctx.futureSkillCompleted ? 'Ready!' : 'Complete a Future Skills subject';
    case 'perseverance':
      return 'Complete a topic after using hints';
    case 'night_session':
      return 'Complete a lesson after 7pm';
    default:
      return '';
  }
}
