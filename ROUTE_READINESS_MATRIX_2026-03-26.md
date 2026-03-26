# Luminary Route Readiness Matrix — 2026-03-26

## Purpose

This document classifies Luminary routes as one of:
- **Real** — primarily backed by real routing/auth/data logic
- **Hybrid** — mixes real structure with mock/demo/fallback behavior
- **Mock** — primarily demo/mock-backed
- **Unknown** — not yet deeply reviewed

This is a build-planning tool.

---

## Readiness Summary

### Public / Marketing
| Route | Status | Notes |
|---|---|---|
| `/` | Hybrid | Real landing page, but had placeholder footer links and some unfinished trust surfaces. |
| `/pricing` | Hybrid | Real page/UI, but uses `MOCK_FAMILY` for current tier and Stripe route integration needs validation. |

### Auth / Onboarding
| Route | Status | Notes |
|---|---|---|
| `/auth/login` | Hybrid | Real route/UI, but learner/parent/admin flows use demo/mock logic heavily. |
| `/auth/signup` | Mock | Explicitly simulated signup; comments say production would use Supabase later. |
| `/auth/onboarding` | Mock/Hybrid | Real UI flow but appears local-state only from current review; needs backend persistence audit. |

### Learner Experience
| Route | Status | Notes |
|---|---|---|
| `/learn` | Hybrid | Fetches APIs, but silently falls back to mock data. |
| `/learn/[slug]` | Unknown | Needs route-specific review. |
| `/learn/[slug]/[topic]` | Hybrid | Strong real UI/state/streaming structure, but still heavily mock-driven for child/topic/content context. |

### Parent Experience
| Route | Status | Notes |
|---|---|---|
| `/parent` | Mock | Dashboard is heavily driven by `MOCK_*` data in page component. |
| `/progress` | Unknown | Not yet reviewed. |
| `/profile` | Unknown | Not yet reviewed. |
| `/achievements` | Unknown | Not yet reviewed. |

### Admin Experience
| Route | Status | Notes |
|---|---|---|
| `/admin/*` layout | Hybrid/More Real | Admin layout enforces auth and redirects to admin login mode. |
| `/admin/content` | Unknown | Not yet reviewed deeply. |
| `/admin/lessons` | Unknown | Not yet reviewed deeply. |
| `/admin/library` | Unknown | Not yet reviewed deeply. |
| `/admin/images` | Unknown | Not yet reviewed deeply. |
| `/admin/reports` | Unknown | Not yet reviewed deeply. |
| `/admin/safety` | Unknown | Not yet reviewed deeply. |
| `/admin/performance` | Unknown | Not yet reviewed deeply. |
| `/admin/test-lesson/[id]` | Unknown | Likely important; needs deep review. |

### API Routes
| Route | Status | Notes |
|---|---|---|
| `/api/learn/subjects` | Hybrid | Tries Supabase, falls back to mock data. |
| `/api/learn/child-profile` | Hybrid | Tries Supabase, falls back to mock data; also references `learning_sessions` table which may need validation. |
| `/api/learn/topic-progress` | Unknown | Not yet reviewed. |
| `/api/parent/dashboard` | Mock | Explicitly returns enriched mock data. |
| `/api/reports/generate` | Unknown | Not yet reviewed. |
| `/api/stripe/checkout` | Unknown | Needs runtime validation. |
| `/api/admin/login` | Hybrid/More Real | Used by admin login flow; needs auth/session validation. |
| `/api/admin/*` content/lesson/media routes | Unknown | Needs deeper audit to assess how many are fully wired. |
| `/api/lumi/chat` | Hybrid | Real Anthropic streaming path exists, but lesson/topic/child context is still mostly mock-backed and demo fallback stream exists when no API key is present. |
| `/api/lesson/start` | Hybrid | Real route and lesson-engine entry point, but currently returns mock child context and local/mock-backed lesson state. |
| `/api/lumi/*` other | Unknown | Remaining Lumi routes still need audit. |
| `/api/lesson/*` other | Unknown | Remaining lesson routes still need audit. |

---

## Key Findings

### 1. The biggest current issue is boundary clarity
The app currently mixes:
- real route structure
- real-looking UI
- partial real auth/data logic
- mock fallbacks
- explicit demo behavior

This makes launch readiness hard to judge quickly.

### 2. Parent area is less real than it looks
The parent dashboard is currently mock-heavy in the route component itself.

### 3. Learner area is more dangerous than a pure mock route
The learner dashboard silently falls back to mock data if real API fetches fail.
That can make real backend issues harder to notice.

### 4. Auth is structurally useful but not production-clean
The login route is useful for testing UX and flow ideas, but it is still hybrid/demo-oriented.

---

## Recommended Build Order

### Phase 1 — Clarity
1. Mark or gate demo behavior explicitly
2. Remove silent fallback where it hides real failures
3. Decide which routes are expected to be production-ready first

### Phase 2 — Make one core lane real end-to-end
Recommended target lane:
- auth -> learner dashboard -> lesson start

Alternative target lane:
- auth -> parent dashboard -> reports

### Phase 3 — Expand truthfully
Once one lane is genuinely real, continue converting hybrid/mock routes with clearer confidence.

---

## Recommended Next Audits

1. `/learn/[slug]/[topic]`
2. `/api/lesson/start`
3. `/api/lumi/chat`
4. `/admin/lessons`
5. `/api/admin/generate-lesson`
6. `/api/reports/generate`

These will show whether the real product core is stronger on the lesson/admin side than the dashboard/auth side.
