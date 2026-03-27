import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learn/child-profile?child_id=xxx
 *
 * Returns child profile with recent sessions.
 * This route is now REAL-DATA: no silent mock fallbacks.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id');

  if (!childId) {
    return NextResponse.json({ error: 'child_id is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceClient();

    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (childError) {
      return NextResponse.json({ error: childError.message }, { status: 500 });
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('lesson_sessions')
      .select('*')
      .eq('child_id', childId)
      .order('started_at', { ascending: false })
      .limit(20);

    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    return NextResponse.json({
      child,
      sessions: sessions || [],
      source: 'supabase',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

