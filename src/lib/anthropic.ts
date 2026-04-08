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
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    });
  }
  return openaiClient;
}

// Use Claude 3.5 Sonnet for lesson generation (fast & capable)
// Configurable via LUMI_MODEL env var
export const LUMI_MODEL = process.env.LUMI_MODEL || 'claude-3-5-sonnet-20241022';
export const LUMI_FAST_MODEL = process.env.LUMI_FAST_MODEL || 'claude-3-5-sonnet-20241022';
export const LUMI_MAX_TOKENS = 8192;
export const LUMI_SUMMARY_MAX_TOKENS = 100;

