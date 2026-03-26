import { NextRequest, NextResponse } from 'next/server';
import { updateAgentTask } from '@/lib/agents/queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const task = await updateAgentTask(params.id, {
      status: typeof body.status === 'string' ? body.status : undefined,
      owner: typeof body.owner === 'string' || body.owner === null ? body.owner : undefined,
      priority: typeof body.priority === 'string' ? body.priority : undefined,
    });

    if (!task) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    return NextResponse.json(task);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
