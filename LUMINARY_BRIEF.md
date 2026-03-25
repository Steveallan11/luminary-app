# Luminary App: Technical & Product Brief

**Date:** March 2026
**Author:** Manus AI
**Status:** Active Development (Production Studio Upgrade Complete)

This document serves as a comprehensive onboarding brief for the Luminary application. It covers the product vision, technical architecture, database schema, user flows, and the current state of development.

---

## 1. Product Overview

Luminary is an AI-powered homeschooling platform designed for the UK curriculum. It replaces traditional static learning with **Lumi**, an enthusiastic, warm, and genuinely funny AI tutor. 

The core philosophy is conversational, Socratic learning. Instead of reading textbooks, children chat with Lumi, who guides them through a structured 7-phase lesson arc, dynamically injecting interactive content (games, diagrams, videos, images) into the chat stream.

### Target Audience
- **Children (Ages 5-16):** Segmented into Key Stages (KS1-KS4). The AI dynamically calibrates its vocabulary, sentence structure, and use of emojis based on the child's age.
- **Parents:** Seeking a structured, curriculum-aligned homeschooling solution with deep visibility into their child's progress, mastery, and engagement.
- **Local Authorities (LAs):** Require proof of learning. Luminary generates PDF reports detailing engagement, curriculum coverage, and mastery to satisfy LA requirements.

---

## 2. Technical Architecture

Luminary is built on a modern, serverless React stack.

### Core Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion (for fluid animations)
- **Database & Auth:** Supabase (PostgreSQL)
- **AI Engine:** Anthropic Claude (`claude-opus-4-6` for complex generation, `claude-3-haiku` for fast chat)
- **Payments:** Stripe
- **PDF Generation:** `@react-pdf/renderer`

### Key Architectural Patterns
1. **Server-Sent Events (SSE) Chat:** The core learning experience is a real-time chat interface. The `/api/lumi/chat` route streams Claude's responses back to the client.
2. **Signal Interception:** As Claude streams text, the frontend parses special signals (e.g., `[CONTENT:game:123]`, `[IMAGE:url]`, `[PHASE:explore]`). These signals trigger the UI to render interactive React components inline within the chat or update the current lesson phase.
3. **Background Generation:** Lesson generation is a heavy AI task (taking up to 2-3 minutes). It runs synchronously in a Vercel function with an extended timeout (`maxDuration = 300`), updating a `generation_jobs` table in Supabase so the frontend can poll for progress.

---

## 3. Database Schema (Supabase)

The database is structured around families, children, curriculum hierarchy, and AI-generated content.

### User & Progress Tables
- **`families`**: Parent accounts, subscription tier (`free`, `family`, `pro`), Stripe customer ID.
- **`children`**: Child profiles, age, year group, avatar, XP total, streak days.
- **`child_topic_progress`**: Tracks mastery score (0-100) and status (`locked`, `available`, `in_progress`, `completed`) for each topic.
- **`lesson_sessions`**: Logs individual learning sessions, duration, XP earned, and chat transcripts.

### Curriculum & Content Tables
- **`subjects`**: High-level subjects (e.g., Maths, English, AI Literacy).
- **`topics`**: Specific topics within a subject (e.g., Fractions, Photosynthesis).
- **`topic_lesson_structures`**: The core AI-generated lesson blueprint. Contains JSON columns for each of the 7 phases (`spark_json`, `explore_json`, etc.), plus game content and real-world examples.
- **`topic_assets`**: Standalone interactive content linked to topics (concept cards, videos, diagrams, games, worksheets).
- **`lesson_phase_media`**: (Newly added) Maps specific media (images, YouTube, GIFs) to specific phases of a lesson structure, including instructions on how Lumi should use them.
- **`lesson_knowledge_base`**: Custom uploaded content (text, PDFs) that Lumi uses as RAG context for specific lessons.

### Admin Tables
- **`generation_jobs`**: Tracks the status of long-running AI generation tasks.
- **`admin_test_sessions`**: Logs admin testing sessions, including chat transcripts, applied refinements, and notes.

---

## 4. The 7-Phase Lesson Arc

Every Luminary lesson follows a strict pedagogical framework, designed to keep children engaged and ensure genuine understanding.

