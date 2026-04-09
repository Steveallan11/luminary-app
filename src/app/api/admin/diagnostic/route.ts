import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';
  
  return NextResponse.json({
    apiKeySet: !!apiKey,
    apiKeyLength: apiKey.length,
    apiKeyFirst10: apiKey.substring(0, 10) + '****',
    apiKeyLast10: '****' + apiKey.substring(apiKey.length - 10),
    baseUrl,
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'unknown',
  });
}
