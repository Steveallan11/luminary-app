import { NextResponse } from 'next/server';
import { runProductTechReview } from '@/lib/agents/run-product-tech';
import { getCeoDashboard } from '@/lib/agents/run-ceo';

export async function POST() {
  try {
    const result = await runProductTechReview();
    const dashboard = await getCeoDashboard();

    return NextResponse.json({
      ...result,
      dashboard,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run Product & Tech review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
