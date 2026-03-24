import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// GET: Fetch all knowledge base items for a lesson
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get('lesson_id');
  if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('lesson_knowledge_base')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

// POST: Add a knowledge base item (text snippet or URL reference)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lesson_id, title, content_type, text_content, file_url, file_name, file_size, description } = body;

    if (!lesson_id || !title || !content_type) {
      return NextResponse.json({ error: 'lesson_id, title, and content_type are required' }, { status: 400 });
    }

    // For text content, extract key points using Claude
    let extracted_summary = '';
    let key_concepts: string[] = [];

    if (text_content && text_content.length > 100) {
      try {
        const summaryResponse = await anthropic.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Extract the key educational concepts and a brief summary from this content for a children's lesson. Return JSON: {"summary": "...", "key_concepts": ["concept1", "concept2", ...]}\n\nContent:\n${text_content.substring(0, 3000)}`
          }]
        });
        const summaryText = summaryResponse.content[0].type === 'text' ? summaryResponse.content[0].text : '';
        const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          extracted_summary = parsed.summary || '';
          key_concepts = parsed.key_concepts || [];
        }
      } catch { /* Continue without summary */ }
    }

    const { data, error } = await supabase
      .from('lesson_knowledge_base')
      .insert({
        lesson_id,
        title,
        content_type, // 'text', 'image', 'video', 'document', 'url'
        text_content: text_content || null,
        file_url: file_url || null,
        file_name: file_name || null,
        file_size: file_size || null,
        description: description || null,
        extracted_summary,
        key_concepts,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, item: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove a knowledge base item
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('id');
  if (!itemId) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase
    .from('lesson_knowledge_base')
    .delete()
    .eq('id', itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH: Toggle active status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, is_active } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data, error } = await supabase
      .from('lesson_knowledge_base')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, item: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
