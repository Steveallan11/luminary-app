import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, LUMI_MODEL, LUMI_SUMMARY_MAX_TOKENS } from '@/lib/anthropic';
import { generateSummaryPrompt } from '@/lib/lumi-prompt';
import { calculateSessionXP, clampMastery } from '@/lib/mastery';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

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
    const { child_id, topic_id, topic_title, session_id, message_count, mastery_score, child_name } = body;

    if (!child_id || !topic_id) {
      return NextResponse.json(
        { error: 'Missing child_id or topic_id' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Get child data
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('name, streak_days, streak_last_date, xp_total')
      .eq('id', child_id)
      .single();

    if (childError || !child) {
      console.error('Child not found:', childError);
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

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
    const lastDate = child.streak_last_date?.split('T')[0] || null;
    let newStreak = child.streak_days;
    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      newStreak = lastDate === yesterday ? child.streak_days + 1 : 1;
    }

    // Persist to Supabase
    try {
      // 1. Insert lesson session record
      const { error: sessionError } = await supabase
        .from('lesson_sessions')
        .insert({
          id: session_id,
          child_id,
          topic_id,
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          duration_minutes: Math.round(message_count * 2), // Estimate: ~2 min per message
          xp_earned: xpEarned,
          summary_text: summaryText,
        });

      if (sessionError) {
        console.error('Failed to insert session:', sessionError);
      }

      // 2. Update child_topic_progress
      const { data: existingProgress } = await supabase
        .from('child_topic_progress')
        .select('id')
        .eq('child_id', child_id)
        .eq('topic_id', topic_id)
        .single();

      if (existingProgress) {
        // Update existing progress
        const { error: updateError } = await supabase
          .from('child_topic_progress')
          .update({
            mastery_score: finalMastery,
            status: topicStatus,
          })
          .eq('child_id', child_id)
          .eq('topic_id', topic_id);

        if (updateError) {
          console.error('Failed to update progress:', updateError);
        }
      } else {
        // Create new progress record
        const { error: createError } = await supabase
          .from('child_topic_progress')
          .insert({
            child_id,
            topic_id,
            mastery_score: finalMastery,
            status: topicStatus,
          });

        if (createError) {
          console.error('Failed to create progress:', createError);
        }
      }

      // 3. Update child XP and streak
      const { error: childUpdateError } = await supabase
        .from('children')
        .update({
          xp_total: child.xp_total + xpEarned,
          streak_days: newStreak,
          streak_last_date: today,
        })
        .eq('id', child_id);

      if (childUpdateError) {
        console.error('Failed to update child:', childUpdateError);
      }
    } catch (dbError) {
      console.error('Database persistence error:', dbError);
      // Don't fail the response - still return success to the client
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
