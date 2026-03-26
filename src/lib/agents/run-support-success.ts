import type { AgentOutput } from '@/types/agents';
import {
  getLatestBusinessMetric,
  getOpenAgentTasks,
  getRecentAgentLogs,
  insertAgentLog,
  insertAgentTasks,
} from '@/lib/agents/queries';

function buildSupportSuccessOutput(data: {
  metrics: Awaited<ReturnType<typeof getLatestBusinessMetric>>;
  openTasks: Awaited<ReturnType<typeof getOpenAgentTasks>>;
  logs: Awaited<ReturnType<typeof getRecentAgentLogs>>;
}): AgentOutput {
  const supportTasks = data.openTasks.filter((task) => task.agent_name === 'support_success');
  const findings = [] as AgentOutput['findings'];
  const recommendedActions = [] as AgentOutput['recommended_actions'];
  const tasks = [] as AgentOutput['tasks'];

  if (!data.metrics) {
    findings.push({
      title: 'Support visibility is still mostly qualitative',
      detail: 'Without fuller operational metrics, support work is inferred from product trust gaps rather than real case volume or onboarding drop-off.',
      severity: 'medium',
    });
  }

  const authOrCoreTask = data.openTasks.find((task) => task.task_type === 'auth' || task.task_type === 'product_core');
  if (authOrCoreTask) {
    findings.push({
      title: 'Current product trust issues will also show up as support pain',
      detail: 'Any ambiguity in auth, onboarding, or lesson continuity creates parent confusion and avoidable support load.',
      severity: 'high',
    });
  }

  recommendedActions.push(
    {
      title: 'Define the first parent onboarding and support friction checklist',
      reason: 'Support should start by clarifying where a parent would get confused or lose trust.',
      priority: 'high',
    },
    {
      title: 'Audit the parent-facing trust journey',
      reason: 'If reporting, auth, and child access feel brittle, support volume rises and confidence drops.',
      priority: 'high',
    }
  );

  if (!supportTasks.some((task) => task.task_type === 'parent_onboarding_audit')) {
    tasks.push({
      task_type: 'parent_onboarding_audit',
      title: 'Audit parent onboarding and trust friction',
      description: 'Review the first parent journey across landing, signup, auth, dashboard, and child start flow to identify confusion points and support risk.',
      priority: 'high',
      payload: {
        source: 'support_success_agent',
        routes: ['/', '/auth/signup', '/auth/login', '/parent'],
      },
    });
  }

  if (!supportTasks.some((task) => task.task_type === 'support_triage_setup')) {
    tasks.push({
      task_type: 'support_triage_setup',
      title: 'Define the first support triage categories',
      description: 'Create a simple support taxonomy covering onboarding, auth, lesson continuity, reporting, and billing so future issues can be grouped cleanly.',
      priority: 'medium',
      payload: {
        source: 'support_success_agent',
        categories: ['onboarding', 'auth', 'lesson_continuity', 'reporting', 'billing'],
      },
    });
  }

  return {
    summary: 'Support & Success should focus on trust and continuity: audit the parent journey, identify likely confusion before scale, and create a simple triage structure for recurring issues.',
    findings,
    recommended_actions: recommendedActions,
    tasks,
  };
}

export async function runSupportSuccessReview() {
  const [metrics, logs, openTasks] = await Promise.all([
    getLatestBusinessMetric(),
    getRecentAgentLogs(20),
    getOpenAgentTasks(50),
  ]);

  const output = buildSupportSuccessOutput({
    metrics,
    openTasks,
    logs,
  });

  const createdTasks = await insertAgentTasks('support_success', output.tasks);

  await insertAgentLog({
    agent_name: 'support_success',
    run_type: 'manual',
    summary: output.summary,
    details: output as unknown as Record<string, unknown>,
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: createdTasks.map((task) => ({ type: 'task_created', task_id: task.id, title: task.title })),
    severity: output.findings[0]?.severity ?? 'medium',
    created_tasks_count: createdTasks.length,
  });

  return {
    output,
    createdTasks,
  };
}
