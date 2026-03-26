import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabaseClient, updateAgentTask } from '@/lib/agents/queries';
import { executeTaskOnStart } from '@/lib/agents/task-executors';

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

    if (body.status === 'in_progress') {
      const supabase = getServiceSupabaseClient();
      const { data } = supabase
        ? await supabase.from('agent_tasks').select('*').eq('id', params.id).single()
        : { data: task };

      const latestTask = (data as typeof task | null) ?? task;
      const execution = await executeTaskOnStart(latestTask);

      return NextResponse.json({
        task: latestTask,
        execution,
      });
    }

    return NextResponse.json(task);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
