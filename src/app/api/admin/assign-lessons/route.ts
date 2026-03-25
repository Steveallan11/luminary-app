import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminSessionEmail } from '@/lib/admin-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const adminEmail = await getAdminSessionEmail();
    const body = await req.json();
    const { child_id, lesson_ids, due_date, priority = 5 } = body;

    if (!child_id || !lesson_ids || !Array.isArray(lesson_ids) || lesson_ids.length === 0) {
      return NextResponse.json(
        { error: 'child_id and lesson_ids array are required' },
        { status: 400 }
      );
    }

    // Verify child exists
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, name')
      .eq('id', child_id)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Create assignments (using upsert to avoid duplicates)
    const assignments = lesson_ids.map((lessonId: string) => ({
      lesson_structure_id: lessonId,
      child_id: child_id,
      assigned_by: adminEmail || 'admin',
      assigned_at: new Date().toISOString(),
      due_date: due_date || null,
      priority: priority,
      status: 'pending',
    }));

    const { data: created, error: assignError } = await supabase
      .from('lesson_assignments')
      .upsert(assignments, {
        onConflict: 'lesson_structure_id,child_id',
        ignoreDuplicates: false,
      })
      .select();

    if (assignError) {
      console.error('Error creating assignments:', assignError);
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }

    // Log admin activity
    await supabase.from('admin_activity_log').insert({
      admin_email: adminEmail || 'admin',
      action: 'assign_lessons',
      entity_type: 'lesson_assignments',
      entity_id: child_id,
      details_json: {
        child_name: child.name,
        lesson_count: lesson_ids.length,
        lesson_ids,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Assigned ${lesson_ids.length} lesson(s) to ${child.name}`,
      assignments: created,
    });
  } catch (error: any) {
    console.error('Assign lessons API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Fetch assignments for a child
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('child_id');

    if (!childId) {
      return NextResponse.json({ error: 'child_id is required' }, { status: 400 });
    }

    const { data: assignments, error } = await supabase
      .from('lesson_assignments')
      .select(`
        id,
        status,
        assigned_at,
        due_date,
        priority,
        started_at,
        completed_at,
        lesson_structure_id,
        topic_lesson_structures (
          id,
          age_group,
          key_stage,
          status,
          topics (
            id,
            title,
            slug,
            subjects (
              id,
              name,
              slug,
              icon
            )
          )
        )
      `)
      .eq('child_id', childId)
      .order('priority', { ascending: false })
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assignments: assignments || [] });
  } catch (error: any) {
    console.error('Get assignments API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
