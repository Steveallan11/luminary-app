import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/generate-images
 * 
 * Generates images using DALL-E 3 for content assets.
 * Accepts: { prompt, style, size }
 * Returns: { url, revised_prompt }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, style = 'natural', size = '1024x1024' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Return placeholder in demo mode
      return NextResponse.json({
        url: null,
        revised_prompt: prompt,
        message: 'Demo mode — no OpenAI API key configured. In production, DALL-E 3 would generate an image.',
        placeholder: true,
      });
    }

    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });

    // Prepend child-safe style instructions
    const safePrompt = `Create a child-friendly, educational illustration. Style: warm, colourful, flat design, suitable for ages 5-16. No text in the image. ${prompt}`;

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: safePrompt,
      n: 1,
      size: size as '1024x1024' | '1024x1792' | '1792x1024',
      style: style as 'natural' | 'vivid',
      quality: 'standard',
    });

    const imageUrl = response.data?.[0]?.url;
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    return NextResponse.json({
      url: imageUrl,
      revised_prompt: revisedPrompt,
      message: 'Image generated successfully',
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: error.message || 'Image generation failed' }, { status: 500 });
  }
}
