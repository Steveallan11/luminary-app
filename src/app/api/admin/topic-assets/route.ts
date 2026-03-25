/**
 * Topic Assets API — fetch, update, and delete topic assets from Supabase
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MOCK_TOPIC_ASSETS } from '@/lib/mock-content';

export const dynamic = 'force-dynamic';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET /api/admin/topic-assets — fetch all assets, optionally filtered by topic_id or subject
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic_id = searchParams.get('topic_id');
  const subject = searchParams.get('subject');
  const asset_type = searchParams.get('asset_type');

  const supabase = getServiceClient();
  if (!supabase) {
    // Return mock data as fallback
    let filtered = MOCK_TOPIC_ASSETS;
    if (topic_id) filtered = filtered.filter(a => a.topic_id === topic_id);
    if (asset_type) filtered = filtered.filter(a => a.asset_type === asset_type);
    return NextResponse.json({ assets: filtered, source: 'mock' });
  }

  try {
    let query = supabase
      .from('topic_assets')
      .select(`
        *,
        topics(id, title, slug, subject_id, subjects(id, name, colour_hex))
      `)
      .order('created_at', { ascending: false });

    if (topic_id) query = query.eq('topic_id', topic_id);
    if (asset_type) query = query.eq('asset_type', asset_type);

    const { data, error } = await query;

    if (error) {
      console.error('[topic-assets] Supabase error:', error);
      return NextResponse.json({ assets: MOCK_TOPIC_ASSETS, source: 'mock', error: error.message });
    }

    // If no data in DB, return mock data
    if (!data || data.length === 0) {
      return NextResponse.json({ assets: MOCK_TOPIC_ASSETS, source: 'mock' });
    }

    return NextResponse.json({ assets: data, source: 'supabase' });
  } catch (err: any) {
    console.error('[topic-assets] Error:', err);
    return NextResponse.json({ assets: MOCK_TOPIC_ASSETS, source: 'mock', error: err.message });
  }
}

// PATCH /api/admin/topic-assets — update an asset's content_json or status
export async function PATCH(request: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, content_json, status, title } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (content_json !== undefined) updates.content_json = content_json;
    if (status !== undefined) updates.status = status;
    if (title !== undefined) updates.title = title;

    const { data, error } = await supabase
      .from('topic_assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ asset: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/topic-assets — delete an asset
export async function DELETE(request: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('topic_assets')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
