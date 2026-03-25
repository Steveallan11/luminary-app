import { NextRequest, NextResponse } from 'next/server';
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && childId) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: child, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single();

      if (!error && child) {
        // Fetch recent sessions
        const { data: sessions } = await supabase
          .from('learning_sessions')
          .select('*')
          .eq('child_id', childId)
          .order('started_at', { ascending: false })
          .limit(20);

        return NextResponse.json({
          child,
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
