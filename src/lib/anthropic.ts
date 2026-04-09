import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not configured.');
      throw new Error('OPENROUTER_API_KEY is not configured. Please ensure it is set in your environment variables.');
    }

    // Use OpenRouter endpoint for Claude models
    const baseURL = 'https://openrouter.ai/api/v1';

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
    // Use OpenRouter for Claude models
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not configured.');
      throw new Error('API key is not configured. Please set OPENROUTER_API_KEY.');
    }

    openaiClient = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }
  return openaiClient;
}

// Use Claude models via OpenRouter
// Always use OpenRouter format with anthropic/ prefix
export const LUMI_MODEL = 'anthropic/claude-opus-4-6';
export const LUMI_FAST_MODEL = 'anthropic/claude-sonnet-4-6';
export const LUMI_MAX_TOKENS = 8192;
export const LUMI_SUMMARY_MAX_TOKENS = 100;

console.log('[anthropic] Configured models:', {
  LUMI_MODEL,
  LUMI_FAST_MODEL,
  usingOpenRouter: true,
  baseURL: 'https://openrouter.ai/api/v1',
});

