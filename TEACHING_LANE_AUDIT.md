# Core Teaching Lane Audit
Date: 2026-03-27

## Summary

Full trace of the child learning journey from login to session end.
Maps what is **REAL** (Supabase-backed) vs **MOCK** (hardcoded demo data) at each step.

---

## Step 1: /auth/login

- **File:** `src/app/auth/login/page.tsx`
- **Real or mock:** MOCK — child PIN login is fully simulated; any 4 digits accepted
- **Auth method:** Parent enters email → selects child → enters PIN (PIN not validated against DB)
- **Supabase tables queried:** NONE
- **If no profile:** Falls back to hardcoded `mockChildren` array — always shows something
- **Issues found:**
  - PIN accepts any 4 digits with no DB check
  - No Supabase Auth session created — child identity stored in `localStorage` only
  - No `/auth/callback` route exists — no token exchange
  - `luminary_child_id` written to localStorage on PIN entry

---

## Step 2: /auth/callback

- **File:** Does NOT exist
- **Real or mock:** N/A
- **Issues found:**
  - No OAuth callback route — Supabase Auth token exchange never happens
  - Session management is localStorage-only (child_id key)
  - No JWT or secure session cookie is set

---

## Step 3: /learn (Subject Hub)

- **File:** `src/app/learn/page.tsx`
- **Real or mock:** REAL — fetches from Supabase via API routes (with fallback)
- **Tables queried:** `subjects`, `topics`, `child_topic_progress`, `children`, `lesson_sessions`
- **Child profile:** Required — reads `luminary_child_id` from localStorage
- **If no profile:** Shows onboarding CTA → `/auth/onboarding`
- **If API fails / env vars missing:** Shows SUBJECTS_FALLBACK (Maths, English, Science, History) — never hangs
- **Issues fixed (this session):**
  - TypeScript null crash on `childData.child` before `isLoading` guard — FIXED
  - No AbortController timeout (could hang forever) — FIXED (5s timeout added)
  - API returning `{error: "..."}` treated as valid data — FIXED (shape-validated)

---

## Step 4: /learn/[slug] (Subject Page)

- **File:** `src/app/learn/[slug]/page.tsx`
- **Real or mock:** MIXED — real Supabase call with silent fallback to `MOCK_SUBJECTS` on error
- **Tables queried:** `subjects`, `topics`, `child_topic_progress`
- **Child profile:** Optional — uses `luminary_child_id` from localStorage if present
- **If API fails:** Silently uses mock data (subject page still renders)
- **Issues found:**
  - Sequential unlock logic works — first topic always available, others unlock after completion
  - Falls back to mock without telling the user

---

## Step 5: /learn/[slug]/[topic] (Lesson Player)

- **File:** `src/app/learn/[slug]/[topic]/page.tsx`
- **Real or mock:** MIXED — loads real subjects/child data but initialises with `MOCK_CHILD`
- **Tables queried:** `subjects`, `topics`, `children`
- **Child profile:** Attempted — but MOCK_CHILD used as initial state; real child only loaded if API succeeds
- **Issues found:**
  - `MOCK_CHILD` used as default — if API fails, Lumi teaches the wrong child profile
  - `sessionId` generated as `Date.now()` — not linked to `lesson_sessions` table

---

## Step 6: Lumi Chat (/api/lumi/chat)

- **File:** `src/app/api/lumi/chat/route.ts`
- **Real or mock:** MOCK — always uses `MOCK_CHILD`, no Supabase queries
- **ANTHROPIC_API_KEY present:** Required — falls back to hardcoded mock responses if missing
- **System prompt:** Built from `buildLumiSystemPrompt()` in `src/lib/lumi-prompt.ts` — uses mock child context
- **Child context:** MOCK_CHILD hardcoded (ignores `child_id` parameter)
- **Session saving:** NONE — no DB writes
- **Issues found:**
  - `child_id` parameter is accepted but ignored — Lumi always teaches "Lyla" (mock child)
  - Phase tracking uses `getMockPhaseTracking()` — not real DB session state
  - No rate limiting on endpoint
  - `admin_mode` flag accepted without auth check

