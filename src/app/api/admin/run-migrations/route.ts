import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Run DDL via a stored procedure if available, otherwise use raw fetch to PostgREST
async function execSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Try using Supabase's built-in sql execution via the REST API
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
    
    // Use the pg-meta endpoint that Supabase exposes for schema operations
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (res.ok) return { success: true };

    // Fallback: try the rpc approach
    const { error } = await supabase.rpc('exec_ddl', { ddl: sql });
    if (!error) return { success: true };

    return { success: false, error: `pg/query: ${res.status}, rpc: ${error.message}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Check if a table exists by trying to select from it
async function tableExists(tableName: string): Promise<boolean> {
  const { error } = await supabase.from(tableName).select('id').limit(1);
  // If error code is PGRST116 or 42P01, table doesn't exist
  if (error && (error.code === 'PGRST116' || error.message.includes('does not exist'))) {
    return false;
  }
  return true;
}

// Check if a column exists in a table
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', tableName)
    .eq('column_name', columnName)
    .eq('table_schema', 'public');
  return !error && (data?.length || 0) > 0;
}

export async function GET() {
  const tables = {
    lesson_knowledge_base: await tableExists('lesson_knowledge_base'),
    admin_test_sessions: await tableExists('admin_test_sessions'),
    topic_assets: await tableExists('topic_assets'),
  };

  return NextResponse.json({ tables });
}

export async function POST() {
  const results: { name: string; status: string; exists?: boolean; error?: string }[] = [];

  // Check what already exists
  const kbExists = await tableExists('lesson_knowledge_base');
  const sessionsExists = await tableExists('admin_test_sessions');
  const assetsExists = await tableExists('topic_assets');

  results.push({ name: 'lesson_knowledge_base', status: kbExists ? 'already_exists' : 'needs_creation', exists: kbExists });
  results.push({ name: 'admin_test_sessions', status: sessionsExists ? 'already_exists' : 'needs_creation', exists: sessionsExists });
  results.push({ name: 'topic_assets', status: assetsExists ? 'exists' : 'missing', exists: assetsExists });

  // Try to create missing tables using raw SQL via the Supabase REST API
  if (!kbExists || !sessionsExists) {
    const sql = `
      ${!kbExists ? `CREATE TABLE IF NOT EXISTS lesson_knowledge_base (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        lesson_id uuid NOT NULL REFERENCES topic_lesson_structures(id) ON DELETE CASCADE,
        title text NOT NULL,
        content_type text NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'document', 'url')),
        text_content text,
        file_url text,
        file_name text,
        file_size integer,
        description text,
        extracted_summary text,
        key_concepts text[],
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );` : ''}
      ${!sessionsExists ? `CREATE TABLE IF NOT EXISTS admin_test_sessions (
        id text PRIMARY KEY,
        lesson_id uuid REFERENCES topic_lesson_structures(id) ON DELETE SET NULL,
        admin_email text,
        chat_transcript jsonb DEFAULT '[]'::jsonb,
        admin_notes jsonb DEFAULT '[]'::jsonb,
        refinements_applied jsonb DEFAULT '[]'::jsonb,
        variants_generated jsonb DEFAULT '[]'::jsonb,
        overall_rating integer,
        feedback_summary text,
        started_at timestamptz DEFAULT now(),
        ended_at timestamptz,
        updated_at timestamptz DEFAULT now()
      );` : ''}
    `;

    const result = await execSQL(sql);
    results.push({ name: 'ddl_execution', status: result.success ? 'success' : 'failed', error: result.error });
  }

  // Add missing columns to topic_assets
  if (assetsExists) {
    const titleExists = await columnExists('topic_assets', 'title');
    if (!titleExists) {
      const result = await execSQL(`
        ALTER TABLE topic_assets
          ADD COLUMN IF NOT EXISTS title text,
          ADD COLUMN IF NOT EXISTS linked_lesson_id uuid,
          ADD COLUMN IF NOT EXISTS key_stage text,
          ADD COLUMN IF NOT EXISTS age_group text,
          ADD COLUMN IF NOT EXISTS asset_type text,
          ADD COLUMN IF NOT EXISTS content jsonb;
      `);
      results.push({ name: 'topic_assets_columns', status: result.success ? 'success' : 'failed', error: result.error });
    } else {
      results.push({ name: 'topic_assets_columns', status: 'already_exists' });
    }
  }

  return NextResponse.json({ 
    success: true, 
    results,
    note: 'If DDL execution failed, please run the SQL manually in Supabase SQL Editor. See /supabase-admin-test-sessions.sql in the repo.'
  });
}
