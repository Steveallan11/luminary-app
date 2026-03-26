# Luminary Agent Cron Plan

## Purpose

This document defines the first practical recurring schedule for the Luminary agent system.

The goal is to automate useful founder workflows without generating noise.

---

## Principles

- prefer a small number of high-signal recurring runs
- avoid flooding Telegram with low-value updates
- send concise summaries, not essays
- use daily rhythm for operations and weekly rhythm for strategy
- keep each recurring run tied to a concrete purpose

---

## Delivery Surfaces

### Telegram
Use for:
- short daily summaries
- urgent issues
- reminders that need founder attention

### CEO Dashboard
Use for:
- full logs
- task queue
- trends
- drilldowns

---

## Daily Jobs

### 08:00 — CEO Morning Brief
**Agent:** `ceo`

**Purpose:**
- summarise what matters today
- identify blockers
- prioritise next actions

**Output:**
- short Telegram summary
- `agent_logs` entry
- optional tasks in `agent_tasks`

---

### 09:00 — Product & Tech Health Check
**Agent:** `product_tech`

**Purpose:**
- review unresolved bugs
- review release risks
- flag broken routes/flows if known
- identify top technical priorities

**Output:**
- log entry
- tasks for urgent tech work
- optional Telegram alert only if something important changed

---

### 11:30 — Growth Pulse
**Agent:** `growth`

**Purpose:**
- review waitlist/growth priorities
- suggest small conversion or messaging improvements
- keep growth work visible without overwhelming the day

**Output:**
- short log entry
- optional task creation
- no Telegram send unless something needs immediate attention

---

### 13:30 — Support & Success Digest
**Agent:** `support_success`

**Purpose:**
- summarise support pain points
- highlight onboarding friction
- identify repeated issues

**Output:**
- log entry
- support tasks
- Telegram alert only for high-severity trust/support issues

---

### 16:30 — Content & Curriculum Review
**Agent:** `content_curriculum`

**Purpose:**
- identify lesson quality issues
- flag low-mastery or high-drop-off topics
- suggest content priorities

**Output:**
- log entry
- content tasks
- no Telegram send by default

---

### 18:00 — CEO End-of-Day Wrap
**Agent:** `ceo`

**Purpose:**
- summarise progress
- note unresolved blockers
- suggest tomorrow’s focus

**Output:**
- short Telegram wrap
- log entry

---

## Weekly Jobs

### Monday 08:30 — Weekly CEO Planning Review
**Agent:** `ceo`

**Purpose:**
- define weekly priorities
- roll up major risks and opportunities
- set the tone for the week

**Output:**
- Telegram summary
- dashboard log
- priority tasks

---

### Tuesday 14:00 — Product / QA Deep Sweep
**Agent:** `product_tech`

**Purpose:**
- deeper review of product quality
- focus on regressions and weak flows

**Output:**
- quality-focused log
- implementation tasks

---

### Wednesday 15:00 — Content & Curriculum Strategy Review
**Agent:** `content_curriculum`

**Purpose:**
- review topic backlog
- identify curriculum gaps
- rank lesson-improvement priorities

**Output:**
- log entry
- content roadmap tasks

---

### Thursday 11:00 — Growth Review
**Agent:** `growth`

**Purpose:**
- evaluate waitlist and conversion opportunities
- suggest experiments or messaging updates

**Output:**
- growth review summary
- suggested actions/tasks

---

### Friday 16:00 — Finance & Ops Review
**Agent:** `finance_ops`

**Purpose:**
- review KPIs
- summarise trials/churn/subscriber movement
- flag founder admin deadlines or commercial issues

**Output:**
- Telegram summary
- dashboard log
- follow-up tasks

---

## Escalation Rules

### Telegram immediately when:
- there is a production-breaking issue
- a trust/compliance issue appears
- a major bug affects onboarding or learning
- a critical deadline/reminder is at risk

### Dashboard/log only when:
- it is informational
- it can wait for founder review
- it is a lower-severity observation

---

## Messaging Style

Recurring outputs should be:
- concise
- structured
- actionable
- easy to skim on mobile

Good format example:

```text
CEO Morning Brief
- Top priority: Fix learner login confusion
- Blocker: Public legal pages still missing
- Opportunity: Pricing page is live and should be linked from landing footer
- Next: Continue protected-route QA and define first agent schema migration
```

---

## Implementation Notes

### Option A: OpenClaw cron jobs
Use OpenClaw cron for scheduled invocations of the relevant agent route or run handler.

### Option B: App-native scheduler
Use internal scheduling or Vercel cron for API-triggered runs if the app itself becomes the agent execution host.

### Recommended first approach
Start with a scheduler that:
- calls the relevant run endpoint
- writes logs/tasks
- optionally sends Telegram summary via the existing assistant channel

---

## Start Small

Initial recommended enabled jobs:
1. CEO Morning Brief
2. Product & Tech Health Check
3. CEO End-of-Day Wrap
4. Weekly CEO Planning Review
5. Friday Finance & Ops Review

Then add the rest once signal quality is good.

---

## Success Criteria

The cron plan is working if:
- Steve gets fewer surprises
- priorities become clearer
- important work gets surfaced earlier
- recurring checks reduce founder mental load
- messages stay useful and not annoying
