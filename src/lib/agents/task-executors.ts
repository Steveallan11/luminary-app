import type { AgentOutput, AgentTask } from '@/types/agents';
import { getLatestBusinessMetric, getOpenAgentTasks, getRecentAgentLogs, insertAgentLog, insertAgentTasks, updateAgentTask } from '@/lib/agents/queries';

async function executeTeachingLaneAudit(task: AgentTask) {
  const [metrics, openTasks] = await Promise.all([
    getLatestBusinessMetric(),
    getOpenAgentTasks(50),
  ]);

  const output: AgentOutput = {
    summary: 'Product & Tech completed a first execution pass on the core teaching lane. The route chain is now explicitly being treated as Luminary’s most important product-trust path, and the next step is to turn this audit into a concrete fix sequence rather than letting it remain a generic platform concern.',
    findings: [
      {
        title: 'Core teaching lane remains the highest-leverage trust path',
        detail: 'Auth, learner routing, lesson start, Lumi chat continuity, and session completion still need to feel like one coherent product rather than mixed demo/real fragments.',
        severity: 'high',
      },
      {
        title: 'Execution order matters more than breadth right now',
        detail: 'The correct next move is to stabilise the main child-learning path before spreading product effort across too many admin or growth surfaces.',
        severity: 'medium',
      },
    ],
    recommended_actions: [
      {
        title: 'Break the core teaching lane into route-by-route QA checks',
        reason: 'This turns a strategic priority into an executable technical checklist.',
        priority: 'high',
      },
      {
        title: 'Define the lesson-start and Lumi-chat handoff contract',
        reason: 'The child experience needs a reliable transition from lesson selection into active tutoring.',
        priority: 'high',
      },
    ],
    tasks: openTasks.some((item) => item.task_type === 'teaching_lane_fix_sequence')
      ? []
      : [
          {
            task_type: 'teaching_lane_fix_sequence',
            title: 'Create a fix sequence for the core teaching lane',
            description: 'Convert the core teaching lane audit into an ordered fix list covering auth, learn routing, lesson start, chat continuity, and session completion.',
            priority: 'high',
            payload: {
              source_task_id: task.id,
              routes: task.payload?.routes ?? [],
            },
          },
        ],
  };

  const createdTasks = await insertAgentTasks('product_tech', output.tasks);

  await insertAgentLog({
    agent_name: 'product_tech',
    run_type: 'triggered',
    summary: output.summary,
    details: {
      ...output,
      source_task_id: task.id,
      execution_type: 'task_start',
    },
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: [
      { type: 'task_execution', source_task_id: task.id, task_type: task.task_type },
      ...createdTasks.map((createdTask) => ({ type: 'task_created', task_id: createdTask.id, title: createdTask.title })),
    ],
    severity: output.findings[0]?.severity ?? 'medium',
    created_tasks_count: createdTasks.length,
  });

  await updateAgentTask(task.id, { status: 'done' });

  return { output, createdTasks };
}

async function executeHomepageMessagingAudit(task: AgentTask) {
  const [metrics] = await Promise.all([
    getLatestBusinessMetric(),
  ]);

  const output: AgentOutput = {
    summary: 'Growth completed a first execution pass on homepage and signup messaging. The strongest next opportunity is to tighten trust language, explain the parent/child experience more concretely, and make the signup path feel more deliberate and credible.',
    findings: [
      {
        title: 'Trust and clarity should outrank generic growth tactics',
        detail: 'The homepage needs to quickly answer what Luminary is, who it helps, and why a parent should trust it with a child’s learning journey.',
        severity: 'high',
      },
      {
        title: 'Signup should reinforce confidence, not just collect intent',
        detail: 'The sign-up path should feel like a continuation of the trust story rather than a separate admin step.',
        severity: 'medium',
      },
    ],
    recommended_actions: [
      {
        title: 'Tighten the public trust story across homepage and signup',
        reason: 'Parents need faster clarity and stronger confidence cues before conversion work can compound.',
        priority: 'high',
      },
    ],
    tasks: [
      {
        task_type: 'homepage_copy_revision',
        title: 'Draft a tighter homepage and signup trust message pass',
        description: 'Create a first revision pass for homepage and signup messaging focused on trust, clarity, and why Luminary is credible for parents.',
        priority: 'high',
        payload: {
          source_task_id: task.id,
          routes: task.payload?.routes ?? [],
        },
      },
    ],
  };

  const createdTasks = await insertAgentTasks('growth', output.tasks);

  await insertAgentLog({
    agent_name: 'growth',
    run_type: 'triggered',
    summary: output.summary,
    details: {
      ...output,
      source_task_id: task.id,
      execution_type: 'task_start',
    },
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: [
      { type: 'task_execution', source_task_id: task.id, task_type: task.task_type },
      ...createdTasks.map((createdTask) => ({ type: 'task_created', task_id: createdTask.id, title: createdTask.title })),
    ],
    severity: output.findings[0]?.severity ?? 'medium',
    created_tasks_count: createdTasks.length,
  });

  await updateAgentTask(task.id, { status: 'done' });

  return { output, createdTasks };
}

