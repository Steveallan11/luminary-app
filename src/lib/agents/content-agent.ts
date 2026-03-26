import { getAnthropicClient, LUMI_MODEL } from '@/lib/anthropic';
import { AgentTask, AgentResponse } from './types';
import { createClient } from '@supabase/supabase-js';

const CONTENT_AGENT_PROMPT = `You are the Content Agent for Luminary, an AI-powered educational platform.

Your capabilities:
1. Generate lesson briefs with key concepts, misconceptions, and curriculum objectives
2. Create complete lesson structures following the Spark-Explore-Anchor-Practise-Create-Check-Celebrate framework
3. Review and improve existing lesson content
4. Suggest topics based on curriculum requirements

When generating content:
- Target UK National Curriculum standards
- Use age-appropriate language and examples
- Include interactive elements and visual suggestions
- Consider common misconceptions and address them proactively

Respond with actionable content or clear status updates on tasks.`;

export async function processContentTask(task: AgentTask): Promise<AgentResponse> {
  const taskType = (task.input_data.taskType as string) || 'general';
  
  switch (taskType) {
    case 'generate_brief':
      return await generateTopicBrief(task);
    case 'generate_lesson':
      return await queueLessonGeneration(task);
    case 'review_lesson':
      return await reviewLesson(task);
    case 'suggest_topics':
      return await suggestTopics(task);
    default:
      return await handleGeneralContentRequest(task);
  }
}

