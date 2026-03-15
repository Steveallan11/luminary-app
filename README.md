# Luminary — Learning That Lights Up Every Child

An AI-powered homeschooling platform for UK children aged 5–16. Built with Next.js 14, Supabase, Tailwind CSS, Framer Motion, and powered by Claude AI.

## Overview

Luminary provides two user experiences:

- **Child**: An immersive, cosmic-themed learning universe with 15 subjects, visual learning maps, XP tracking, streaks, achievements, and a personalised AI tutor called Lumi
- **Parent**: A clean, data-rich dashboard for monitoring progress, managing child profiles, and adjusting settings

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Framework |
| Supabase (PostgreSQL) | Database & Auth |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| Anthropic Claude API | AI Tutor (Lumi) |
| Google Fonts | Nunito, Fraunces, JetBrains Mono |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project
- Anthropic API key

### Installation

```bash
git clone <repo-url>
cd luminary
pnpm install
```

### Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy contents of supabase-schema.sql into Supabase SQL Editor
```

This creates all tables, RLS policies, and seeds 15 subjects with sample topics.

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build
pnpm start
```

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with starfield, hero, features, subject preview |
| `/auth/signup` | Parent account creation |
| `/auth/login` | Login with child selector and PIN entry |
| `/auth/onboarding` | Add first child (name, age, year group, avatar, PIN) |
| `/learn` | Child home — Learning Universe with 15 subject cards |
| `/learn/[slug]` | Subject page with visual learning map |
| `/learn/[slug]/[topic]` | **Full AI lesson** — Streaming chat with Lumi |
| `/parent` | Parent dashboard with stats, progress, activity |
| `/progress` | Child's progress overview across all subjects |
| `/achievements` | Badges and achievements |
| `/profile` | Child profile with avatar, XP, streak |

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/lumi/chat` | POST | Streaming chat with Claude AI as Lumi |
| `/api/lumi/opening-message` | GET | Generates Lumi's opening message for a lesson |
| `/api/lumi/session-end` | POST | Ends session, generates summary, calculates XP |

## Lumi — The AI Tutor

Lumi is not a chatbot. Lumi is a warm, curious, personalised learning companion that:

- **Teaches through questions** using the Socratic method
- **Never gives the answer** — guides the child to find it themselves
- **Adapts language** completely based on the child's age (5-7, 8-11, 12-14, 15-16)
- **Celebrates effort** as much as correct answers
- **Includes child safety guardrails** — stays on educational topics, redirects off-topic conversations
- **Streams responses** word-by-word for a natural, alive feeling

### Lesson Flow

1. Child opens a topic → Lumi auto-generates a warm opening message
2. Lumi assesses what the child already knows with an open question
3. Interactive Socratic dialogue with streaming responses
4. "I'm stuck" hint button provides scaffolded hints without giving answers
5. Session ends after 20 minutes or when child clicks "Finish"
6. Session summary screen shows XP earned, mastery score, and topic status

### Mastery Scoring

| Event | Score Change |
|---|---|
| Correct response detected | +5 |
| Child explains back correctly | +10 |
| Hint used | -2 |
| Session completed | +15 |
| Topic mastery threshold | 70/100 |

## Database Schema

- `families` — Parent accounts and family names
- `children` — Child profiles with avatar, year group, PIN, XP, streaks
- `subjects` — 15 seeded subjects (9 traditional + 6 future skills)
- `topics` — Learning topics within each subject
- `child_topic_progress` — Per-child topic completion tracking with mastery scores
- `lesson_sessions` — Individual lesson session records with AI-generated summaries

## Session 1 Deliverables

- Complete Next.js project with all pages
- Supabase integration with all tables, RLS policies, and seed data
- Full authentication flow (parent signup, child PIN login)
- All static UI pages with premium cosmic design
- Subject cards with seeded data rendering correctly
- Learning map visual structure
- Parent dashboard with placeholder data
- Responsive layout across all pages

## Session 2 Deliverables

- Dynamic system prompt generator with age-calibrated language
- 3 API routes with Anthropic Claude integration
- Streaming chat interface on the lesson page
- Lumi auto-opening message on lesson load
- Hint system ("I'm stuck" button with scaffolded hints)
- Session end screen with XP calculation and mastery scoring
- Supabase update logic for progress, XP, and streaks
- Child-safe guardrails in system prompt
- Typing indicator and smooth streaming UX
- Session summary generation via Claude

## Session 3 (Coming Next)

- Payment system
- Email notifications
- Voice input
- Multi-language support
- Real Supabase auth integration (replacing mock data)

## Anthropic API Considerations

- **Model**: claude-sonnet-4-6
- **Max tokens per response**: 800 (chat), 100 (summaries)
- **Streaming**: Enabled for all chat responses
- **Rate limits**: Standard Anthropic rate limits apply
- **Cost**: ~$3/MTok input, ~$15/MTok output (check current pricing)
- **Safety**: All API calls go through server-side Next.js API routes; API key never exposed to client

## License

Private — All rights reserved.
