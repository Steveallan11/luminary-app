-- ═══════════════════════════════════════
-- Luminary Agent System Migration
-- Adds agent_tasks, agent_logs, and business_metrics
-- ═══════════════════════════════════════

create extension if not exists pgcrypto;

-- 1. CORE AGENT TABLES
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

-- 2. INDEXES
create index if not exists idx_agent_tasks_agent_name on public.agent_tasks(agent_name);
create index if not exists idx_agent_tasks_status on public.agent_tasks(status);
create index if not exists idx_agent_tasks_priority on public.agent_tasks(priority);
create index if not exists idx_agent_tasks_created_at on public.agent_tasks(created_at desc);

create index if not exists idx_agent_logs_agent_name on public.agent_logs(agent_name);
create index if not exists idx_agent_logs_run_at on public.agent_logs(run_at desc);

create index if not exists idx_business_metrics_date on public.business_metrics(date desc);

-- 3. UPDATED_AT TRIGGER
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_agent_tasks_updated_at on public.agent_tasks;
create trigger trg_agent_tasks_updated_at
before update on public.agent_tasks
for each row
execute function public.set_updated_at();

-- 4. RLS
alter table public.agent_tasks enable row level security;
alter table public.agent_logs enable row level security;
alter table public.business_metrics enable row level security;

-- Service-role access will bypass RLS. Keep client-facing policies restrictive by default.

-- Optional admin read policies can be added later once admin auth is wired more formally.
