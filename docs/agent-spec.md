# Luminary Agent System Spec

## Purpose

The Luminary agent system is a business automation and operational support layer for the platform.

It exists to help run Luminary as a business and product, not to replace human judgment. It should help Steve operate faster, see the important things sooner, and turn recurring founder work into structured workflows.

This system is separate from **Lumi**, the child-facing tutor.

- **Lumi** teaches children.
- **Luminary agents** support business operations, product oversight, content operations, and execution.

---

## Core Principles

### 1. Assist the operator, do not impersonate the operator
Agents should help Steve make decisions, prepare work, identify issues, and structure follow-up.

They should not silently act like autonomous executives making irreversible choices without oversight.

### 2. Prefer structured outputs over vague chat
Agent outputs should be operationally useful.

They should produce:
- summaries
- findings
- proposed actions
- task objects
- priority or severity indicators
- audit-friendly logs

### 3. Separate analysis from action
An agent may detect a problem and recommend an action, but that does not always mean it should take the action automatically.

Default model:
- observe
- analyse
- recommend
- queue/prepare
- execute only where safe and intended

### 4. Be useful in recurring workflows
The system should support both:
- dashboard-triggered on-demand reviews
- cron-triggered recurring workflows

### 5. Stay lightweight enough for a solo-founder business
The system should reduce overhead, not create an enterprise theatre layer full of dashboards nobody uses.

---

## System Goal

The goal is to create a practical founder operating layer that can:
- summarise business state
- highlight risks and opportunities
- create and track tasks
- support product and engineering decisions
- support marketing and sales execution
- support customer/support operations
- give Steve a clear daily and weekly picture of what matters

---

## Agent Topology

The recommended first version is:
- one **CEO agent** as orchestrator
- four specialist sub-agents:
  - Tech
  - Marketing
  - Sales
  - Support

This is enough structure to be useful without becoming overdesigned.

---

## CEO Agent

### Role
The CEO agent is the orchestration and synthesis layer.

It should read the current business state, review outputs from sub-agents, and produce concise operating guidance.

### Responsibilities
- read current business metrics
- read recent agent logs
- review open and recently completed tasks
- identify the most important issues, opportunities, and bottlenecks
- recommend priorities for Steve
- trigger or coordinate specialist sub-agent work where appropriate
- generate daily / weekly founder briefings

### Good Output Shape
A good CEO agent output should include:
- top-line summary
- what changed
- what needs attention now
- what can wait
- recommended next actions
- tasks created or updated

### What It Should Not Do
The CEO agent should not:
- spam the founder with low-value observations
- make external commitments silently
- behave like a motivational quote machine
- bury decisions inside walls of text

---

## Tech Agent

### Role
The Tech agent supports engineering, product implementation, technical risk review, and developer operations.

### Responsibilities
- review bugs, failures, or regressions
- monitor technical debt or dependency issues
- summarise engineering priorities
- break implementation goals into tasks
- support schema / API / dashboard planning
- identify blockers in the build pipeline
- help translate product decisions into technical execution plans

### Example Use Cases
- daily technical status summary
- identify build blockers before a coding session
- review open product implementation priorities
- prepare a scoped task plan for a feature
- flag migrations or infra work that should happen before UI work

### Typical Inputs
- error logs
- deployment/build signals
- issue lists
- technical roadmap items
- recent product priorities

### Typical Outputs
- technical summary
- blockers
- implementation plan
- recommended task breakdown
- risk flags

---

## Marketing Agent

### Role
The Marketing agent supports demand generation, content planning, messaging, and discoverability.

### Responsibilities
- create or refine content ideas
- support blog / social / SEO planning
- review messaging consistency
- identify content production priorities
- track campaign ideas and growth experiments
- help operationalise the content pipeline

### Example Use Cases
- weekly content plan
- homepage or landing-page messaging drafts
- founder social post drafts
- SEO opportunity list
- grant / launch messaging support

### Typical Outputs
- campaign summary
- content ideas
- draft copy
- recommended tasks
- priority sequence for publishing work

---

## Sales Agent

### Role
The Sales agent supports conversion, outreach, pricing awareness, and revenue-oriented follow-up.

### Responsibilities
- monitor trial funnel and conversions
- flag churn risks or drop-off patterns
- support school outreach workflows
- propose follow-up actions for interested leads
- help Steve prioritise revenue-relevant work

### Example Use Cases
- daily trial conversion review
- weekly outreach queue
- draft follow-up messaging
- identify where the funnel is leaking
- recommend founder actions likely to increase revenue sooner

### Typical Outputs
- funnel summary
- sales opportunities
- risk notes
- outreach tasks
- suggested follow-up drafts

---

## Support Agent

### Role
The Support agent supports onboarding, issue triage, and customer-facing operational readiness.

### Responsibilities
- review support requests or reported friction
- group repeated problems into themes
- draft support replies
- identify onboarding pain points
- flag issues affecting trust, reporting, or learning continuity
- help keep founder support work structured

### Example Use Cases
- support inbox triage
- weekly issue clustering
- onboarding friction review
- draft replies for common support cases
- LA report or parent dashboard issue escalation

### Typical Outputs
- triage summary
- user pain themes
- recommended fixes
- response drafts
- severity tags

---

## Data Model

