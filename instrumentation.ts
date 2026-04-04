import * as Sentry from '@sentry/nextjs';

const runtime = process.env.NEXT_RUNTIME;

export async function register() {
  if (runtime === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (runtime === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
