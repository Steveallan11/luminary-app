# Sentry Error Tracking

Luminary now uses `@sentry/nextjs` for minimal app + API error capture.

## Environment Variables

Set at least one DSN:

- `SENTRY_DSN` (server/edge runtime)
- `NEXT_PUBLIC_SENTRY_DSN` (browser runtime)

Optional:

- `SENTRY_TRACES_SAMPLE_RATE` (default `0.1`)
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (default `0.1`)

## Redaction / PII

- `sendDefaultPii` is disabled in client/server/edge configs.
- Do not add raw learner messages, auth tokens, or API keys to Sentry scope extras.

## Verification

1. Configure DSN env vars in `.env.local`.
2. Start the app (`npm run dev`).
3. Open `http://localhost:3000/api/_diag/error`.
4. Confirm a 500 response is returned.
5. In Sentry, confirm a new event with:
   - message containing `Sentry diagnostic endpoint triggered`
   - request metadata (URL/path and request context)

The diagnostic route intentionally throws and should be used only for verification.
