import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('child_id');

    if (!childId) {
      return NextResponse.json({ error: 'child_id is required' }, { status: 400 });
    }

    // Fetch pending assignments for this child
    const { data: assignments, error } = await supabase
      .from('lesson_assignments')
      .select(`
        id,
        status,
        assigned_at,
        due_date,
        priority,
        lesson_structure_id,
        topic_lesson_structures (
          id,
          age_group,
          key_stage,
          status,
          quality_score,
          topic_id,
          topics (
            id,
            title,
            slug,
            subject_id,
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
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('assigned_at', { ascending: true });

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to a more usable format
    const formattedAssignments = assignments?.map((a: any) => {
      const structure = a.topic_lesson_structures;
      const topic = structure?.topics;
      const subject = topic?.subjects;

      return {
        id: a.id,
        assignment_status: a.status,
        assigned_at: a.assigned_at,
        due_date: a.due_date,
        priority: a.priority,
        lesson: {
          id: structure?.id,
          topic_id: structure?.topic_id,
          age_group: structure?.age_group,
          key_stage: structure?.key_stage,
          status: structure?.status,
        },
        topic: {
          id: topic?.id,
          title: topic?.title,
          slug: topic?.slug,
        },
        subject: {
          id: subject?.id,
          name: subject?.name,
          slug: subject?.slug,
          icon: subject?.icon,
        },
      };
    });

    return NextResponse.json({
      assignments: formattedAssignments || [],
      count: formattedAssignments?.length || 0,
    });
  } catch (error: any) {
    console.error('Get child assignments API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Mark an assignment as started or completed
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { assignment_id, status, session_id } = body;

    if (!assignment_id || !status) {
      return NextResponse.json(
        { error: 'assignment_id and status are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      ...(status === 'in_progress' && { started_at: new Date().toISOString() }),
      ...(status === 'completed' && { completed_at: new Date().toISOString() }),
      ...(session_id && { session_id }),
    };

    const { data, error } = await supabase
      .from('lesson_assignments')
      .update(updateData)
      .eq('id', assignment_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, assignment: data });
  } catch (error: any) {
    console.error('Update assignment API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
