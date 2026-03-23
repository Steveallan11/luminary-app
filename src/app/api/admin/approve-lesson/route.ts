import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/approve-lesson
 *
 * Admin endpoint: Approves a generated lesson structure, changing its
 * status from 'pending_review' to 'live'. Optionally accepts inline
 * edits to individual phases before approval.
 *
 * In production, this updates topic_lesson_structures in Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { structure_id, edits, approved_by } = body;

    if (!structure_id) {
      return NextResponse.json(
        { error: 'structure_id is required' },
        { status: 400 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updatePayload: Record<string, unknown> = {
      status: 'live',
      updated_at: new Date().toISOString(),
    };

    // Apply any inline edits
    if (edits) {
      for (const [phase, content] of Object.entries(edits)) {
        if (['spark_json', 'explore_json', 'anchor_json', 'practise_json',
             'create_json', 'check_json', 'celebrate_json',
             'game_content', 'concept_card_json', 'realworld_json'].includes(phase)) {
          updatePayload[phase] = content;
        }
      }
    }

    const { data, error } = await supabase
      .from('topic_lesson_structures')
      .update(updatePayload)
      .eq('id', structure_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to approve lesson: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      structure_id,
      status: 'live',
      approved_at: new Date().toISOString(),
      approved_by: approved_by ?? 'admin',
      edits_applied: edits ? Object.keys(edits).length : 0,
    });
  } catch (error: unknown) {
    console.error('Lesson approval error:', error);
    const message = error instanceof Error ? error.message : 'Failed to approve lesson';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
