# Luminary — Learning That Lights Up Every Child

An AI-powered homeschooling platform for UK children aged 5–16. Built with Next.js 14, Supabase, Tailwind CSS, Framer Motion, and powered by Claude AI.

## Overview

Luminary provides two user experiences:

- **Child**: An immersive, cosmic-themed learning universe with 15 subjects, visual learning maps, XP tracking, streaks, achievements, interactive games, diagrams, and a personalised AI tutor called Lumi
- **Parent**: A clean, data-rich dashboard for monitoring progress, managing child profiles, downloading reports, and managing subscriptions
- **Admin**: Content production tools for generating and managing educational assets at scale

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Framework |
| Supabase (PostgreSQL) | Database & Auth |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| Anthropic Claude API | AI Tutor (Lumi) + Content Generation |
| OpenAI DALL-E 3 | Image Generation |
| Stripe | Subscription payments |
| jsPDF | Worksheet PDF generation |
| Google Fonts | Nunito, Fraunces, JetBrains Mono |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project
- Anthropic API key
- OpenAI API key (for image generation)
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
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run the SQL schemas in your Supabase SQL editor in order:

```bash
# 1. Run the base schema
# Copy contents of supabase-schema.sql into Supabase SQL Editor

# 2. Run the Session 3 additions
# Copy contents of supabase-schema-session3.sql into Supabase SQL Editor

# 3. Run the Session 4 additions (content system)
# Copy contents of supabase-schema-session4.sql into Supabase SQL Editor
```

