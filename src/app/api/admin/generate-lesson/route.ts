import { NextRequest, NextResponse } from 'next/server';
import { generateLessonLogic } from '@/lib/generate-lesson-logic';

// Extend Vercel function timeout to 300 seconds (5 minutes) — required for Claude API calls
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    console.log('[generate-lesson] Request received');
    const body = await req.json();
    const jobId = body.job_id;

    // Run synchronously so Vercel doesn't kill the function before Claude responds
    await generateLessonLogic(body, jobId);

    return NextResponse.json({
      success: true,
      message: 'Lesson generation completed.',
      job_id: jobId,
    });
  } catch (error: unknown) {
    console.error('[generate-lesson] Error during generation:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate lesson';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