async function executeParentOnboardingAudit(task: AgentTask) {
  const [metrics, logs] = await Promise.all([
    getLatestBusinessMetric(),
    getRecentAgentLogs(20),
  ]);

  const output: AgentOutput = {
    summary: 'Support & Success completed a first execution pass on the parent journey. The main job now is to reduce trust friction between signup, login, parent visibility, and child start so the experience feels guided rather than improvised.',
    findings: [
      {
        title: 'Parent trust depends on guided continuity',
        detail: 'Parents need a smoother sense of what happens after signup, where their child fits, and how progress/reporting connects back to the product promise.',
        severity: 'high',
      },
      {
        title: 'Support structure should reflect real journey stages',
        detail: 'Onboarding, auth, dashboard comprehension, and child-start handoff should become explicit support categories rather than one generic bucket.',
        severity: 'medium',
      },
    ],
    recommended_actions: [
      {
        title: 'Define the parent journey touchpoints more explicitly',
        reason: 'A clearer parent path reduces confusion, support burden, and perceived product fragility.',
        priority: 'high',
      },
    ],
    tasks: logs.some((log) => log.agent_name === 'support_success' && typeof log.summary === 'string' && log.summary.includes('parent journey'))
      ? []
      : [
          {
            task_type: 'parent_journey_fix_list',
            title: 'Create a parent journey fix list from support audit findings',
            description: 'Turn the onboarding and trust audit into a concrete list of parent-facing product and messaging fixes.',
            priority: 'high',
            payload: {
              source_task_id: task.id,
              routes: task.payload?.routes ?? [],
            },
          },
        ],
  };

  const createdTasks = await insertAgentTasks('support_success', output.tasks);

  await insertAgentLog({
    agent_name: 'support_success',
    run_type: 'triggered',
    summary: output.summary,
    details: {
      ...output,
      source_task_id: task.id,
      execution_type: 'task_start',
    },
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: [
      { type: 'task_execution', source_task_id: task.id, task_type: task.task_type },
      ...createdTasks.map((createdTask) => ({ type: 'task_created', task_id: createdTask.id, title: createdTask.title })),
    ],
    severity: output.findings[0]?.severity ?? 'medium',
    created_tasks_count: createdTasks.length,
  });

  await updateAgentTask(task.id, { status: 'done' });

  return { output, createdTasks };
}

async function executeLessonMediaEnrichment(task: AgentTask) {
  const metrics = await getLatestBusinessMetric();

  const output: AgentOutput = {
    summary: 'Content & Curriculum completed a first media-enrichment execution pass for a real lesson. The next priority is to map reliable visuals and media support to the most important teaching moments instead of leaving the lesson text-only.',
    findings: [
      {
        title: 'Lesson phases need intentional media choices',
        detail: 'Spark, Explore, and Anchor are the most valuable places to add reliable-source visuals, diagrams, or short videos that genuinely help understanding.',
        severity: 'high',
      },
      {
        title: 'Media should serve explanation, not decoration',
        detail: 'The enrichment layer should choose assets that reduce confusion and increase memorability rather than just making the lesson look busy.',
        severity: 'medium',
      },
    ],
    recommended_actions: [
      {
        title: 'Create a source-backed media pack for the lesson',
        reason: 'A concrete media pack gives manual editors and future automation something real to work from.',
        priority: 'high',
      },
    ],
    tasks: [
      {
        task_type: 'lesson_media_pack',
        title: 'Create a lesson media pack from enrichment review',
        description: 'Turn the enrichment review into a concrete pack of suggested images, diagrams, or videos mapped to lesson phases.',
        priority: 'high',
        payload: {
          source_task_id: task.id,
          lesson_id: task.payload?.lesson_id ?? null,
          topic_id: task.payload?.topic_id ?? null,
        },
      },
    ],
  };

  const createdTasks = await insertAgentTasks('content_curriculum', output.tasks);

  await insertAgentLog({
    agent_name: 'content_curriculum',
    run_type: 'triggered',
    summary: output.summary,
    details: {
      ...output,
      source_task_id: task.id,
      execution_type: 'task_start',
    },
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: [
      { type: 'task_execution', source_task_id: task.id, task_type: task.task_type },
      ...createdTasks.map((createdTask) => ({ type: 'task_created', task_id: createdTask.id, title: createdTask.title })),
    ],
    severity: output.findings[0]?.severity ?? 'medium',
    created_tasks_count: createdTasks.length,
  });

  await updateAgentTask(task.id, { status: 'done' });

  return { output, createdTasks };
}

