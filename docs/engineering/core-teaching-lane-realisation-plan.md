# Luminary Core Teaching Lane Realisation Plan

## Purpose

This document defines the plan for turning Luminary’s core teaching lane from hybrid/demo into genuinely production-real.

The target lane is:

**auth → learner dashboard → subject/topic selection → lesson start → Lumi chat → session end/persistence**

This is the most important product lane in Luminary.
If this lane is not real, the product is not truly real.

---

## Current State Summary

The current lane has:
- strong UI structure
- real-feeling learner flow
- real streaming chat capability when Anthropic is configured
- hybrid Supabase reads in some places
- mock child/topic/lesson/session context in too many critical places
- incomplete persistence at the end of the loop

In short:
**the shell is stronger than the backend truth model**

---

## Target End State

The lane should become:

### Auth
- real parent auth
- real learner selection
- real learner PIN validation
- real selected-child context

### Learner dashboard
- reads real learner, progress, subject, and topic data
- no silent mock fallback in production mode

### Lesson start
- creates a real lesson session
- fetches a real topic and lesson structure
- resolves real learner context

### Lumi chat
- uses real learner, topic, structure, and session state
- streams real AI output when configured
- uses explicit demo mode only when intentionally enabled

### Session end
- persists XP, mastery, progress, and session data
- updates future dashboard/subject map state

That is the bar.

---

## Main Problems To Solve

### 1. Identity is not trustworthy enough yet
Current login behavior is still demo-oriented.

### 2. Learner context is not propagated reliably
The system cannot yet trust that the active learner context is real and durable.

### 3. Lesson start is not DB-backed enough
The system is not yet creating and grounding lessons in canonical persisted records.

### 4. Lumi chat is real-model / fake-context in too many cases
The model can be real while the context is still mocked.

### 5. Session completion does not close the loop properly
Without persistence, the lane does not create real product continuity.

---

## Implementation Principles

- make the lane explicitly real or explicitly demo
- do not silently mask production failures with mock fallback
- prefer a smaller genuinely real lane over a larger fake-feeling one
- keep mock mode for development/demo only behind explicit controls
- preserve current UX quality while replacing backend truth sources underneath

---

## Recommended Build Order

## Phase 1 — Identity and learner context

### Goal
Make learner identity real enough that the rest of the lane can trust it.

### Work
1. Replace hardcoded learner login behavior
2. Replace simulated parent login behavior
3. implement real learner selection and PIN verification
4. establish selected-child context in a real, durable way
5. ensure learn routes can resolve current learner correctly

### Likely files
- `src/app/auth/login/page.tsx`
- `src/app/auth/onboarding/page.tsx`
- `src/lib/supabase.ts`
- related auth/session helpers

### Deliverable
A user can sign in and enter the learn area with a real learner identity, not demo assumptions.

---

## Phase 2 — Make read paths trustworthy

### Goal
Ensure learner and subject/topic data comes from real sources and fails honestly.

### Work
1. tighten `/api/learn/subjects`
2. tighten `/api/learn/child-profile`
3. remove silent mock fallback in production mode
4. surface explicit error/loading states when real data is unavailable
5. ensure subject/topic/progress reads are scoped to the real learner/family

### Likely files
- `src/app/api/learn/subjects/route.ts`
- `src/app/api/learn/child-profile/route.ts`
- `src/app/learn/page.tsx`
- `src/app/learn/[slug]/page.tsx`

### Deliverable
The learner dashboard and subject views are backed by real data or fail clearly.

---

## Phase 3 — Real lesson session creation

### Goal
Make lesson start create a real session grounded in DB records.

### Work
1. update `/api/lesson/start`
2. resolve child from real identity/session
3. resolve topic from DB
4. fetch real lesson structure for the child/topic/age group
5. create real lesson session record
6. optionally create phase-tracking record

### Likely files
- `src/app/api/lesson/start/route.ts`
- `src/lib/lesson-engine.ts` (refactor or replace production path)
- Supabase schema/session helpers

### Deliverable
Starting a lesson yields a real session id and real persisted context.

---

## Phase 4 — Realise Lumi context

### Goal
Make Lumi talk from real learner/topic/session state rather than mock context.

### Work
1. update `/api/lumi/opening-message`
2. update `/api/lumi/chat`
3. pass real child info
4. pass real topic info
5. pass real lesson structure
6. pass real progress/session context
7. keep demo fallback only behind explicit dev/demo mode

### Likely files
- `src/app/api/lumi/opening-message/route.ts`
- `src/app/api/lumi/chat/route.ts`
- `src/lib/lumi-prompt.ts`
- `src/lib/lesson-engine.ts` or production lesson context helpers

### Deliverable
Claude responses are grounded in real Luminary state, not just real model calls over mock inputs.

---

## Phase 5 — Persist the loop

### Goal
Make the end of a lesson update the real product state.

### Work
1. update `/api/lumi/session-end`
2. persist session summary
3. persist mastery/progress changes
4. update child XP and streak
5. update child_topic_progress
6. optionally update achievements / spaced repetition / phase tracking

### Likely files
- `src/app/api/lumi/session-end/route.ts`
- `src/app/api/learn/topic-progress/route.ts` (if retained as separate path)
- mastery/session helpers

### Deliverable
A completed lesson produces durable state that appears in learner and parent surfaces.

---

## Phase 6 — Remove ambiguity

### Goal
Make production and demo behavior clearly separate.

### Work
1. define explicit demo mode flag(s)
2. gate mock fallbacks behind demo/dev mode only
3. remove hidden production fallback to mock data
4. document route readiness and production assumptions

### Deliverable
The team can tell whether the lane is actually working.

---

## Route Checklist

### `/auth/login`
- [ ] no hardcoded learner list
- [ ] no any-4-digit PIN shortcut in production mode
- [ ] parent login verified properly
- [ ] selected learner is stored and trusted

### `/learn`
- [ ] uses real learner context
- [ ] no hidden fallback to mock data in production mode
- [ ] errors are visible and actionable

### `/learn/[slug]`
- [ ] real topic availability and unlock logic
- [ ] real progress source

### `/learn/[slug]/[topic]`
- [ ] bootstraps from real learner/session
- [ ] uses real content/lesson context
- [ ] session start/end are durable

### `/api/learn/subjects`
- [ ] real DB source
- [ ] proper scoping
- [ ] explicit error behavior

### `/api/learn/child-profile`
- [ ] real learner lookup
- [ ] recent session retrieval is correct
- [ ] explicit error behavior

### `/api/lesson/start`
- [ ] creates real session
- [ ] fetches real lesson structure
- [ ] uses real learner/topic

### `/api/lumi/opening-message`
- [ ] real child/topic/structure prompt context

### `/api/lumi/chat`
- [ ] real session-aware prompt context
- [ ] explicit demo mode only

### `/api/lumi/session-end`
- [ ] persists session
- [ ] updates progress
- [ ] updates XP/streak

---

## What To Defer

Do not let these distract from the lane becoming real:
- parent dashboard polish
- achievement bells and whistles
- advanced agent automation
- deeper reporting polish
- edge-case visual enhancements

The core loop is more important.

---

## Success Criteria

This plan is successful when:
- a real learner can sign in
- start a real lesson
- chat with Lumi using real grounded context
- finish the lesson
- see progress persist afterward

If those five things are true, Luminary crosses an important threshold from impressive prototype to real product.

---

## Recommended Immediate Next Action

The very next implementation target should be:

### **Phase 1 + Phase 3 planning combined**
Meaning:
- lock learner identity/auth model
- define real lesson session model

Those two foundations determine everything else in the lane.
