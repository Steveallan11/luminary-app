import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'
    const altText = formData.get('alt_text') as string || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `File type ${file.type} not allowed. Allowed: images, videos, audio.` 
      }, { status: 400 })
    }

    // Check file size (max 50MB for videos, 10MB for images)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024)
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxMB}MB.` 
      }, { status: 400 })
    }

    // Generate unique filename with folder structure
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const pathname = `luminary/${folder}/${timestamp}-${sanitizedName}`

    // Upload to Vercel Blob (private storage)
    const blob = await put(pathname, file, {
      access: 'private',
      contentType: file.type,
    })

    // Determine media type
    let mediaType: 'image' | 'video' | 'audio' = 'image'
    if (file.type.startsWith('video/')) mediaType = 'video'
    else if (file.type.startsWith('audio/')) mediaType = 'audio'

    // Save to database
    const supabase = await createServerSupabaseClient()
    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_assets')
      .insert({
        url: blob.url,
        pathname: blob.pathname,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        media_type: mediaType,
        alt_text: altText,
        folder: folder,
        storage_provider: 'vercel_blob',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error saving media:', dbError)
      // Still return success - file is uploaded even if DB fails
    }

    return NextResponse.json({ 
      success: true,
      pathname: blob.pathname,
      url: blob.url,
      media: mediaRecord || {
        pathname: blob.pathname,
        filename: file.name,
        mime_type: file.type,
        media_type: mediaType,
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
