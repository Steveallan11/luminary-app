import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generateLessonStructure,
  scoreLessonQuality,
  type TopicBrief,
} from '@/lib/lesson-generator';

export async function POST(req: NextRequest) {
  try {
    console.log('[generate-lesson] Request received');
    const body = await req.json();
    console.log('[generate-lesson] Request body:', body);

    const brief: TopicBrief = {
      topic_id: body.topic_id,
      title: body.title,
      subject_name: body.subject_name,
      key_stage: body.key_stage ?? 'KS2',
      age_group: body.age_group ?? '8-11',
      key_concepts: Array.isArray(body.key_concepts) ? body.key_concepts : (body.key_concepts?.split(',') ?? []).map((s: string) => s.trim()),
      common_misconceptions: Array.isArray(body.common_misconceptions) ? body.common_misconceptions : (body.common_misconceptions?.split(',') ?? []).map((s: string) => s.trim()),
      real_world_examples: Array.isArray(body.real_world_examples) ? body.real_world_examples : (body.real_world_examples?.split(',') ?? []).map((s: string) => s.trim()),
      curriculum_objectives: Array.isArray(body.curriculum_objectives) ? body.curriculum_objectives : (body.curriculum_objectives?.split('\n') ?? []).map((s: string) => s.trim()).filter((s: string) => s.length > 0),
    };

    if (!brief.title || !brief.subject_name) {
      return NextResponse.json(
        { error: 'title and subject_name are required' },
        { status: 400 }
      );
    }

    console.log('[generate-lesson] Brief prepared:', brief);
    const structure = await generateLessonStructure(brief);
    console.log('[generate-lesson] Structure generated successfully');
    const qualityScore = scoreLessonQuality(structure);

    // Save to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('topic_lesson_structures')
      .insert({
        topic_id: brief.topic_id,
        age_group: brief.age_group,
        key_stage: brief.key_stage,
        status: 'pending_review',
        spark_json: structure.spark_json,
        explore_json: structure.explore_json,
        anchor_json: structure.anchor_json,
        practise_json: structure.practise_json,
        create_json: structure.create_json,
        check_json: structure.check_json,
        celebrate_json: structure.celebrate_json,
        game_type: structure.game_type,
        game_content: structure.game_content,
        concept_card_json: structure.concept_card_json,
        realworld_json: structure.realworld_json,
        quality_score: qualityScore,
      })
      .select()
      .single();

    if (error) {
      console.error('[generate-lesson] Supabase insert error:', error);
      throw new Error(`Failed to save lesson: ${error.message}`);
    }

    const lessonId = data?.id;
    console.log('[generate-lesson] Lesson saved to Supabase:', lessonId);

    // Automatically create and link assets from the lesson structure
    if (lessonId) {
      const assetsToCreate = [];

      // 1. Concept Card
      if (structure.concept_card_json) {
        assetsToCreate.push({
          topic_id: brief.topic_id,
          asset_type: 'concept_card',
          title: structure.concept_card_json.title,
          content_json: structure.concept_card_json,
          age_group: brief.age_group,
          key_stage: brief.key_stage,
          status: 'draft',
          linked_lesson_id: lessonId,
        });
      }

      // 2. Game
      if (structure.game_content) {
        assetsToCreate.push({
          topic_id: brief.topic_id,
          asset_type: 'game_questions',
          asset_subtype: structure.game_type,
          title: structure.game_content.title,
          content_json: structure.game_content,
          age_group: brief.age_group,
          key_stage: brief.key_stage,
          status: 'draft',
          linked_lesson_id: lessonId,
        });
      }

      // 3. Real-world Everyday
      if (structure.realworld_json?.everyday) {
        assetsToCreate.push({
          topic_id: brief.topic_id,
          asset_type: 'realworld_card',
          asset_subtype: 'everyday',
          title: structure.realworld_json.everyday.title,
          content_json: structure.realworld_json.everyday,
          age_group: brief.age_group,
          key_stage: brief.key_stage,
          status: 'draft',
          linked_lesson_id: lessonId,
        });
      }

      if (assetsToCreate.length > 0) {
        const { error: assetsError } = await supabase
          .from('topic_assets')
          .insert(assetsToCreate);
        
        if (assetsError) {
          console.error('[generate-lesson] Failed to create linked assets:', assetsError);
        } else {
          console.log(`[generate-lesson] Created ${assetsToCreate.length} linked assets`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
      structure,
      quality_score: qualityScore,
      status: 'pending_review',
      brief,
      generated_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[generate-lesson] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate lesson';
    const stack = error instanceof Error ? error.stack : '';
    console.error('[generate-lesson] Stack:', stack);
    return NextResponse.json({ error: message, details: stack }, { status: 500 });
  }
}
