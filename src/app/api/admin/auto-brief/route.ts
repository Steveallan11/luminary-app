import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, LUMI_MODEL } from '@/lib/anthropic';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/auto-brief
 *
 * Auto-generates a lesson brief from a topic title using Claude.
 * Returns suggested key concepts, misconceptions, real-world examples, and curriculum objectives.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic_title, subject_name, age_group } = body;

    if (!topic_title) {
      return NextResponse.json({ error: 'topic_title is required' }, { status: 400 });
    }

    const client = getAnthropicClient();
    const prompt = `You are a curriculum expert for Luminary, a UK homeschooling platform.
Generate a lesson brief for the following topic:
- Topic: ${topic_title}
- Subject: ${subject_name || 'General'}
- Age Group: ${age_group || '8-11'}

Return ONLY valid JSON with this structure:
{
  "keyConcepts": ["string", "string", ...],
  "misconceptions": ["string", "string", ...],
  "realWorldExamples": ["string", "string", ...],
  "curriculumObjectives": ["string", "string", ...]
}

Ensure the content is age-appropriate and follows the UK National Curriculum standards.
Return ONLY the JSON object, no markdown formatting, no code fences.`;

    const response = await client.messages.create({
      model: LUMI_MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const cleaned = text
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```\s*$/m, '')
      .trim();

    const brief = JSON.parse(cleaned);
    return NextResponse.json({ brief });
  } catch (error) {
    console.error('Auto-brief generation error:', error);
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
