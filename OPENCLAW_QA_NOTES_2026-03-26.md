# OpenClaw QA Notes — 2026-03-26

## Scope
Initial live QA pass against:
- https://luminary-omega.vercel.app/

Repo cross-check performed against local code in `luminary-app`.

---

## Confirmed Issues

### 1. Homepage footer contains placeholder / dead links
**Severity:** Medium
**Area:** Marketing / trust / public UX

Confirmed in `src/app/page.tsx`.

Current placeholder links use `href="#"` for:
- Subjects
- Pricing
- Help Centre
- Contact Us
- Community
- Privacy Policy
- Terms of Service
- Cookie Policy

**Why it matters:**
- weakens trust on a public-facing product
- creates visibly unfinished UX
- hurts launch readiness
- legal links especially should not be placeholders

**Suggested fix:**
- wire real routes where they exist (e.g. pricing)
- convert non-ready items to plain text or remove temporarily
- create proper legal/support routes when available

---

### 2. Learner login copy is confusing
**Severity:** Medium
**Area:** Auth UX

Confirmed in `src/app/auth/login/page.tsx`.

When login type is `child`, the first-step email field label still reads:
- `Parent's Email`

While that may reflect the intended flow, it creates friction because the user explicitly clicked:
- `I'm a Learner`

**Why it matters:**
- mismatch between selected mode and form wording
- likely to confuse first-time users
- makes learner flow feel unfinished/demo-ish

**Suggested fix:**
- change the label/help copy dynamically for learner mode
- explain clearly why a learner is entering a parent email first, or redesign the first step

---

### 3. Login flow is still heavily demo-oriented
**Severity:** Low/Medium
**Area:** Auth / production readiness

Observed in `src/app/auth/login/page.tsx`:
- mock children array hardcoded
- any 4-digit PIN works in demo mode
- parent login uses timeout + redirect
- admin mode has test-email shortcut

**Why it matters:**
- okay for staging/demo
- dangerous if treated as production-ready behavior
- can blur what is real vs mocked

**Suggested fix:**
- document clearly which flows are demo-only
- gate demo behavior behind env flags or explicit demo routes
- progressively replace mocked auth steps with real Supabase-backed behavior

---

## Recommended Priority Order

1. Fix public placeholder links on homepage
2. Improve learner login wording
3. Audit auth flow for demo-only logic vs production logic
4. Continue QA into signup, post-auth routes, and protected pages

---

## Notes
This is a first-pass QA list, not a full product audit.
More issues will likely emerge once child/parent/admin flows are tested deeper.
