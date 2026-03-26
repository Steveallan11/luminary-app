import type { AgentLog, AgentName, AgentOutput, AgentSeverity, AgentStatusSummary, CeoDashboardData } from '@/types/agents';
import { getLatestBusinessMetric, getOpenAgentTasks, getRecentAgentLogs, insertAgentLog, insertAgentTasks } from '@/lib/agents/queries';
import { runProductTechReview } from '@/lib/agents/run-product-tech';
import { runContentCurriculumReview } from '@/lib/agents/run-content-curriculum';
import { runGrowthReview } from '@/lib/agents/run-growth';
import { runSupportSuccessReview } from '@/lib/agents/run-support-success';

const AGENT_ORDER: AgentName[] = ['ceo', 'product_tech', 'content_curriculum', 'growth', 'support_success', 'finance_ops'];

function getAgentStatusTone(severity: AgentSeverity | null, openTasksCount: number): AgentStatusSummary['status'] {
  if (severity === 'critical' || openTasksCount > 0) {
    return 'blocked';
  }

  if (severity === 'high' || severity === 'medium') {
    return 'attention';
  }

  return 'ok';
}

function buildAgentSummaries(logs: AgentLog[], tasks: Awaited<ReturnType<typeof getOpenAgentTasks>>): AgentStatusSummary[] {
  return AGENT_ORDER.map((agentName) => {
    const latestLog = logs.find((log) => log.agent_name === agentName) ?? null;
    const agentTasks = tasks.filter((task) => task.agent_name === agentName);

    return {
      agent_name: agentName,
      latest_run_at: latestLog?.run_at ?? null,
      summary: latestLog?.summary ?? 'No runs yet.',
      status: getAgentStatusTone(latestLog?.severity ?? null, agentTasks.length),
      created_tasks_count: latestLog?.created_tasks_count ?? 0,
      open_tasks_count: agentTasks.length,
    };
  });
}

function buildFallbackCeoOutput(data: {
  metrics: Awaited<ReturnType<typeof getLatestBusinessMetric>>;
  tasksCount: number;
  blockers: number;
  recentLogsCount: number;
}): AgentOutput {
  const priorities: string[] = [];
  const blockers: string[] = [];
  const nextActions: string[] = [];

  if (!data.metrics) {
    blockers.push('No business metrics are stored yet. Seed at least one business_metrics row.');
    nextActions.push('Add an initial business_metrics row so the CEO dashboard has real operating context.');
  }

  if (data.tasksCount > 0) {
    priorities.push(`There are ${data.tasksCount} open operational tasks that need triage.`);
  } else {
    priorities.push('Create the first few operational tasks from current QA and product findings.');
  }

  if (data.blockers > 0) {
    blockers.push(`${data.blockers} open task(s) are currently blocked.`);
  }

  if (data.recentLogsCount === 0) {
    nextActions.push('Run the CEO review regularly so logs begin to reflect operating history.');
  }

  nextActions.push('Keep the core teaching lane and the agent system as the two main build tracks.');

  return {
    summary: 'Luminary now has the first shape of an operating system, but metrics, logs, and task history are still thin. The immediate goal is to create a trustworthy internal loop while continuing to make the product core real.',
    findings: [
      {
        title: 'Operating system is newly scaffolded',
        detail: 'The agent schema, docs, and first route plans exist, but the system still needs seed data and repeated use to become genuinely useful.',
        severity: 'medium',
      },
    ],
    recommended_actions: [
      ...priorities.map((title) => ({ title, reason: 'This will make the founder operating layer more useful immediately.', priority: 'high' as const })),
      ...nextActions.map((title) => ({ title, reason: 'This improves operating clarity and momentum.', priority: 'medium' as const })),
    ],
    tasks: data.metrics
      ? []
      : [
          {
            task_type: 'ops_setup',
            title: 'Seed initial business metrics',
            description: 'Add the first business_metrics row so CEO summaries and dashboard cards have real data.',
            priority: 'high',
            payload: { table: 'business_metrics' },
          },
        ],
  };
}

