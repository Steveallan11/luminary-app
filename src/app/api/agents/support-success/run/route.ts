import { NextResponse } from 'next/server';
import { runSupportSuccessReview } from '@/lib/agents/run-support-success';
import { getCeoDashboard } from '@/lib/agents/run-ceo';

export async function POST() {
  try {
    const result = await runSupportSuccessReview();
    const dashboard = await getCeoDashboard();

    return NextResponse.json({
      ...result,
      dashboard,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run Support & Success review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
