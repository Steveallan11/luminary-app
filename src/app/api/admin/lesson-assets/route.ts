import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lesson_id');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!lessonId) {
      return NextResponse.json({ error: 'lesson_id is required' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('[lesson-assets] Supabase credentials missing');
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('topic_assets')
      .select('id, title, asset_type, asset_subtype, status, reviewed_by, reviewed_at, created_at')
      .eq('linked_lesson_id', lessonId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[lesson-assets] Supabase query failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assets: data || [] });
  } catch (error: unknown) {
    console.error('[lesson-assets] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load lesson assets';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
