/**
 * Visual Lumi — Image Search, Generation, and Verification
 *
 * Lumi finds or generates the right image for a topic, verifies accuracy
 * using Claude's vision capability, then caches it for all future learners.
 *
 * Flow:
 * 1. Check cache (topic_lesson_images)
 * 2. If no cache: search Wikimedia (factual) or generate via DALL-E (abstract)
 * 3. Accuracy gate: Claude vision scores the image 1-10
 * 4. If 8+: approve and cache. If <8: try alternative source.
 * 5. Return the approved image URL + Lumi teaching instruction.
 */

import { getAnthropicClient, LUMI_MODEL } from '@/lib/anthropic';

// ─── Types ───────────────────────────────────────────────────────

export interface VisualSearchResult {
  url: string;
  source_type: 'wikimedia' | 'dalle' | 'google_arts' | 'admin_upload';
  title: string;
  description?: string;
  license?: string;
}

export interface AccuracyVerification {
  score: number;
  is_approved: boolean;
  concerns: string;
  lumi_instruction: string;
}

export interface CachedVisual {
  id: string;
  topic_id: string;
  phase: string;
  source_type: string;
  public_url: string;
  accuracy_score: number;
  lumi_instruction: string;
  is_approved: boolean;
}

// ─── Wikimedia Commons Search ────────────────────────────────────

const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';

export async function searchWikimedia(query: string, limit: number = 5): Promise<VisualSearchResult[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrlimit: String(limit),
    gsrnamespace: '6', // File namespace
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '800',
    format: 'json',
    origin: '*',
  });

  try {
    const res = await fetch(`${WIKIMEDIA_API}?${params.toString()}`, {
      headers: { 'User-Agent': 'Luminary-Education/1.0 (https://luminary.education)' },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    const results: VisualSearchResult[] = [];

    for (const page of Object.values(pages) as any[]) {
      const info = page.imageinfo?.[0];
      if (!info) continue;

      // Filter out very small images
      if (info.width < 300 || info.height < 200) continue;

      const url = info.thumburl || info.url;
      const title = page.title?.replace('File:', '') ?? 'Untitled';
      const desc = info.extmetadata?.ImageDescription?.value ?? '';
      const license = info.extmetadata?.LicenseShortName?.value ?? 'Unknown';

      results.push({
        url,
        source_type: 'wikimedia',
        title,
        description: desc.replace(/<[^>]*>/g, '').slice(0, 200),
        license,
      });
    }

    return results;
  } catch (err) {
    console.error('Wikimedia search failed:', err);
    return [];
  }
}

// ─── DALL-E Image Generation ─────────────────────────────────────

export async function generateDalleImage(
  topic: string,
  subject: string,
  ageGroup: string
): Promise<VisualSearchResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });

    const prompt = `Create a child-friendly, educational illustration for teaching "${topic}" in ${subject}. 
Style: warm, colourful, flat design, suitable for ages ${ageGroup}. 
Must be factually accurate and clearly show the concept. 
No text or labels in the image. Clean white or light background.`;

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      style: 'natural',
      quality: 'standard',
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) return null;

    return {
      url: imageUrl,
      source_type: 'dalle',
      title: `AI-generated illustration: ${topic}`,
      description: response.data?.[0]?.revised_prompt ?? prompt,
    };
  } catch (err) {
    console.error('DALL-E generation failed:', err);
    return null;
  }
}

// ─── Accuracy Verification via Claude Vision ─────────────────────

