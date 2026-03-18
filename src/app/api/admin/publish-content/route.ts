import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/publish-content
 *
 * Publishes content, making it available to learners.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset_id } = body;

    if (!asset_id) {
      return NextResponse.json({ error: 'asset_id is required' }, { status: 400 });
    }

    // In production, update the database
    // For now, just return success
    return NextResponse.json({ success: true, asset_id, status: 'published', published_at: new Date().toISOString() });
  } catch (error) {
    console.error('Content publish error:', error);
    return NextResponse.json({ error: 'Failed to publish content' }, { status: 500 });
  }
}