This creates all tables, RLS policies, seeds 15 subjects with sample topics, achievements, content assets, and subscription support.

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
| `/learn/[slug]/[topic]` | **Full AI lesson** — Streaming chat with Lumi + interactive content |
| `/parent` | Parent dashboard with live stats, heatmap, activity feed |
| `/progress` | Child's progress overview across all subjects |
| `/achievements` | 12 achievement badges with earned/locked states and confetti |
| `/profile` | Child profile with avatar, XP, streak |
| `/pricing` | Subscription pricing page (Free, Family, Pro tiers) |
| `/demo` | **Interactive demo** — Explore all 6 game types, diagrams, content cards |
| `/admin/content` | Admin content dashboard with asset coverage and AI generator |

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/lumi/chat` | POST | Streaming chat with Claude AI as Lumi |
| `/api/lumi/opening-message` | GET | Generates Lumi's opening message for a lesson |
| `/api/lumi/session-end` | POST | Ends session, generates summary, calculates XP |
| `/api/reports/generate` | GET | Generates HTML progress report for Local Authority |
| `/api/stripe/checkout` | POST | Creates Stripe checkout session for subscription |
| `/api/stripe/webhook` | POST | Handles Stripe webhook events |
| `/api/content/game-result` | POST | Records game result and calculates XP |
| `/api/content/generate-worksheet` | GET | Generates printable worksheet PDF |
| `/api/admin/generate-content` | POST | AI batch content generation for topics |
| `/api/admin/generate-images` | POST | DALL-E 3 image generation for content assets |

## Lumi — The AI Tutor

Lumi is not a chatbot. Lumi is a warm, curious, personalised learning companion that:

- **Teaches through questions** using the Socratic method
- **Never gives the answer** — guides the child to find it themselves
- **Adapts language** completely based on the child's age (5-7, 8-11, 12-14, 15-16)
- **Celebrates effort** as much as correct answers
- **Includes child safety guardrails** — stays on educational topics, redirects off-topic conversations
- **Streams responses** word-by-word for a natural, alive feeling
- **Triggers interactive content** via `[CONTENT:*]` signals in chat

### Lesson Flow

1. Child opens a topic → Lumi auto-generates a warm opening message
2. Lumi assesses what the child already knows with an open question
3. Interactive Socratic dialogue with streaming responses
4. Lumi triggers games, diagrams, concept cards, and videos at appropriate moments
5. "I'm stuck" hint button provides scaffolded hints without giving answers
6. Session ends after 20 minutes or when child clicks "Finish"
7. Session summary screen shows XP earned, mastery score, and topic status

### Content Signals

Lumi can trigger interactive content during lessons by emitting signals:

| Signal | Triggers |
|---|---|
| `[CONTENT:CONCEPT_CARD]` | Concept card with definition, hook question, image |
| `[CONTENT:VIDEO]` | Video player with custom controls |
| `[CONTENT:DIAGRAM]` | Interactive diagram (fraction bar, number line, etc.) |
| `[CONTENT:GAME]` | Mini-game (match, sort, fill, true/false, build, quick fire) |
| `[CONTENT:REALWORLD]` | Real-world application card |
| `[CONTENT:WORKSHEET]` | Printable worksheet link |

### Mastery Scoring

| Event | Score Change |
|---|---|
| Correct response detected | +5 |
| Child explains back correctly | +10 |
| Hint used | -2 |
| Session completed | +15 |
| Topic mastery threshold | 70/100 |

## Interactive Content System (Session 4)

### 6 Mini-Game Types

| Game | Description | Interaction |
|---|---|---|
| **Match It** | Connect matching pairs | Tap left + right columns |
| **Sort It** | Categorise items into groups | Drag/tap items into category buckets |
| **Fill It** | Complete sentences with blanks | Type answers with hints available |
| **True / False** | Judge statements | Swipe or tap True/False buttons |
| **Build It** | Order steps/items correctly | Drag to reorder sequence |
| **Quick Fire** | Timed multiple choice | Select answer within time limit |

All games feature:
- Animated feedback (correct/wrong)
- Progress bar
- Results screen with score, XP, time, and wrong answer review
- Subject-themed colours

### 5 Interactive Diagram Types

| Diagram | Description |
|---|---|
| **Fraction Bar** | Interactive fraction explorer with adjustable denominators and comparison mode |
| **Number Line** | Zoomable number line with fraction/decimal markers and placement mode |
| **Timeline** | Historical timeline with era bands and optional ordering exercise |
| **Labelled Diagram** | Image with discoverable hotspots that reveal labels and descriptions |
| **Sorting Visual** | Visual sorting exercise with draggable items into groups |

### Content Cards

- **Concept Card**: Definition, hook question, tagline — flippable card with front/back
- **Real-World Card**: Everyday or inspiring real-world application scenarios
- **Video Player**: Custom-styled player with progress bar, volume, fullscreen

### Worksheet Generator

- Generates printable PDF worksheets via `/api/content/generate-worksheet`
- Sections: Recall, Apply, Create, Reflect
- Age-adapted question complexity
- Working space and lined areas

### Admin Content Dashboard

- Asset coverage overview across all topics
- Subject filter and topic-level asset matrix
- AI batch content generator (select topic + asset types → Claude generates)
- DALL-E 3 image generation for visual assets

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

### Base Tables
- `families` — Parent accounts, family names, subscription info
- `children` — Child profiles with avatar, year group, PIN, XP, streaks
- `subjects` — 15 seeded subjects (9 traditional + 6 future skills)
- `topics` — Learning topics within each subject
- `child_topic_progress` — Per-child topic completion tracking with mastery scores
- `lesson_sessions` — Individual lesson session records with AI-generated summaries
- `achievements` — 12 achievement definitions with criteria
- `child_achievements` — Per-child achievement unlock records

### Content Tables (Session 4)
- `topic_assets` — All content assets (concept cards, videos, games, diagrams, worksheets)
- `diagram_components` — Interactive diagram configurations and data
- `game_sessions` — Individual game play records with scores and answers

#### Seeding live lessons
`node scripts/seed_db.ts` now seeds the MVP subjects/topics _and_ inserts full `topic_lesson_structures` plus `topic_assets` for the seeded topics (`fractions`, `number-sense`, `phonics`, `reading`, `life-cycles`, `states-of-matter`). Run it to populate Supabase with working arcs and assets before you test the lesson engine.

## Project Structure

```
src/
├── app/
│   ├── admin/content/     # Admin content dashboard
│   ├── api/
│   │   ├── admin/         # generate-content, generate-images
│   │   ├── content/       # game-result, generate-worksheet
│   │   ├── lumi/          # chat, opening-message, session-end
│   │   ├── reports/       # generate
│   │   └── stripe/        # checkout, webhook
│   ├── achievements/      # Achievements page
│   ├── auth/              # signup, login, onboarding
│   ├── demo/              # Interactive content demo
│   ├── learn/             # Child learning pages
│   ├── parent/            # Parent dashboard
│   ├── pricing/           # Subscription pricing
│   ├── profile/           # Child profile
│   └── progress/          # Progress overview
├── components/
│   ├── content/           # VideoPlayer, ConceptCard, RealWorldCard, ContentRenderer
│   ├── diagrams/          # FractionBar, Timeline, LabelledDiagram, SortingVisual, NumberLine, DiagramRenderer
│   ├── games/             # MatchIt, SortIt, FillIt, TrueFalse, BuildIt, QuickFire, GameWrapper, GameResults, GameRenderer
│   ├── layout/            # ChildNav, ParentNav, ChildLayout
│   └── ui/                # Button, Card, Input, Skeleton, EmptyState, ErrorState, UpgradeModal, Starfield
├── lib/
│   ├── achievements.ts    # Achievement checker
│   ├── anthropic.ts       # Anthropic client
│   ├── lumi-prompt.ts     # Dynamic system prompt with content manifest
│   ├── mastery.ts         # Mastery scoring
│   ├── mock-content.ts    # Demo content data
│   ├── mock-data.ts       # Demo user/subject data
│   ├── stripe.ts          # Stripe client
│   ├── supabase.ts        # Supabase browser client
│   ├── supabase-server.ts # Supabase server client
│   └── utils.ts           # Utility helpers
└── types/
    └── index.ts           # All TypeScript types
