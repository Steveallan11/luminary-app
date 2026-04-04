import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface PublishPayload {
  asset_id?: string;
  lesson_id?: string;
  topic_id?: string;
  reviewed_by?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PublishPayload;
    const { asset_id, lesson_id, topic_id, reviewed_by } = body;

    if (!asset_id && !lesson_id && !topic_id) {
      return NextResponse.json(
        { error: 'asset_id, lesson_id, or topic_id is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[publish-content] Missing Supabase credentials');
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date().toISOString();

    let query = supabase
      .from('topic_assets')
      .update({
        status: 'published',
        reviewed_by: reviewed_by || 'admin',
        reviewed_at: now,
        updated_at: now,
      });

    if (asset_id) {
      query = query.eq('id', asset_id);
    } else if (lesson_id) {
      query = query.eq('linked_lesson_id', lesson_id);
    } else {
      query = query.eq('topic_id', topic_id);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('[publish-content] Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: data?.length ?? 0,
      assets: data ?? [],
    });
  } catch (error: unknown) {
    console.error('[publish-content] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Failed to publish content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
