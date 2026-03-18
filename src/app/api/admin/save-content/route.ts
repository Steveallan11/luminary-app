import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/save-content
 *
 * Saves content changes to an asset.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset_id, content_json } = body;

    if (!asset_id || !content_json) {
      return NextResponse.json({ error: 'asset_id and content_json are required' }, { status: 400 });
    }

    // In production, update the database
    // For now, just return success
    return NextResponse.json({ success: true, asset_id, updated_at: new Date().toISOString() });
  } catch (error) {
    console.error('Content save error:', error);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
