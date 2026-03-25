import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { data: lessons, error } = await supabase
      .from('topic_lesson_structures')
      .select(`
        id,
        topic_id,
        age_group,
        key_stage,
        status,
        quality_score,
        created_at,
        topics (
          id,
          title,
          slug,
          subjects (
            id,
            name,
            slug
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lessons:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lessons: lessons || [] });
  } catch (error: any) {
    console.error('Admin lessons API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
