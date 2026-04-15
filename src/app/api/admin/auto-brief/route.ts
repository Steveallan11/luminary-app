import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, LUMI_FAST_MODEL } from '@/lib/anthropic';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type LessonBrief = {
  keyConcepts: string[];
  misconceptions: string[];
  realWorldExamples: string[];
  curriculumObjectives: string[];
};

function extractJsonObject(text: string): string {
  const cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```$/im, '')
    .trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('No JSON object found in model response');
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function ensureStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function buildFallbackBrief(topicTitle: string, subjectName: string, ageGroup: string): LessonBrief {
  return {
    keyConcepts: [
      `${topicTitle} basics`,
      `Important vocabulary in ${subjectName}`,
      `How ${topicTitle} works in simple steps`,
    ],
    misconceptions: [
      `Common mix-ups children may have about ${topicTitle}`,
      `Over-simplified ideas that need correcting`,
    ],
    realWorldExamples: [
      `${topicTitle} in everyday life`,
      `${topicTitle} in school, home, or nature`,
    ],
    curriculumObjectives: [
      `Explain the main idea of ${topicTitle} in an age-appropriate way`,
      `Use key ${subjectName} vocabulary confidently`,
      `Apply learning about ${topicTitle} to a simple example for ages ${ageGroup}`,
    ],
  };
}

function parseBrief(text: string, topicTitle: string, subjectName: string, ageGroup: string): LessonBrief {
  const parsed = JSON.parse(extractJsonObject(text)) as Partial<LessonBrief>;
  const fallback = buildFallbackBrief(topicTitle, subjectName, ageGroup);

  return {
    keyConcepts: ensureStringArray(parsed.keyConcepts, fallback.keyConcepts),
    misconceptions: ensureStringArray(parsed.misconceptions, fallback.misconceptions),
    realWorldExamples: ensureStringArray(parsed.realWorldExamples, fallback.realWorldExamples),
    curriculumObjectives: ensureStringArray(parsed.curriculumObjectives, fallback.curriculumObjectives),
  };
}

/**
 * POST /api/admin/auto-brief
 *
 * Auto-generates a lesson brief from a topic title using Claude.
 * Returns suggested key concepts, misconceptions, real-world examples, and curriculum objectives.
 */
export async function POST(request: NextRequest) {
  let topicTitle = '';
  let resolvedSubject = 'General';
  let resolvedAgeGroup = '8-11';

  try {
    const body = await request.json();
    const { topic_title, subject_name, age_group } = body;
    topicTitle = topic_title || '';
    resolvedSubject = subject_name || 'General';
    resolvedAgeGroup = age_group || '8-11';

    if (!topicTitle) {
      return NextResponse.json({ error: 'topic_title is required' }, { status: 400 });
    }

    const client = getAnthropicClient();
    const prompt = `You are a curriculum expert for Luminary, a UK homeschooling platform.
Generate a lesson brief for the following topic:
- Topic: ${topicTitle}
- Subject: ${resolvedSubject}
- Age Group: ${resolvedAgeGroup}

Return ONLY valid JSON with this structure:
{
  "keyConcepts": ["string", "string", ...],
  "misconceptions": ["string", "string", ...],
  "realWorldExamples": ["string", "string", ...],
  "curriculumObjectives": ["string", "string", ...]
}

Ensure the content is age-appropriate and follows the UK National Curriculum standards.
Return ONLY the JSON object, no markdown formatting, no code fences.`;

    let text = '';
    let parseError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await client.messages.create({
        model: LUMI_FAST_MODEL,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: attempt === 0
              ? prompt
              : `${prompt}\n\nYour previous answer was not valid JSON. Reply again with a single JSON object only.`,
          },
        ],
      });

      text = response.content[0]?.type === 'text' ? response.content[0].text : '';

      try {
        const brief = parseBrief(text, topicTitle, resolvedSubject, resolvedAgeGroup);
        return NextResponse.json({ brief });
      } catch (error) {
        parseError = error instanceof Error ? error : new Error('Unknown parse error');
      }
    }

    console.error('Auto-brief parse failed after retry:', {
      error: parseError?.message,
      preview: text.slice(0, 500),
    });

    const brief = buildFallbackBrief(topicTitle, resolvedSubject, resolvedAgeGroup);
    return NextResponse.json({ brief });
  } catch (error) {
    console.error('Auto-brief generation error:', error);
    if (!topicTitle) {
      return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
    }

    const brief = buildFallbackBrief(topicTitle, resolvedSubject, resolvedAgeGroup);
    return NextResponse.json({
      brief,
      warning: 'Generated fallback brief because the AI request failed.',
    });
  }
}