```

## Session Deliverables

### Session 1: Foundation
- Complete Next.js project with all pages
- Supabase integration with all tables, RLS policies, and seed data
- Full authentication flow (parent signup, child PIN login)
- All static UI pages with premium cosmic design
- Subject cards with seeded data rendering correctly
- Learning map visual structure
- Parent dashboard with placeholder data
- Responsive layout across all pages

### Session 2: AI Tutor
- Dynamic system prompt generator with age-calibrated language
- 3 API routes with Anthropic Claude integration
- Streaming chat interface on the lesson page
- Lumi auto-opening message on lesson load
- Hint system ("I'm stuck" button with scaffolded hints)
- Session end screen with XP calculation and mastery scoring
- Child-safe guardrails in system prompt
- Typing indicator and smooth streaming UX

### Session 3: Data & Monetisation
- Gamification engine: 12 achievements, 5 XP levels, achievement checker
- Real parent dashboard: live data, child selector, heatmap, activity feed
- PDF progress report with AI narrative for Local Authority
- Live learning map with mastery scores and sequential unlock
- Stripe subscriptions: pricing page, checkout, webhook, upgrade modal
- Loading skeletons, error/empty states, SEO, production polish

### Session 4: Rich Content System
- **6 mini-game components**: MatchIt, SortIt, FillIt, TrueFalse, BuildIt, QuickFire
- **5 interactive diagram components**: FractionBar, NumberLine, Timeline, LabelledDiagram, SortingVisual
- **Content rendering**: VideoPlayer, ConceptCard, RealWorldCard, ContentRenderer
- **Worksheet PDF generator**: Age-adapted printable worksheets with recall/apply/create/reflect sections
- **Lumi content integration**: Updated system prompt with content manifest, `[CONTENT:*]` signal processing
- **Admin content dashboard**: Asset coverage matrix, AI batch content generator, DALL-E 3 image generation
- **4 new API routes**: game-result, generate-worksheet, generate-content, generate-images
- **Interactive demo page**: `/demo` showcasing all game types, diagrams, and content cards
- **3 new database tables**: topic_assets, diagram_components, game_sessions
- **Full Fractions demo data**: Complete set of mock assets for Maths > Fractions walkthrough

## API Keys & Costs

| Service | Model | Estimated Cost |
|---|---|---|
| Anthropic | claude-sonnet-4-6 | ~$3/MTok input, ~$15/MTok output |
| OpenAI | DALL-E 3 | ~$0.04/image (1024x1024) |
| Stripe | — | 2.9% + 30p per transaction |

All API calls go through server-side Next.js API routes; API keys are never exposed to the client.

## License

Private — All rights reserved.
