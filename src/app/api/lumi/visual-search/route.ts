import { NextRequest, NextResponse } from 'next/server';
import {
  runVisualPipeline,
  searchWikimedia,
  type VisualSearchPipelineResult,
} from '@/lib/visual-lumi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lumi/visual-search
 *
 * Runs the Visual Lumi pipeline for a given topic:
 * 1. Searches Wikimedia Commons (factual subjects) or generates via DALL-E (abstract)
 * 2. Verifies accuracy using Claude vision (skipped for trusted Wikimedia sources)
 * 3. Returns the image URL, accuracy score, and Lumi teaching instruction
 *
 * Query params:
 * - topic: topic title (required)
 * - subject: subject name (required)
 * - key_stage: e.g. 'KS2' (optional, defaults to 'KS2')
 * - age_group: e.g. '8-11' (optional, defaults to '8-11')
 * - source: force a specific source ('wikimedia' | 'dalle') (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const subject = searchParams.get('subject');
    const keyStage = searchParams.get('key_stage') ?? 'KS2';
    const ageGroup = searchParams.get('age_group') ?? '8-11';
    const forceSource = searchParams.get('source');

    if (!topic || !subject) {
      return NextResponse.json(
        { error: 'topic and subject query parameters are required' },
        { status: 400 }
      );
    }

    let result: VisualSearchPipelineResult;

    if (forceSource === 'wikimedia') {
      // Direct Wikimedia search only
      const results = await searchWikimedia(`${topic} educational diagram`);
      result = {
        image: results[0] ?? null,
        verification: results[0]
          ? {
              score: 9,
              is_approved: true,
              concerns: 'None — trusted Wikimedia Commons source',
              lumi_instruction: `Look at this image about ${topic}. Ask the child what they notice.`,
            }
          : null,
        attempts: 1,
        source_used: results[0] ? 'wikimedia' : 'none',
      };
    } else {
      // Full pipeline
      result = await runVisualPipeline(topic, subject, keyStage, ageGroup);
    }

    if (!result.image) {
      return NextResponse.json(
        {
          found: false,
          message: `No suitable image found for "${topic}" after ${result.attempts} attempt(s).`,
          attempts: result.attempts,
        },
        { status: 404 }
      );
    }

    // In production: cache to topic_lesson_images
    // const { data, error } = await supabase
    //   .from('topic_lesson_images')
    //   .insert({
    //     topic_id: topicId,
    //     phase: 'explore',
    //     source_type: result.image.source_type,
    //     public_url: result.image.url,
    //     accuracy_score: result.verification?.score ?? 0,
    //     accuracy_notes: result.verification?.concerns,
    //     lumi_instruction: result.verification?.lumi_instruction,
    //     search_query: topic,
    //     is_approved: result.verification?.is_approved ?? false,
    //   })
    //   .select()
    //   .single();

    return NextResponse.json({
      found: true,
      image: {
        url: result.image.url,
        source_type: result.image.source_type,
        title: result.image.title,
        description: result.image.description,
      },
      verification: result.verification
        ? {
            score: result.verification.score,
            is_approved: result.verification.is_approved,
            concerns: result.verification.concerns,
            lumi_instruction: result.verification.lumi_instruction,
          }
        : null,
      attempts: result.attempts,
      source_used: result.source_used,
    });
  } catch (error: unknown) {
    console.error('Visual search error:', error);
    const message = error instanceof Error ? error.message : 'Visual search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
