import { NextRequest, NextResponse } from 'next/server';
import { verifyImageAccuracy } from '@/lib/visual-lumi';

/**
 * POST /api/lumi/verify-image
 *
 * Verifies an image's accuracy for teaching a specific topic using
 * Claude's vision capability. Used by the admin image review panel
 * and the Visual Lumi pipeline.
 *
 * Body:
 * - image_url: string (required)
 * - topic_title: string (required)
 * - subject_name: string (required)
 * - key_stage: string (optional, defaults to 'KS2')
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image_url, topic_title, subject_name, key_stage } = body;

    if (!image_url || !topic_title || !subject_name) {
      return NextResponse.json(
        { error: 'image_url, topic_title, and subject_name are required' },
        { status: 400 }
      );
    }

    const result = await verifyImageAccuracy(
      image_url,
      topic_title,
      subject_name,
      key_stage ?? 'KS2'
    );

    return NextResponse.json({
      score: result.score,
      is_approved: result.is_approved,
      concerns: result.concerns,
      lumi_instruction: result.lumi_instruction,
      threshold: 8,
      message: result.is_approved
        ? 'Image approved for teaching use.'
        : `Image scored ${result.score}/10 — below the 8/10 threshold. Concerns: ${result.concerns}`,
    });
  } catch (error: unknown) {
    console.error('Image verification error:', error);
    const message = error instanceof Error ? error.message : 'Verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