1. **Spark (⚡):** Hook the child's curiosity with a dramatic opening question, scenario, or funny moment.
2. **Explore (🔭):** Teach the core concepts using analogies, examples, and visual media.
3. **Anchor (⚓):** The child explains the concept back in their own words (tests genuine understanding).
4. **Practise (🎯):** Structured practice questions with scaffolded difficulty.
5. **Create (🎨):** A creative application task (e.g., write a diary entry, design a superhero).
6. **Check (✅):** Final assessment questions to measure mastery.
7. **Celebrate (🎉):** Celebrate achievement, share a fun fact, and preview the next topic.

---

## 5. User Flows

### A. Child Flow (The Learning Experience)
1. **Dashboard (`/learn`):** Child logs in, sees their avatar, current XP, streak, and a grid of subjects.
2. **Subject Page (`/learn/[slug]`):** Shows a learning map of topics. Topics unlock sequentially (a topic is `locked` until the previous one is `completed`).
3. **Lesson Interface (`/learn/[slug]/[topic]`):** 
   - The core chat interface. Lumi initiates the conversation based on the `spark` phase.
   - The child chats with Lumi. Lumi evaluates responses, awards XP, and decides when to advance to the next phase.
   - Interactive components (games, diagrams) appear inline when Lumi emits a `[CONTENT:*]` signal.
   - Visual media (images, GIFs) appear when Lumi emits an `[IMAGE:*]` signal.
4. **Completion:** Upon finishing the `celebrate` phase, the session ends, XP is banked, mastery is updated, and the next topic unlocks.

### B. Parent Flow
1. **Dashboard (`/parent`):** Overview of all children in the family.
2. **Insights:** Shows total learning minutes, active days, and subject-level progress (Not Started, In Progress, Strong).
3. **Activity Feed:** A paginated list of recent lesson sessions.
4. **Reports:** Ability to generate PDF reports for Local Authorities, detailing curriculum coverage and engagement.
5. **Subscription (`/pricing`):** Upgrade to Family or Pro tiers via Stripe checkout.

### C. Admin Flow (Content Creation & Curation)
The admin suite (`/admin/*`) is where the curriculum is built.

1. **Lesson Generation (`/admin/lessons`):**
   - Admin inputs a topic name, subject, and age group.
   - Clicks "Auto-Brief" to generate key concepts, misconceptions, and curriculum objectives.
   - Clicks "Generate Lesson". The backend calls Claude to build the full 7-phase JSON structure and linked assets (games, concept cards).
2. **Production Studio (`/admin/test-lesson/[id]`):**
   - **The core curation environment.** Admin tests the lesson by chatting with Lumi exactly as a child would.
   - **Content Tab:** Inline editing of phase goals, teaching points, and questions. Admins can add "Funny Moments" and "Fun Facts".
   - **Media Management:** Admins search for child-safe images, YouTube videos, and GIFs, attaching them to specific phases with instructions for Lumi.
   - **Refine Tab:** AI-powered refinement (e.g., "Make the explore phase simpler").
   - **Variants Tab:** Generate alternative versions of the lesson for different learning styles (Visual, Auditory, Kinesthetic) or lengths (Bite-size, Full).
   - **Report Tab:** Live preview of LA report metrics (engagement score, media count).

---

## 6. Current State & Recent Upgrades

### Just Completed: The Production Studio Upgrade
The `/admin/test-lesson/[id]` page was recently completely overhauled into a "Production Studio".
- **Media Integration:** Added the `lesson_phase_media` table and a comprehensive `MediaPicker` component. Admins can now search Pixabay, YouTube, and Giphy directly within the app and attach media to phases.
- **Enhanced Lumi Personality:** The system prompt (`buildAdminTestSystemPrompt`) was heavily upgraded. Lumi is now explicitly instructed to be funny, use creative analogies, and reference the attached media dynamically.
- **Inline Editing:** Replaced raw JSON editing with a user-friendly `PhaseContentPanel`.

### Next Priorities / Pending Tasks
1. **Database Migration:** The `lesson_phase_media` table needs to be created in the production Supabase instance (can be triggered via `/api/admin/run-migrations`).
2. **Child-Facing Media Rendering:** While media is now attached to lessons and passed to Lumi's context, the child-facing chat UI (`/learn/[slug]/[topic]/page.tsx`) needs to be updated to render the `[IMAGE:url]` signals inline beautifully.
3. **Knowledge Base UI:** The backend API for uploading custom PDFs/text (`/api/admin/knowledge-base`) exists, but the admin UI needs a file upload component to allow admins to feed custom curriculum documents into Lumi's context.
4. **LA Report Export:** The metrics are tracked in the admin panel, but the actual PDF export button utilizing `@react-pdf/renderer` needs to be wired up in the parent dashboard.

---
*End of Brief*
