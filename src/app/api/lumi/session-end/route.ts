import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, LUMI_MODEL, LUMI_SUMMARY_MAX_TOKENS } from '@/lib/anthropic';
import { getSupabaseServiceClient } from '@/lib/supabase-service';
import { generateSummaryPrompt } from '@/lib/lumi-prompt';
import {
  buildChildStatsUpdate,
  buildSessionUpdate,
  getChildActiveDate,
  getChildXpTotal,
  getErrorMessage,
  getErrorResponseStatus,
  getLiveLearnerContext,
} from '@/lib/live-lesson-data';
import { calculateSessionXP, clampMastery } from '@/lib/mastery';

interface SessionEndRequest {
  child_id: string;
  topic_id: string;
  topic_title: string;
  session_id: string;
  message_count: number;
  mastery_score: number;
  child_name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SessionEndRequest = await request.json();
    const { child_id, topic_id, topic_title, session_id, message_count, mastery_score, child_name } = body;

    if (!child_id || !topic_id || !topic_title || !session_id) {
      return NextResponse.json(
        { error: 'child_id, topic_id, topic_title and session_id are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    const context = await getLiveLearnerContext({
      childId: child_id,
      topicId: topic_id,
      sessionId: session_id,
    });
    const name = child_name || context.child.name;
    const xpEarned = calculateSessionXP(message_count, true);
    const finalMastery = clampMastery(mastery_score + 15);

    let summaryText = `Explored ${topic_title} with Lumi`;
    if (process.env.ANTHROPIC_API_KEY) {
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

        const firstBlock = summaryResponse.content[0];
        if (firstBlock?.type === 'text') {
          summaryText = firstBlock.text;
        }
      } catch (error) {
        console.error('Summary generation failed, using fallback:', error);
      }
    }

    const topicStatus = finalMastery >= 70 ? 'completed' : 'in_progress';
    const endedAt = new Date().toISOString();
    const today = endedAt.slice(0, 10);
    const lastDate = getChildActiveDate(context.child)?.slice(0, 10) ?? null;
    let newStreak = context.child.streak_days ?? 0;

    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      newStreak = lastDate === yesterday ? (context.child.streak_days ?? 0) + 1 : 1;
    }

    const durationMinutes = Math.max(1, Math.round(message_count / 2));

    const sessionUpdate = buildSessionUpdate(context.session!, {
      endedAt,
      xpEarned,
      summaryText,
      masteryScore: finalMastery,
      durationMinutes,
    });

    const { error: sessionError } = await supabase
      .from('lesson_sessions')
      .update(sessionUpdate)
      .eq('id', context.session!.id);

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    const progressPayload: Record<string, unknown> = {
      child_id,
      topic_id,
      status: topicStatus,
      mastery_score: finalMastery,
    };
    if (topicStatus === 'completed') {
      progressPayload.completed_at = endedAt;
    }

    let { error: progressError } = await supabase
      .from('child_topic_progress')
      .upsert(progressPayload, { onConflict: 'child_id,topic_id' });

    if (progressError?.message?.includes('mastery_score')) {
      const fallbackPayload = { ...progressPayload };
      delete fallbackPayload.mastery_score;

      const retry = await supabase
        .from('child_topic_progress')
        .upsert(fallbackPayload, { onConflict: 'child_id,topic_id' });

      progressError = retry.error;
    }

    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    const childUpdate = buildChildStatsUpdate(context.child, xpEarned, endedAt, newStreak);
    const { error: childError } = await supabase
      .from('children')
      .update(childUpdate)
      .eq('id', context.child.id);

    if (childError) {
      return NextResponse.json({ error: childError.message }, { status: 500 });
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
        xp_total: getChildXpTotal(context.child) + xpEarned,
        streak_days: newStreak,
        streak_last_date: today,
      },
    });
  } catch (error) {
    console.error('Session end error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal server error') },
      { status: getErrorResponseStatus(error) }
    );
  }
}
