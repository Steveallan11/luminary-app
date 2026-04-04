import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { getServerSupabaseUrl } from '@/lib/server-env';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const LUMI_MODEL = 'claude-opus-4-6';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lesson_id, instruction, target_phase, current_lesson } = body;

    if (!lesson_id || !instruction || !current_lesson) {
      return NextResponse.json({ error: 'lesson_id, instruction, and current_lesson are required' }, { status: 400 });
    }

    const supabase = createClient(getServerSupabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const topicTitle = current_lesson.topics?.title || 'Unknown Topic';
    const subjectName = current_lesson.topics?.subjects?.name || 'General';
    const ageGroup = current_lesson.age_group || '8-11';
    const keyStage = current_lesson.key_stage || 'KS2';

    // Build the phase data to refine
    const phaseKey = target_phase ? `${target_phase}_json` : null;
    const currentPhaseData = phaseKey ? current_lesson[phaseKey] : null;

    // Determine which phases to update
    const phasesToUpdate = target_phase
      ? [target_phase]
      : ['spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate'];

    const updatedPhases: Record<string, any> = {};

    for (const phase of phasesToUpdate) {
      const phaseData = current_lesson[`${phase}_json`];
      if (!phaseData) continue;

      const prompt = `You are an expert curriculum designer for Luminary, a UK AI homeschooling platform.

TASK: Refine the following lesson phase based on the admin's instruction.

LESSON CONTEXT:
- Topic: ${topicTitle}
- Subject: ${subjectName}
- Age Group: ${ageGroup} (${keyStage})
- Phase: ${phase.toUpperCase()}

ADMIN INSTRUCTION: "${instruction}"

CURRENT PHASE DATA:
${JSON.stringify(phaseData, null, 2)}

INSTRUCTIONS:
1. Apply the admin's instruction to improve this phase
2. Keep the same JSON structure — only update the content
3. Maintain age-appropriate language for ${ageGroup} year olds
4. Keep all existing fields, just update their values
5. If the instruction doesn't apply to this specific phase, return the original unchanged
6. Return ONLY valid JSON, no markdown, no explanation

Return the updated phase JSON:`;

      const response = await client.messages.create({
        model: LUMI_MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      try {
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          updatedPhases[`${phase}_json`] = JSON.parse(jsonMatch[0]);
        } else {
          updatedPhases[`${phase}_json`] = phaseData; // Keep original if parse fails
        }
      } catch {
        updatedPhases[`${phase}_json`] = phaseData; // Keep original if parse fails
      }
    }

    // Save updated phases to Supabase
    const { data: updatedLesson, error: updateError } = await supabase
      .from('topic_lesson_structures')
      .update(updatedPhases)
      .eq('id', lesson_id)
      .select('*, topics(title, description, subjects(name, colour_hex, color))')
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Generate a summary of what changed
    const phasesUpdated = Object.keys(updatedPhases).map(k => k.replace('_json', '')).join(', ');
    const summary = `Updated ${phasesUpdated} phase${phasesUpdated.includes(',') ? 's' : ''} based on: "${instruction}"`;

    return NextResponse.json({
      success: true,
      updated_lesson: updatedLesson,
      summary,
      phases_updated: Object.keys(updatedPhases),
    });

  } catch (error: any) {
    console.error('Refine lesson error:', error);
    return NextResponse.json({ error: error.message || 'Refinement failed' }, { status: 500 });
  }
}
