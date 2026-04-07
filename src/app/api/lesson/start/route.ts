import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-service';
import { getAgeGroup } from '@/lib/lesson-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const childId = body.child_id as string | undefined;
    const topicId = body.topic_id as string | undefined;

    if (!childId || !topicId) {
      return NextResponse.json(
        { error: 'child_id and topic_id are required' },
        { status: 400 }
      );
    }

    let supabase: ReturnType<typeof getSupabaseServiceClient>;
    try {
      supabase = getSupabaseServiceClient();
    } catch {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Fetch child
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Fetch topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Determine age group from child's age
    const ageGroup = getAgeGroup(child.age);

    // Look up lesson structure for this topic + age group
    const { data: structure, error: structureError } = await supabase
      .from('topic_lesson_structures')
      .select('*')
      .eq('topic_id', topicId)
      .eq('age_group', ageGroup)
      .eq('status', 'live')
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (structureError && structureError.code !== 'PGRST116') {
      // PGRST116 is "no rows found", which is expected if no live structure exists yet
      console.error('Error fetching structure:', structureError);
    }

    // Create lesson_session record
    const { data: session, error: sessionError } = await supabase
      .from('lesson_sessions')
      .insert({
        child_id: childId,
        topic_id: topicId,
        structure_id: structure?.id || null,
        status: 'active',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating lesson session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Create or update child_topic_progress if not already exists
    const { data: existingProgress, error: progressCheckError } = await supabase
      .from('child_topic_progress')
      .select('id')
      .eq('child_id', childId)
      .eq('topic_id', topicId)
      .single();

    if (!existingProgress && !progressCheckError) {
      // Progress doesn't exist, create it
      const { error: createProgressError } = await supabase
        .from('child_topic_progress')
        .insert({
          child_id: childId,
          topic_id: topicId,
          status: 'in_progress',
        });

      if (createProgressError) {
        console.error('Error creating progress:', createProgressError);
      }
    } else if (!progressCheckError) {
      // Progress exists, optionally update status to in_progress if it was locked
      const { error: updateProgressError } = await supabase
        .from('child_topic_progress')
        .update({ status: 'in_progress' })
        .eq('child_id', childId)
        .eq('topic_id', topicId)
        .eq('status', 'locked');

      if (updateProgressError) {
        console.error('Error updating progress:', updateProgressError);
      }
    }

    return NextResponse.json({
      success: true,
      session_id: session.id,
      child_id: childId,
      topic_id: topicId,
      topic_title: topic.title,
      age_group: ageGroup,
      has_prepared_structure: !!structure,
      structure_id: structure?.id || null,
      state: structure ? 'live' : 'generating',
      message: structure
        ? 'Ready to start lesson with prepared content'
        : 'Lesson structure not yet available, will generate in real-time',
    });
  } catch (error) {
    console.error('Lesson start error:', error);
    const message = error instanceof Error ? error.message : 'Failed to start lesson';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
