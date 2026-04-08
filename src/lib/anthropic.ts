import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured.');
      throw new Error('ANTHROPIC_API_KEY is not configured. Please ensure it is set in your environment variables.');
    }

    // Support for OpenRouter (baseURL format: https://openrouter.ai/api/v1)
    // If using OpenRouter, set ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1
    const baseURL = process.env.ANTHROPIC_BASE_URL;

    const config: ConstructorParameters<typeof Anthropic>[0] = {
      apiKey,
    };

    if (baseURL) {
      config.baseURL = baseURL;
    }

    anthropicClient = new Anthropic(config);
  }
  return anthropicClient;
}

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    // Use OpenRouter via ANTHROPIC_API_KEY if configured, otherwise use OpenAI key
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.ANTHROPIC_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    if (!apiKey) {
      console.error('Neither ANTHROPIC_API_KEY nor OPENAI_API_KEY is configured.');
      throw new Error('API key is not configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
    }

    openaiClient = new OpenAI({
      apiKey,
      baseURL,
    });
  }
  return openaiClient;
}

// Use Claude Sonnet for lesson generation (fast & capable)
// Configurable via LUMI_MODEL and LUMI_FAST_MODEL env vars
// For OpenRouter, use format: anthropic/claude-3-5-sonnet-20241022
// For direct Anthropic/OpenAI API, use format: claude-3-5-sonnet-20241022
function getModelName(envVar: string, defaultName: string): string {
  if (process.env[envVar]) {
    return process.env[envVar] as string;
  }
  // Always use OpenRouter format (anthropic/ prefix) since we're routing through OpenRouter
  if (process.env.ANTHROPIC_BASE_URL === 'https://openrouter.ai/api/v1') {
    return `anthropic/${defaultName}`;
  }
  return defaultName;
}

export const LUMI_MODEL = getModelName('LUMI_MODEL', 'claude-3-5-sonnet-20241022');
export const LUMI_FAST_MODEL = getModelName('LUMI_FAST_MODEL', 'claude-3-5-sonnet-20241022');
export const LUMI_MAX_TOKENS = 8192;
export const LUMI_SUMMARY_MAX_TOKENS = 100;

console.log('[anthropic] Configured models:', {
  LUMI_MODEL,
  LUMI_FAST_MODEL,
  usingOpenRouter: !!process.env.ANTHROPIC_BASE_URL,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

