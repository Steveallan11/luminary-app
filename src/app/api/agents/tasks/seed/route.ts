import { NextResponse } from 'next/server';
import { insertAgentTasks, getOpenAgentTasks } from '@/lib/agents/queries';
import type { AgentTaskDraft } from '@/types/agents';

const starterTasks: AgentTaskDraft[] = [
  {
    task_type: 'product_core',
    title: 'Make the core teaching lane explicitly real or explicitly demo',
    description: 'Remove ambiguity in auth → learn → lesson start → Lumi chat → session end so the product core can be trusted.',
    priority: 'critical',
    payload: {
      area: 'core_teaching_lane',
      routes: ['/auth/login', '/learn', '/api/lesson/start', '/api/lumi/chat', '/api/lumi/session-end'],
    },
  },
  {
    task_type: 'auth',
    title: 'Replace learner demo login with real learner identity flow',
    description: 'Implement real parent/learner auth, child selection, and PIN verification rather than hardcoded demo behavior.',
    priority: 'high',
    payload: {
      area: 'auth',
      routes: ['/auth/login', '/auth/onboarding'],
    },
  },
  {
    task_type: 'ops',
    title: 'Define and seed richer business metrics for the CEO dashboard',
    description: 'Populate business_metrics with values that make the CEO dashboard operationally useful rather than structurally correct only.',
    priority: 'medium',
    payload: {
      table: 'business_metrics',
    },
  },
  {
    task_type: 'admin_content',
    title: 'Audit and harden the admin/content pipeline end-to-end',
    description: 'Turn the current admin/content pipeline from promising hybrid implementation into a clearly production-ready path.',
    priority: 'high',
    payload: {
      area: 'admin_content_pipeline',
      routes: ['/admin/lessons', '/admin/library', '/admin/test-lesson/[id]'],
    },
  },
];

export async function POST() {
  try {
    const existingTasks = await getOpenAgentTasks(100);
    if (existingTasks.length > 0) {
      return NextResponse.json({
        inserted: 0,
        skipped: true,
        reason: 'Open tasks already exist. Seed route only inserts starter tasks into an empty queue.',
      });
    }

    const inserted = await insertAgentTasks('ceo', starterTasks);
    return NextResponse.json({ inserted: inserted.length, tasks: inserted });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to seed tasks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
