import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Extend Vercel function timeout to 300 seconds for Claude API calls
export const maxDuration = 300;

type AssetType = 'concept_card' | 'realworld_card' | 'game_questions' | 'worksheet' | 'check_questions';

/**
 * POST /api/admin/generate-content
 *
 * Accepts: { topic_id, asset_types[], age_group, key_stage?, linked_lesson_id?, title?, subject_name? }
 * Uses Claude to generate content for each requested asset type.
 * Saves generated assets to topic_assets table in Supabase.
 * Returns: { assets: [], message }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic_id,
      asset_types,
      age_group = '8-11',
      key_stage = 'KS2',
      linked_lesson_id = null,
      title: bodyTitle,
      subject_name: bodySubjectName,
    } = body;

    if (!topic_id || !asset_types || asset_types.length === 0) {
      return NextResponse.json({ error: 'topic_id and asset_types are required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up topic and subject from real Supabase data
    const { data: topicData } = await supabase
      .from('topics')
      .select('id, title, description, key_stage, subjects(name, colour_hex, color)')
      .eq('id', topic_id)
      .single();

    // Use DB data if available, fall back to body params
    const topicTitle = topicData?.title || bodyTitle || 'Unknown Topic';
    const topicDescription = (topicData as any)?.description || '';
    const subjectData = (topicData as any)?.subjects;
    const subjectName = subjectData?.name || bodySubjectName || 'General';
    const subjectColour = subjectData?.colour_hex || subjectData?.color || '#64748b';
    const topicKeyStage = (topicData as any)?.key_stage || key_stage;

    // Call Claude API for each asset type
    const { getAnthropicClient, LUMI_MODEL } = await import('@/lib/anthropic');
    const client = getAnthropicClient();

    const generatedAssets = [];

    for (const type of asset_types) {
      console.log(`[generate-content] Generating ${type} for topic ${topic_id}`);
      const prompt = buildGenerationPrompt(type, topicTitle, topicDescription, subjectName, subjectColour, age_group);

      let contentJson: Record<string, unknown> = {};
      try {
        const response = await client.messages.create({
          model: LUMI_MODEL,
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const cleaned = text
          .replace(/^```(?:json)?\s*/m, '')
          .replace(/\s*```\s*$/m, '')
          .trim();
        contentJson = JSON.parse(cleaned);
      } catch (e: any) {
        console.error(`[generate-content] Failed to generate/parse ${type}:`, e.message);
        contentJson = { error: 'Generation failed', raw: String(e.message) };
      }

      const assetSubtype =
        type === 'game_questions' ? 'true_false' :
        type === 'realworld_card' ? 'everyday' : null;

      generatedAssets.push({
        topic_id,
        asset_type: type,
        asset_subtype: assetSubtype,
        title: `${topicTitle} — ${type.replace(/_/g, ' ')}`,
        content_json: contentJson,
        file_url: null,
        thumbnail_url: null,
        age_group,
        key_stage: topicKeyStage,
        status: 'draft',
        generation_prompt: prompt,
        generated_at: new Date().toISOString(),
        linked_lesson_id: linked_lesson_id || null,
      });
    }

    // Save all generated assets to Supabase
    const { data: savedAssets, error: saveError } = await supabase
      .from('topic_assets')
      .insert(generatedAssets)
      .select();

    if (saveError) {
      console.error('[generate-content] Failed to save assets to Supabase:', saveError);
      return NextResponse.json({
        assets: generatedAssets,
        message: `Generated ${generatedAssets.length} assets (save failed: ${saveError.message})`,
        save_error: saveError.message,
      });
    }

    console.log(`[generate-content] Saved ${savedAssets?.length || 0} assets to Supabase`);

    return NextResponse.json({
      assets: savedAssets || generatedAssets,
      message: `Generated and saved ${savedAssets?.length || generatedAssets.length} assets successfully`,
    });

  } catch (error: any) {
    console.error('[generate-content] Error:', error);
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
- Topic: ${topicTitle}${topicDescription ? `\n- Description: ${topicDescription}` : ''}
- Age group: ${ageGroup}
- UK National Curriculum aligned
Return ONLY valid JSON (no markdown, no code fences, no explanation).`;

  switch (type) {
    case 'concept_card':
      return `${base}

Generate a concept card with this exact JSON structure:
{"title": "topic title", "icon": "single relevant emoji", "subtitle": "short catchy tagline (max 8 words)", "body": "clear age-appropriate explanation in 2-3 sentences", "key_facts": ["fact 1", "fact 2", "fact 3"], "image_prompt": "description for an illustration suitable for children"}`;

    case 'realworld_card':
      return `${base}

Generate a real-world connection card:
{"everyday": {"title": "catchy title", "description": "how this topic appears in daily life (2-3 sentences)", "scenario": "specific relatable scenario a child would recognise", "image_prompt": "illustration description"}, "inspiring": {"title": "inspiring application title", "description": "an amazing professional or scientific application (2-3 sentences)", "image_prompt": "illustration description"}}`;

    case 'game_questions':
      return `${base}

Generate a True or False game with exactly 10 statements:
{"game_type": "true_false", "title": "${topicTitle} True or False", "instructions": "Is each statement true or false?", "statements": [{"id": "s1", "statement": "...", "is_true": true, "explanation": "brief why"}, {"id": "s2", "statement": "...", "is_true": false, "explanation": "brief why"}, {"id": "s3", "statement": "...", "is_true": true, "explanation": "brief why"}, {"id": "s4", "statement": "...", "is_true": false, "explanation": "brief why"}, {"id": "s5", "statement": "...", "is_true": true, "explanation": "brief why"}, {"id": "s6", "statement": "...", "is_true": false, "explanation": "brief why"}, {"id": "s7", "statement": "...", "is_true": true, "explanation": "brief why"}, {"id": "s8", "statement": "...", "is_true": false, "explanation": "brief why"}, {"id": "s9", "statement": "...", "is_true": true, "explanation": "brief why"}, {"id": "s10", "statement": "...", "is_true": false, "explanation": "brief why"}]}`;

    case 'worksheet':
      return `${base}

Generate a printable worksheet:
{"title": "${topicTitle} Worksheet", "age_group": "${ageGroup}", "subject": "${subjectName}", "topic": "${topicTitle}", "recall_questions": [{"q": "...", "lines": 2}, {"q": "...", "lines": 2}, {"q": "...", "lines": 2}], "apply_questions": [{"q": "...", "lines": 3, "show_working_space": true}, {"q": "...", "lines": 3, "show_working_space": true}], "create_task": {"title": "creative task title", "description": "task description", "space_type": "lined", "lines": 8}, "reflect_prompts": ["What was the most interesting thing you learned?", "How could you use this in real life?"]}`;

    case 'check_questions':
      return `${base}

Generate 5 assessment questions:
{"questions": [{"id": "q1", "question": "...", "type": "short_answer", "expected_answer": "model answer", "marks": 1, "hints": ["hint if stuck"]}, {"id": "q2", "question": "...", "type": "short_answer", "expected_answer": "model answer", "marks": 1, "hints": ["hint"]}, {"id": "q3", "question": "...", "type": "short_answer", "expected_answer": "model answer", "marks": 2, "hints": ["hint"]}, {"id": "q4", "question": "...", "type": "short_answer", "expected_answer": "model answer", "marks": 2, "hints": ["hint"]}, {"id": "q5", "question": "...", "type": "short_answer", "expected_answer": "model answer", "marks": 3, "hints": ["hint"]}]}`;

    default:
      return `${base}\n\nGenerate appropriate content for type "${type}" as a JSON object.`;
  }
}
