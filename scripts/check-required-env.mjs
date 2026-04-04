import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv();

const required = [
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missing = required.filter((name) => {
  const value = process.env[name];
  return !value || value.trim().length === 0;
});

if (missing.length > 0) {
  console.error('Supabase environment contract is incomplete.');
  console.error(`Missing: ${missing.join(', ')}`);
  console.error('Copy .env.local.example to .env.local and populate the required Supabase values before running build or the learner-flow verifier.');
  process.exit(1);
}

console.log('Supabase environment contract OK.');
console.log('Service client URL source: SUPABASE_URL');

const hasSentryDsn =
  (process.env.SENTRY_DSN && process.env.SENTRY_DSN.trim().length > 0) ||
  (process.env.NEXT_PUBLIC_SENTRY_DSN &&
    process.env.NEXT_PUBLIC_SENTRY_DSN.trim().length > 0);

if (!hasSentryDsn) {
  console.warn(
    'Warning: Sentry DSN is not configured. Error tracking will remain disabled.'
  );
}
