import type { AgentOutput, LessonStructureRecord } from '@/types/agents';
import {
  getLatestBusinessMetric,
  getOpenAgentTasks,
  getRecentAgentLogs,
  getRecentLessonStructures,
  insertAgentLog,
  insertAgentTasks,
} from '@/lib/agents/queries';

function getPhaseData(lesson: LessonStructureRecord, phase: 'spark' | 'explore' | 'anchor' | 'practise' | 'create' | 'check' | 'celebrate') {
  return lesson[`${phase}_json` as const] as Record<string, unknown> | null;
}

function buildLessonEnrichmentTasks(lesson: LessonStructureRecord, existingTasks: Awaited<ReturnType<typeof getOpenAgentTasks>>) {
  const lessonTitle = lesson.topics?.title ?? 'Untitled lesson';
  const lessonKey = lesson.id;
  const tasks = [] as AgentOutput['tasks'];

  const hasTask = (taskType: string) => existingTasks.some((task) => task.task_type === taskType && task.payload?.lesson_id === lessonKey);

  const spark = getPhaseData(lesson, 'spark');
  if (!hasTask('lesson_media_enrichment')) {
    tasks.push({
      task_type: 'lesson_media_enrichment',
      title: `Add media enrichment plan for ${lessonTitle}`,
      description: 'Identify where reliable-source images, diagrams, or short videos would strengthen hook, explanation, and retention across the lesson phases.',
      priority: 'high',
      payload: {
        lesson_id: lesson.id,
        topic_id: lesson.topic_id,
        source: 'content_curriculum_agent',
        spark_goal: spark?.phase_goal ?? null,
      },
    });
  }

  const explore = getPhaseData(lesson, 'explore');
  const anchor = getPhaseData(lesson, 'anchor');
  if (!hasTask('lesson_diagram_or_concept_card')) {
    tasks.push({
      task_type: 'lesson_diagram_or_concept_card',
      title: `Add diagram or concept card support for ${lessonTitle}`,
      description: 'Create a phase support plan for Explore/Anchor so core ideas become easier to visualise and explain to a child.',
      priority: 'high',
      payload: {
        lesson_id: lesson.id,
        topic_id: lesson.topic_id,
        source: 'content_curriculum_agent',
        explore_goal: explore?.phase_goal ?? null,
        anchor_goal: anchor?.phase_goal ?? null,
      },
    });
  }

  const practise = getPhaseData(lesson, 'practise');
  if (!hasTask('lesson_game_or_worksheet')) {
    tasks.push({
      task_type: 'lesson_game_or_worksheet',
      title: `Add game questions or worksheet for ${lessonTitle}`,
      description: 'Strengthen practice and recall by designing either game questions, a worksheet, or both for the lesson.',
      priority: 'high',
      payload: {
        lesson_id: lesson.id,
        topic_id: lesson.topic_id,
        source: 'content_curriculum_agent',
        practise_goal: practise?.phase_goal ?? null,
      },
    });
  }

  const create = getPhaseData(lesson, 'create');
  const celebrate = getPhaseData(lesson, 'celebrate');
  if (!hasTask('lesson_engagement_polish')) {
    tasks.push({
      task_type: 'lesson_engagement_polish',
      title: `Polish engagement arc for ${lessonTitle}`,
      description: 'Review Create and Celebrate phases so the lesson ends with stronger ownership, creativity, and reward for the child.',
      priority: 'medium',
      payload: {
        lesson_id: lesson.id,
        topic_id: lesson.topic_id,
        source: 'content_curriculum_agent',
        create_goal: create?.phase_goal ?? null,
        celebrate_goal: celebrate?.phase_goal ?? null,
      },
    });
  }

  return tasks;
}

function buildContentCurriculumOutput(data: {
  metrics: Awaited<ReturnType<typeof getLatestBusinessMetric>>;
  openTasks: Awaited<ReturnType<typeof getOpenAgentTasks>>;
  logs: Awaited<ReturnType<typeof getRecentAgentLogs>>;
  lessons: LessonStructureRecord[];
}): AgentOutput {
  const contentTasks = data.openTasks.filter((task) => task.agent_name === 'content_curriculum');
  const latestLesson = data.lessons[0] ?? null;

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

  if (latestLesson) {
    findings.push({
      title: 'A real generated lesson is now available for enrichment review',
      detail: `The latest lesson (${latestLesson.topics?.title ?? 'Untitled lesson'}) can now be used as a concrete target for media, game, and pedagogy improvements rather than keeping the content lane abstract.`,
      severity: 'high',
    });

    recommendedActions.push(
      {
        title: `Review ${latestLesson.topics?.title ?? 'the latest lesson'} phase-by-phase for enrichment`,
        reason: 'Content quality should now be improved on actual generated lesson records, not just workflow planning.',
        priority: 'high',
      },
      {
        title: 'Use existing lesson/content admin flows as the execution surface',
        reason: 'Manual generation and approval should remain possible while the agent lane creates enrichment tasks and asset suggestions.',
        priority: 'high',
      }
    );

    tasks.push(...buildLessonEnrichmentTasks(latestLesson, contentTasks));
  } else {
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
    summary: latestLesson
      ? `Content & Curriculum is now reviewing real generated lessons. The latest lesson (${latestLesson.topics?.title ?? 'Untitled lesson'}) should be used as the first enrichment target so media, diagrams, games, worksheets, and pedagogy improvements are attached to an actual Lumi lesson rather than staying abstract.`
      : 'Content & Curriculum should become a lesson-enrichment lane that works alongside the existing Claude 4.6 lesson generator: preserve manual lesson creation, then add structured planning, enrichment, review, media strategy, and asset orchestration to make lessons more exciting and educationally strong.',
    findings,
    recommended_actions: recommendedActions,
    tasks,
  };
}

export async function runContentCurriculumReview() {
  const [metrics, logs, openTasks, lessons] = await Promise.all([
    getLatestBusinessMetric(),
    getRecentAgentLogs(20),
    getOpenAgentTasks(50),
    getRecentLessonStructures(10),
  ]);

  const output = buildContentCurriculumOutput({
    metrics,
    openTasks,
    logs,
    lessons,
  });

  const createdTasks = await insertAgentTasks('content_curriculum', output.tasks);

  await insertAgentLog({
    agent_name: 'content_curriculum',
    run_type: 'manual',
    summary: output.summary,
    details: {
      ...output,
      lesson_ids_reviewed: lessons.map((lesson) => lesson.id),
    } as Record<string, unknown>,
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
