import { NextResponse } from 'next/server';
import { runCeoReview } from '@/lib/agents/run-ceo';

export async function POST() {
  try {
    const result = await runCeoReview();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run CEO review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
