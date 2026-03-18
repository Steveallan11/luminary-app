import { NextRequest, NextResponse } from 'next/server';

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

    // For now, return mock data. In production, call Claude to generate.
    const mockBriefs: Record<string, any> = {
      'Roman Empire': {
        keyConcepts: ['Roman Republic', 'Julius Caesar', 'Augustus', 'Pax Romana', 'Gladiators', 'Aqueducts'],
        misconceptions: ['Romans invented democracy', 'All Romans were wealthy', 'The Roman Empire lasted forever', 'Romans only fought wars'],
        realWorldExamples: ['Modern government structures inspired by Rome', 'Roman roads still used today', 'Latin in modern languages', 'Roman architecture in cities'],
        curriculumObjectives: [
          'Understand the rise and fall of the Roman Empire',
          'Identify key figures and their contributions',
          'Describe daily life in ancient Rome',
          'Explain the legacy of Rome in modern society',
        ],
      },
      '5 Times Table': {
        keyConcepts: ['Multiplication', 'Groups of 5', 'Skip counting', 'Repeated addition', 'Patterns'],
        misconceptions: ['Multiplication is just repeated addition (it\'s more)', 'The 5 times table only goes to 50', 'You need to memorize it perfectly'],
        realWorldExamples: ['Counting fingers and toes', 'Money (5p coins)', 'Clocks (5-minute intervals)', 'Sports scores'],
        curriculumObjectives: [
          'Recall the 5 times table fluently',
          'Use the 5 times table to solve problems',
          'Understand the relationship between multiplication and division',
          'Apply times tables in real-world contexts',
        ],
      },
      'Angles': {
        keyConcepts: ['Acute angles', 'Obtuse angles', 'Right angles', 'Straight angles', 'Angle measurement', 'Degrees'],
        misconceptions: ['Angles are only in triangles', 'Bigger shapes have bigger angles', 'You can\'t measure angles without a protractor'],
        realWorldExamples: ['Clock hands', 'Building corners', 'Road intersections', 'Ladder leaning against a wall'],
        curriculumObjectives: [
          'Identify and classify different types of angles',
          'Measure angles using a protractor',
          'Understand angle relationships',
          'Apply angle knowledge to solve problems',
        ],
      },
    };

    // Try to find a matching brief, otherwise generate a generic one
    let brief = mockBriefs[topic_title];

    if (!brief) {
      // Generic fallback based on topic
      brief = {
        keyConcepts: [
          `Understanding ${topic_title}`,
          `Key principles of ${topic_title}`,
          `Applications of ${topic_title}`,
          `History of ${topic_title}`,
        ],
        misconceptions: [
          `${topic_title} is too difficult`,
          `${topic_title} is not useful in real life`,
          `There's only one way to approach ${topic_title}`,
        ],
        realWorldExamples: [
          `${topic_title} in everyday life`,
          `Famous examples of ${topic_title}`,
          `How ${topic_title} affects us`,
        ],
        curriculumObjectives: [
          `Understand the fundamentals of ${topic_title}`,
          `Apply ${topic_title} to solve problems`,
          `Recognize ${topic_title} in real-world contexts`,
        ],
      };
    }

    return NextResponse.json({ brief });
  } catch (error) {
    console.error('Auto-brief generation error:', error);
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
