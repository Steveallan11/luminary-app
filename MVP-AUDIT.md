# Luminary MVP Audit - Full Flow Analysis

## Executive Summary

The MVP has most pieces in place but several critical gaps prevent the full flow from working:

1. **Auth Flow**: Blocked - signup works but onboarding requires authenticated session
2. **Lesson Creation (Admin)**: Working - generates lessons via Claude and saves to DB
3. **Lesson Delivery (Child)**: Partially working - depends on child session being set
4. **Progress/XP Tracking**: Partially implemented - session-end API exists but some endpoints missing

---

## 1. AUTHENTICATION FLOW

### Current State: BROKEN

**Signup (`/api/auth/signup`)**: 
- Creates Supabase auth user with email verification required
- Stores `family_name` in user metadata
- Returns `emailConfirmationRequired: true`

**Problem**: After email verification, user lands on `/auth/onboarding` but:
- The onboarding page checks `supabase.auth.getUser()` 
- User may not have a valid session cookie after email redirect
- Onboarding API fails with 401 "You must be logged in"

### Fix Required:
1. Add email confirmation callback route that establishes session
2. OR use service role client in onboarding to bypass RLS temporarily
3. Ensure proper cookie handling in the email redirect flow

---

## 2. LESSON CREATION (ADMIN)

### Current State: WORKING (with caveats)

**Flow**:
1. Admin visits `/admin/lessons` or `/admin/content`
2. Fills in topic brief (title, key concepts, misconceptions, etc.)
3. Calls `/api/admin/queue-generation` which creates a `generation_jobs` row
4. Calls `/api/admin/generate-lesson` which:
   - Uses `generateLessonStructure()` from `lesson-generator.ts`
   - Calls Claude API with detailed prompts
   - Saves to `topic_lesson_structures` table
   - Creates linked assets in `topic_assets` table
   - Updates job status to 'completed'

**Dependencies**:
- `ANTHROPIC_API_KEY` - Required for Claude
- `SUPABASE_SERVICE_ROLE_KEY` - Required for DB writes
- `generation_jobs` table must exist

**What Works**:
- Lesson structure generation via Claude
- Quality scoring
- Saving to database
- Job progress tracking

**Missing**:
- No way to assign generated lessons to specific children
- `lesson_assignments` table referenced but may not exist

---

## 3. LESSON DELIVERY (CHILD)

### Current State: PARTIALLY WORKING

**Flow**:
1. Child logs in via `/auth/login` (enters parent email + selects avatar + PIN)
2. Child session stored in localStorage via `child-session.ts`
3. Child visits `/learn` to see subjects
4. Child clicks topic, goes to `/learn/[slug]/[topic]`
5. `bootstrapLesson()` calls `/api/lesson/start`
6. If lesson structure exists: starts immediately
7. If not: enters "generating" state, calls `/api/lesson/generate`
8. Chat interface uses `/api/lumi/chat` for streaming responses
9. Session ends via `/api/lumi/session-end`

**Dependencies**:
- Child must have valid session in localStorage
- `children` table must have the child record
- `lesson_sessions` table for tracking
- `/api/lumi/*` endpoints for chat

**What Works**:
- Lesson start flow
- Chat streaming with Claude
- Phase progression
- XP/mastery tracking in UI

**Missing/Broken**:
- `/api/lesson/chat/route.ts` - FILE DOES NOT EXIST
- `/api/lesson/complete/route.ts` - FILE DOES NOT EXIST
- `/api/lumi/chat` - Need to verify this exists
- `/api/lumi/session-end` - Need to verify this exists
- `/api/lumi/opening-message` - Need to verify this exists

---

## 4. PROGRESS & XP TRACKING

### Current State: PARTIALLY IMPLEMENTED

**Database Tables** (from schema):
- `lesson_sessions` - Tracks each lesson attempt
- `child_topic_progress` - Tracks mastery per topic
- `spaced_repetition_queue` - Schedules review sessions
- `child_achievements` - Tracks earned badges

**API Endpoints Needed**:
- Session completion (save XP, mastery, duration)
- Progress update (update `child_topic_progress`)
- Achievement check (award badges)

**What's Missing**:
- Clear session completion flow
- XP persistence to database
- Mastery band calculation
- Achievement awarding logic

---

## 5. API ENDPOINTS STATUS

Based on the lesson page code, these endpoints are called:

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/api/lesson/start` | Start a lesson | EXISTS |
| `/api/lesson/generate` | Generate lesson content | EXISTS |
| `/api/lumi/chat` | Chat streaming | EXISTS |
| `/api/lumi/opening-message` | Get first message | EXISTS |
| `/api/lumi/session-end` | End session, save progress | EXISTS |
| `/api/lumi/verify-image` | Verify teaching images | EXISTS |
| `/api/lumi/visual-search` | Search for images | EXISTS |
| `/api/learn/subjects` | Get subjects list | EXISTS |
| `/api/learn/child-profile` | Get child data | EXISTS |
| `/api/learn/assignments` | Get assigned lessons | EXISTS |
| `/auth/callback` | Email verification callback | JUST CREATED |

---

## 6. DATABASE TABLES STATUS

### Confirmed Existing (from schema):
- `families` - Parent families
- `children` - Child profiles  
- `subjects` - Subject list
- `topics` - Topic list
- `topic_lesson_structures` - Generated lessons
- `topic_assets` - Lesson assets
- `lesson_sessions` - Session tracking
- `child_topic_progress` - Progress tracking
- `generation_jobs` - Job queue
- `achievements` - Badge definitions
- `child_achievements` - Earned badges

### May Need Creation:
- `parent_profiles` - From scripts/001
- `lesson_assignments` - From scripts/002
- `agent_tasks` - From scripts/004
- `media_assets` - From scripts/003

---

## 7. PRIORITY FIXES FOR MVP

### P0 - Critical (Blocking MVP):

1. **Fix Auth Flow** - DONE
   - `/auth/callback` route created to handle email verification
   - Signup now redirects to callback which exchanges code for session
   - Session established before reaching onboarding

2. **Lumi APIs** - ALREADY EXIST
   - `/api/lumi/chat` - EXISTS
   - `/api/lumi/opening-message` - EXISTS
   - `/api/lumi/session-end` - EXISTS

3. **Run Database Migrations** - USER ACTION REQUIRED
   - Execute all scripts in `/scripts/` folder in Supabase SQL Editor:
     - `001-parent-profiles-and-rls.sql`
     - `002-lesson-assignments.sql`
     - `003-media-assets.sql`
     - `004-agent-system.sql`

### P1 - Important (Core Functionality):

4. **Connect Lesson Assignment**
   - Admin assigns lessons to children
   - Children see assigned lessons on `/learn`

5. **XP/Progress Persistence**
   - Save XP to `children.xp` on session end
   - Update `child_topic_progress` mastery
   - Award achievements

### P2 - Nice to Have:

6. **Parent Dashboard**
   - View child progress
   - See completed lessons

7. **Spaced Repetition**
   - Queue review sessions
   - Smart scheduling

---

## 8. ENVIRONMENT VARIABLES REQUIRED

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Optional
OPENAI_API_KEY= (for image generation)
BLOB_READ_WRITE_TOKEN= (for media uploads)
```

---

## 9. QUICK FIX COMMANDS

To get MVP working, run these SQL migrations in Supabase SQL Editor:

1. `scripts/001-parent-profiles-and-rls.sql`
2. `scripts/002-lesson-assignments.sql`  
3. `scripts/003-media-assets.sql`
4. `scripts/004-agent-system.sql`

Then I will create the missing API endpoints.
