import { NextRequest, NextResponse } from 'next/server';
import { MOCK_CHILD, MOCK_SUBJECTS, MOCK_TOPIC_PROGRESS } from '@/lib/mock-data';
import { getMasteryBand } from '@/lib/mastery-v2';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parent/dashboard
 *
 * Returns aggregated progress data for the parent dashboard.
 * In production, this queries Supabase for real data.
 * Currently returns enriched mock data with mastery bands.
 *
 * Query params:
 * - child_id: uuid (optional, defaults to mock child)
 * - period: 'week' | 'month' | 'term' | 'year' (optional, defaults to 'month')
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') ?? 'month';

    const child = MOCK_CHILD;

    // Build subject progress from mock data
    const subjectProgress = MOCK_SUBJECTS.map((subject) => {
      const topicProgress = MOCK_TOPIC_PROGRESS[subject.slug] ?? {};
      const topics = Object.entries(topicProgress).map(([slug, progress]) => ({
        slug,
        status: progress.status,
        mastery_score: progress.mastery_score,
        mastery_band: getMasteryBand(progress.mastery_score),
      }));

      const completed = topics.filter((t) => t.status === 'completed').length;
      const total = topics.length;
      const avgMastery =
        topics.length > 0
          ? Math.round(topics.reduce((sum, t) => sum + t.mastery_score, 0) / topics.length)
          : 0;

      return {
        subject_id: subject.id,
        subject_name: subject.name,
        subject_slug: subject.slug,
        icon_emoji: subject.icon_emoji,
        colour_hex: subject.colour_hex,
        topics_completed: completed,
        topics_total: total,
        avg_mastery: avgMastery,
        avg_mastery_band: getMasteryBand(avgMastery),
        topics,
      };
    }).filter((s) => s.topics_total > 0);

    // Calculate overall stats
    const totalCompleted = subjectProgress.reduce((sum, s) => sum + s.topics_completed, 0);
    const totalTopics = subjectProgress.reduce((sum, s) => sum + s.topics_total, 0);
    const overallMastery =
      totalTopics > 0
        ? Math.round(
            subjectProgress.reduce((sum, s) => sum + s.avg_mastery * s.topics_total, 0) / totalTopics
          )
        : 0;

    // Mock recent sessions
    const recentSessions = [
      {
        topic_title: 'Times Tables',
        subject_name: 'Maths',
        mastery_score: 84,
        mastery_band: getMasteryBand(84),
        duration_mins: 19,
        hints_used: 2,
        completed_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        topic_title: 'Ancient Egyptians',
        subject_name: 'History',
        mastery_score: 91,
        mastery_band: getMasteryBand(91),
        duration_mins: 22,
        hints_used: 0,
        completed_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Yesterday
      },
      {
        topic_title: 'Fractions',
        subject_name: 'Maths',
        mastery_score: 72,
        mastery_band: getMasteryBand(72),
        duration_mins: 18,
        hints_used: 1,
        completed_at: new Date(Date.now() - 1000 * 60 * 60 * 74).toISOString(), // 3 days ago
      },
    ];

    return NextResponse.json({
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
        year_group: child.year_group,
        avatar: child.avatar,
        xp_total: child.xp_total,
        streak_days: child.streak_days,
      },
      period,
      overview: {
        total_xp: 847,
        xp_this_week: 125,
        topics_completed: totalCompleted,
        subjects_studied: subjectProgress.filter((s) => s.topics_completed > 0).length,
        avg_mastery: overallMastery,
        avg_mastery_band: getMasteryBand(overallMastery),
        day_streak: child.streak_days,
        total_learning_time_mins: 842,
      },
      subject_progress: subjectProgress,
      recent_sessions: recentSessions,
    });
  } catch (error: unknown) {
    console.error('Parent dashboard error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
