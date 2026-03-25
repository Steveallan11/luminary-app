import { list, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - List all media
export async function GET(request: NextRequest) {
  try {
    const folder = request.nextUrl.searchParams.get('folder')
    const mediaType = request.nextUrl.searchParams.get('type')

    // Try to get from database first
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })

    if (folder) {
      query = query.eq('folder', folder)
    }
    if (mediaType) {
      query = query.eq('media_type', mediaType)
    }

    const { data: dbMedia, error: dbError } = await query

    if (!dbError && dbMedia && dbMedia.length > 0) {
      return NextResponse.json({ 
        files: dbMedia,
        source: 'database'
      })
    }

    // Fallback to listing from Blob storage directly
    const { blobs } = await list({ prefix: 'luminary/' })

    const files = blobs.map((blob) => ({
      pathname: blob.pathname,
      url: blob.url,
      filename: blob.pathname.split('/').pop() || 'unknown',
      size_bytes: blob.size,
      uploaded_at: blob.uploadedAt,
      media_type: blob.contentType?.startsWith('video/') ? 'video' 
        : blob.contentType?.startsWith('audio/') ? 'audio' 
        : 'image',
      mime_type: blob.contentType,
    }))

    return NextResponse.json({ 
      files,
      source: 'blob_storage'
    })
  } catch (error) {
    console.error('Error listing media:', error)
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 })
  }
}

// DELETE - Delete media
export async function DELETE(request: NextRequest) {
  try {
    const { url, pathname } = await request.json()

    if (!url && !pathname) {
      return NextResponse.json({ error: 'No URL or pathname provided' }, { status: 400 })
    }

    // Delete from Blob storage
    if (url) {
      await del(url)
    }

    // Delete from database
    const supabase = await createServerSupabaseClient()
    if (pathname) {
      await supabase
        .from('media_assets')
        .delete()
        .eq('pathname', pathname)
    } else if (url) {
      await supabase
        .from('media_assets')
        .delete()
        .eq('url', url)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
