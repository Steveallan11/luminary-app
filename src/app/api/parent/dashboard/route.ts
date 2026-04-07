import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-service';
import { MOCK_CHILD, MOCK_SUBJECTS, MOCK_TOPIC_PROGRESS } from '@/lib/mock-data';
import { getMasteryBand } from '@/lib/mastery-v2';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parent/dashboard
 *
 * Returns aggregated progress data for the parent dashboard.
 * Queries Supabase for real data, falls back to mock data if unavailable.
 *
 * Query params:
 * - child_id: uuid (optional)
 * - period: 'week' | 'month' | 'term' | 'year' (optional, defaults to 'month')
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('child_id');
    const period = searchParams.get('period') ?? 'month';

    let supabase: ReturnType<typeof getSupabaseServiceClient>;
    try {
      supabase = getSupabaseServiceClient();
    } catch {
      // Fallback to mock data
      return getDefaultMockResponse(MOCK_CHILD, period);
    }

    // If no child_id provided, use fallback
    if (!childId) {
      return getDefaultMockResponse(MOCK_CHILD, period);
    }

    // Fetch child data
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (childError || !child) {
      console.log('Child not found, using mock data');
      return getDefaultMockResponse(MOCK_CHILD, period);
    }

    // Fetch child's topic progress with real data
    const { data: progressData, error: progressError } = await supabase
      .from('child_topic_progress')
      .select(`
        topic_id,
        status,
        best_mastery_score,
        completed_at
      `)
      .eq('child_id', childId);

    if (progressError) {
      console.log('Progress error, using mock data:', progressError.message);
      return getDefaultMockResponse(child, period);
    }

    // Fetch all subjects and topics to build progress
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*');

    if (subjectsError) {
      return getDefaultMockResponse(child, period);
    }

    // Fetch all topics with subjects
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, title, subject_id');

    if (topicsError) {
      return getDefaultMockResponse(child, period);
    }

    // Fetch recent lesson sessions
    let sessions: any[] = [];
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('lesson_sessions')
        .select(`
          id,
          topic_id,
          final_mastery_score,
          session_duration_mins,
          final_phase_reached,
          created_at
        `)
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!sessionsError) {
        sessions = sessionsData || [];
      }
    } catch (e) {
      console.log('Error fetching sessions:', e);
    }

    // Build progress map
    const progressMap = new Map(
      (progressData || []).map((p: any) => [p.topic_id, p])
    );

    const topicMap = new Map(
      (topics || []).map((t: any) => [t.id, t])
    );

    // Build subject progress
    const subjectProgress = (subjects || [])
      .map((subject: any) => {
        const subjectTopics = (topics || []).filter((t: any) => t.subject_id === subject.id);
        const subjectProgress = subjectTopics.map((topic: any) => {
          const progress = progressMap.get(topic.id);
          return {
            topic_id: topic.id,
            title: topic.title,
            status: progress?.status || 'locked',
            mastery_score: progress?.best_mastery_score || 0,
            mastery_band: getMasteryBand(progress?.best_mastery_score || 0),
            completed: progress?.completed_at || null,
          };
        });

        const completed = subjectProgress.filter((t) => t.status === 'completed').length;
        const total = subjectTopics.length;
        const avgMastery =
          subjectProgress.length > 0
            ? Math.round(subjectProgress.reduce((sum, t) => sum + (t.mastery_score || 0), 0) / subjectProgress.length)
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
          topics: subjectProgress,
        };
      })
      .filter((s) => s.topics_total > 0);

    // Calculate overall stats
    const totalCompleted = subjectProgress.reduce((sum, s) => sum + s.topics_completed, 0);
    const totalTopics = subjectProgress.reduce((sum, s) => sum + s.topics_total, 0);
    const overallMastery =
      totalTopics > 0
        ? Math.round(
            subjectProgress.reduce((sum, s) => sum + s.avg_mastery * s.topics_total, 0) / totalTopics
          )
        : 0;

    // Transform recent sessions
    const recentSessions = (sessions || [])
      .map((session: any) => {
        const topic = topicMap.get(session.topic_id);
        const subject = (subjects || []).find((s: any) => s.id === topic?.subject_id);
        return {
          topic_title: topic?.title || 'Unknown Topic',
          subject_name: subject?.name || 'Unknown Subject',
          mastery_score: session.final_mastery_score || 0,
          mastery_band: getMasteryBand(session.final_mastery_score || 0),
          duration_mins: session.session_duration_mins || 0,
          hints_used: 0,
          completed_at: session.created_at,
        };
      })
      .slice(0, 5);

    return NextResponse.json({
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
        year_group: child.year_group,
        avatar: child.avatar,
        xp_total: child.xp || 0,
        streak_days: child.streak_days || 0,
      },
      period,
      overview: {
        total_xp: child.xp || 0,
        xp_this_week: 0, // TODO: Calculate from sessions in period
        topics_completed: totalCompleted,
        subjects_studied: subjectProgress.filter((s) => s.topics_completed > 0).length,
        avg_mastery: overallMastery,
        avg_mastery_band: getMasteryBand(overallMastery),
        day_streak: child.streak_days || 0,
        total_learning_time_mins: (sessions || []).reduce((sum, s) => sum + (s.session_duration_mins || 0), 0),
      },
      subject_progress: subjectProgress,
      recent_sessions: recentSessions,
      source: 'supabase',
    });
  } catch (error: unknown) {
    console.error('Parent dashboard error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getDefaultMockResponse(child: any, period: string) {
  const subjectProgress = MOCK_SUBJECTS.map((subject) => {
    const topicProgress = MOCK_TOPIC_PROGRESS[subject.slug] ?? {};
    const topics = Object.entries(topicProgress).map(([slug, progress]) => ({
      slug,
      status: (progress as any).status,
      mastery_score: (progress as any).mastery_score,
      mastery_band: getMasteryBand((progress as any).mastery_score),
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

  const totalCompleted = subjectProgress.reduce((sum, s) => sum + s.topics_completed, 0);
  const totalTopics = subjectProgress.reduce((sum, s) => sum + s.topics_total, 0);
  const overallMastery =
    totalTopics > 0
      ? Math.round(
          subjectProgress.reduce((sum, s) => sum + s.avg_mastery * s.topics_total, 0) / totalTopics
        )
      : 0;

  const recentSessions = [
    {
      topic_title: 'Times Tables',
      subject_name: 'Maths',
      mastery_score: 84,
      mastery_band: getMasteryBand(84),
      duration_mins: 19,
      hints_used: 2,
      completed_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      topic_title: 'Ancient Egyptians',
      subject_name: 'History',
      mastery_score: 91,
      mastery_band: getMasteryBand(91),
      duration_mins: 22,
      hints_used: 0,
      completed_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    },
    {
      topic_title: 'Fractions',
      subject_name: 'Maths',
      mastery_score: 72,
      mastery_band: getMasteryBand(72),
      duration_mins: 18,
      hints_used: 1,
      completed_at: new Date(Date.now() - 1000 * 60 * 60 * 74).toISOString(),
    },
  ];

  return NextResponse.json({
    child: {
      id: child.id,
      name: child.name,
      age: child.age,
      year_group: child.year_group,
      avatar: child.avatar,
      xp_total: child.xp_total || 0,
      streak_days: child.streak_days || 0,
    },
    period,
    overview: {
      total_xp: 847,
      xp_this_week: 125,
      topics_completed: totalCompleted,
      subjects_studied: subjectProgress.filter((s) => s.topics_completed > 0).length,
      avg_mastery: overallMastery,
      avg_mastery_band: getMasteryBand(overallMastery),
      day_streak: child.streak_days || 0,
      total_learning_time_mins: 842,
    },
    subject_progress: subjectProgress,
    recent_sessions: recentSessions,
    source: 'mock',
  });
}
