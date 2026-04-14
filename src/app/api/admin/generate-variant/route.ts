import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAnthropicClient, LUMI_MODEL } from '@/lib/anthropic';
import { getServerSupabaseUrl } from '@/lib/server-env';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
type LessonLength = 'full' | 'standard' | 'bite_size';

const LEARNING_STYLE_INSTRUCTIONS: Record<LearningStyle, string> = {
  visual: `Adapt this lesson for VISUAL learners:
- Emphasise diagrams, charts, mind maps, colour-coding, and imagery
- Add visual metaphors and spatial descriptions
- Include "imagine you can see..." language
- Suggest drawing activities and visual note-taking
- Reference colours, shapes, patterns, and visual organisation`,

  auditory: `Adapt this lesson for AUDITORY learners:
- Emphasise verbal explanations, discussion, and storytelling
- Add rhythm, rhyme, and mnemonics where helpful
- Include "listen to this..." and "say it out loud..." prompts
- Suggest verbal repetition and discussion activities
- Use narrative flow and conversational language`,

  kinesthetic: `Adapt this lesson for KINESTHETIC learners:
- Emphasise hands-on activities, movement, and physical interaction
- Add "try this..." and "do this with your hands..." prompts
- Include building, sorting, and physical demonstration activities
- Connect concepts to physical sensations and real-world doing
- Suggest movement breaks and tactile learning activities`,

  reading_writing: `Adapt this lesson for READING/WRITING learners:
- Emphasise written notes, lists, definitions, and structured text
- Add "write this down..." and "make a list..." prompts
- Include vocabulary definitions and written summaries
- Suggest note-taking frameworks and written reflection activities
- Use precise, structured language with clear headings and bullet points`,
};

const LESSON_LENGTH_INSTRUCTIONS: Record<LessonLength, string> = {
  full: `Create a FULL lesson (45-60 minutes) with ALL 7 phases:
- spark, explore, anchor, practise, create, check, celebrate
- Each phase should be rich and detailed
- Include multiple questions, activities, and teaching points per phase
- Allow for deep exploration and extended practice`,

  standard: `Create a STANDARD lesson (25-35 minutes) with core phases:
- Include all 7 phases but keep each concise
- 2-3 questions per phase maximum
- Focus on the most important teaching points
- Balanced depth without overwhelming detail`,

  bite_size: `Create a BITE-SIZE lesson (8-12 minutes) for on-the-go learning:
- Include only: spark (hook), anchor (key concept), check (quick quiz), celebrate (reward)
- Skip explore, practise, and create phases
- Maximum 1-2 questions per phase
- Focus on ONE key concept only
- Perfect for revision or quick learning on mobile
- Keep all content extremely concise and punchy`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lesson_id,
      learning_style,
      lesson_length,
      topic_title,
      subject_name,
      age_group,
      key_stage,
      base_lesson,
    } = body;

    if (!lesson_id || !learning_style || !lesson_length || !base_lesson) {
      return NextResponse.json(
        { error: 'lesson_id, learning_style, lesson_length, and base_lesson are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(getServerSupabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const client = getAnthropicClient();

    // Determine which phases to generate based on lesson length
    const phasesToGenerate = lesson_length === 'bite_size'
      ? ['spark', 'anchor', 'check', 'celebrate']
      : ['spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate'];

    const styleInstruction = LEARNING_STYLE_INSTRUCTIONS[learning_style as LearningStyle];
    const lengthInstruction = LESSON_LENGTH_INSTRUCTIONS[lesson_length as LessonLength];

    const prompt = `You are an expert curriculum designer for Luminary, a UK AI homeschooling platform.

TASK: Create an adapted lesson variant for a specific learning style and lesson length.

LESSON CONTEXT:
- Topic: ${topic_title}
- Subject: ${subject_name}
- Age Group: ${age_group} (${key_stage})
- Learning Style: ${learning_style.toUpperCase()}
- Lesson Length: ${lesson_length.toUpperCase()}

BASE LESSON (adapt this):
${JSON.stringify({
  spark: base_lesson.spark_json,
  explore: base_lesson.explore_json,
  anchor: base_lesson.anchor_json,
  practise: base_lesson.practise_json,
  create: base_lesson.create_json,
  check: base_lesson.check_json,
  celebrate: base_lesson.celebrate_json,
}, null, 2)}

LEARNING STYLE ADAPTATION:
${styleInstruction}

LESSON LENGTH ADAPTATION:
${lengthInstruction}

PHASES TO GENERATE: ${phasesToGenerate.join(', ')}

For each phase, generate a JSON object with these fields:
{
  "phase_goal": "string - what the learner achieves in this phase",
  "opening_question": "string - the opening question to kick off this phase",
  "teaching_points": ["array of key teaching points"],
  "questions": [
    {
      "question": "string",
      "expected_answer": "string",
      "hint": "string"
    }
  ],
  "activities": ["array of activities adapted for the learning style"],
  "lumi_notes": "string - notes for Lumi on how to deliver this phase for this learning style",
  "closing_summary": "string - brief summary to close the phase"
}

Return a JSON object with keys: ${phasesToGenerate.map(p => `"${p}"`).join(', ')}
Return ONLY valid JSON, no markdown, no explanation.`;

    const response = await client.messages.create({
      model: LUMI_MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse the generated phases
    let generatedPhases: Record<string, any> = {};
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      const parsed = JSON.parse(jsonMatch[0]);

      for (const phase of phasesToGenerate) {
        if (parsed[phase]) {
          generatedPhases[`${phase}_json`] = parsed[phase];
        }
      }
    } catch (parseError: any) {
      console.error('Parse error:', parseError, 'Response:', responseText.substring(0, 500));
      return NextResponse.json({ error: 'Failed to parse generated variant' }, { status: 500 });
    }

    // For bite-size, set null for skipped phases
    if (lesson_length === 'bite_size') {
      for (const phase of ['explore', 'practise', 'create']) {
        generatedPhases[`${phase}_json`] = null;
      }
    }

    // Save as a new variant in topic_lesson_structures
    // Use version 2+ to avoid conflict with the base lesson
    const { data: existingVariants } = await supabase
      .from('topic_lesson_structures')
      .select('version')
      .eq('topic_id', base_lesson.topic_id)
      .eq('age_group', age_group)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingVariants && existingVariants.length > 0
      ? (existingVariants[0].version || 1) + 1
      : 2;

    const { data: newVariant, error: insertError } = await supabase
      .from('topic_lesson_structures')
      .insert({
        topic_id: base_lesson.topic_id,
        age_group,
        key_stage,
        version: nextVersion,
        status: 'generating',
        generation_model: LUMI_MODEL,
        ...generatedPhases,
        personalisation_hooks: JSON.stringify({
          learning_style,
          lesson_length,
          variant_of: lesson_id,
          generated_at: new Date().toISOString(),
        }),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      variant_id: newVariant.id,
      message: `${learning_style} / ${lesson_length} variant created successfully! Version ${nextVersion} saved to the Library.`,
      phases_generated: phasesToGenerate,
    });

  } catch (error: any) {
    console.error('Generate variant error:', error);
    return NextResponse.json({ error: error.message || 'Variant generation failed' }, { status: 500 });
  }
}
