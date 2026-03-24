import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'placeholder-anthropic-key') {
      // If no Anthropic key, we'll return a proxy or throw
      // For now, we'll throw to let the caller handle the fallback
      throw new Error('ANTHROPIC_API_KEY is not configured.');
    }
    anthropicClient = new Anthropic({ apiKey });
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

export const LUMI_MODEL = 'claude-3-5-sonnet-20240620';
export const LUMI_MAX_TOKENS = 4096;
export const LUMI_SUMMARY_MAX_TOKENS = 100;
