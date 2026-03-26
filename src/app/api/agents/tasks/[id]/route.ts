import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase service credentials are not configured.' }, { status: 500 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.status === 'string') {
      updates.status = body.status;
      if (body.status === 'done') {
        updates.completed_at = new Date().toISOString();
      }
    }

    if (typeof body.owner === 'string' || body.owner === null) {
      updates.owner = body.owner;
    }

    if (typeof body.priority === 'string') {
      updates.priority = body.priority;
    }

    const { data, error } = await supabase
      .from('agent_tasks')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
