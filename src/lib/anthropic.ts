import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

const usingOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);
const usingOpenCode = Boolean(process.env.OPENCODE_API_KEY);
const usingAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

const provider = usingOpenRouter ? 'openrouter' : usingOpenCode ? 'opencode' : 'anthropic';
const baseURL = usingOpenRouter
  ? 'https://openrouter.ai/api/v1'
  : usingOpenCode
    ? process.env.OPENCODE_API_ENDPOINT || 'https://api.opencode.ai/v1'
    : 'https://api.anthropic.com/v1';
const apiKey = usingOpenRouter
  ? process.env.OPENROUTER_API_KEY
  : usingOpenCode
    ? process.env.OPENCODE_API_KEY
    : process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('No API key configured. Set OPENROUTER_API_KEY, OPENCODE_API_KEY, or ANTHROPIC_API_KEY.');
  throw new Error('No API key configured. Set OPENROUTER_API_KEY, OPENCODE_API_KEY, or ANTHROPIC_API_KEY.');
}

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const config: ConstructorParameters<typeof Anthropic>[0] = {
      apiKey: apiKey!,
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

export const LUMI_MODEL = usingOpenRouter
  ? 'anthropic/claude-opus-4-6'
  : usingOpenCode
    ? 'anthropic/claude-opus-4-5'
    : 'claude-opus-4-6';
export const LUMI_FAST_MODEL = usingOpenRouter
  ? 'anthropic/claude-sonnet-4-6'
  : usingOpenCode
    ? 'anthropic/claude-sonnet-4-5'
    : 'claude-sonnet-4-6';
export const LUMI_MAX_TOKENS = 8192;
export const LUMI_SUMMARY_MAX_TOKENS = 100;

console.log('[anthropic] Configuration:', {
  provider,
  LUMI_MODEL,
  LUMI_FAST_MODEL,
  baseURL,
});
