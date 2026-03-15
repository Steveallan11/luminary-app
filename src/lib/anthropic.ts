import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'placeholder-anthropic-key') {
      throw new Error(
        'ANTHROPIC_API_KEY is not configured. Please set it in .env.local'
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const LUMI_MODEL = 'claude-sonnet-4-6';
export const LUMI_MAX_TOKENS = 800;
export const LUMI_SUMMARY_MAX_TOKENS = 100;
