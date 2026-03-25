import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { MOCK_CHILD, MOCK_CHILDREN, MOCK_SESSIONS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learn/child-profile?child_id=xxx
 *
 * Returns child profile with recent sessions.
 * Tries Supabase first, falls back to mock data if unavailable.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id');

  if (childId) {
    try {
      const supabase = await createServerSupabaseClient();

      const { data: child, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single();

      if (!error && child) {
        // Fetch recent sessions from lesson_sessions table
        const { data: sessions } = await supabase
          .from('lesson_sessions')
          .select('*')
          .eq('child_id', childId)
          .order('started_at', { ascending: false })
          .limit(20);

        return NextResponse.json({
          child: {
            id: child.id,
            name: child.name,
            age: child.age,
            year_group: child.year_group,
            avatar: child.avatar,
            xp_total: child.xp_total || 0,
            streak_days: child.streak_days || 0,
            streak_last_date: child.streak_last_date,
            learning_mode: child.learning_mode,
          },
          sessions: sessions || [],
          source: 'supabase',
        });
      }
    } catch (err) {
      console.warn('Supabase child profile fetch failed, using mock data:', err);
    }
  }

  // Fallback to mock data
  const child = childId
    ? MOCK_CHILDREN.find((c) => c.id === childId) || MOCK_CHILD
    : MOCK_CHILD;

  const sessions = MOCK_SESSIONS.filter((s) => s.child_id === child.id);

  return NextResponse.json({
    child,
    sessions,
    source: 'mock',
  });
}
