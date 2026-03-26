# Luminary CEO Dashboard Spec

## Purpose

The CEO dashboard is the founder control room for Luminary.

It should help Steve answer, quickly and reliably:
- what matters today?
- what changed?
- what is blocked?
- what should I do next?

This dashboard is not a vanity analytics page. It is an operational surface for decision-making and task triage.

---

## Design Goal

The UI should feel like:
- calm but high-signal
- operational
- fast to scan
- structured around action, not decoration

Visual direction:
- dark sidebar
- metric cards
- status panels
- clear severity indicators
- compact task and log views

---

## Primary Users

### Main user
- Steve (founder/operator)

### Secondary future users
- trusted admin/operator roles

---

## Main Route

Recommended route:
- `/ceo`

Potential supporting routes:
- `/ceo/tasks`
- `/ceo/logs`
- `/ceo/agents/[agent]`
- `/ceo/metrics`

The first version can start with a single dashboard page and progressively add subviews.

---

## First Version Layout

### 1. Top Summary Bar
Purpose: immediate context at a glance.

Show:
- current date
- latest CEO run timestamp
- current priority count
- active blockers count
- open high-priority tasks count

### 2. KPI Cards Row
Purpose: top-line business and product pulse.

Suggested cards:
- MRR
- subscribers
- trials
- churned
- active sessions
- completed lessons

Cards should show:
- current value
- simple delta or trend if available
- optional small status tone (up/down/stable)

### 3. CEO Brief Panel
Purpose: the most important founder-facing summary.

This should show:
- short summary paragraph
- top 3 priorities
- key blockers
- recommended next actions

This is the single most important module on the page.

### 4. Agent Status Grid
Purpose: quick view of the specialist agents.

One card per agent:
- CEO
- Product & Tech
- Content & Curriculum
- Growth
- Support & Success
- Finance & Ops

Each card should show:
- latest run time
- run health/status
- summary line
- number of tasks created recently
- status tone (`ok`, `attention`, `blocked`)

### 5. Priority Task Queue
Purpose: see what actually needs doing.

Columns for first version:
- title
- agent
- priority
- status
- source
- created at

Filters:
- status
- priority
- agent

Useful actions:
- mark done
- mark blocked
- view payload/details

### 6. Recent Activity / Logs
Purpose: operational audit trail.

Show recent agent logs with:
- timestamp
- agent
- summary
- severity
- tasks created count

Useful action:
- expand to inspect full details JSON in a readable panel

### 7. Metrics Trend Panel
Purpose: trend awareness without overbuilding charts too early.

First version can include:
- simple sparkline or small area charts for
  - MRR
  - subscribers
  - trials
  - active sessions

If charting is not ready, use simple historical cards or mini tables first.

---

## Navigation Structure

### Sidebar
Suggested items:
- Overview
- Tasks
- Logs
- Agents
- Metrics
- Settings (later)

### Agent drilldown pages
Each specialist agent page should eventually show:
- latest summary
- recent runs
- tasks created
- recurring schedule
- configuration/prompt version (later)

---

## Founder Workflow Support

The dashboard should support these workflows well:

### Morning check-in
Steve opens `/ceo` and immediately sees:
- what matters today
- what’s blocking progress
- what has changed since yesterday

### Midday triage
Steve checks:
- new tasks
- support issues
- product/QA findings
- whether anything needs escalation

### Weekly review
Steve reviews:
- trend cards
- agent logs
- recurring themes
- which areas need focused work next week

---

## Key UI Components

### `CeoSummaryCard`
Displays:
- summary
- priorities
- blockers
- next actions

### `MetricCard`
Displays:
- title
- value
- delta/trend
- tone

### `AgentStatusCard`
Displays:
- agent name
- latest run time
- summary line
- state badge
- task count

### `TaskTable`
Displays:
- filtered operational tasks
- row actions
- status/priority badges

### `RunLogList`
Displays:
- recent logs
- severity markers
- expandable detail view

### `MiniTrendChart`
Optional for early version, useful later.

---

## Data Sources

### From `business_metrics`
- KPI cards
- trend charts
- top summary context

### From `agent_tasks`
- priority task queue
- open blockers count
- task distribution by agent

### From `agent_logs`
- CEO brief source
- agent status summaries
- recent activity list

---

## Suggested API Shape

### `GET /api/agents/ceo/dashboard`
Returns dashboard-ready payload containing:
- latest metrics
- CEO summary
- agent summaries
- priority tasks
- recent logs

### Example response shape

```json
{
  "overview": {
    "last_ceo_run_at": "2026-03-26T08:00:00Z",
    "open_high_priority_tasks": 4,
    "blockers": 1
  },
  "metrics": {
    "mrr": 0,
    "subscriber_count": 0,
    "trial_count": 8,
    "active_sessions": 14
  },
  "ceo_brief": {
    "summary": "Landing page trust fixes and auth clarity are the top immediate actions.",
    "priorities": [
      "Fix public placeholder links",
      "Audit login and post-auth flows",
      "Define first agent schema migration"
    ],
    "blockers": [
      "Production/demo auth boundaries are still blurred"
    ],
    "next_actions": [
      "Ship landing-page fixes",
      "Continue QA into learner and admin routes"
    ]
  },
  "agents": [],
  "tasks": [],
  "logs": []
}
```

---

## Initial Empty States

The dashboard should handle early-stage emptiness gracefully.

Examples:
- no metrics yet
- no logs yet
- no tasks yet
- only one agent implemented

Good empty states:
- explain what will appear here
- provide a button to run the CEO agent manually
- avoid making the dashboard feel broken when the system is young

---

## Actions Needed in First Version

Buttons worth including early:
- Run CEO Review
- Refresh Dashboard
- View All Tasks
- View All Logs

Avoid adding too many write actions in v1.

---

## What Not To Overbuild Yet

Do not overcomplicate the first dashboard with:
- custom drag-and-drop layouts
- too many charts
- granular permissions UI
- prompt editors embedded directly into the dashboard
- nested workflow builders
- fake AI animations or gimmicks

The dashboard should win on clarity and usefulness.

---

## Success Criteria

The CEO dashboard is successful if Steve can open it and within 60 seconds know:
- what matters now
- what is blocked
- what changed recently
- what he should do next

That is the bar.
