import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, LUMI_MODEL, LUMI_SUMMARY_MAX_TOKENS } from '@/lib/anthropic';
import { generateSummaryPrompt } from '@/lib/lumi-prompt';
import { calculateSessionXP, clampMastery } from '@/lib/mastery';
import { MOCK_CHILD } from '@/lib/mock-data';

interface SessionEndRequest {
  child_id: string;
  topic_id: string;
  topic_title: string;
  session_id: string;
  message_count: number;
  mastery_score: number;
  child_name?: string;
}

/**
 * POST /api/lumi/session-end
 *
 * Generates a session summary using Claude, calculates XP,
 * and returns updated child stats.
 * In production, this would also update Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const body: SessionEndRequest = await request.json();
    const { child_id, topic_title, session_id, message_count, mastery_score, child_name } = body;

    const child = MOCK_CHILD;
    const name = child_name || child.name;

    // Calculate XP
    const xpEarned = calculateSessionXP(message_count, true);
    const finalMastery = clampMastery(mastery_score + 15); // +15 for session completion

    // Generate session summary using Claude
    let summaryText = `Explored ${topic_title} with Lumi`;
    try {
      const client = getAnthropicClient();
      const summaryResponse = await client.messages.create({
        model: LUMI_MODEL,
        max_tokens: LUMI_SUMMARY_MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: generateSummaryPrompt(name, topic_title, message_count),
          },
        ],
      });

      if (summaryResponse.content[0]?.type === 'text') {
        summaryText = summaryResponse.content[0].text;
      }
    } catch (err) {
      console.error('Summary generation failed, using fallback:', err);
    }

    // Determine topic status
    const topicStatus = finalMastery >= 70 ? 'completed' : 'in_progress';

    // In production, update Supabase here:
    // - lesson_sessions: insert record
    // - child_topic_progress: update mastery_score and status
    // - children: update xp_total, streak_days, streak_last_date

    // Calculate streak (simplified for MVP)
    const today = new Date().toISOString().split('T')[0];
    const lastDate = child.streak_last_date;
    let newStreak = child.streak_days;
    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      newStreak = lastDate === yesterday ? child.streak_days + 1 : 1;
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session_id,
        xp_earned: xpEarned,
        summary_text: summaryText,
        mastery_score: finalMastery,
        topic_status: topicStatus,
      },
      child: {
        xp_total: child.xp_total + xpEarned,
        streak_days: newStreak,
        streak_last_date: today,
      },
    });
  } catch (error) {
    console.error('Session end error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