---

## Step 7: Session End (/api/lumi/session-end)

- **File:** `src/app/api/lumi/session-end/route.ts`
- **Real or mock:** MOCK — no Supabase writes
- **What gets saved to lesson_sessions:** NOTHING — commented out
- **child_topic_progress updated:** NO
- **XP updated:** NO
- **Issues found (CRITICAL):**
  - All progress, XP, mastery calculated but never persisted
  - User refreshes → all progress lost
  - DB tables exist but route never writes to them

---

## Real vs Mock Summary Table

| Step | File | Data Source | Supabase Writes | Auth Check |
|------|------|-------------|-----------------|------------|
| Login | `auth/login/page.tsx` | MOCK | ❌ | ❌ |
| Callback | — | MISSING | ❌ | ❌ |
| /learn | `learn/page.tsx` | REAL + fallback | ❌ | localStorage only |
| /learn/[slug] | `learn/[slug]/page.tsx` | REAL + mock fallback | ❌ | localStorage only |
| /learn/[slug]/[topic] | `learn/[slug]/[topic]/page.tsx` | MIXED | ❌ | localStorage only |
| Lumi chat | `api/lumi/chat/route.ts` | MOCK | ❌ | ❌ |
| Session end | `api/lumi/session-end/route.ts` | MOCK | ❌ | ❌ |

---

## Top 3 Gaps to Fix Next

### Gap A — Session end not persisting (CRITICAL)
`/api/lumi/session-end` calculates XP and mastery but never writes to Supabase.
Tables exist: `lesson_sessions`, `child_topic_progress`, `children`.
Fix: implement the commented-out Supabase inserts/updates in `session-end/route.ts`.

### Gap B — Lumi uses wrong child context (HIGH)
`/api/lumi/chat` ignores the `child_id` parameter and always uses `MOCK_CHILD`.
Fix: load child from `children` table using `child_id`, inject real name/age/year_group into `buildLumiSystemPrompt()`.

### Gap C — No real auth session (HIGH)
Child identity is localStorage only — no Supabase Auth session, no JWT.
Fix: implement Supabase Auth email/password login for parents, write `luminary_child_id` after verifying the child belongs to the authenticated parent.

---

## Env Vars Required (full list)

| Variable | Server/Public | Status |
|----------|--------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ Should be set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ Should be set |
| `SUPABASE_URL` | Server only | ⚠️ MISSING from Vercel — add manually |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | ⚠️ MISSING from Vercel — add manually |
| `ANTHROPIC_API_KEY` | Server only | Check Vercel settings |
| `OPENAI_API_KEY` | Server only | Check Vercel settings |
| `STRIPE_SECRET_KEY` | Server only | Check Vercel settings |
| `STRIPE_WEBHOOK_SECRET` | Server only | Check Vercel settings |
| `NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID` | Public | Check Vercel settings |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Public | Check Vercel settings |
| `NEXT_PUBLIC_APP_URL` | Public | Should be `https://luminary-omega.vercel.app` |

---

## Steve's Manual Actions Required

> These cannot be fixed in code. Must be done in Vercel/Supabase dashboards.

1. **Add `SUPABASE_URL` to Vercel Production**
   - Vercel → luminary → Settings → Environment Variables
   - Value: same as `NEXT_PUBLIC_SUPABASE_URL` (your Supabase project URL)
   - Environment: Production (+ Preview if you want preview builds to work)

2. **Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel Production**
   - Value: from Supabase dashboard → Settings → API → `service_role` key (secret)
   - Environment: Production ONLY — never `NEXT_PUBLIC_`

3. **Re-add `www.meetlumi.co.uk` domain**
   - Vercel → luminary → Settings → Domains → Add domain

4. **Disable Vercel preview deployment protection**
   - Vercel → luminary → Settings → Deployment Protection → disable or set to Production only
   - Currently all preview URLs return 401, blocking API testing

5. **Upgrade Anthropic API tier if needed**
   - console.anthropic.com → Settings → Billing → check tier (need Tier 2+ for production load)
