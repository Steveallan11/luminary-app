import { NextResponse } from 'next/server';
import { runContentCurriculumReview } from '@/lib/agents/run-content-curriculum';
import { getCeoDashboard } from '@/lib/agents/run-ceo';

export async function POST() {
  try {
    const result = await runContentCurriculumReview();
    const dashboard = await getCeoDashboard();

    return NextResponse.json({
      ...result,
      dashboard,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run Content & Curriculum review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
