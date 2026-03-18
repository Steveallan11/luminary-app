-- Session 5: Luminary lesson engine additions
-- Adds only the missing lesson orchestration tables and required alterations

create extension if not exists pgcrypto;

create table if not exists topic_lesson_structures (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  age_group text not null check (age_group in ('5-7', '8-11', '12-14', '15-16')),
  version integer not null default 1,
  status text not null default 'generating' check (status in ('generating', 'live', 'archived')),
  generation_model text default 'claude-sonnet-4-6',
  spark_json jsonb,
  explore_json jsonb,
  anchor_json jsonb,
  practise_json jsonb,
  create_json jsonb,
  check_json jsonb,
  celebrate_json jsonb,
  personalisation_hooks jsonb,
  quality_score integer default 0,
  times_delivered integer default 0,
  avg_mastery_score double precision,
  auto_improvement_notes text,
  auto_approve_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (topic_id, age_group, version)
);

create table if not exists lesson_phase_tracking (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references learning_sessions(id) on delete cascade,
  current_phase text default 'spark' check (current_phase in ('spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate')),
  phase_started_at timestamptz default now(),
  objectives_covered uuid[] default '{}',
  mastery_signals jsonb default '{}'::jsonb,
  phase_history jsonb default '[]'::jsonb,
  hints_used integer default 0,
  practise_responses jsonb default '[]'::jsonb,
  check_responses jsonb default '[]'::jsonb,
  final_mastery_score integer,
  content_assets_shown text[] default '{}',
  created_at timestamptz default now()
);

alter table learning_sessions
  add column if not exists structure_id uuid references topic_lesson_structures(id),
  add column if not exists prior_knowledge_response text,
  add column if not exists is_revisit boolean default false;

alter table topics
  add column if not exists lesson_generation_status text,
  add column if not exists last_generated_at timestamptz;

alter table topic_lesson_structures enable row level security;
alter table lesson_phase_tracking enable row level security;

create policy if not exists "Allow authenticated users to view lesson structures"
  on topic_lesson_structures
  for select
  using (auth.role() = 'authenticated');

create policy if not exists "Allow authenticated users to manage lesson structures"
  on topic_lesson_structures
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy if not exists "Allow authenticated users to view lesson phase tracking"
  on lesson_phase_tracking
  for select
  using (auth.role() = 'authenticated');

create policy if not exists "Allow authenticated users to manage lesson phase tracking"
  on lesson_phase_tracking
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

insert into children (
  id,
  family_id,
  name,
  age,
  year_group,
  avatar,
  pin_hash,
  xp,
  streak_days,
  last_active_date
)
select
  gen_random_uuid(),
  f.id,
  'Lyla Rae',
  8,
  'Year 4',
  'unicorn',
  'demo-pin-hash',
  240,
  4,
  current_date
from families f
where not exists (
  select 1 from children c where lower(c.name) = 'lyla rae'
)
limit 1;
