import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql }),
    });
    if (res.ok) return { success: true };
    const err = await res.text();
    return { success: false, error: err };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

async function runSQLDirect(sql: string): Promise<{ success: boolean; error?: string }> {
  // Use the Supabase Management API via pg connection
  try {
    const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    if (res.ok) return { success: true };
    const err = await res.text();
    return { success: false, error: err };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

const MIGRATIONS = [
  {
    name: 'create_lesson_knowledge_base',
    sql: `CREATE TABLE IF NOT EXISTS lesson_knowledge_base (
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
    )`,
  },
  {
    name: 'create_admin_test_sessions',
    sql: `CREATE TABLE IF NOT EXISTS admin_test_sessions (
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
    )`,
  },
  {
    name: 'add_topic_assets_columns',
    sql: `ALTER TABLE topic_assets
      ADD COLUMN IF NOT EXISTS title text,
      ADD COLUMN IF NOT EXISTS linked_lesson_id uuid,
      ADD COLUMN IF NOT EXISTS key_stage text,
      ADD COLUMN IF NOT EXISTS age_group text,
      ADD COLUMN IF NOT EXISTS asset_type text,
      ADD COLUMN IF NOT EXISTS content jsonb`,
  },
];

export async function POST() {
  const results: { name: string; status: string; error?: string }[] = [];

  for (const migration of MIGRATIONS) {
    // Try via rpc first, then direct
    let result = await runSQL(migration.sql);
    if (!result.success) {
      result = await runSQLDirect(migration.sql);
    }
    results.push({
      name: migration.name,
      status: result.success ? 'success' : 'failed',
      error: result.error,
    });
  }

  const allSuccess = results.every(r => r.status === 'success');
  return NextResponse.json({ success: allSuccess, migrations: results });
}

export async function GET() {
  // Quick health check — see which tables exist
  const checks = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/lesson_knowledge_base?select=id&limit=1`, {
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
    }).then(r => ({ table: 'lesson_knowledge_base', exists: r.status !== 404 && r.status !== 400 })),
    fetch(`${SUPABASE_URL}/rest/v1/admin_test_sessions?select=id&limit=1`, {
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
    }).then(r => ({ table: 'admin_test_sessions', exists: r.status !== 404 && r.status !== 400 })),
    fetch(`${SUPABASE_URL}/rest/v1/topic_assets?select=id&limit=1`, {
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
    }).then(r => ({ table: 'topic_assets', exists: r.status !== 404 && r.status !== 400 })),
  ]);

  return NextResponse.json({ tables: Object.fromEntries(checks.map(c => [c.table, c.exists])) });
}
