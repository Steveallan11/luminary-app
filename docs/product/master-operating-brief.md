# Luminary — Master Operating Brief

## Purpose

This document is the working operating brief for Luminary. It gives coding agents and human collaborators the minimum detailed context needed to understand the product, architecture direction, business model, and current priorities without bloating `CLAUDE.md`.

`CLAUDE.md` should stay lean. This file exists so that implementation work can pull in richer context only when needed.

---

## What Luminary Is

Luminary is a UK AI homeschooling platform for children aged 5–16.

Its core experience is **Lumi**, a warm, Socratic AI tutor who teaches through conversation instead of static lessons, worksheets, or passive videos. Luminary is designed to feel engaging for children, useful for parents, and defensible for Local Authorities who need evidence of structured education.

Luminary is not just a chatbot for children. It is a learning platform with:
- a structured lesson engine
- mastery and progress tracking
- parent visibility
- admin content operations
- reporting for Local Authority compliance
- an emerging business automation / agent layer for founder operations

---

## Core Product Surfaces

### 1. Child Learning Experience
The child-facing product is the heart of Luminary.

Children log in, choose a subject/topic, and learn through a streaming conversation with Lumi. The experience should feel alive, playful, and encouraging without becoming chaotic or unstructured.

Key characteristics:
- conversational, not worksheet-first
- guided by a fixed pedagogical arc
- personalised to age and understanding level
- able to inject visuals, games, diagrams, and activities inline
- designed to reward understanding, not just completion

### 2. Parent Dashboard
Parents need clear evidence that learning is happening.

The parent side should provide:
- topic and subject progress
- learning time and activity summaries
- mastery indicators
- recent session history
- report generation for oversight and compliance

### 3. Admin Production Studio
The admin layer is where Luminary content is created, reviewed, improved, and governed.

This includes:
- topic and lesson generation
- phase-by-phase content editing
- media attachment and review
- testing lessons in an admin simulation environment
- performance and quality oversight
- future prompt and version management

### 4. Local Authority Reporting
Luminary should produce defensible progress evidence for elective home education.

Reports should show:
- curriculum coverage
- learning activity
- topic mastery
- time spent
- examples of demonstrated understanding
- evidence aligned to UK educational expectations where appropriate

### 5. CEO / Agent Layer
A separate operational layer will support founder workflows and business automation.

This is not the child tutor. It is a business operations system that helps manage:
- product and engineering oversight
- marketing/content workflows
- sales and conversion monitoring
- support operations
- business metrics and prioritisation

---

## Who Luminary Is For

### Children
Primary learners are children aged 5–16, segmented by Key Stage.

The first learner context currently referenced in planning is:
- **Lyla Rae**
- age 8
- Year 4
- KS2
- strong interest in Maths, English, History, Art

The product should adapt tone, pacing, vocabulary, humour, and challenge level based on the child’s age and stage.

### Parents
Parents need trust, visibility, and proof.

They are not just buying “AI chat.” They are buying:
- a structured learning system
- confidence in educational direction
- easy oversight
- reduced planning/admin burden
- useful reporting they can actually show someone

### Local Authorities
Local Authorities are not the daily user, but they matter.

Luminary’s reporting and structure should be defensible enough to demonstrate that a child is receiving meaningful education through a coherent platform rather than random screen time.

---

## Core Product Model

### The 7-Phase Lesson Arc
Every Luminary lesson should follow a consistent pedagogical structure:

1. **Spark** — hook curiosity with a question, surprise, scenario, or dramatic opening
2. **Explore** — teach the core concept using examples, visuals, analogies, and guided explanation
3. **Anchor** — have the child explain or reflect back to prove genuine understanding
4. **Practise** — use scaffolded questions and guided application
5. **Create** — ask for a creative or open-ended application of the concept
6. **Check** — assess understanding with clearer correctness criteria
7. **Celebrate** — reinforce success, reflect, and point toward what comes next

This structure should be stable across the platform. Personalisation should happen within the structure, not by abandoning it.

### Conversational Delivery
Luminary’s core learning interface is a streaming chat experience.

Lumi should be able to emit structured signals that the frontend interprets to render richer inline experiences, such as:
- `[CONTENT:*]`
- `[IMAGE:*]`
- `[PHASE:*]`

This allows the conversation layer and UI layer to work together rather than forcing everything into plain text.

### Personalisation Layer
Luminary should personalise:
- language difficulty
- response style
- pacing
- examples
- humour
- scaffolding
- follow-up questions

But the underlying lesson structure, learning goals, and quality controls should remain consistent.

---

## Core Technical Direction

### Stack
Luminary is being built on:
- Next.js 14 App Router
- TypeScript
- Supabase (database, auth, storage, realtime)
- Tailwind CSS
- Anthropic Claude models
- Stripe
- Resend
- Vercel

### Architectural Pattern
The platform should separate:
- **content structure** from
- **live conversational delivery** from
- **analytics/improvement feedback**

That separation matters because Luminary is not just generating messages. It is generating and serving a reusable learning system.

### Database Direction
Existing core platform tables should be treated carefully. New work should extend the system rather than rename or destroy current structures.

