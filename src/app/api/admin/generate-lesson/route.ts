import { NextRequest, NextResponse } from 'next/server';
import { generateLessonLogic } from '@/lib/generate-lesson-logic';

export async function POST(req: NextRequest) {
  try {
    console.log('[generate-lesson] Request received');
    const body = await req.json();
    const jobId = body.job_id;
    
    // Execute the logic in a non-blocking way and catch any unhandled rejections
    Promise.resolve(generateLessonLogic(body, jobId)).catch(error => {
      console.error(`[generate-lesson] Unhandled rejection from generateLessonLogic for job ${jobId}:`, error);
    });

    return NextResponse.json({
      success: true,
      message: 'Lesson generation initiated in background.',
      job_id: jobId,
    });
  } catch (error: unknown) {
    console.error('[generate-lesson] Error initiating background task:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate lesson generation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
