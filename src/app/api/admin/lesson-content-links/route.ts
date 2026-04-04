import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseUrl } from '@/lib/server-env';

// ─── Supabase client helper ───────────────────────────────────────────────────
function getSupabase() {
  const url = getServerSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

// ─── Mock fallback data ───────────────────────────────────────────────────────
const MOCK_LINKS: Array<{
  id: string;
  lesson_id: string;
  asset_id: string;
  phase: string;
  position: number;
  lumi_instruction: string | null;
  created_at: string;
}> = [];

// ─── GET /api/admin/lesson-content-links?lesson_id=xxx ───────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lesson_id = searchParams.get('lesson_id');
  const phase = searchParams.get('phase');

  if (!lesson_id) {
    return NextResponse.json({ error: 'lesson_id required' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Return mock data filtered by lesson_id
    let links = MOCK_LINKS.filter(l => l.lesson_id === lesson_id);
    if (phase) links = links.filter(l => l.phase === phase);
    return NextResponse.json({ links });
  }

  try {
    let query = supabase
      .from('lesson_content_links')
      .select(`
        *,
        asset:topic_assets(
          id, title, asset_type, asset_subtype, content_json,
          age_group, key_stage, status
        )
      `)
      .eq('lesson_id', lesson_id)
      .order('phase')
      .order('position');

    if (phase) query = query.eq('phase', phase);

    const { data, error } = await query;
    if (error) {
      // Table may not exist yet — return empty
      console.warn('[lesson-content-links GET] Supabase error:', error.message);
      return NextResponse.json({ links: [] });
    }
    return NextResponse.json({ links: data || [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ links: [], error: msg });
  }
}

// ─── POST /api/admin/lesson-content-links ────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lesson_id, asset_id, phase, position = 0, lumi_instruction = null } = body;

  if (!lesson_id || !asset_id || !phase) {
    return NextResponse.json({ error: 'lesson_id, asset_id, phase required' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Mock: store in memory
    const newLink = {
      id: `mock-link-${Date.now()}`,
      lesson_id,
      asset_id,
      phase,
      position,
      lumi_instruction,
      created_at: new Date().toISOString(),
    };
    MOCK_LINKS.push(newLink);
    return NextResponse.json({ link: newLink });
  }

  try {
    // Upsert — if same lesson+asset+phase exists, update position and instruction
    const { data, error } = await supabase
      .from('lesson_content_links')
      .upsert(
        { lesson_id, asset_id, phase, position, lumi_instruction },
        { onConflict: 'lesson_id,asset_id,phase' }
      )
      .select()
      .single();

    if (error) {
      console.error('[lesson-content-links POST] Supabase error:', error.message);
      // If table doesn't exist, return mock success
      const mockLink = {
        id: `mock-${Date.now()}`,
        lesson_id, asset_id, phase, position, lumi_instruction,
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({ link: mockLink });
    }
    return NextResponse.json({ link: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── DELETE /api/admin/lesson-content-links?id=xxx ───────────────────────────
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    const idx = MOCK_LINKS.findIndex(l => l.id === id);
    if (idx !== -1) MOCK_LINKS.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  try {
    const { error } = await supabase
      .from('lesson_content_links')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PATCH /api/admin/lesson-content-links — reorder ─────────────────────────
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, position, lumi_instruction } = body;

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    const link = MOCK_LINKS.find(l => l.id === id);
    if (link) {
      if (position !== undefined) link.position = position;
      if (lumi_instruction !== undefined) link.lumi_instruction = lumi_instruction;
    }
    return NextResponse.json({ success: true });
  }

  try {
    const updates: Record<string, unknown> = {};
    if (position !== undefined) updates.position = position;
    if (lumi_instruction !== undefined) updates.lumi_instruction = lumi_instruction;

    const { error } = await supabase
      .from('lesson_content_links')
      .update(updates)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
