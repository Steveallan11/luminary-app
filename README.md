# Luminary — Learning That Lights Up Every Child

An AI-powered homeschooling platform for UK children aged 5–16. Built with Next.js 14, Supabase, Tailwind CSS, Framer Motion, and powered by Claude AI.

## Overview

Luminary provides two user experiences:

- **Child**: An immersive, cosmic-themed learning universe with 15 subjects, visual learning maps, XP tracking, streaks, achievements, and a personalised AI tutor called Lumi
- **Parent**: A clean, data-rich dashboard for monitoring progress, managing child profiles, downloading reports, and managing subscriptions

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Framework |
| Supabase (PostgreSQL) | Database & Auth |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| Anthropic Claude API | AI Tutor (Lumi) |
| Stripe | Subscription payments |
| Google Fonts | Nunito, Fraunces, JetBrains Mono |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project
- Anthropic API key
- Stripe account (for payments)

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
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run the SQL schemas in your Supabase SQL editor:

```bash
# 1. Run the base schema
# Copy contents of supabase-schema.sql into Supabase SQL Editor

# 2. Run the Session 3 additions
# Copy contents of supabase-schema-session3.sql into Supabase SQL Editor
```

This creates all tables, RLS policies, seeds 15 subjects with sample topics, achievements, and subscription support.

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
| `/learn/[slug]` | Subject page with data-driven learning map and sequential unlock |
| `/learn/[slug]/[topic]` | **Full AI lesson** — Streaming chat with Lumi |
| `/parent` | Parent dashboard with live stats, heatmap, activity feed |
| `/progress` | Child's progress overview across all subjects |
| `/achievements` | 12 achievement badges with earned/locked states and confetti |
| `/profile` | Child profile with avatar, XP, streak |
| `/pricing` | Subscription pricing page (Free, Family, Pro tiers) |

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/lumi/chat` | POST | Streaming chat with Claude AI as Lumi |
| `/api/lumi/opening-message` | GET | Generates Lumi's opening message for a lesson |
| `/api/lumi/session-end` | POST | Ends session, generates summary, calculates XP |
| `/api/reports/generate` | GET | Generates HTML progress report for Local Authority |
| `/api/stripe/checkout` | POST | Creates Stripe checkout session for subscription |
| `/api/stripe/webhook` | POST | Handles Stripe webhook events |

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

## Gamification System

### XP Levels

| Level | Name | XP Required |
|---|---|---|
| 1 | Curious | 0 |
| 2 | Explorer | 100 |
| 3 | Discoverer | 300 |
| 4 | Scholar | 600 |
| 5 | Luminary | 1000 |

### Achievements (12 badges)

First Step, Subject Explorer, Getting Started, On a Roll, Unstoppable, Legend, Deep Diver, Renaissance Learner, Future Ready, Perseverance, Marathon Learner, Night Owl

## Subscription Tiers

| Feature | Free | Family (£9.99/mo) | Pro (£14.99/mo) |
|---|---|---|---|
| Subjects | 3 | All 15 | All 15 |
| Children | 1 | 3 | 5 |
| Sessions/week | 3 | Unlimited | Unlimited |
| PDF Reports | No | Yes | Yes |
| Achievements | No | Yes | Yes |
| GCSE Mode | No | No | Coming Soon |

## Database Schema

- `families` — Parent accounts, family names, subscription info
- `children` — Child profiles with avatar, year group, PIN, XP, streaks
- `subjects` — 15 seeded subjects (9 traditional + 6 future skills)
- `topics` — Learning topics within each subject
- `child_topic_progress` — Per-child topic completion tracking with mastery scores
- `lesson_sessions` — Individual lesson session records with AI-generated summaries
- `achievements` — 12 achievement definitions with criteria
- `child_achievements` — Per-child achievement unlock records

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

## Session 3 Deliverables

- **Gamification engine**: 12 achievements, 5 XP levels, achievement checker utility
- **Achievements page**: Full badge grid with earned/locked states, confetti on new unlocks, XP level progress bar
- **Real parent dashboard**: Live data from mock sessions, child selector, subject progress grid with animated bars, weekly heatmap, streak display, paginated activity feed
- **PDF progress report**: HTML report generator with AI narrative for Local Authority submissions, print/save-as-PDF support, learner info, subject progress table
- **Live learning map**: Data-driven topic status with mastery scores, sequential unlock progression, animated connection lines, in-progress mastery bar
- **Stripe subscriptions**: Pricing page with 3 tiers (Free/Family/Pro), checkout API, webhook handler, upgrade modal for free tier enforcement
- **Loading skeletons**: Skeleton components for subjects, dashboard, and chat
- **Error/empty states**: Global error page, 404 "Lost in Space" page, empty state component for no-activity/no-achievements
- **SEO**: Enhanced metadata with Open Graph, sitemap.xml, robots.txt
- **Production polish**: Shimmer animations, focus rings for accessibility, custom scrollbar, global loading spinner

## Anthropic API Considerations

- **Model**: claude-sonnet-4-6
- **Max tokens per response**: 800 (chat), 100 (summaries)
- **Streaming**: Enabled for all chat responses
- **Rate limits**: Standard Anthropic rate limits apply
- **Cost**: ~$3/MTok input, ~$15/MTok output (check current pricing)
- **Safety**: All API calls go through server-side Next.js API routes; API key never exposed to client

## License

Private — All rights reserved.
