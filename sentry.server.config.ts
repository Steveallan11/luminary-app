import * as Sentry from '@sentry/nextjs';

declare global {
  // eslint-disable-next-line no-var
  var __luminarySentryProcessHandlers: boolean | undefined;
}

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  enabled: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  sendDefaultPii: false,
});

if (!global.__luminarySentryProcessHandlers) {
  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason);
  });

  process.on('uncaughtExceptionMonitor', (error) => {
    Sentry.captureException(error);
  });

  global.__luminarySentryProcessHandlers = true;
}
