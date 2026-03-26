import { NextResponse } from 'next/server';
import { runGrowthReview } from '@/lib/agents/run-growth';
import { getCeoDashboard } from '@/lib/agents/run-ceo';

export async function POST() {
  try {
    const result = await runGrowthReview();
    const dashboard = await getCeoDashboard();

    return NextResponse.json({
      ...result,
      dashboard,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run Growth review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
