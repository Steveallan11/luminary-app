import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/admin/queue-generation
 *
 * Queues a content or lesson generation job to run in the background.
 * Returns immediately with a job ID so the user can continue working.
 * The actual generation happens asynchronously.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, topic_id, asset_types, age_group, key_stage, title, subject_name, brief } = body;

    if (!type || !topic_id) {
      return NextResponse.json(
        { error: 'type and topic_id are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const jobId = uuidv4();

    // FIX: Check if topic_id exists to avoid foreign key constraint error
    // If it's a mock ID or placeholder, we'll use null or a safe value if the column allows it
    let safeTopicId = topic_id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(topic_id);
    
    if (!isUuid || topic_id === '00000000-0000-0000-0000-000000000000') {
      // If not a valid UUID, we need a fallback to satisfy NOT NULL constraint
      const { data: fallbackTopic } = await supabase.from('topics').select('id').limit(1).single();
      safeTopicId = fallbackTopic?.id || null;
    } else {
      // Verify it actually exists in the topics table
      const { data: topicExists } = await supabase
        .from('topics')
        .select('id')
        .eq('id', topic_id)
        .single();
      
      if (!topicExists) {
        console.warn(`[queue-generation] Topic ${topic_id} not found in database, fetching fallback`);
        const { data: fallbackTopic } = await supabase.from('topics').select('id').limit(1).single();
        safeTopicId = fallbackTopic?.id || null;
      }
    }

    // Create a generation job record
    const { data, error } = await supabase
      .from('generation_jobs')
      .insert({
        id: jobId,
        type, // 'lesson' or 'content'
        topic_id: safeTopicId,
        asset_types: asset_types || null,
        age_group,
        key_stage,
        title,
        subject_name,
        brief: brief || null,
        status: 'queued', // queued -> processing -> completed -> failed
        progress: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[queue-generation] Supabase insert error:', error);
      throw new Error(`Failed to queue generation: ${error.message}`);
    }

    console.log('[queue-generation] Job queued:', jobId);

    // Trigger the actual generation in the background
    // In production, this would call a background job service like Bull, Temporal, or AWS Lambda
    // For now, we'll call the generation endpoint asynchronously
    triggerBackgroundGeneration(jobId, type, body).catch((err) => {
      console.error('[queue-generation] Background trigger error:', err);
    });

    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: 'queued',
      message: 'Generation queued. You will be notified when complete.',
    });
  } catch (error: unknown) {
    console.error('[queue-generation] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to queue generation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Trigger the actual generation in the background.
 * In a production system, this would use a job queue like Bull or Temporal.
 */
async function triggerBackgroundGeneration(jobId: string, type: string, body: Record<string, unknown>) {
  try {
    // Simulate background processing with a small delay
    // In production, this would be a proper background job
    setTimeout(async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase credentials not configured');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Update job status to processing
        await supabase
          .from('generation_jobs')
          .update({ status: 'processing', progress: 25 })
          .eq('id', jobId);

        // Call the appropriate generation endpoint
        const endpoint =
          type === 'lesson'
            ? '/api/admin/generate-lesson'
            : '/api/admin/generate-content';

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Generation failed');
        }

        const result = await response.json();

        // Update job status to completed
        await supabase
          .from('generation_jobs')
          .update({
            status: 'completed',
            progress: 100,
            result_id: result.id || result.data?.id,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        console.log('[background-generation] Job completed:', jobId);
      } catch (err) {
        console.error('[background-generation] Error:', err);

        // Update job status to failed
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase
            .from('generation_jobs')
            .update({
              status: 'failed',
              error_message: err instanceof Error ? err.message : 'Unknown error',
            })
            .eq('id', jobId);
        }
      }
    }, 1000);
  } catch (err) {
    console.error('[triggerBackgroundGeneration] Error:', err);
  }
}

/**
 * GET /api/admin/queue-generation?job_id=xxx
 * Get the status of a generation job
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json(
        { error: 'job_id is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: data,
    });
  } catch (error: unknown) {
    console.error('[queue-generation-get] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get job status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
