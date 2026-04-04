import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get('topic_id');

  if (!topicId) {
    return NextResponse.json({ error: 'topic_id is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceClient();
    const { data: assets, error: assetsError } = await supabase
      .from('topic_assets')
      .select('*')
      .eq('topic_id', topicId)
      .neq('status', 'archived')
      .order('created_at', { ascending: true });

    if (assetsError) {
      return NextResponse.json({ error: assetsError.message }, { status: 500 });
    }

    const diagramIds = (assets ?? [])
      .map((asset) => {
        const content = asset.content_json as { diagram_component_id?: string } | null;
        return content?.diagram_component_id ?? null;
      })
      .filter((value): value is string => Boolean(value));

    let diagrams: unknown[] = [];
    if (diagramIds.length > 0) {
      const { data: diagramRows, error: diagramError } = await supabase
        .from('diagram_components')
        .select('*')
        .in('id', diagramIds);

      if (diagramError && !diagramError.message.toLowerCase().includes('does not exist')) {
        return NextResponse.json({ error: diagramError.message }, { status: 500 });
      }

      diagrams = diagramRows ?? [];
    }

    return NextResponse.json({
      assets: assets ?? [],
      diagrams,
      source: 'supabase',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
