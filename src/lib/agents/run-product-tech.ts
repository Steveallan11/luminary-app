import type { AgentOutput } from '@/types/agents';
import {
  getLatestBusinessMetric,
  getOpenAgentTasks,
  getRecentAgentLogs,
  insertAgentLog,
  insertAgentTasks,
} from '@/lib/agents/queries';

function buildProductTechOutput(data: {
  metrics: Awaited<ReturnType<typeof getLatestBusinessMetric>>;
  openTasks: Awaited<ReturnType<typeof getOpenAgentTasks>>;
  logs: Awaited<ReturnType<typeof getRecentAgentLogs>>;
}): AgentOutput {
  const productTechTasks = data.openTasks.filter((task) => task.agent_name === 'product_tech');
  const blockedProductTechTasks = productTechTasks.filter((task) => task.status === 'blocked');
  const criticalTeachingLaneTask = data.openTasks.find((task) => task.task_type === 'product_core');
  const authTask = data.openTasks.find((task) => task.task_type === 'auth');
  const latestCeoLog = data.logs.find((log) => log.agent_name === 'ceo');

  const findings = [] as AgentOutput['findings'];
  const recommendedActions = [] as AgentOutput['recommended_actions'];
  const tasks = [] as AgentOutput['tasks'];

  if (criticalTeachingLaneTask) {
    findings.push({
      title: 'Core teaching lane still needs hardening',
      detail: 'The CEO queue still flags auth → learn → lesson start → Lumi chat → session end as the most important product trust lane to make explicitly real.',
      severity: criticalTeachingLaneTask.priority === 'critical' ? 'critical' : 'high',
    });
  }

  if (authTask) {
    findings.push({
      title: 'Learner identity flow is still mixed with demo behaviour',
      detail: 'Product trust remains limited while learner login, child selection, and post-auth routing are not cleanly separated from demo assumptions.',
      severity: authTask.priority === 'critical' ? 'critical' : 'high',
    });
  }

  if (blockedProductTechTasks.length > 0) {
    findings.push({
      title: 'Existing Product & Tech work is blocked',
      detail: `${blockedProductTechTasks.length} Product & Tech task(s) are currently marked blocked and need founder review before more work is queued.`,
      severity: 'high',
    });
  }

  if (!data.metrics) {
    findings.push({
      title: 'Metrics context is still thin for technical prioritisation',
      detail: 'Without richer business metrics, technical prioritisation is still driven mainly by product trust and operational intuition rather than performance trends.',
      severity: 'medium',
    });
  }

  recommendedActions.push(
    {
      title: 'Audit the core teaching lane end to end',
      reason: 'Before adding more surfaces, Luminary needs one explicitly trustworthy child learning path.',
      priority: 'critical',
    },
    {
      title: 'Separate real learner auth from demo behaviour',
      reason: 'Clear identity and routing is the next dependency for product trust, testing, and school-ready confidence.',
      priority: 'high',
    },
    {
      title: 'Turn CEO priorities into an implementation queue the team can execute',
      reason: 'The Product & Tech lane should convert founder priorities into scoped engineering tasks instead of leaving them as dashboard observations.',
      priority: 'high',
    }
  );

  if (!productTechTasks.some((task) => task.task_type === 'teaching_lane_audit')) {
    tasks.push({
      task_type: 'teaching_lane_audit',
      title: 'Audit the core teaching lane end to end',
      description: 'Map and verify auth → learn → lesson start → Lumi chat → session end so the product core is either fully real or clearly labelled demo at every step.',
      priority: 'critical',
      payload: {
        area: 'core_teaching_lane',
        source: 'product_tech_agent',
        routes: ['/auth/login', '/learn', '/api/lesson/start', '/api/lumi/chat', '/api/lumi/session-end'],
      },
    });
  }

  if (!productTechTasks.some((task) => task.task_type === 'real_auth_flow')) {
    tasks.push({
      task_type: 'real_auth_flow',
      title: 'Scope the real learner auth and child-selection flow',
      description: 'Replace demo-path assumptions with a proper parent/learner identity flow, child selection, and PIN verification plan.',
      priority: 'high',
      payload: {
        area: 'auth',
        source: 'product_tech_agent',
        routes: ['/auth/login', '/auth/onboarding', '/learn'],
      },
    });
  }

  if (!productTechTasks.some((task) => task.task_type === 'implementation_queue')) {
    tasks.push({
      task_type: 'implementation_queue',
      title: 'Create a Product & Tech implementation queue from current CEO priorities',
      description: 'Translate the current founder/CEO priorities into scoped engineering tasks with order, dependencies, and definition of done.',
      priority: 'high',
      payload: {
        source: 'product_tech_agent',
        derived_from: latestCeoLog?.id ?? null,
      },
    });
  }

  return {
    summary: 'Product & Tech should now act as the execution-planning lane for Luminary: harden the core teaching journey, separate real auth from demo behaviour, and turn founder priorities into a build queue the team can actually ship against.',
    findings,
    recommended_actions: recommendedActions,
    tasks,
  };
}

export async function runProductTechReview() {
  const [metrics, logs, openTasks] = await Promise.all([
    getLatestBusinessMetric(),
    getRecentAgentLogs(20),
    getOpenAgentTasks(50),
  ]);

  const output = buildProductTechOutput({
    metrics,
    openTasks,
    logs,
  });

  const createdTasks = await insertAgentTasks('product_tech', output.tasks);

  await insertAgentLog({
    agent_name: 'product_tech',
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
