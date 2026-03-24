/**
 * Lesson Generator — Claude-powered lesson structure creation
 *
 * Takes an admin topic brief and generates a complete 7-phase lesson
 * structure using Claude. This is the core of the pre-generation pipeline.
 */

import { getAnthropicClient, LUMI_MODEL } from '@/lib/anthropic';

export interface TopicBrief {
  topic_id: string;
  title: string;
  subject_name: string;
  key_stage: string;
  age_group: '5-7' | '8-11' | '12-14' | '15-16';
  estimated_minutes?: number;
  key_concepts: string[];
  common_misconceptions: string[];
  real_world_examples: string[];
  curriculum_objectives: string[];
}

export interface GeneratedPhaseJson {
  phase_goal: string;
  opening_question?: string;
  teaching_points: string[];
  questions: { question: string; expected_answer: string; hints: string[] }[];
  transition_to_next: string;
}

export interface GeneratedGameContent {
  game_type: 'match_it' | 'true_false' | 'fill_it' | 'sort_it' | 'quick_fire';
  title: string;
  questions: Record<string, unknown>[];
}

export interface GeneratedLessonStructure {
  spark_json: GeneratedPhaseJson;
  explore_json: GeneratedPhaseJson;
  anchor_json: GeneratedPhaseJson;
  practise_json: GeneratedPhaseJson;
  create_json: GeneratedPhaseJson;
  check_json: GeneratedPhaseJson;
  celebrate_json: GeneratedPhaseJson;
  game_type: string;
  game_content: GeneratedGameContent;
  concept_card_json: {
    title: string;
    icon: string;
    subtitle: string;
    body: string;
  };
  realworld_json: {
    everyday: { title: string; description: string };
    inspiring: { title: string; description: string };
  };
}

function buildGenerationPrompt(brief: TopicBrief): string {
  return `You are a curriculum designer for Luminary, a UK homeschooling platform. Generate a complete 7-phase lesson structure for the following topic.

TOPIC BRIEF:
- Title: ${brief.title}
- Subject: ${brief.subject_name}
- Key Stage: ${brief.key_stage}
- Age Group: ${brief.age_group}
- Key Concepts: ${brief.key_concepts.join(', ')}
- Common Misconceptions: ${brief.common_misconceptions.join(', ')}
- Real-World Examples: ${brief.real_world_examples.join(', ')}
- Curriculum Objectives: ${brief.curriculum_objectives.join(', ')}

THE 7 PHASES (Luminary's lesson framework):
1. SPARK — Hook the child's curiosity. One dramatic opening question or scenario.
2. EXPLORE — Teach the core concepts. Use analogies, examples, and visuals.
3. ANCHOR — Child explains it back in their own words. Tests genuine understanding.
4. PRACTISE — Structured practice questions with scaffolded difficulty.
5. CREATE — Creative application task (diary entry, design, story, etc.).
6. CHECK — Final assessment questions to measure mastery.
7. CELEBRATE — Celebrate achievement, fun fact, preview next topic.

AGE CALIBRATION for ${brief.age_group}:
${brief.age_group === '5-7' ? 'Very simple language, short sentences, lots of emojis, picture-book style.' : ''}
${brief.age_group === '8-11' ? 'Enthusiastic, varied sentences, introduce vocabulary naturally, creative analogies.' : ''}
${brief.age_group === '12-14' ? 'Rich vocabulary, subject terminology, intellectual curiosity, debates welcome.' : ''}
${brief.age_group === '15-16' ? 'Near-adult vocabulary, rigorous but warm, nuance and complexity.' : ''}

GAME TYPE: Choose the most appropriate game type for this topic:
- match_it: Matching pairs (good for vocabulary, definitions, dates)
- true_false: True or False statements (good for misconceptions, facts)
- fill_it: Fill in the blanks (good for formulas, sentences, sequences)
- sort_it: Categorise items into groups (good for classification)
- quick_fire: Rapid-fire multiple choice (good for recall, times tables)

Return ONLY valid JSON with this exact structure:
{
  "spark_json": {
    "phase_goal": "string",
    "opening_question": "string",
    "teaching_points": ["string"],
    "questions": [{"question": "string", "expected_answer": "string", "hints": ["string"]}],
    "transition_to_next": "string"
  },
  "explore_json": { same structure },
  "anchor_json": { same structure },
  "practise_json": {
    "phase_goal": "string",
    "teaching_points": ["string"],
    "questions": [
      {"question": "string", "expected_answer": "string", "hints": ["string"]},
      {"question": "string", "expected_answer": "string", "hints": ["string"]},
      {"question": "string", "expected_answer": "string", "hints": ["string"]}
    ],
    "transition_to_next": "string"
  },
  "create_json": { same structure — the question should be a creative task },
  "check_json": {
    "phase_goal": "string",
    "teaching_points": [],
    "questions": [
      {"question": "string", "expected_answer": "string", "hints": ["string"]},
      {"question": "string", "expected_answer": "string", "hints": ["string"]},
      {"question": "string", "expected_answer": "string", "hints": ["string"]}
    ],
    "transition_to_next": "string"
  },
  "celebrate_json": {
    "phase_goal": "string",
    "teaching_points": ["fun fact about the topic"],
    "questions": [],
    "transition_to_next": "string"
  },
  "game_type": "match_it | true_false | fill_it | sort_it | quick_fire",
  "game_content": {
    "game_type": "same as above",
    "title": "string",
    "questions": [ game-type-specific question objects ]
  },
  "concept_card_json": {
    "title": "string",
    "icon": "single emoji",
    "subtitle": "short tagline",
    "body": "2-3 sentence overview of the topic"
  },
  "realworld_json": {
    "everyday": {"title": "string", "description": "how this topic appears in daily life"},
    "inspiring": {"title": "string", "description": "an amazing real-world application"}
  }
}

IMPORTANT:
- Every phase MUST have at least one question except celebrate_json.
- Questions must be age-appropriate and progressively harder.
- The game must have at least 6 items/questions.
- All content must be factually accurate for the UK National Curriculum.
- Return ONLY the JSON object, no markdown formatting, no code fences.`;
}

