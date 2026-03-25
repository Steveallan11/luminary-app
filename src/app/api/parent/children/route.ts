import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parent/children
 * 
 * Returns all children for the authenticated parent's family
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get the family for this user
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id, family_name')
      .eq('parent_user_id', user.id)
      .single();

    if (familyError || !family) {
      return NextResponse.json(
        { error: 'No family found' },
        { status: 404 }
      );
    }

    // Get all children for this family
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select(`
        id,
        name,
        age,
        year_group,
        avatar,
        learning_mode,
        xp_total,
        streak_days,
        streak_last_date,
        created_at
      `)
      .eq('family_id', family.id)
      .order('name');

    if (childrenError) {
      console.error('Children fetch error:', childrenError);
      return NextResponse.json(
        { error: 'Failed to fetch children' },
        { status: 500 }
      );
    }

    // Get recent sessions for each child
    const childIds = children?.map(c => c.id) || [];
    
    let sessions: any[] = [];
    if (childIds.length > 0) {
      const { data: sessionData } = await supabase
        .from('lesson_sessions')
        .select('*')
        .in('child_id', childIds)
        .order('started_at', { ascending: false })
        .limit(50);
      
      sessions = sessionData || [];
    }

    return NextResponse.json({
      family: {
        id: family.id,
        name: family.family_name,
      },
      children: children || [],
      sessions,
      source: 'supabase',
    });
  } catch (error) {
    console.error('Parent children fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
