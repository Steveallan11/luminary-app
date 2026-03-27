import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/seed-lessons
 * Reports how many seeded lessons are live in the DB vs total in the seed file.
 */
export async function GET() {
  let supabase: ReturnType<typeof getSupabaseServiceClient>;
  try {
    supabase = getSupabaseServiceClient();
  } catch {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }

  const { count: live } = await supabase
    .from('topic_lesson_structures')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'live');

  const { count: topics } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    live_lessons: live ?? 0,
    total_topics: topics ?? 0,
    note: 'POST to this endpoint to run the seed.',
  });
}

/**
 * POST /api/admin/seed-lessons
 * Inserts 45 KS2 lessons (3 per subject × 15 subjects) into Supabase.
 * Safe to run multiple times — uses upsert logic.
 */
export async function POST() {
  let supabase: ReturnType<typeof getSupabaseServiceClient>;
  try {
    supabase = getSupabaseServiceClient();
  } catch {
    return NextResponse.json({ error: 'Missing Supabase credentials — add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Vercel.' }, { status: 500 });
  }

  // Import seed data lazily to keep module init fast
  let SEED_LESSONS: any[];
  try {
    const mod = await import('@/lib/lesson-seed-data');
    SEED_LESSONS = mod.SEED_LESSONS;
  } catch (e: any) {
    return NextResponse.json({ error: `Could not load seed data: ${e.message}` }, { status: 500 });
  }

  const results: { slug: string; status: string; error?: string }[] = [];

  for (const lesson of SEED_LESSONS) {
    try {
      // 1. Get subject ID by slug
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('slug', lesson.subjectSlug)
        .maybeSingle();

      if (subjectError || !subject) {
        results.push({ slug: lesson.topic.slug, status: 'skipped_no_subject', error: subjectError?.message });
        continue;
      }

      // 2. Upsert topic (UNIQUE constraint on subject_id, slug)
      const { data: topicRow, error: topicError } = await supabase
        .from('topics')
        .upsert(
          {
            subject_id: subject.id,
            title: lesson.topic.title,
            slug: lesson.topic.slug,
            description: lesson.topic.description,
            order_index: lesson.topic.order_index,
            key_stage: lesson.topic.key_stage,
            estimated_minutes: lesson.topic.estimated_minutes,
          },
          { onConflict: 'subject_id,slug', ignoreDuplicates: true }
        )
        .select('id')
        .maybeSingle();

      // If upsert returned nothing (ignoreDuplicates hit), fetch the existing row
      let topicId: string;
      if (topicRow?.id) {
        topicId = topicRow.id;
      } else {
        const { data: existing, error: fetchError } = await supabase
          .from('topics')
          .select('id')
          .eq('subject_id', subject.id)
          .eq('slug', lesson.topic.slug)
          .single();

        if (fetchError || !existing) {
          results.push({ slug: lesson.topic.slug, status: 'topic_insert_failed', error: topicError?.message ?? fetchError?.message });
          continue;
        }
        topicId = existing.id;
      }

      // 3. Upsert lesson structure
      const { error: structureError } = await supabase
        .from('topic_lesson_structures')
        .upsert(
          {
            topic_id: topicId,
            age_group: '8-11',
            version: 1,
            status: 'live',
            generation_model: 'claude-sonnet-4-6',
            quality_score: 85,
            times_delivered: 0,
            spark_json: lesson.structure.spark_json,
            explore_json: lesson.structure.explore_json,
            anchor_json: lesson.structure.anchor_json,
            practise_json: lesson.structure.practise_json,
            create_json: lesson.structure.create_json,
            check_json: lesson.structure.check_json,
            celebrate_json: lesson.structure.celebrate_json,
          },
          { onConflict: 'topic_id,age_group,version' }
        );

      if (structureError) {
        results.push({ slug: lesson.topic.slug, status: 'structure_upsert_failed', error: structureError.message });
      } else {
        results.push({ slug: lesson.topic.slug, status: 'ok' });
      }
    } catch (e: any) {
      results.push({ slug: lesson.topic?.slug ?? 'unknown', status: 'exception', error: e.message });
    }
  }

  const ok = results.filter((r) => r.status === 'ok').length;
  const skipped = results.filter((r) => r.status.startsWith('skipped')).length;
  const failed = results.filter((r) => r.status !== 'ok' && !r.status.startsWith('skipped')).length;

  return NextResponse.json({
    seeded: ok,
    skipped,
    failed,
    total: SEED_LESSONS.length,
    results,
    note: failed > 0 ? 'Some lessons failed. Check results array for details.' : 'All lessons seeded successfully.',
  });
}