Important known data areas include:
- families and children
- subjects and topics
- child progress
- lesson sessions
- lesson structures
- lesson phase tracking
- achievements
- spaced repetition
- safety flags
- admin users

Planned business automation tables include:
- `agent_tasks`
- `agent_logs`
- `business_metrics`

---

## Fundamental Scaling Decision

### Recommended Model
Luminary should scale lesson creation using:

**pre-generate in batches → human review → serve instantly → improve with data**

This is a foundational product and engineering principle.

### Why Not Pure On-Demand Generation
Pure on-demand generation creates several problems:
- first-child waiting time damages the experience
- lesson quality is less consistent
- there is no review checkpoint before delivery
- AI cost becomes less predictable as usage grows

### Why Not Fully Manual Authoring
A fully hand-built model does not scale:
- too slow to build breadth of curriculum
- makes the founder the bottleneck
- difficult to improve systematically using data

### What the Chosen Model Enables
This hybrid model allows Luminary to:
- ship lessons instantly to children
- keep quality under review
- manage AI cost more predictably
- update lessons based on real usage
- scale far beyond manual authoring capacity

### Human-in-the-Loop Pipeline
The intended content pipeline is:
1. create a topic brief
2. generate a lesson structure with AI
3. review and edit before publication
4. publish for instant child delivery
5. collect session/mastery/drop-off data
6. improve future lesson versions using real evidence

This should be treated as a durable operating principle.

---

## Visual Lumi Principle

Visual teaching is a defining product advantage for Luminary.

Lumi should not just describe visuals. She should find or generate them, verify that they are educationally suitable, and then teach from what she can actually “see” using model vision.

### Recommended Visual Flow
**cache first → search/generate when needed → verify accuracy → teach with vision → cache approved result**

### Operational Logic
1. Check for an existing approved visual for the topic/phase
2. If none exists, search or generate based on subject type
3. Verify educational accuracy before showing the child
4. Pass the approved image to the model as vision input
5. Have Lumi teach from the actual image content
6. Cache the approved result for future learners

### Source Strategy
The current design direction is:
- factual subjects: sources like Wikimedia first
- art: actual artworks where possible
- abstract concepts: generated educational visuals when necessary

### Why This Matters
This makes Lumi materially more useful than a text-only tutor because she can:
- reference real parts of a diagram or artwork
- guide observation
- ask grounded questions
- build stronger understanding during the Explore phase

---

## Reporting and Educational Evidence

Luminary should capture and surface the kinds of evidence needed for parent confidence and LA compliance.

Important reporting dimensions include:
- topics studied
- lesson attempts
- total learning time
- mastery score / band
- curriculum alignment
- examples of child responses and understanding
- consistency of engagement over time

Reports should feel clear and defensible, not just decorative.

---

## Current Known Priorities

Based on the current briefs and uploaded materials, the main known priorities are:

1. **Apply or verify production migration work for `lesson_phase_media`**
2. **Render child-facing `[IMAGE:url]` signals properly in the learning UI**
3. **Add admin knowledge-base upload UI for PDFs/text**
4. **Wire LA report PDF export in the parent dashboard**
5. **Design and implement the CEO / sub-agent automation system**

These priorities may evolve, but they are the current known implementation focus.

---

## Documentation Strategy

Luminary should use a layered documentation model.

### `CLAUDE.md`
Keep it lean.

It should act as the fast-reference brief read at the start of coding sessions. It should contain:
- identity of the product
- non-negotiable rules
- high-level architecture constraints
- links to detailed docs

### `/docs/*.md`
Use detailed docs for area-specific implementation context.

Recommended docs structure:
- `/docs/master-operating-brief.md`
- `/docs/agent-spec.md`
- `/docs/ceo-dashboard-spec.md`
- `/docs/admin-map.md`
- `/docs/content-system.md`

This prevents context bloat while preserving depth where needed.

---

## Working Rules for Coding Agents

When working on Luminary:
- read `CLAUDE.md` first
- read relevant `/docs/...` files for the area being changed
- read existing files before adding new ones in that area
- read `/supabase/migrations/` before schema changes
- do not rename or drop existing tables, columns, files, or components unless explicitly instructed
- add instead of replacing where possible
- use TypeScript types
- handle errors explicitly
- add RLS policies for new database tables
- keep UI systems separated by audience (child vs parent vs admin vs agent)
- commit changes in logical chunks

---

## Design System Separation

Luminary contains multiple product surfaces with distinct design rules.

### Child UI
- cosmic
- playful
- animated
- dark purple / teal energy
- emotionally warm and engaging

### Parent UI
- clean
- warm
- professional
- reassuring
- calm and readable

### Admin UI
- denser
- precise
- operational
- tool-like, not playful

### CEO / Agent UI
- command-centre feel
- dark sidebar
- metrics, queues, status, operational clarity

These systems should not be mixed. Child styling should not leak into admin or agent interfaces.

---

## What Good Looks Like

A strong Luminary implementation should feel like this:
- instant to start
- warm and personal for the child
- structured enough to drive real learning
- measurable enough for parents and reporting
- manageable enough for one founder to operate
- scalable enough to grow beyond manual content creation
- reviewable enough that quality does not drift unchecked

That combination is the real product.
