import type { AgentOutput } from '@/types/agents';
import {
  getLatestBusinessMetric,
  getOpenAgentTasks,
  getRecentAgentLogs,
  insertAgentLog,
  insertAgentTasks,
} from '@/lib/agents/queries';

function buildGrowthOutput(data: {
  metrics: Awaited<ReturnType<typeof getLatestBusinessMetric>>;
  openTasks: Awaited<ReturnType<typeof getOpenAgentTasks>>;
  logs: Awaited<ReturnType<typeof getRecentAgentLogs>>;
}): AgentOutput {
  const growthTasks = data.openTasks.filter((task) => task.agent_name === 'growth');
  const latestMetrics = data.metrics;

  const findings = [] as AgentOutput['findings'];
  const recommendedActions = [] as AgentOutput['recommended_actions'];
  const tasks = [] as AgentOutput['tasks'];

  if (!latestMetrics) {
    findings.push({
      title: 'Growth work is under-instrumented',
      detail: 'MRR, subscriber, trial, and conversion context is too thin to prioritise growth confidently.',
      severity: 'medium',
    });
  } else {
    if ((latestMetrics.trial_count ?? 0) === 0) {
      findings.push({
        title: 'Trial flow has no visible activity',
        detail: 'The latest business metrics show zero active trials, which makes funnel learning and growth experimentation hard.',
        severity: 'high',
      });
    }

    if ((latestMetrics.site_conversion_rate ?? 0) === 0) {
      findings.push({
        title: 'Conversion measurement is missing or zeroed',
        detail: 'Without a live conversion signal, homepage and funnel improvements cannot be judged properly.',
        severity: 'medium',
      });
    }
  }

  recommendedActions.push(
    {
      title: 'Define the first founder growth dashboard inputs',
      reason: 'Growth work should be tied to trials, conversions, waitlist, and message clarity rather than generic marketing motion.',
      priority: 'high',
    },
    {
      title: 'Audit homepage and signup path message clarity',
      reason: 'Luminary needs a sharper trust and conversion story before scaling acquisition work.',
      priority: 'high',
    }
  );

  if (!growthTasks.some((task) => task.task_type === 'growth_metrics_plan')) {
    tasks.push({
      task_type: 'growth_metrics_plan',
      title: 'Define the first growth metrics and funnel review pack',
      description: 'Create the minimum useful growth metrics set for founder review: trials, conversions, waitlist, and landing/sign-up clarity.',
      priority: 'high',
      payload: {
        source: 'growth_agent',
        areas: ['metrics', 'homepage', 'signup'],
      },
    });
  }

  if (!growthTasks.some((task) => task.task_type === 'homepage_messaging_audit')) {
    tasks.push({
      task_type: 'homepage_messaging_audit',
      title: 'Audit homepage and sign-up messaging for trust and conversion',
      description: 'Review whether the public landing story clearly explains Luminary, who it is for, and why a parent should trust it enough to start.',
      priority: 'high',
      payload: {
        source: 'growth_agent',
        routes: ['/', '/pricing', '/auth/signup'],
      },
    });
  }

  return {
    summary: 'Growth should focus on a small, founder-useful funnel: instrument the basics, sharpen trust and homepage clarity, and avoid pretending there is a scaled acquisition engine before the core message converts.',
    findings,
    recommended_actions: recommendedActions,
    tasks,
  };
}

export async function runGrowthReview() {
  const [metrics, logs, openTasks] = await Promise.all([
    getLatestBusinessMetric(),
    getRecentAgentLogs(20),
    getOpenAgentTasks(50),
  ]);

  const output = buildGrowthOutput({
    metrics,
    openTasks,
    logs,
  });

  const createdTasks = await insertAgentTasks('growth', output.tasks);

  await insertAgentLog({
    agent_name: 'growth',
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
