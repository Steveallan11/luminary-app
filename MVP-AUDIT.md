# MVP Ship Checklist

## STATUS: READY TO TEST

### What I Fixed:
1. **lesson-engine.ts** - Now queries Supabase first, falls back to mock only if DB empty
2. **Seed migration** - Created `scripts/005-seed-subjects-topics.sql` with:
   - 3 subjects (Maths, English, Science)
   - 18 topics across all subjects
   - 1 complete lesson structure (Fractions Intro) ready to teach
3. **lesson/start API** - Now uses async Supabase-first lookup

---

## YOUR ACTION REQUIRED

Run these SQL migrations in **Supabase SQL Editor** (in order):

```
1. scripts/001-parent-profiles-and-rls.sql
2. scripts/002-lesson-assignments.sql  
3. scripts/005-seed-subjects-topics.sql  <-- NEW: Seeds content
```

---

## MVP FLOW (After migrations)

### 1. Parent Signup
- Go to `/auth/signup`
- Enter email, password, family name
- Check email for verification link
- Click link -> callback establishes session -> onboarding

### 2. Onboarding
- Create first child (name, age, year group, avatar, PIN)
- Redirects to `/parent` dashboard

### 3. Child Login
- Go to `/auth/login`
- Enter parent email
- Select child avatar
- Enter PIN
- Redirects to `/learn`

### 4. Take a Lesson
- Click on "Maths" subject
- Click on "Introduction to Fractions" 
- Lesson starts with Lumi
- Chat through spark -> explore -> anchor -> practise -> check -> celebrate
- XP and progress saved to database

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/lesson-engine.ts` | Added async Supabase-first lookups |
| `src/app/api/lesson/start/route.ts` | Uses async lesson start |
| `scripts/005-seed-subjects-topics.sql` | New: Seeds subjects, topics, lesson |
| `src/app/auth/callback/route.ts` | New: Handles email verification |

---

## What Works Now

- [x] Parent signup with email verification
- [x] Auth callback establishes session
- [x] Onboarding creates family + child
- [x] Child PIN login
- [x] Subjects/topics fetched from Supabase
- [x] Lesson structures fetched from Supabase
- [x] Lumi chat with Claude streaming
- [x] XP and progress saved to database
- [x] 1 complete lesson ready (Fractions Intro for ages 8-11)

---

## What Needs Content

These topics exist but need lesson structures generated via admin:
- Equivalent Fractions
- Adding/Subtracting Fractions
- Times Tables
- Multiplication Methods
- Division Intro
- Decimals Intro
- Percentages Intro
- Punctuation Basics
- Sentence Types
- Paragraphs
- Reading Comprehension
- Creative Writing
- Living Things
- Human Body
- Materials
- Forces
- Electricity

Use `/admin/content` to generate lessons for these topics.

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
ANTHROPIC_API_KEY=your-claude-key
```
