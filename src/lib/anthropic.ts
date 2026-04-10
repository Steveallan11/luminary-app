import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    // Support both OpenRouter and OpenCode via environment variables
    const apiKey = process.env.OPENROUTER_API_KEY ||
                   process.env.OPENCODE_API_KEY ||
                   process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('No API key configured. Set OPENROUTER_API_KEY, OPENCODE_API_KEY, or ANTHROPIC_API_KEY.');
      throw new Error('No API key configured. Set OPENROUTER_API_KEY, OPENCODE_API_KEY, or ANTHROPIC_API_KEY.');
    }

    // Determine which endpoint to use based on configured API key
    let baseURL = 'https://api.anthropic.com/v1';
    if (process.env.OPENROUTER_API_KEY) {
      baseURL = 'https://openrouter.ai/api/v1';
    } else if (process.env.OPENCODE_API_KEY) {
      baseURL = process.env.OPENCODE_API_ENDPOINT || 'https://api.opencode.ai/v1';
    }

    const config: ConstructorParameters<typeof Anthropic>[0] = {
      apiKey,
      baseURL,
    };

    anthropicClient = new Anthropic(config);
  }
  return anthropicClient;
}

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    });
  }
  return openaiClient;
}

// Use claude-opus-4-6 for lesson generation (most capable)
// When using OpenRouter or OpenCode, use "anthropic/" prefix
// Falls back to claude-sonnet-4-6 for faster/cheaper operations
export const LUMI_MODEL = process.env.OPENROUTER_API_KEY || process.env.OPENCODE_API_KEY
  ? 'anthropic/claude-opus-4-6'
  : 'claude-opus-4-6';
export const LUMI_FAST_MODEL = process.env.OPENROUTER_API_KEY || process.env.OPENCODE_API_KEY
  ? 'anthropic/claude-sonnet-4-6'
  : 'claude-sonnet-4-6';
export const LUMI_MAX_TOKENS = 8192;
export const LUMI_SUMMARY_MAX_TOKENS = 100;

console.log('[anthropic] Configuration:', {
  LUMI_MODEL,
  LUMI_FAST_MODEL,
  baseURL: process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' :
           process.env.OPENCODE_API_KEY ? (process.env.OPENCODE_API_ENDPOINT || 'https://api.opencode.ai/v1') :
           'https://api.anthropic.com/v1',
});