async function generateTopicBrief(task: AgentTask): Promise<AgentResponse> {
  const client = getAnthropicClient();
  const { title, subject, keyStage, ageGroup } = task.input_data as {
    title?: string;
    subject?: string;
    keyStage?: string;
    ageGroup?: string;
  };

  if (!title || !subject) {
    return {
      message: 'Please provide a topic title and subject to generate a brief.',
    };
  }

  const prompt = `Generate a comprehensive topic brief for:
Topic: ${title}
Subject: ${subject}
Key Stage: ${keyStage || 'KS2'}
Age Group: ${ageGroup || '8-11'}

Include:
1. 5-7 key concepts to teach
2. 3-5 common misconceptions students have
3. 4-6 real-world examples that make the topic relatable
4. Relevant UK National Curriculum objectives
5. Suggested visual aids and interactive elements

Format as JSON with these fields: keyConcepts, commonMisconceptions, realWorldExamples, curriculumObjectives, visualSuggestions`;

  try {
    const response = await client.messages.create({
      model: LUMI_MODEL,
      max_tokens: 2048,
      system: CONTENT_AGENT_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const content = textBlock && 'text' in textBlock ? textBlock.text : '';

    // Try to parse JSON from response
    let briefData = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        briefData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, return raw content
    }

    return {
      message: `Generated topic brief for "${title}"`,
      metadata: {
        brief: briefData,
        rawContent: content,
        title,
        subject,
        keyStage: keyStage || 'KS2',
        ageGroup: ageGroup || '8-11',
      },
    };
  } catch (error) {
    return {
      message: `Failed to generate brief: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function queueLessonGeneration(task: AgentTask): Promise<AgentResponse> {
  const { topicId, title, subject, ageGroup, keyConcepts, misconceptions, realWorldExamples, curriculumObjectives } = task.input_data as {
    topicId?: string;
    title?: string;
    subject?: string;
    ageGroup?: string;
    keyConcepts?: string[];
    misconceptions?: string[];
    realWorldExamples?: string[];
    curriculumObjectives?: string[];
  };

  if (!topicId || !title || !subject) {
    return {
      message: 'Please provide topicId, title, and subject to queue lesson generation.',
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      message: 'Database connection not configured. Cannot queue lesson generation.',
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create generation job
    const { error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        id: jobId,
        type: 'lesson_structure',
        status: 'pending',
        progress: 0,
        input_data: {
          topic_id: topicId,
          title,
          subject_name: subject,
          age_group: ageGroup || '8-11',
          key_stage: ageGroup === '5-7' ? 'KS1' : 'KS2',
          key_concepts: keyConcepts || [],
          common_misconceptions: misconceptions || [],
          real_world_examples: realWorldExamples || [],
          curriculum_objectives: curriculumObjectives || [],
        },
      });

    if (jobError) {
      throw jobError;
    }

    // Trigger the generation API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.meetlumi.co.uk';
    fetch(`${appUrl}/api/admin/generate-lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        topic_id: topicId,
        title,
        subject_name: subject,
        age_group: ageGroup || '8-11',
        key_concepts: keyConcepts || [],
        common_misconceptions: misconceptions || [],
        real_world_examples: realWorldExamples || [],
        curriculum_objectives: curriculumObjectives || [],
      }),
    }).catch(err => console.error('Background generation trigger failed:', err));

    return {
      message: `Lesson generation queued for "${title}" (Job ID: ${jobId}). The lesson will be ready in 2-3 minutes.`,
      metadata: {
        jobId,
        topicId,
        status: 'queued',
      },
    };
  } catch (error) {
    return {
      message: `Failed to queue lesson: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function reviewLesson(task: AgentTask): Promise<AgentResponse> {
  const client = getAnthropicClient();
  const { lessonId, structure } = task.input_data as {
    lessonId?: string;
    structure?: Record<string, unknown>;
  };

  if (!structure) {
    return {
      message: 'Please provide the lesson structure to review.',
    };
  }

  const prompt = `Review this lesson structure and provide feedback:

${JSON.stringify(structure, null, 2)}

Evaluate:
1. Age-appropriateness of language and content
2. Coverage of key concepts
3. Quality of questions and activities
4. Engagement potential
5. Alignment with UK curriculum

Provide specific improvement suggestions.`;

  try {
    const response = await client.messages.create({
      model: LUMI_MODEL,
      max_tokens: 2048,
      system: CONTENT_AGENT_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const review = textBlock && 'text' in textBlock ? textBlock.text : '';

    return {
      message: review,
      metadata: { lessonId, reviewed: true },
    };
  } catch (error) {
    return {
      message: `Failed to review lesson: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function suggestTopics(task: AgentTask): Promise<AgentResponse> {
  const client = getAnthropicClient();
  const { subject, keyStage, existingTopics } = task.input_data as {
    subject?: string;
    keyStage?: string;
    existingTopics?: string[];
  };

  const prompt = `Suggest educational topics for:
Subject: ${subject || 'General'}
Key Stage: ${keyStage || 'KS2'}
${existingTopics?.length ? `Already have topics: ${existingTopics.join(', ')}` : ''}

Suggest 5-10 new topics that:
1. Align with UK National Curriculum
2. Are engaging for the age group
3. Build on existing topics if provided
4. Cover different difficulty levels

Format as a JSON array with: title, description, keyConcepts (array), difficulty (easy/medium/hard)`;

  try {
    const response = await client.messages.create({
      model: LUMI_MODEL,
      max_tokens: 2048,
      system: CONTENT_AGENT_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const content = textBlock && 'text' in textBlock ? textBlock.text : '';

    let suggestions = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Return raw content if parsing fails
    }

    return {
      message: `Here are topic suggestions for ${subject || 'General'} (${keyStage || 'KS2'}):`,
      suggestions: suggestions.map((s: { title: string }) => s.title),
      metadata: {
        topics: suggestions,
        rawContent: content,
      },
    };
  } catch (error) {
    return {
      message: `Failed to suggest topics: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function handleGeneralContentRequest(task: AgentTask): Promise<AgentResponse> {
  const client = getAnthropicClient();
  
  try {
    const response = await client.messages.create({
      model: LUMI_MODEL,
      max_tokens: 2048,
      system: CONTENT_AGENT_PROMPT,
      messages: [{ role: 'user', content: task.description || task.title }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const content = textBlock && 'text' in textBlock ? textBlock.text : '';

    return {
      message: content,
      metadata: { taskId: task.id },
    };
  } catch (error) {
    return {
      message: `Content task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
