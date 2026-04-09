import { createClient } from '@supabase/supabase-js';
import {
  generateLessonStructure,
  scoreLessonQuality,
  type TopicBrief,
} from './lesson-generator';

export async function generateLessonLogic(body: any, jobId: string) {
  console.log(`[generate-lesson-logic] Function entered for job ${jobId}`);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials not configured for background generation");
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`[generate-lesson-logic] Job ${jobId} started`);
    console.log(
      "NEXT_PUBLIC_SUPABASE_URL=" + process.env.NEXT_PUBLIC_SUPABASE_URL +
      ", SUPABASE_SERVICE_ROLE_KEY (present): " + !!process.env.SUPABASE_SERVICE_ROLE_KEY +
      ", OPENROUTER_API_KEY (present): " + !!process.env.OPENROUTER_API_KEY
    );

    // Update progress: starting
    await supabase
      .from('generation_jobs')
      .update({ progress: 20 })
      .eq('id', jobId);

    // Normalise the brief — handle both flat body and nested brief object
    const briefSource = body.brief || body;

    const brief: TopicBrief = {
      topic_id: body.topic_id,
      title: body.title,
      subject_name: body.subject_name,
      key_stage: body.key_stage ?? 'KS2',
      age_group: body.age_group ?? '8-11',
      estimated_minutes: body.estimated_minutes ?? 30,
      key_concepts: Array.isArray(briefSource.keyConcepts)
        ? briefSource.keyConcepts
        : Array.isArray(briefSource.key_concepts)
        ? briefSource.key_concepts
        : (briefSource.key_concepts?.split(',') ?? []).map((s: string) => s.trim()),
      common_misconceptions: Array.isArray(briefSource.misconceptions)
        ? briefSource.misconceptions
        : Array.isArray(briefSource.common_misconceptions)
        ? briefSource.common_misconceptions
        : (briefSource.common_misconceptions?.split(',') ?? []).map((s: string) => s.trim()),
      real_world_examples: Array.isArray(briefSource.realWorldExamples)
        ? briefSource.realWorldExamples
        : Array.isArray(briefSource.real_world_examples)
        ? briefSource.real_world_examples
        : (briefSource.real_world_examples?.split(',') ?? []).map((s: string) => s.trim()),
      curriculum_objectives: Array.isArray(briefSource.curriculumObjectives)
        ? briefSource.curriculumObjectives
        : Array.isArray(briefSource.curriculum_objectives)
        ? briefSource.curriculum_objectives
        : (briefSource.curriculum_objectives?.split('\n') ?? []).map((s: string) => s.trim()).filter((s: string) => s.length > 0),
    };

    if (!brief.title || !brief.subject_name) {
      console.error(`[generate-lesson-logic] Job ${jobId} failed: title and subject_name are required`);
      await supabase
        .from('generation_jobs')
        .update({ status: 'failed', error_message: 'Title and subject name are required' })
        .eq('id', jobId);
      return;
    }

    console.log(`[generate-lesson-logic] Job ${jobId} Brief prepared:`, brief);

    // Update progress: calling Claude
    await supabase
      .from('generation_jobs')
      .update({ progress: 30 })
      .eq('id', jobId);

    console.log(`[generate-lesson-logic] Job ${jobId} Calling generateLessonStructure...`);
    const structure = await generateLessonStructure(brief);
    console.log(`[generate-lesson-logic] Job ${jobId} Structure generated successfully`);

    // Update progress: Claude responded, saving to DB
    await supabase
      .from('generation_jobs')
      .update({ progress: 80 })
      .eq('id', jobId);

    const qualityScore = scoreLessonQuality(structure);
    console.log(`[generate-lesson-logic] Job ${jobId} Quality score: ${qualityScore}`);

    // Use upsert to handle the case where a lesson already exists for this topic+age_group+version
    const { data, error } = await supabase
      .from('topic_lesson_structures')
      .upsert({
        topic_id: brief.topic_id,
        age_group: brief.age_group,
        key_stage: brief.key_stage,
        status: 'generating',
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
      }, { onConflict: 'topic_id,age_group,version' })
      .select()
      .single();

    if (error) {
      console.error(`[generate-lesson-logic] Job ${jobId} Supabase insert error:`, error);
      console.error(`[generate-lesson-logic] Job ${jobId} Supabase error details:`, JSON.stringify(error));
      await supabase
        .from('generation_jobs')
        .update({ status: 'failed', error_message: `Failed to save lesson: ${error.message}` })
        .eq('id', jobId);
      return;
    }

    const lessonId = data?.id;
    console.log(`[generate-lesson-logic] Job ${jobId} Lesson saved to Supabase: ${lessonId}`);

    // Create linked assets (concept card, game, real-world card)
    if (lessonId) {
      const assetsToCreate = [];

      const generateImage = async (prompt: string) => {
        if (!process.env.OPENAI_API_KEY) return null;
        try {
          const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
          const res = await fetch(`${appUrl}/api/admin/generate-images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
          });
          if (res.ok) {
            const data = await res.json();
            return data.url;
          }
        } catch (e) {
          console.error(`[generate-lesson-logic] Job ${jobId} Background image generation failed:`, e);
        }
        return null;
      };

      if (structure.concept_card_json) {
        const conceptCard = structure.concept_card_json as any;
        const imageUrl = await generateImage(conceptCard.image_prompt || conceptCard.title);
        assetsToCreate.push({
          topic_id: brief.topic_id,
          asset_type: 'concept_card',
          title: structure.concept_card_json.title,
          content_json: structure.concept_card_json,
          file_url: imageUrl,
          age_group: brief.age_group,
          key_stage: brief.key_stage,
          status: 'draft',
          linked_lesson_id: lessonId,
        });
      }

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

      if (structure.realworld_json?.everyday) {
        const everyday = structure.realworld_json.everyday as any;
        const imageUrl = await generateImage(everyday.image_prompt || everyday.title);
        assetsToCreate.push({
          topic_id: brief.topic_id,
          asset_type: 'realworld_card',
          asset_subtype: 'everyday',
          title: structure.realworld_json.everyday.title,
          content_json: structure.realworld_json.everyday,
          file_url: imageUrl,
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
          console.error(`[generate-lesson-logic] Job ${jobId} Failed to create linked assets:`, assetsError);
        } else {
          console.log(`[generate-lesson-logic] Job ${jobId} Created ${assetsToCreate.length} linked assets`);
        }
      }
    }

    await supabase
      .from('generation_jobs')
      .update({
        status: 'completed',
        progress: 100,
        result_id: lessonId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    console.log(`[generate-lesson-logic] Job ${jobId} completed successfully`);

  } catch (error: unknown) {
    console.error(`[generate-lesson-logic] Job ${jobId} Uncaught error:`, error);
    const message = error instanceof Error ? error.message : 'Failed to generate lesson';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[generate-lesson-logic] Job ${jobId} Stack:`, stack);
    await supabase
      .from('generation_jobs')
      .update({ status: 'failed', error_message: message })
      .eq('id', jobId);
    throw error; // Re-throw so the caller knows it failed
  }
}