export async function runCeoReview(): Promise<{ output: AgentOutput; dashboard: CeoDashboardData }> {
  const [metrics, logs, tasks] = await Promise.all([
    getLatestBusinessMetric(),
    getRecentAgentLogs(20),
    getOpenAgentTasks(50),
  ]);

  const blockers = tasks.filter((task) => task.status === 'blocked');
  const highPriorityTasks = tasks.filter((task) => task.priority === 'high' || task.priority === 'critical');

  const specialistRuns = await Promise.all([
    runProductTechReview(),
    runContentCurriculumReview(),
    runGrowthReview(),
    runSupportSuccessReview(),
  ]);

  const specialistActions = specialistRuns.flatMap((run) => run.output.recommended_actions);
  const specialistTasksCreated = specialistRuns.reduce((sum, run) => sum + run.createdTasks.length, 0);
  const specialistFindings = specialistRuns.flatMap((run) => run.output.findings);

  const fallbackOutput = buildFallbackCeoOutput({
    metrics,
    tasksCount: tasks.length,
    blockers: blockers.length,
    recentLogsCount: logs.length,
  });

  const priorities = specialistActions
    .filter((action) => action.priority === 'critical' || action.priority === 'high')
    .map((action) => action.title)
    .slice(0, 3);

  const nextActions = specialistActions
    .map((action) => action.title)
    .slice(0, 3);

  const output: AgentOutput = {
    summary: specialistFindings.length > 0
      ? `CEO review now coordinates specialist lanes. Product & Tech, Growth, and Support & Success have each produced an operating pass, and the immediate founder job is to focus on the core teaching lane, trust/conversion clarity, and the parent journey rather than treating the dashboard as an end in itself.`
      : fallbackOutput.summary,
    findings: specialistFindings.length > 0 ? specialistFindings.slice(0, 6) : fallbackOutput.findings,
    recommended_actions: specialistActions.length > 0 ? specialistActions.slice(0, 6) : fallbackOutput.recommended_actions,
    tasks: fallbackOutput.tasks,
  };

  const createdTasks = await insertAgentTasks('ceo', output.tasks);
  const blockerTitles = blockers.map((task) => task.title).slice(0, 3);

  await insertAgentLog({
    agent_name: 'ceo',
    run_type: 'manual',
    summary: output.summary,
    details: {
      ...output,
      delegated_runs: [
        { agent_name: 'product_tech', created_tasks_count: specialistRuns[0]?.createdTasks.length ?? 0 },
        { agent_name: 'content_curriculum', created_tasks_count: specialistRuns[1]?.createdTasks.length ?? 0 },
        { agent_name: 'growth', created_tasks_count: specialistRuns[2]?.createdTasks.length ?? 0 },
        { agent_name: 'support_success', created_tasks_count: specialistRuns[3]?.createdTasks.length ?? 0 },
      ],
    } as Record<string, unknown>,
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: [
      ...createdTasks.map((task) => ({ type: 'task_created', task_id: task.id, title: task.title })),
      ...specialistRuns.flatMap((run) => run.createdTasks.map((task) => ({ type: 'delegated_task_created', task_id: task.id, title: task.title }))),
    ],
    severity: output.findings[0]?.severity ?? 'medium',
    created_tasks_count: createdTasks.length + specialistTasksCreated,
  });

  const refreshedLogs = await getRecentAgentLogs(20);
  const refreshedTasks = await getOpenAgentTasks(50);
  const latestCeoLog = refreshedLogs.find((log) => log.agent_name === 'ceo') ?? null;

  return {
    output,
    dashboard: {
      overview: {
        last_ceo_run_at: latestCeoLog?.run_at ?? null,
        open_high_priority_tasks: refreshedTasks.filter((task) => task.priority === 'high' || task.priority === 'critical').length,
        blockers: refreshedTasks.filter((task) => task.status === 'blocked').length,
      },
      metrics,
      ceo_brief: {
        summary: output.summary,
        priorities: priorities.length > 0 ? priorities : fallbackOutput.recommended_actions.map((action) => action.title).slice(0, 3),
        blockers: blockerTitles,
        next_actions: nextActions.length > 0 ? nextActions : fallbackOutput.recommended_actions.map((action) => action.title).slice(0, 3),
      },
      agents: buildAgentSummaries(refreshedLogs, refreshedTasks),
      tasks: refreshedTasks,
      logs: refreshedLogs,
    },
  };
}

export async function getCeoDashboard(): Promise<CeoDashboardData> {
  const [metrics, logs, tasks] = await Promise.all([
    getLatestBusinessMetric(),
    getRecentAgentLogs(10),
    getOpenAgentTasks(20),
  ]);

  const latestCeoLog = logs.find((log) => log.agent_name === 'ceo') ?? null;
  const blockers = tasks.filter((task) => task.status === 'blocked');
  const highPriorityTasks = tasks.filter((task) => task.priority === 'high' || task.priority === 'critical');

  const ceoDetails = (latestCeoLog?.details ?? {}) as {
    recommended_actions?: { title: string; priority: string }[];
  };

  const priorities = (ceoDetails.recommended_actions ?? [])
    .filter((action) => action.priority === 'high' || action.priority === 'critical')
    .map((action) => action.title)
    .slice(0, 3);

  return {
    overview: {
      last_ceo_run_at: latestCeoLog?.run_at ?? null,
      open_high_priority_tasks: highPriorityTasks.length,
      blockers: blockers.length,
    },
    metrics,
    ceo_brief: {
      summary: latestCeoLog?.summary ?? 'No CEO review has been run yet.',
      priorities,
      blockers: blockers.map((task) => task.title).slice(0, 3),
      next_actions: priorities,
    },
    agents: buildAgentSummaries(logs, tasks),
    tasks,
    logs,
  };
}
