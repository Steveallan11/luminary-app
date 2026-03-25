/**
 * Media Search API — finds relevant images, YouTube videos, and GIFs for lesson phases
 * Uses free/open APIs: Unsplash, YouTube Data API, Giphy, Pexels, and Wikipedia Commons
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, LUMI_MODEL } from '@/lib/anthropic';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface MediaResult {
  id: string;
  type: 'image' | 'video' | 'gif' | 'youtube';
  url: string;
  thumbnail: string;
  title: string;
  source: string;
  relevance_score: number;
  lumi_suggestion: string; // How Lumi should use this in the lesson
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, phase, key_concepts, age_group, search_type = 'all' } = body;

    if (!topic || !phase) {
      return NextResponse.json({ error: 'topic and phase are required' }, { status: 400 });
    }

    const results: MediaResult[] = [];

    // Use Claude to generate smart search queries for this topic/phase
    const client = getAnthropicClient();
    const queryResponse = await client.messages.create({
      model: LUMI_MODEL,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Generate 3 specific search queries to find educational media for a lesson about "${topic}" in the "${phase}" phase for children aged ${age_group || '8-11'}.
Key concepts: ${(key_concepts || []).join(', ')}

Return ONLY a JSON array of 3 search query strings. Make them specific, visual, and child-friendly.
Example: ["photosynthesis diagram for kids", "plant absorbing sunlight animation", "chlorophyll green leaves close up"]`
      }]
    });

    let searchQueries: string[] = [topic, `${topic} for kids`, `${topic} diagram`];
    try {
      const responseText = queryResponse.content[0].type === 'text' ? queryResponse.content[0].text : '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        searchQueries = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Use fallback queries
    }

    // Search Unsplash for images (using their free demo endpoint)
    if (search_type === 'all' || search_type === 'image') {
      for (const query of searchQueries.slice(0, 2)) {
        try {
          const unsplashRes = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=4&orientation=landscape`,
            {
              headers: {
                'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY || 'demo'}`,
              }
            }
          );
          if (unsplashRes.ok) {
            const data = await unsplashRes.json();
            for (const photo of (data.results || []).slice(0, 3)) {
              results.push({
                id: `unsplash-${photo.id}`,
                type: 'image',
                url: photo.urls.regular,
                thumbnail: photo.urls.small,
                title: photo.alt_description || photo.description || query,
                source: 'Unsplash',
                relevance_score: 0.8,
                lumi_suggestion: `Show this image during the ${phase} phase to help visualise ${query}`
              });
            }
          }
        } catch {
          // Continue with other sources
        }
      }
    }

    // Search Pixabay for educational images (free API)
    if ((search_type === 'all' || search_type === 'image') && process.env.PIXABAY_API_KEY) {
      try {
        const pixabayRes = await fetch(
          `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(searchQueries[0])}&image_type=photo&safesearch=true&per_page=6&category=education`
        );
        if (pixabayRes.ok) {
          const data = await pixabayRes.json();
          for (const hit of (data.hits || []).slice(0, 4)) {
            results.push({
              id: `pixabay-${hit.id}`,
              type: 'image',
              url: hit.largeImageURL,
              thumbnail: hit.previewURL,
              title: hit.tags,
              source: 'Pixabay',
              relevance_score: 0.75,
              lumi_suggestion: `Use this educational image to illustrate ${topic}`
            });
          }
        }
      } catch {
        // Continue
      }
    }

    // Search YouTube for educational videos
    if ((search_type === 'all' || search_type === 'video') && process.env.YOUTUBE_API_KEY) {
      try {
        const ytQuery = `${searchQueries[0]} educational kids`;
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(ytQuery)}&type=video&safeSearch=strict&videoDuration=short&maxResults=4&key=${process.env.YOUTUBE_API_KEY}`
        );
        if (ytRes.ok) {
          const data = await ytRes.json();
          for (const item of (data.items || []).slice(0, 3)) {
            const videoId = item.id.videoId;
            results.push({
              id: `youtube-${videoId}`,
              type: 'youtube',
              url: `https://www.youtube.com/embed/${videoId}`,
              thumbnail: item.snippet.thumbnails.medium?.url || '',
              title: item.snippet.title,
              source: 'YouTube',
              relevance_score: 0.85,
              lumi_suggestion: `Play this video clip during the ${phase} phase to show ${topic} in action`
            });
          }
        }
      } catch {
        // Continue
      }
    }

    // Search Giphy for educational/fun GIFs
    if ((search_type === 'all' || search_type === 'gif') && process.env.GIPHY_API_KEY) {
      try {
        const giphyRes = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(searchQueries[0])}&limit=4&rating=g&lang=en`
        );
        if (giphyRes.ok) {
          const data = await giphyRes.json();
          for (const gif of (data.data || []).slice(0, 3)) {
            results.push({
              id: `giphy-${gif.id}`,
              type: 'gif',
              url: gif.images.original.url,
              thumbnail: gif.images.fixed_height_small.url,
              title: gif.title,
              source: 'Giphy',
              relevance_score: 0.6,
              lumi_suggestion: `Use this fun GIF to celebrate or add humour to the ${phase} phase`
            });
          }
        }
      } catch {
        // Continue
      }
    }

    // If no API keys are set, generate placeholder suggestions using Claude
    if (results.length === 0) {
      const suggestionResponse = await client.messages.create({
        model: LUMI_MODEL,
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Suggest 6 specific pieces of media (images, videos, or GIFs) that would make a lesson about "${topic}" in the "${phase}" phase visually exciting and engaging for children aged ${age_group || '8-11'}.

For each suggestion, provide:
1. A specific description of what to search for
2. Whether it's an image, video, or GIF
3. How Lumi should use it in the lesson
4. A funny or engaging way to introduce it

Return as JSON array:
[{
  "search_for": "string",
  "type": "image|video|gif",
  "lumi_use": "string",
  "funny_intro": "string"
}]`
        }]
      });

      try {
        const text = suggestionResponse.content[0].type === 'text' ? suggestionResponse.content[0].text : '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          for (let i = 0; i < suggestions.length; i++) {
            const s = suggestions[i];
            results.push({
              id: `suggestion-${i}`,
              type: s.type,
              url: '',
              thumbnail: '',
              title: s.search_for,
              source: 'Lumi Suggestion',
              relevance_score: 0.9,
              lumi_suggestion: `${s.lumi_use} — Intro: "${s.funny_intro}"`
            });
          }
        }
      } catch {
        // Return empty results
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevance_score - a.relevance_score);

    return NextResponse.json({
      success: true,
      results: results.slice(0, 12),
      search_queries: searchQueries,
      topic,
      phase
    });

  } catch (error) {
    console.error('Media search error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
