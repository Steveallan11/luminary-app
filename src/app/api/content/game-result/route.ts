import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/content/game-result
 * 
 * Records a game result and updates the child's mastery score.
 * Accepts: { child_id, topic_id, game_type, score, max_score, time_spent_seconds, answers }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { child_id, topic_id, game_type, score, max_score, time_spent_seconds, answers } = body;

    if (!child_id || !topic_id || !game_type || score === undefined || !max_score) {
      return NextResponse.json(
        { error: 'child_id, topic_id, game_type, score, and max_score are required' },
        { status: 400 }
      );
    }

    const percentage = Math.round((score / max_score) * 100);

    // Calculate XP earned from game
    let xpEarned = 0;
    if (percentage >= 90) xpEarned = 25;
    else if (percentage >= 70) xpEarned = 15;
    else if (percentage >= 50) xpEarned = 10;
    else xpEarned = 5;

    // In production, save to Supabase:
    // 1. Insert into game_results table
    // 2. Update topic_progress mastery score
    // 3. Add XP to child profile
    // 4. Check for achievement unlocks

    return NextResponse.json({
      success: true,
      result: {
        child_id,
        topic_id,
        game_type,
        score,
        max_score,
        percentage,
        xp_earned: xpEarned,
        time_spent_seconds,
        feedback: getFeedback(percentage),
      },
    });
  } catch (error: any) {
    console.error('Game result error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record result' }, { status: 500 });
  }
}

function getFeedback(percentage: number): string {
  if (percentage >= 90) return 'Outstanding! You really know your stuff!';
  if (percentage >= 70) return 'Great job! You\'re getting really good at this!';
  if (percentage >= 50) return 'Good effort! Keep practising and you\'ll master this!';
  return 'Nice try! Let\'s review this topic together and try again.';
}
