import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Fetch all families with their children and parent info
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select(`
        id,
        family_name,
        created_at,
        parent_user_id,
        parent_profiles (
          id,
          email,
          display_name,
          created_at
        ),
        children (
          id,
          name,
          avatar,
          year_group,
          date_of_birth,
          learning_mode,
          created_at,
          xp,
          last_active_date
        )
      `)
      .order('created_at', { ascending: false });

    if (familiesError) {
      console.error('Error fetching families:', familiesError);
      return NextResponse.json({ error: familiesError.message }, { status: 500 });
    }

    // Get session counts per child
    const { data: sessionCounts, error: sessionError } = await supabase
      .from('lesson_sessions')
      .select('child_id')
      .then(async (res) => {
        if (res.error) return { data: null, error: res.error };
        
        // Count sessions per child
        const counts: Record<string, number> = {};
        res.data?.forEach((s: any) => {
          counts[s.child_id] = (counts[s.child_id] || 0) + 1;
        });
        return { data: counts, error: null };
      });

    // Get assignment counts per child
    const { data: assignmentCounts } = await supabase
      .from('lesson_assignments')
      .select('child_id, status')
      .then((res) => {
        if (res.error) return { data: {} };
        
        const counts: Record<string, { total: number; pending: number; completed: number }> = {};
        res.data?.forEach((a: any) => {
          if (!counts[a.child_id]) {
            counts[a.child_id] = { total: 0, pending: 0, completed: 0 };
          }
          counts[a.child_id].total++;
          if (a.status === 'pending') counts[a.child_id].pending++;
          if (a.status === 'completed') counts[a.child_id].completed++;
        });
        return { data: counts };
      });

    // Enrich children with stats
    const enrichedFamilies = families?.map((family: any) => ({
      ...family,
      children: family.children?.map((child: any) => ({
        ...child,
        session_count: sessionCounts?.[child.id] || 0,
        assignments: assignmentCounts?.[child.id] || { total: 0, pending: 0, completed: 0 },
      })),
    }));

    // Get overall stats
    const { count: totalFamilies } = await supabase
      .from('families')
      .select('*', { count: 'exact', head: true });

    const { count: totalChildren } = await supabase
      .from('children')
      .select('*', { count: 'exact', head: true });

    const { count: totalSessions } = await supabase
      .from('lesson_sessions')
      .select('*', { count: 'exact', head: true });

    const { count: totalAssignments } = await supabase
      .from('lesson_assignments')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      families: enrichedFamilies || [],
      stats: {
        totalFamilies: totalFamilies || 0,
        totalChildren: totalChildren || 0,
        totalSessions: totalSessions || 0,
        totalAssignments: totalAssignments || 0,
      },
    });
  } catch (error: any) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
