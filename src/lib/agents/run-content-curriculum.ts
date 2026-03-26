import type { AgentOutput } from '@/types/agents';
import {
  getLatestBusinessMetric,
  getOpenAgentTasks,
  getRecentAgentLogs,
  insertAgentLog,
  insertAgentTasks,
} from '@/lib/agents/queries';

function buildContentCurriculumOutput(data: {
  metrics: Awaited<ReturnType<typeof getLatestBusinessMetric>>;
  openTasks: Awaited<ReturnType<typeof getOpenAgentTasks>>;
  logs: Awaited<ReturnType<typeof getRecentAgentLogs>>;
}): AgentOutput {
  const contentTasks = data.openTasks.filter((task) => task.agent_name === 'content_curriculum');

  const findings = [] as AgentOutput['findings'];
  const recommendedActions = [] as AgentOutput['recommended_actions'];
  const tasks = [] as AgentOutput['tasks'];

  findings.push(
    {
      title: 'Luminary already has a real lesson generator worth preserving',
      detail: 'The existing Claude 4.6 lesson generation flow already handles topic → curriculum brief → editable misconceptions/objectives → full lesson structure, so the content lane should enrich and coordinate that system rather than replace it.',
      severity: 'medium',
    },
    {
      title: 'Lesson quality now needs an enrichment pipeline, not just core generation',
      detail: 'To feel exciting for children, lessons need stronger media, diagrams, games, and reliable-source enrichment layered around the generated lesson structure.',
      severity: 'high',
    }
  );

  recommendedActions.push(
    {
      title: 'Create a lesson enrichment workflow alongside the existing generator',
      reason: 'Manual lesson generation should remain possible while the agent layer plans richer multimodal experiences.',
      priority: 'high',
    },
    {
      title: 'Define a reliable-source media strategy for videos, images, and diagrams',
      reason: 'Educational excitement should come from trustworthy and useful assets, not random decoration.',
      priority: 'high',
    },
    {
      title: 'Add a review pass focused on engagement and pedagogy',
      reason: 'Generated lessons should be checked for clarity, age fit, pacing, and whether media genuinely helps the child learn.',
      priority: 'high',
    }
  );

  if (!contentTasks.some((task) => task.task_type === 'lesson_enrichment_workflow')) {
    tasks.push({
      task_type: 'lesson_enrichment_workflow',
      title: 'Design the lesson enrichment workflow alongside manual lesson generation',
      description: 'Map how content agents should sit alongside the current Claude 4.6 lesson generator so manual creation stays possible while enrichment, media, and review steps become structured.',
      priority: 'high',
      payload: {
        source: 'content_curriculum_agent',
        integrates_with: ['/admin/lessons', '/admin/content'],
      },
    });
  }

  if (!contentTasks.some((task) => task.task_type === 'lesson_media_strategy')) {
    tasks.push({
      task_type: 'lesson_media_strategy',
      title: 'Define media and asset strategy for lesson enrichment',
      description: 'Set rules for when a lesson should use reliable-source images, diagrams, videos, generated visuals, concept cards, game questions, worksheets, and knowledge-base materials.',
      priority: 'high',
      payload: {
        source: 'content_curriculum_agent',
        asset_targets: ['video', 'image', 'diagram', 'game_questions', 'worksheet', 'concept_card', 'realworld_card'],
      },
    });
  }

  if (!contentTasks.some((task) => task.task_type === 'lesson_review_pass_design')) {
    tasks.push({
      task_type: 'lesson_review_pass_design',
      title: 'Design a lesson review pass for engagement and pedagogy',
      description: 'Create a repeatable review step that checks lesson excitement, age fit, clarity, misconceptions, pacing, and whether media genuinely improves learning.',
      priority: 'high',
      payload: {
        source: 'content_curriculum_agent',
        review_dimensions: ['engagement', 'pedagogy', 'age_fit', 'media_value', 'accuracy'],
      },
    });
  }

  if (!contentTasks.some((task) => task.task_type === 'lesson_brief_generation')) {
    tasks.push({
      task_type: 'lesson_brief_generation',
      title: 'Generate a first agent-assisted lesson brief workflow',
      description: 'Define how the content agent should propose lesson briefs, objectives, misconceptions, and enrichment ideas before a human edits and runs the existing generator.',
      priority: 'medium',
      payload: {
        source: 'content_curriculum_agent',
        output_target: 'admin_lessons_brief_stage',
      },
    });
  }

  return {
    summary: 'Content & Curriculum should become a lesson-enrichment lane that works alongside the existing Claude 4.6 lesson generator: preserve manual lesson creation, then add structured planning, enrichment, review, media strategy, and asset orchestration to make lessons more exciting and educationally strong.',
    findings,
    recommended_actions: recommendedActions,
    tasks,
  };
}

export async function runContentCurriculumReview() {
  const [metrics, logs, openTasks] = await Promise.all([
    getLatestBusinessMetric(),
    getRecentAgentLogs(20),
    getOpenAgentTasks(50),
  ]);

  const output = buildContentCurriculumOutput({
    metrics,
    openTasks,
    logs,
  });

  const createdTasks = await insertAgentTasks('content_curriculum', output.tasks);

  await insertAgentLog({
    agent_name: 'content_curriculum',
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
