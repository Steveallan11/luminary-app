/**
 * Lesson Media API — manages media attachments for lesson phases
 * Stores images, videos, GIFs, and text edits per phase in the database
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

// GET /api/admin/lesson-media?lesson_id=xxx — get all media for a lesson
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lesson_id = searchParams.get('lesson_id');

    if (!lesson_id) {
      return NextResponse.json({ error: 'lesson_id is required' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('lesson_phase_media')
      .select('*')
      .eq('lesson_id', lesson_id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, media: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/lesson-media — add media to a lesson phase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lesson_id,
      phase,
      media_type, // 'image' | 'video' | 'gif' | 'youtube' | 'text_edit'
      url,
      thumbnail,
      title,
      source,
      lumi_instruction, // How Lumi should use this
      display_order,
      phase_text_override, // If admin edits the phase text
    } = body;

    if (!lesson_id || !phase || !media_type) {
      return NextResponse.json({ error: 'lesson_id, phase, and media_type are required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('lesson_phase_media')
      .insert({
        lesson_id,
        phase,
        media_type,
        url: url || null,
        thumbnail: thumbnail || null,
        title: title || null,
        source: source || null,
        lumi_instruction: lumi_instruction || null,
        display_order: display_order || 0,
        phase_text_override: phase_text_override || null,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, media: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/lesson-media — remove media from a lesson phase
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { media_id } = body;

    if (!media_id) {
      return NextResponse.json({ error: 'media_id is required' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { error } = await supabase
      .from('lesson_phase_media')
      .update({ is_active: false })
      .eq('id', media_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/admin/lesson-media — update phase text override
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { lesson_id, phase, phase_json_override } = body;

    if (!lesson_id || !phase) {
      return NextResponse.json({ error: 'lesson_id and phase are required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Update the phase JSON directly in topic_lesson_structures
    const phaseColumn = `${phase}_json`;
    const { error } = await supabase
      .from('topic_lesson_structures')
      .update({ [phaseColumn]: phase_json_override })
      .eq('id', lesson_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
