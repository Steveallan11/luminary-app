import { NextRequest, NextResponse } from 'next/server';
import { MOCK_SUBJECTS, MOCK_TOPICS } from '@/lib/mock-data';
import { AssetType, TopicAsset, Topic, AgeGroup } from '@/types';

const ALL_TOPICS: Topic[] = Object.values(MOCK_TOPICS).flat();

/**
 * POST /api/admin/generate-content
 * 
 * Accepts: { topic_id, asset_types[], age_group }
 * Uses Claude to generate content for each requested asset type.
 * Returns: { assets: TopicAsset[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic_id, asset_types, age_group = '8-11' as AgeGroup } = body as {
      topic_id: string;
      asset_types: AssetType[];
      age_group: AgeGroup;
    };

    if (!topic_id || !asset_types || asset_types.length === 0) {
      return NextResponse.json({ error: 'topic_id and asset_types are required' }, { status: 400 });
    }

    const topic = ALL_TOPICS.find(t => t.id === topic_id);
    const subject = topic ? MOCK_SUBJECTS.find(s => s.id === topic.subject_id) : null;

    if (!topic || !subject) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Check for Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'sk-ant-placeholder') {
      // Return demo content instead
      return NextResponse.json({
        assets: asset_types.map((type, i) => ({
          id: `gen-${Date.now()}-${i}`,
          topic_id,
          asset_type: type,
          asset_subtype: type === 'game_questions' ? 'true_false' : type === 'realworld_card' ? 'everyday' : null,
          title: `${topic.title} — ${type.replace('_', ' ')}`,
          content_json: getDemoContent(type, topic.title, subject.name, age_group),
          file_url: null,
          thumbnail_url: null,
          age_group,
          key_stage: topic.key_stage,
          status: 'draft',
          generation_prompt: `Generate ${type} for ${topic.title} (${subject.name}), age group ${age_group}`,
          generated_at: new Date().toISOString(),
          reviewed_by: null,
          reviewed_at: null,
          linked_lesson_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        message: 'Demo content generated (no API key configured)',
      });
    }

    // In production, call Claude API for each asset type
    const { getAnthropicClient, LUMI_MODEL } = await import('@/lib/anthropic');
    const client = getAnthropicClient();

    const assets: TopicAsset[] = [];

    for (const type of asset_types) {
      const prompt = buildGenerationPrompt(type, topic.title, topic.description, subject.name, subject.colour_hex, age_group);

      const response = await client.messages.create({
        model: LUMI_MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      // Parse JSON from response
      let contentJson = {};
      try {
        const cleaned = text
          .replace(/^```(?:json)?\s*/m, '')
          .replace(/\s*```\s*$/m, '')
          .trim();
        contentJson = JSON.parse(cleaned);
      } catch {
        contentJson = { raw_text: text };
      }

      assets.push({
        id: `gen-${Date.now()}-${assets.length}`,
        topic_id,
        asset_type: type,
        asset_subtype: type === 'game_questions' ? 'true_false' : type === 'realworld_card' ? 'everyday' : null,
        title: `${topic.title} — ${type.replace('_', ' ')}`,
        content_json: contentJson,
        file_url: null,
        thumbnail_url: null,
        age_group,
        key_stage: topic.key_stage,
        status: 'draft',
        generation_prompt: prompt,
        generated_at: new Date().toISOString(),
        reviewed_by: null,
        reviewed_at: null,
        linked_lesson_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ assets, message: `Generated ${assets.length} assets` });
  } catch (error: any) {
    console.error('Content generation error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}

function buildGenerationPrompt(
  type: AssetType,
  topicTitle: string,
  topicDescription: string,
  subjectName: string,
  subjectColour: string,
  ageGroup: string
): string {
  const base = `You are a UK curriculum content creator for Luminary, a homeschool learning platform. Generate content for:
- Subject: ${subjectName}
- Topic: ${topicTitle}
- Description: ${topicDescription}
- Age group: ${ageGroup}
- UK National Curriculum aligned

Return ONLY valid JSON (no markdown, no explanation).`;

  switch (type) {
    case 'concept_card':
      return `${base}\n\nGenerate a concept card with this JSON structure:\n{"tagline": "short catchy phrase", "hook_question": "engaging question for the child", "definition": "clear age-appropriate explanation (2-3 sentences)", "image_prompt": "description for illustration"}`;
    case 'realworld_card':
      return `${base}\n\nGenerate a real-world everyday connection card:\n{"type": "everyday", "title": "catchy title", "description": "how this topic appears in daily life", "scenario": "specific relatable scenario", "image_prompt": "illustration description"}`;
    case 'game_questions':
      return `${base}\n\nGenerate a True or False game with 10 statements:\n{"statements": [{"id": "s1", "statement": "...", "is_true": true/false, "explanation": "why"}]}`;
    case 'worksheet':
      return `${base}\n\nGenerate a worksheet:\n{"age_group": "${ageGroup}", "subject": "${subjectName}", "topic": "${topicTitle}", "recall_questions": [{"q": "...", "lines": 2}], "apply_questions": [{"q": "...", "lines": 3, "show_working_space": true}], "create_task": {"title": "...", "description": "...", "space_type": "lined", "lines": 10}, "reflect_prompts": ["..."]}`;
    default:
      return `${base}\n\nGenerate content for type "${type}" as a JSON object with appropriate fields.`;
  }
}

function getDemoContent(type: AssetType, topicTitle: string, subjectName: string, ageGroup: string): Record<string, unknown> {
  switch (type) {
    case 'concept_card':
      return {
        tagline: `Understanding ${topicTitle}`,
        hook_question: `What do you already know about ${topicTitle.toLowerCase()}?`,
        definition: `This is a placeholder concept card for ${topicTitle} in ${subjectName}. In production, Claude would generate a clear, age-appropriate explanation.`,
        image_prompt: `Simple flat illustration of ${topicTitle.toLowerCase()}, warm colours, suitable for children`,
      };
    case 'realworld_card':
      return {
        type: 'everyday',
        title: `${topicTitle} in Real Life`,
        description: `Placeholder showing how ${topicTitle.toLowerCase()} connects to everyday life.`,
        scenario: `Imagine you are at the shops and need to use ${topicTitle.toLowerCase()}...`,
      };
    case 'game_questions':
      return {
        statements: [
          { id: 's1', statement: `${topicTitle} is part of ${subjectName}`, is_true: true, explanation: 'This is a demo statement' },
          { id: 's2', statement: 'This is a placeholder question', is_true: false, explanation: 'Generated by demo mode' },
        ],
      };
    default:
      return { placeholder: true, topic: topicTitle, subject: subjectName, age_group: ageGroup };
  }
}
