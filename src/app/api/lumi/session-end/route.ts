import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, LUMI_MODEL, LUMI_SUMMARY_MAX_TOKENS } from '@/lib/anthropic';
import { generateSummaryPrompt } from '@/lib/lumi-prompt';
import { calculateSessionXP, clampMastery } from '@/lib/mastery';
import { MOCK_CHILD } from '@/lib/mock-data';
import { createClient } from '@supabase/supabase-js';

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

    // Calculate streak
    const today = new Date().toISOString().split('T')[0];
    let newStreak = 1;
    let currentXpTotal = 0;

    // Update Supabase if we have service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey && child_id) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get current child data
        const { data: currentChild } = await supabase
          .from('children')
          .select('xp_total, streak_days, streak_last_date, xp')
          .eq('id', child_id)
          .single();

        if (currentChild) {
          currentXpTotal = currentChild.xp_total || currentChild.xp || 0;
          const lastDate = currentChild.streak_last_date;
          if (lastDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            newStreak = lastDate === yesterday ? (currentChild.streak_days || 0) + 1 : 1;
          } else {
            newStreak = currentChild.streak_days || 1;
          }
        }

        // Update lesson session
        await supabase
          .from('lesson_sessions')
          .update({
            xp_earned: xpEarned,
            final_mastery_score: finalMastery,
            summary_text: summaryText,
            final_phase_reached: 'celebrate',
            session_duration_mins: Math.floor(message_count / 2),
          })
          .eq('id', session_id);

        // Update or insert child_topic_progress
        const { data: existingProgress } = await supabase
          .from('child_topic_progress')
          .select('id, best_mastery_score, attempts_count')
          .eq('child_id', child_id)
          .eq('topic_id', body.topic_id)
          .single();

        if (existingProgress) {
          await supabase
            .from('child_topic_progress')
            .update({
              mastery_score: finalMastery,
              best_mastery_score: Math.max(existingProgress.best_mastery_score || 0, finalMastery),
              attempts_count: (existingProgress.attempts_count || 0) + 1,
              mastery_band: finalMastery >= 90 ? 'mastered' : finalMastery >= 70 ? 'secure' : finalMastery >= 50 ? 'developing' : 'not_grasped',
              last_attempt_at: new Date().toISOString(),
              completed_at: finalMastery >= 70 ? new Date().toISOString() : null,
            })
            .eq('id', existingProgress.id);
        } else {
          await supabase
            .from('child_topic_progress')
            .insert({
              child_id,
              topic_id: body.topic_id,
              mastery_score: finalMastery,
              best_mastery_score: finalMastery,
              attempts_count: 1,
              mastery_band: finalMastery >= 90 ? 'mastered' : finalMastery >= 70 ? 'secure' : finalMastery >= 50 ? 'developing' : 'not_grasped',
              last_attempt_at: new Date().toISOString(),
              completed_at: finalMastery >= 70 ? new Date().toISOString() : null,
            });
        }

        // Update child XP and streak
        await supabase
          .from('children')
          .update({
            xp_total: currentXpTotal + xpEarned,
            xp: currentXpTotal + xpEarned,
            streak_days: newStreak,
            streak_last_date: today,
            last_active_date: today,
          })
          .eq('id', child_id);

        // Update any assignment to completed
        const { data: lessonStructure } = await supabase
          .from('topic_lesson_structures')
          .select('id')
          .eq('topic_id', body.topic_id)
          .single();

        if (lessonStructure) {
          await supabase
            .from('lesson_assignments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('child_id', child_id)
            .eq('lesson_structure_id', lessonStructure.id)
            .eq('status', 'in_progress');
        }

        currentXpTotal = currentXpTotal + xpEarned;
      } catch (dbError) {
        console.error('Failed to update Supabase:', dbError);
        // Continue with response even if DB update fails
      }
    } else {
      // Fallback to mock data
      const lastDate = child.streak_last_date;
      if (lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        newStreak = lastDate === yesterday ? child.streak_days + 1 : 1;
      } else {
        newStreak = child.streak_days;
      }
      currentXpTotal = child.xp_total + xpEarned;
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
        xp_total: currentXpTotal,
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
