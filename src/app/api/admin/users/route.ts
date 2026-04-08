import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

/**
 * GET /api/admin/users
 *
 * Returns all families, their parent emails, and all children with their progress.
 * This is used for the admin User Accounts dashboard to display all users.
 */
export async function GET() {
  try {
    let supabase;
    try {
      supabase = getSupabaseServiceClient();
    } catch (err) {
      console.error('[users-api] Supabase config error:', err);
      return NextResponse.json(
        { error: 'Database not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 503 }
      );
    }

    // Fetch all families with their children and child progress
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select(`
        id,
        parent_user_id,
        subscription_status,
        created_at,
        children (
          id,
          name,
          age,
          year_group,
          avatar,
          xp,
          streak_days,
          created_at,
          child_topic_progress (
            id,
            topic_id,
            status,
            best_mastery_score,
            attempts_count,
            mastery_band,
            completed_at
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (familiesError) {
      console.error('[users-api] Families fetch error:', familiesError);
      return NextResponse.json(
        { error: `Failed to fetch families: ${familiesError.message}` },
        { status: 500 }
      );
    }

    // Fetch all topics for reference (to show topic names in progress)
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, title, subject_id');

    if (topicsError) {
      console.error('Topics error:', topicsError);
    }

    // Build topic lookup map
    const topicMap = new Map((topics || []).map((t: any) => [t.id, t]));

    // Transform data to include topic information
    const enrichedFamilies = (families || []).map((family: any) => ({
      id: family.id,
      parent_user_id: family.parent_user_id,
      subscription_status: family.subscription_status,
      created_at: family.created_at,
      children_count: family.children?.length || 0,
      children: (family.children || []).map((child: any) => ({
        id: child.id,
        name: child.name,
        age: child.age,
        year_group: child.year_group,
        avatar: child.avatar,
        xp: child.xp,
        streak_days: child.streak_days,
        created_at: child.created_at,
        topics_in_progress: (child.child_topic_progress || []).filter((p: any) => p.status === 'in_progress').length,
        topics_completed: (child.child_topic_progress || []).filter((p: any) => p.status === 'completed').length,
        avg_mastery_score: child.child_topic_progress && child.child_topic_progress.length > 0
          ? Math.round(
              child.child_topic_progress.reduce((sum: number, p: any) => sum + (p.best_mastery_score || 0), 0) /
                child.child_topic_progress.length
            )
          : 0,
        progress: child.child_topic_progress || [],
      })),
    }));

    return NextResponse.json({
      families: enrichedFamilies,
      topics: Array.from(topicMap.values()),
      total_families: enrichedFamilies.length,
      total_children: enrichedFamilies.reduce((sum: number, f: any) => sum + f.children_count, 0),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('[users-api] Error:', message);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
