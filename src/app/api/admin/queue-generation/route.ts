import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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
        if (fallbackTopic) {
          safeTopicId = fallbackTopic.id;
        } else {
          throw new Error('Database is empty and failed to create a fallback topic.');
        }
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

    // Trigger background generation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const endpoint = type === 'lesson' ? '/api/admin/generate-lesson' : '/api/admin/generate-content';
    
    // Fire and forget
    fetch(`${appUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, job_id: jobId, topic_id: safeTopicId }),
    }).then(async (res) => {
      if (res.ok) {
        const result = await res.json();
        await supabase.from('generation_jobs').update({
          status: 'completed',
          progress: 100,
          result_id: result.id,
          completed_at: new Date().toISOString()
        }).eq('id', jobId);
      } else {
        const err = await res.json();
        await supabase.from('generation_jobs').update({
          status: 'failed',
          error_message: err.error || 'Generation failed'
        }).eq('id', jobId);
      }
    }).catch(async (err) => {
      await supabase.from('generation_jobs').update({
        status: 'failed',
        error_message: err.message
      }).eq('id', jobId);
    });

    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: 'processing',
      message: 'Generation started.',
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
