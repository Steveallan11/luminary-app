import { NextResponse } from 'next/server';
import { getCeoDashboard } from '@/lib/agents/run-ceo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dashboard = await getCeoDashboard();
    return NextResponse.json(dashboard);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load CEO dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