async function executeLessonGameOrWorksheet(task: AgentTask) {
  const metrics = await getLatestBusinessMetric();

  const output: AgentOutput = {
    summary: 'Content & Curriculum completed a first practice-enrichment execution pass. The lesson now has a clearer route toward interactive reinforcement through game questions, worksheets, or both.',
    findings: [
      {
        title: 'Practice phases benefit from explicit retrieval and play',
        detail: 'Practise and Check should not rely only on conversational prompts; they need structured reinforcement the child can actively do.',
        severity: 'high',
      },
    ],
    recommended_actions: [
      {
        title: 'Generate supporting practice assets for the lesson',
        reason: 'This turns lesson structure into richer child-facing activity instead of leaving practice thin.',
        priority: 'high',
      },
    ],
    tasks: [
      {
        task_type: 'generate_supporting_content_assets',
        title: 'Generate game questions and worksheet support for this lesson',
        description: 'Use the existing content system to generate support assets linked to this lesson, especially for practice and checking understanding.',
        priority: 'high',
        payload: {
          source_task_id: task.id,
          lesson_id: task.payload?.lesson_id ?? null,
          topic_id: task.payload?.topic_id ?? null,
          requested_asset_types: ['game_questions', 'worksheet'],
        },
      },
    ],
  };

  const createdTasks = await insertAgentTasks('content_curriculum', output.tasks);

  await insertAgentLog({
    agent_name: 'content_curriculum',
    run_type: 'triggered',
    summary: output.summary,
    details: {
      ...output,
      source_task_id: task.id,
      execution_type: 'task_start',
    },
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: [
      { type: 'task_execution', source_task_id: task.id, task_type: task.task_type },
      ...createdTasks.map((createdTask) => ({ type: 'task_created', task_id: createdTask.id, title: createdTask.title })),
    ],
    severity: output.findings[0]?.severity ?? 'medium',
    created_tasks_count: createdTasks.length,
  });

  await updateAgentTask(task.id, { status: 'done' });

  return { output, createdTasks };
}

async function executeLessonDiagramOrConceptCard(task: AgentTask) {
  const metrics = await getLatestBusinessMetric();

  const output: AgentOutput = {
    summary: 'Content & Curriculum completed a first explanation-support execution pass. The lesson now has a clearer route toward concept cards or diagrams that make difficult ideas easier for children to grasp.',
    findings: [
      {
        title: 'Explore and Anchor are the best phases for explanation assets',
        detail: 'These phases are where concept cards, diagrams, and visual scaffolds will most improve understanding and recall.',
        severity: 'high',
      },
    ],
    recommended_actions: [
      {
        title: 'Generate explanation assets for the lesson core concepts',
        reason: 'A concept card or diagram makes the lesson more teachable and easier to enrich with visuals.',
        priority: 'high',
      },
    ],
    tasks: [
      {
        task_type: 'generate_explanation_assets',
        title: 'Generate concept card or diagram support for this lesson',
        description: 'Use the existing content system to generate concept-support assets that match the lesson’s Explore and Anchor phases.',
        priority: 'high',
        payload: {
          source_task_id: task.id,
          lesson_id: task.payload?.lesson_id ?? null,
          topic_id: task.payload?.topic_id ?? null,
          requested_asset_types: ['concept_card'],
        },
      },
    ],
  };

  const createdTasks = await insertAgentTasks('content_curriculum', output.tasks);

  await insertAgentLog({
    agent_name: 'content_curriculum',
    run_type: 'triggered',
    summary: output.summary,
    details: {
      ...output,
      source_task_id: task.id,
      execution_type: 'task_start',
    },
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: [
      { type: 'task_execution', source_task_id: task.id, task_type: task.task_type },
      ...createdTasks.map((createdTask) => ({ type: 'task_created', task_id: createdTask.id, title: createdTask.title })),
    ],
    severity: output.findings[0]?.severity ?? 'medium',
    created_tasks_count: createdTasks.length,
  });

  await updateAgentTask(task.id, { status: 'done' });

  return { output, createdTasks };
}

export async function executeTaskOnStart(task: AgentTask) {
  if (task.task_type === 'teaching_lane_audit') {
    return executeTeachingLaneAudit(task);
  }

  if (task.task_type === 'homepage_messaging_audit') {
    return executeHomepageMessagingAudit(task);
  }

  if (task.task_type === 'parent_onboarding_audit') {
    return executeParentOnboardingAudit(task);
  }

  if (task.task_type === 'lesson_media_enrichment') {
    return executeLessonMediaEnrichment(task);
  }

  if (task.task_type === 'lesson_game_or_worksheet') {
    return executeLessonGameOrWorksheet(task);
  }

  if (task.task_type === 'lesson_diagram_or_concept_card') {
    return executeLessonDiagramOrConceptCard(task);
  }

  return null;
}
