# Luminary — Learning That Lights Up Every Child

An AI-powered homeschooling platform for UK children aged 5–16. Built with Next.js 14, Supabase, Tailwind CSS, and Framer Motion.

## Overview

Luminary provides two user experiences:

- **Child**: An immersive, cosmic-themed learning universe with 15 subjects, visual learning maps, XP tracking, streaks, and achievements
- **Parent**: A clean, data-rich dashboard for monitoring progress, managing child profiles, and adjusting settings

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Framework |
| Supabase (PostgreSQL) | Database & Auth |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| Google Fonts | Nunito, Fraunces, JetBrains Mono |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project

### Installation

```bash
git clone <repo-url>
cd luminary
pnpm install
```

### Environment Setup

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Required variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
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
| `/learn/[slug]/[topic]` | Lesson placeholder with Lumi avatar |
| `/parent` | Parent dashboard with stats, progress, activity |
| `/progress` | Child's progress overview across all subjects |
| `/achievements` | Badges and achievements (placeholder) |
| `/profile` | Child profile with avatar, XP, streak |

## Database Schema

- `families` — Parent accounts and family names
- `children` — Child profiles with avatar, year group, PIN, XP, streaks
- `subjects` — 15 seeded subjects (9 traditional + 6 future skills)
- `topics` — Learning topics within each subject
- `child_topic_progress` — Per-child topic completion tracking
- `lesson_sessions` — Individual lesson session records

## Session 1 Deliverables

- Complete Next.js project with all pages
- Supabase integration with all tables, RLS policies, and seed data
- Full authentication flow (parent signup, child PIN login)
- All static UI pages with premium cosmic design
- Subject cards with seeded data rendering correctly
- Learning map visual structure
- Parent dashboard with placeholder data
- Responsive layout across all pages

## Session 2 (Coming Next)

- AI tutor integration (Claude API)
- Real progress tracking logic
- Gamification engine
- Payment system
- Email notifications

## License

Private — All rights reserved.
