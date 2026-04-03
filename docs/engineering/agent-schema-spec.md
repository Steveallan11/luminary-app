# Luminary Agent Schema Spec

## Purpose

This document defines the first practical database shape for the Luminary agent system.

The goal is not to model a giant enterprise platform. The goal is to create a clean, auditable, useful schema for:
- agent-generated tasks
- agent run logs
- business metric snapshots

This schema should support both dashboard-driven and cron-driven operations.

---

## Design Principles

- keep the first version lean
- optimise for founder operations, not theoretical completeness
- make runs and actions auditable
- support structured rendering in the dashboard
- avoid locking the system into overcomplicated workflow logic too early

---

## Table 1: `agent_tasks`

### Purpose
Stores structured work items created or updated by agents.

These tasks are the operational bridge between agent analysis and real execution.

### Suggested Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key | default `gen_random_uuid()` |
| `agent_name` | text | e.g. `ceo`, `product_tech`, `content_curriculum` |
| `task_type` | text | e.g. `bug_fix`, `content_review`, `growth_experiment` |
| `title` | text | short actionable title |
| `description` | text | longer operational context |
| `payload` | jsonb | structured metadata for execution |
| `status` | text | `pending`, `in_progress`, `blocked`, `done`, `cancelled` |
| `priority` | text | `low`, `medium`, `high`, `critical` |
| `source` | text | where task came from: `manual`, `cron`, `agent_run`, `support_signal` |
| `owner` | text nullable | optional human/agent owner |
| `due_at` | timestamptz nullable | optional deadline |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |
| `completed_at` | timestamptz nullable | set when task is done |

### Notes
- `payload` should hold structured implementation data instead of forcing everything into prose.
- `status` and `priority` should be constrained with checks.
- `updated_at` should be maintained automatically.

### Example Payloads

#### Bug task
```json
{
  "route": "/auth/login",
  "issue": "learner mode copy is confusing",
  "repo_path": "src/app/auth/login/page.tsx",
  "severity": "medium"
}
```

#### Content task
```json
{
  "subject": "maths",
  "topic": "fractions",
  "issue": "high drop-off in explore phase",
  "recommended_action": "review lesson visuals and simplify explanation"
}
```

---

## Table 2: `agent_logs`

### Purpose
Stores structured summaries of agent runs.

This is the audit trail and dashboard history layer.

### Suggested Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key | default `gen_random_uuid()` |
| `agent_name` | text | which agent ran |
| `run_type` | text | `manual`, `scheduled`, `triggered` |
| `run_at` | timestamptz | default `now()` |
| `summary` | text | concise summary for the founder/dashboard |
| `details` | jsonb | structured full output |
| `metrics_snapshot` | jsonb | business/ops context used during run |
| `actions_taken` | jsonb | actions executed or queued |
| `severity` | text nullable | overall importance of run |
| `created_tasks_count` | integer | default `0` |
| `created_at` | timestamptz | default `now()` |

### Notes
- `summary` should be scannable in a dashboard card.
- `details` should preserve the structured response from the agent.
- `actions_taken` should capture things like created tasks, status updates, or notifications sent.

### Example `details`
```json
{
  "findings": [
    {
      "title": "Homepage trust gap",
      "detail": "Footer still contains placeholder legal links.",
      "severity": "medium"
    }
  ],
  "recommended_actions": [
    {
      "title": "Replace dead legal links",
      "priority": "high"
    }
  ]
}
```

---

## Table 3: `business_metrics`

### Purpose
Stores daily business and operating snapshots.

This is the top-line input layer for CEO and specialist agents.

### Suggested Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key | default `gen_random_uuid()` |
| `date` | date unique | one snapshot per day |
| `mrr` | numeric(10,2) | monthly recurring revenue |
| `subscriber_count` | integer | active paying subscribers |
| `new_subs` | integer | new subscribers that day |
| `churned` | integer | churned subscribers that day |
| `trial_count` | integer | active trials |
| `active_sessions` | integer | platform usage signal |
| `completed_lessons` | integer nullable | optional learning volume signal |
| `support_count` | integer nullable | support load signal |
| `waitlist_count` | integer nullable | waitlist growth |
| `site_conversion_rate` | numeric(6,2) nullable | optional website KPI |
| `created_at` | timestamptz | default `now()` |

### Notes
Start small. More fields can be added later if needed.

---

## Recommended SQL (starter version)

```sql
create extension if not exists pgcrypto;

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  task_type text not null,
  title text not null,
  description text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  priority text not null default 'medium',
  source text not null default 'agent_run',
  owner text,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint agent_tasks_status_check check (status in ('pending', 'in_progress', 'blocked', 'done', 'cancelled')),
  constraint agent_tasks_priority_check check (priority in ('low', 'medium', 'high', 'critical'))
);

create table if not exists public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  run_type text not null default 'manual',
  run_at timestamptz not null default now(),
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  metrics_snapshot jsonb not null default '{}'::jsonb,
  actions_taken jsonb not null default '[]'::jsonb,
  severity text,
  created_tasks_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.business_metrics (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  mrr numeric(10,2) not null default 0,
  subscriber_count integer not null default 0,
  new_subs integer not null default 0,
  churned integer not null default 0,
  trial_count integer not null default 0,
  active_sessions integer not null default 0,
  completed_lessons integer,
  support_count integer,
  waitlist_count integer,
  site_conversion_rate numeric(6,2),
  created_at timestamptz not null default now()
);
```

---

## RLS Direction

Because these tables are operational and sensitive, default to restrictive RLS.

### Guidance
- allow read/write from server-side service role
- allow admin-only access from protected admin routes if needed
- do not expose direct client write access broadly

### Example approach
- enable RLS on all three tables
- use service-role access for agent routes and admin operations
- if needed, create admin-read policies for authenticated admin users only

---

## Index Recommendations

```sql
create index if not exists idx_agent_tasks_agent_name on public.agent_tasks(agent_name);
create index if not exists idx_agent_tasks_status on public.agent_tasks(status);
create index if not exists idx_agent_tasks_priority on public.agent_tasks(priority);
create index if not exists idx_agent_tasks_created_at on public.agent_tasks(created_at desc);

create index if not exists idx_agent_logs_agent_name on public.agent_logs(agent_name);
create index if not exists idx_agent_logs_run_at on public.agent_logs(run_at desc);

create index if not exists idx_business_metrics_date on public.business_metrics(date desc);
```

---

## Update Trigger Recommendation

Use a trigger to keep `updated_at` current on task updates.

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_agent_tasks_updated_at
before update on public.agent_tasks
for each row
execute function public.set_updated_at();
```

---

## What Not To Do Yet

Avoid adding all of this in v1:
- deeply nested workflow state machines
- task dependencies table
- agent-to-agent message bus tables
- complicated assignment systems
- over-normalised action/event tables

The first version should be useful quickly.

---

## First Build Recommendation

Implement in this order:
1. `agent_tasks`
2. `agent_logs`
3. `business_metrics`
4. RLS
5. indexes
6. dashboard wiring
7. cron jobs that populate and consume these tables
