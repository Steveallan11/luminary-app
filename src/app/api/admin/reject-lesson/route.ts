import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/reject-lesson
 *
 * Marks a lesson as rejected.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lesson_id } = body;

    if (!lesson_id) {
      return NextResponse.json({ error: 'lesson_id is required' }, { status: 400 });
    }

    // In production, update the database
    // For now, just return success
    return NextResponse.json({ success: true, status: 'rejected' });
  } catch (error) {
    console.error('Lesson rejection error:', error);
    return NextResponse.json({ error: 'Failed to reject lesson' }, { status: 500 });
  }
}
