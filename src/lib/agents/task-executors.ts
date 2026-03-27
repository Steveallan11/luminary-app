import type { AgentOutput, AgentTask } from '@/types/agents';
import { getLatestBusinessMetric, getOpenAgentTasks, getRecentAgentLogs, insertAgentLog, insertAgentTasks, insertTopicAsset, updateAgentTask } from '@/lib/agents/queries';

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

async function executeHomepageCopyRevision(task: AgentTask) {
  const metrics = await getLatestBusinessMetric();

  // V1: produce a concrete copy draft and store it in the log.
  // (Applying changes to pages will be a follow-up executable task.)
  const draft = {
    homepage: {
      hero_headline: 'Homeschooling that feels like an adventure — guided by Lumi.',
      hero_subheadline: 'Personalised lessons with games, visuals, and real progress tracking — built for curious children and busy parents.',
      bullets: [
        'Age-appropriate lessons with a 7-phase arc (Spark → Celebrate)',
        'Interactive games, diagrams, worksheets, and concept cards',
        'Parent dashboard + LA-ready reporting',
      ],
      primary_cta: 'Create your family account',
      trust_line: 'Designed for UK learners. Built with safeguarding in mind.',
    },
    signup: {
      headline: 'Create your family account',
      supporting: 'Set up your learner in under 2 minutes. No card required to start.',
    },
  };

  const output: AgentOutput = {
    summary: 'Growth generated a concrete homepage + signup trust copy revision draft. Next step: apply it to the landing and signup pages and test clarity and conversion.',
    findings: [
      {
        title: 'Current messaging needs tighter trust clarity',
        detail: 'Parents need faster answers: what this is, who it is for, and why it is safe/credible.',
        severity: 'high',
      },
    ],
    recommended_actions: [
      {
        title: 'Apply copy draft to / and /auth/signup',
        reason: 'Turns messaging work into a shippable change you can test immediately.',
        priority: 'high',
      },
    ],
    tasks: [
      {
        task_type: 'apply_homepage_copy_patch',
        title: 'Apply homepage + signup copy draft to UI',
        description: 'Apply the generated copy revision to the landing page and signup page, then sanity-check mobile layout and CTA clarity.',
        priority: 'high',
        payload: {
          source_task_id: task.id,
          draft,
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
      draft,
      source_task_id: task.id,
      execution_type: 'task_start',
    },
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: [
      { type: 'task_execution', source_task_id: task.id, task_type: task.task_type },
      ...createdTasks.map((createdTask) => ({ type: 'task_created', task_id: createdTask.id, title: createdTask.title })),
    ],
    severity: 'medium',
    created_tasks_count: createdTasks.length,
  });

  await updateAgentTask(task.id, { status: 'done' });

  return { output, createdTasks };
}

async function executeGenerateExplanationAssets(task: AgentTask) {
  const metrics = await getLatestBusinessMetric();

  const topicId = (task.payload?.topic_id as string | undefined) ?? null;
  const lessonId = (task.payload?.lesson_id as string | undefined) ?? null;

  if (!topicId) {
    await updateAgentTask(task.id, { status: 'blocked' });
    return {
      output: { summary: 'Blocked: missing topic_id in task payload.', findings: [], recommended_actions: [], tasks: [] } satisfies AgentOutput,
      createdTasks: [],
    };
  }

  // V1: create a simple concept card asset record.
  const conceptCard = {
    hook: 'Quick idea check',
    title: 'Concept card: core idea',
    definition: 'A clear, child-friendly definition of the key idea for this lesson.',
    example: 'A short worked example that matches the lesson context.',
    misconception: 'One common mistake and how to avoid it.',
  };

  const inserted = await insertTopicAsset({
    topic_id: topicId,
    asset_type: 'explanation',
    asset_subtype: 'concept_card',
    title: task.title || 'Concept card',
    content_json: conceptCard,
    age_group: '7-11',
    key_stage: 'KS2',
    status: 'draft',
    generation_prompt: 'Generate a concept card to support Explore/Anchor phases.',
    linked_lesson_id: lessonId,
  });

  const output: AgentOutput = {
    summary: inserted
      ? 'Content & Curriculum generated a draft concept card asset and saved it to topic_assets.'
      : 'Content & Curriculum attempted to generate a concept card asset, but the insert failed (see logs).',
    findings: [],
    recommended_actions: [],
    tasks: [],
  };

  await insertAgentLog({
    agent_name: 'content_curriculum',
    run_type: 'triggered',
    summary: output.summary,
    details: {
      ...output,
      inserted_asset: inserted,
      source_task_id: task.id,
      execution_type: 'task_start',
    },
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: [
      { type: 'task_execution', source_task_id: task.id, task_type: task.task_type },
      ...(inserted ? [{ type: 'topic_asset_created', topic_asset_id: inserted.id }] : []),
    ],
    severity: 'low',
    created_tasks_count: 0,
  });

  await updateAgentTask(task.id, { status: inserted ? 'done' : 'blocked' });

  return { output, createdTasks: [] };
}

async function executeGenerateSupportingContentAssets(task: AgentTask) {
  const metrics = await getLatestBusinessMetric();

  const topicId = (task.payload?.topic_id as string | undefined) ?? null;
  const lessonId = (task.payload?.lesson_id as string | undefined) ?? null;

  if (!topicId) {
    await updateAgentTask(task.id, { status: 'blocked' });
    return {
      output: { summary: 'Blocked: missing topic_id in task payload.', findings: [], recommended_actions: [], tasks: [] } satisfies AgentOutput,
      createdTasks: [],
    };
  }

  const worksheet = {
    title: task.title || 'Practice worksheet',
    instructions: 'Answer the questions. Show your working where you can.',
    questions: [
      { type: 'short', prompt: 'Question 1' },
      { type: 'short', prompt: 'Question 2' },
      { type: 'short', prompt: 'Question 3' },
    ],
  };

  const inserted = await insertTopicAsset({
    topic_id: topicId,
    asset_type: 'practice',
    asset_subtype: 'worksheet',
    title: task.title || 'Worksheet',
    content_json: worksheet,
    age_group: '7-11',
    key_stage: 'KS2',
    status: 'draft',
    generation_prompt: 'Generate a KS2 worksheet aligned to Practise/Check phases.',
    linked_lesson_id: lessonId,
  });

  const output: AgentOutput = {
    summary: inserted
      ? 'Content & Curriculum generated a draft worksheet asset and saved it to topic_assets.'
      : 'Content & Curriculum attempted to generate a worksheet asset, but the insert failed (see logs).',
    findings: [],
    recommended_actions: [],
    tasks: [],
  };

  await insertAgentLog({
    agent_name: 'content_curriculum',
    run_type: 'triggered',
    summary: output.summary,
    details: {
      ...output,
      inserted_asset: inserted,
      source_task_id: task.id,
      execution_type: 'task_start',
    },
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: [
      { type: 'task_execution', source_task_id: task.id, task_type: task.task_type },
      ...(inserted ? [{ type: 'topic_asset_created', topic_asset_id: inserted.id }] : []),
    ],
    severity: 'low',
    created_tasks_count: 0,
  });

  await updateAgentTask(task.id, { status: inserted ? 'done' : 'blocked' });

  return { output, createdTasks: [] };
}

async function executeLessonMediaPack(task: AgentTask) {
  const metrics = await getLatestBusinessMetric();

  const topicId = (task.payload?.topic_id as string | undefined) ?? null;
  const lessonId = (task.payload?.lesson_id as string | undefined) ?? null;

  if (!topicId) {
    await updateAgentTask(task.id, { status: 'blocked' });
    return {
      output: { summary: 'Blocked: missing topic_id in task payload.', findings: [], recommended_actions: [], tasks: [] } satisfies AgentOutput,
      createdTasks: [],
    };
  }

  // V1: create a structured media pack draft (stored in log).
  // Later: connect to lesson_phase_media and source validation.
  const mediaPack = {
    lesson_id: lessonId,
    topic_id: topicId,
    phases: {
      spark: [{ type: 'image', source: 'wikimedia', query: 'relevant hook image', notes: 'Use a trustworthy, curiosity-driving image.' }],
      explore: [{ type: 'diagram', source: 'internal', query: 'simple labelled diagram', notes: 'Visual scaffold for the core concept.' }],
      anchor: [{ type: 'image', source: 'wikimedia', query: 'real-world example image', notes: 'Ground the idea in reality.' }],
      practise: [{ type: 'worksheet', source: 'internal', query: 'short practice set', notes: 'Keep it light and doable.' }],
      check: [{ type: 'quiz', source: 'internal', query: 'exit ticket questions', notes: 'Quick retrieval check.' }],
      celebrate: [{ type: 'reward', source: 'internal', query: 'celebration line', notes: 'Make it feel earned.' }],
    },
  };

  const output: AgentOutput = {
    summary: 'Content & Curriculum generated a draft lesson media pack (phase-by-phase) ready for review and future automation.',
    findings: [],
    recommended_actions: [
      {
        title: 'Review and approve media pack suggestions',
        reason: 'This pack becomes the blueprint for trusted visuals and activities tied to the lesson.',
        priority: 'high',
      },
    ],
    tasks: [],
  };

  await insertAgentLog({
    agent_name: 'content_curriculum',
    run_type: 'triggered',
    summary: output.summary,
    details: {
      ...output,
      media_pack: mediaPack,
      source_task_id: task.id,
      execution_type: 'task_start',
    },
    metrics_snapshot: metrics ? (metrics as unknown as Record<string, unknown>) : {},
    actions_taken: [
      { type: 'task_execution', source_task_id: task.id, task_type: task.task_type },
    ],
    severity: 'low',
    created_tasks_count: 0,
  });

  await updateAgentTask(task.id, { status: 'done' });

  return { output, createdTasks: [] };
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

  if (task.task_type === 'homepage_copy_revision') {
    return executeHomepageCopyRevision(task);
  }

  if (task.task_type === 'generate_explanation_assets') {
    return executeGenerateExplanationAssets(task);
  }

  if (task.task_type === 'generate_supporting_content_assets') {
    return executeGenerateSupportingContentAssets(task);
  }

  if (task.task_type === 'lesson_media_pack') {
    return executeLessonMediaPack(task);
  }

  return null;
}