The first pass of the agent system should use three core tables.

### `agent_tasks`
Purpose: structured queue of work items created or updated by agents.

Suggested fields:
- `id`
- `agent_name`
- `task_type`
- `payload`
- `status`
- `priority`
- `result`
- `created_at`
- `completed_at`

Suggested status values:
- `pending`
- `in_progress`
- `blocked`
- `done`
- `cancelled`

Suggested priority values:
- `low`
- `medium`
- `high`
- `critical`

### `agent_logs`
Purpose: audit trail of agent runs and outputs.

Suggested fields:
- `id`
- `agent_name`
- `run_at`
- `summary`
- `metrics_snapshot`
- `actions_taken`

This table should make it easy to answer:
- what ran
- when it ran
- what it concluded
- what it changed or recommended

### `business_metrics`
Purpose: daily operating snapshot for business health.

Suggested fields:
- `id`
- `date`
- `mrr`
- `subscriber_count`
- `new_subs`
- `churned`
- `trial_count`
- `active_sessions`

This is the minimum starting shape. It can expand later, but the first version should stay pragmatic.

---

## Operating Modes

### On-Demand Mode
Founder triggers an agent or CEO review manually from the dashboard.

This is useful for:
- checking current state
- generating a fresh strategic summary
- forcing a task refresh
- getting a focused analysis of one area

### Scheduled Mode
Recurring jobs run via cron or a scheduler.

Initial good candidates:
- daily founder summary
- weekly priority review
- technical risk sweep
- support triage sweep
- content pipeline review
- sales funnel review

The scheduled system should be useful but quiet. Recurring runs should surface signal, not noise.

---

## Output Format Expectations

Agents should produce outputs that are easy to store, display, and act on.

A recommended shape is:

```json
{
  "summary": "Short operational summary",
  "findings": [
    {
      "title": "Finding title",
      "detail": "What matters",
      "severity": "medium"
    }
  ],
  "recommended_actions": [
    {
      "title": "Action title",
      "reason": "Why this matters",
      "priority": "high"
    }
  ],
  "tasks_created": [
    {
      "agent_name": "tech",
      "task_type": "investigate_bug",
      "priority": "high"
    }
  ]
}
```

The exact schema can evolve, but outputs should stay structured enough for dashboard rendering and logging.

---

## Routing and Execution Model

### Recommended Flow
1. A manual trigger or scheduled job starts a run
2. The CEO agent optionally gathers current metrics and recent logs
3. The CEO agent decides which specialist agents should run
4. Specialist agents return structured outputs
5. The CEO agent synthesises key points into a founder-facing summary
6. Tasks and logs are written to storage
7. Dashboard surfaces reflect the latest state

### Important Constraint
The CEO agent should orchestrate and summarise. Specialist agents should do the deeper domain-specific reasoning.

That keeps the system modular and easier to extend.

---

## Dashboard Expectations

The CEO dashboard should feel like a command centre, not a decorative analytics page.

It should show:
- top business metrics
- agent statuses
- latest run summaries
- task queue
- critical issues / blockers
- recent activity log

Useful views may include:
- overview
- task queue
- run history
- per-agent detail
- metrics trend cards

The dashboard should help Steve answer:
- what matters today?
- what changed?
- what is blocked?
- what should I do next?

---

## Guardrails

### External Actions
Agents should not take risky or public external actions by default without clear approval.

Examples:
- sending emails
- publishing posts
- contacting leads
- modifying production systems in destructive ways

### Destructive Changes
Agents should not delete, wipe, or silently mutate critical business data without explicit instruction.

### Traceability
Important actions should be visible through logs, tasks, or summaries.

### Signal Over Noise
The system should avoid generating endless low-value commentary.

A useful system says:
- here are the 3 things that matter
- here is what changed
- here is what to do next

It does not produce generic management theatre.

---

## Cron and Founder Ops Use Cases

The agent layer is a good home for recurring founder workflows.

Examples:
- morning founder briefing
- trial / signup review
- churn / inactivity check
- technical blocker summary
- support issue digest
- content queue reminder
- grant / outreach reminder cadence

These jobs should be short, actionable, and easy to scan from Telegram or the dashboard.

---

## Relationship to Repo Documentation

This spec should work alongside:
- `/docs/master-operating-brief.md`
- `/docs/ceo-dashboard-spec.md`
- `/docs/admin-map.md`
- `/docs/content-system.md`

`CLAUDE.md` should only point to these docs. It should not absorb all of their detail.

---

## Recommended First Build Sequence

1. Create the agent data model (`agent_tasks`, `agent_logs`, `business_metrics`)
2. Add a basic CEO dashboard shell
3. Implement a manual CEO run endpoint
4. Implement at least one specialist sub-agent end to end
5. Store structured outputs and show them in the dashboard
6. Add scheduled recurring runs
7. Expand the agent layer only after the first loop is genuinely useful

This keeps the first version real and testable.

---

## What Good Looks Like

A good Luminary agent system should:
- reduce founder cognitive load
- improve visibility into what matters
- turn recurring work into repeatable workflows
- make priorities clearer
- stay auditable and controlled
- support growth without pretending to be a fully autonomous company

If it feels like a practical founder operating system, it is working.
If it feels like elaborate theatre, it is not.