export async function generateLessonStructure(
  brief: TopicBrief
): Promise<GeneratedLessonStructure> {
  let text = '';
  
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: LUMI_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: buildGenerationPrompt(brief),
      },
    ],
  });
  text = response.content[0]?.type === 'text' ? response.content[0].text : '';

  // Strip any markdown code fences if present
  console.log(`[lesson-generator] Raw Claude response text: ${text.substring(0, 500)}...`); // Log first 500 chars
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as GeneratedLessonStructure;
    return parsed;
  } catch (err) {
    console.error(`[lesson-generator] Failed to parse JSON. Raw cleaned text: ${cleaned.substring(0, 1000)}...`); // Log first 1000 chars of problematic JSON
    throw new Error(
      `Failed to parse generated lesson structure: ${err instanceof Error ? err.message : 'Unknown error'}. Problematic text logged.`
    );
  }
}

/**
 * Calculate a quality score for a generated lesson structure.
 * Returns 0-100 based on completeness and content richness.
 */
export function scoreLessonQuality(structure: GeneratedLessonStructure): number {
  let score = 0;
  const phases = [
    structure.spark_json,
    structure.explore_json,
    structure.anchor_json,
    structure.practise_json,
    structure.create_json,
    structure.check_json,
    structure.celebrate_json,
  ];

  // Each phase present and has goal: +10 each = 70
  for (const phase of phases) {
    if (phase?.phase_goal) score += 5;
    if (phase?.teaching_points?.length > 0) score += 3;
    if (phase?.questions?.length > 0) score += 2;
  }

  // Game content present and has questions: +10
  if (structure.game_content?.questions?.length >= 4) score += 10;

  // Concept card present: +5
  if (structure.concept_card_json?.title) score += 5;

  // Real-world examples: +5
  if (structure.realworld_json?.everyday?.title) score += 3;
  if (structure.realworld_json?.inspiring?.title) score += 2;

  // Check questions have hints: +5
  const checkQs = structure.check_json?.questions ?? [];
  if (checkQs.every((q) => q.hints?.length > 0)) score += 5;

  // Practise has 3+ questions: +5
  const practiseQs = structure.practise_json?.questions ?? [];
  if (practiseQs.length >= 3) score += 5;

  return Math.min(100, score);
}
