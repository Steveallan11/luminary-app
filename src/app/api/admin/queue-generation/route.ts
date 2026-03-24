import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { generateLessonLogic } from '@/lib/generate-lesson-logic';

// Extend Vercel function timeout to 300 seconds (5 minutes) — required for Claude API calls
export const maxDuration = 300;

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

    let safeTopicId = topic_id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(topic_id);
    
    if (!isUuid || topic_id === '00000000-0000-0000-0000-000000000000') {
      let { data: generalSubject } = await supabase.from('subjects').select('id').eq('name', 'General').single();
      if (!generalSubject) {
        const { data: createdSubject } = await supabase.from('subjects').insert({ 
          name: 'General', 
          slug: 'general',
          color: '#64748b' 
        }).select().single();
        generalSubject = createdSubject;
      }

      if (generalSubject) {
        const { data: createdTopic } = await supabase.from('topics').insert({
          title: title || 'Custom Topic',
          subject_id: generalSubject.id,
          slug: `custom-${Date.now()}`
        }).select().single();
        
        if (createdTopic) {
          safeTopicId = createdTopic.id;
        }
      }

      if (!safeTopicId || safeTopicId === '00000000-0000-0000-0000-000000000000') {
        const { data: fallbackTopic } = await supabase.from('topics').select('id').limit(1).single();
        if (!fallbackTopic) {
          throw new Error('No topics found in database to use as fallback.');
        }
        safeTopicId = fallbackTopic.id;
      }
    } else {
      const { data: topicExists } = await supabase
        .from('topics')
        .select('id')
        .eq('id', topic_id)
        .single();
      
      if (!topicExists) {
        const { data: fallbackTopic } = await supabase.from('topics').select('id').limit(1).single();
        if (!fallbackTopic) {
          throw new Error('No topics found in database to use as fallback.');
        }
        safeTopicId = fallbackTopic.id;
      }
    }

    const { error } = await supabase
      .from('generation_jobs')
      .insert({
        id: jobId,
        type,
        topic_id: safeTopicId,
        asset_types: asset_types || null,
        age_group,
        key_stage,
        title,
        subject_name,
        brief: brief || null,
        status: 'processing',
        progress: 10,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[queue-generation] Supabase insert error:', error);
      throw new Error(`Failed to queue generation: ${error.message}`);
    }

    if (type === 'lesson') {
      // Run lesson generation synchronously — Vercel will keep the function alive
      // for up to maxDuration seconds, so Claude has time to respond.
      console.log(`[queue-generation] Running lesson generation synchronously for job ${jobId}`);
      try {
        await generateLessonLogic({ ...body, topic_id: safeTopicId }, jobId);
        console.log(`[queue-generation] Lesson generation completed for job ${jobId}`);
      } catch (genError: any) {
        console.error(`[queue-generation] Lesson generation failed for job ${jobId}:`, genError);
        // generateLessonLogic already updates the job status to 'failed' internally
      }
    } else if (type === 'content') {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      const endpoint = '/api/admin/generate-content';
      console.log(`[queue-generation] Triggering background content task: ${appUrl}${endpoint}`);
      fetch(`${appUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, job_id: jobId, topic_id: safeTopicId }),
      }).then(async (res) => {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        if (res.ok) {
          const result = await res.json();
          await supabase.from('generation_jobs').update({
            status: 'completed',
            progress: 100,
            result_id: result.id,
            completed_at: new Date().toISOString()
          }).eq('id', jobId);
          console.log(`[queue-generation] Job ${jobId} content generation completed successfully`);
        } else {
          const err = await res.json();
          await supabase.from('generation_jobs').update({
            status: 'failed',
            error_message: err.error || 'Content generation failed'
          }).eq('id', jobId);
          console.error(`[queue-generation] Job ${jobId} content generation failed:`, err);
        }
      }).catch(async (err) => {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        await supabase.from('generation_jobs').update({
          status: 'failed',
          error_message: err.message
        }).eq('id', jobId);
        console.error(`[queue-generation] Job ${jobId} content generation fetch error:`, err);
      });
    }

    // Re-fetch the job to return the latest status
    const { data: jobData } = await supabase
      .from('generation_jobs')
      .select('status, result_id, error_message, progress')
      .eq('id', jobId)
      .single();

    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: jobData?.status || 'processing',
      result_id: jobData?.result_id || null,
      error_message: jobData?.error_message || null,
      message: type === 'lesson' 
        ? (jobData?.status === 'completed' ? 'Lesson generated successfully.' : 'Generation failed — check error_message.')
        : 'Generation started.',
    });
  } catch (error: any) {
    console.error('[queue-generation] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    return NextResponse.json({ success: true, job: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