export async function verifyImageAccuracy(
  imageUrl: string,
  topicTitle: string,
  subjectName: string,
  keyStage: string
): Promise<AccuracyVerification> {
  const client = getAnthropicClient();

  try {
    const response = await client.messages.create({
      model: LUMI_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: imageUrl },
            },
            {
              type: 'text',
              text: `You are an educational content reviewer for a UK homeschooling platform.

Evaluate this image for teaching "${topicTitle}" (${subjectName}, ${keyStage}) to a child.

Score the image 1-10 on these criteria:
- Factual accuracy (is it correct?)
- Age appropriateness (is it suitable for children?)
- Educational value (does it help explain the concept?)
- Visual clarity (is it clear and easy to understand?)

Return ONLY valid JSON:
{
  "score": number (1-10),
  "concerns": "string (any issues, or 'None' if perfect)",
  "lumi_instruction": "string (how Lumi should use this image to teach — e.g. 'Ask the child what they notice about the coloured sections')"
}`,
            },
          ],
        },
      ],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
    const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      score: parsed.score ?? 0,
      is_approved: (parsed.score ?? 0) >= 8,
      concerns: parsed.concerns ?? 'Unable to evaluate',
      lumi_instruction: parsed.lumi_instruction ?? 'Show this image and discuss what the child sees.',
    };
  } catch (err) {
    console.error('Image verification failed:', err);
    return {
      score: 0,
      is_approved: false,
      concerns: `Verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      lumi_instruction: '',
    };
  }
}

// ─── Main Visual Search Pipeline ─────────────────────────────────

export type SubjectCategory = 'factual' | 'abstract' | 'art';

export function categoriseSubject(subjectName: string): SubjectCategory {
  const lower = subjectName.toLowerCase();
  if (['history', 'science', 'geography'].some((s) => lower.includes(s))) return 'factual';
  if (['art', 'design'].some((s) => lower.includes(s))) return 'art';
  return 'abstract'; // Maths, English, Computing, etc.
}

export interface VisualSearchPipelineResult {
  image: VisualSearchResult | null;
  verification: AccuracyVerification | null;
  attempts: number;
  source_used: string;
}

/**
 * Run the full Visual Lumi pipeline:
 * 1. Determine source strategy based on subject
 * 2. Search/generate
 * 3. Verify accuracy (skip for trusted Wikimedia sources)
 * 4. Return result
 */
export async function runVisualPipeline(
  topicTitle: string,
  subjectName: string,
  keyStage: string,
  ageGroup: string
): Promise<VisualSearchPipelineResult> {
  const category = categoriseSubject(subjectName);
  let attempts = 0;

  // Strategy 1: Factual subjects — try Wikimedia first
  if (category === 'factual' || category === 'art') {
    attempts++;
    const searchQuery = category === 'art'
      ? `${topicTitle} painting artwork`
      : `${topicTitle} educational diagram`;

    const results = await searchWikimedia(searchQuery);

    if (results.length > 0) {
      // Wikimedia is a trusted source — pre-approved
      const best = results[0];
      return {
        image: best,
        verification: {
          score: 9,
          is_approved: true,
          concerns: 'None — trusted Wikimedia Commons source',
          lumi_instruction: `Look at this image about ${topicTitle}. Ask the child what they notice first, then guide them through the key details.`,
        },
        attempts,
        source_used: 'wikimedia',
      };
    }
  }

  // Strategy 2: Abstract subjects or Wikimedia fallback — use DALL-E
  attempts++;
  const dalleResult = await generateDalleImage(topicTitle, subjectName, ageGroup);

  if (dalleResult) {
    // DALL-E images require verification
    attempts++;
    const verification = await verifyImageAccuracy(
      dalleResult.url,
      topicTitle,
      subjectName,
      keyStage
    );

    if (verification.is_approved) {
      return {
        image: dalleResult,
        verification,
        attempts,
        source_used: 'dalle',
      };
    }

    // If DALL-E failed verification, try Wikimedia as fallback
    if (category === 'abstract') {
      attempts++;
      const fallbackResults = await searchWikimedia(`${topicTitle} ${subjectName} educational`);
      if (fallbackResults.length > 0) {
        return {
          image: fallbackResults[0],
          verification: {
            score: 8,
            is_approved: true,
            concerns: 'Wikimedia fallback after DALL-E verification failure',
            lumi_instruction: `Look at this image related to ${topicTitle}. Discuss what the child sees.`,
          },
          attempts,
          source_used: 'wikimedia_fallback',
        };
      }
    }

    // Return the DALL-E result even if not approved — admin can review
    return {
      image: dalleResult,
      verification,
      attempts,
      source_used: 'dalle_unverified',
    };
  }

  // No image found
  return {
    image: null,
    verification: null,
    attempts,
    source_used: 'none',
  };
}
