import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

let cachedAdminClient: SupabaseClient<any, any, any> | null = null;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }

  if (cachedAdminClient) return cachedAdminClient;

  cachedAdminClient = createClient(url, key);
  return cachedAdminClient;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminClient();

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const lessonId = formData.get('lesson_id') as string;
    const contentType = formData.get('content_type') as string; // 'image', 'video', 'document'

    if (!file || !lessonId) {
      return NextResponse.json({ error: 'file and lesson_id are required' }, { status: 400 });
    }

    // Determine bucket and path
    const bucket = 'lesson-knowledge-base';
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `${lessonId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // If bucket doesn't exist, try to create it
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('bucket')) {
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'video/mp4', 'video/webm', 'video/ogg',
            'application/pdf', 'text/plain', 'text/markdown',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
        });
        if (createError && !createError.message?.includes('already exists')) {
          return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 });
        }
        // Retry upload
        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucket)
          .upload(fileName, buffer, { contentType: file.type, upsert: false });
        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      storage_path: fileName,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
