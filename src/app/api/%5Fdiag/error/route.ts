import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? 'missing-request-id';
  const path = request.nextUrl.pathname;

  throw new Error(
    `Sentry diagnostic endpoint triggered at ${path} (request_id=${requestId})`
  );
}
