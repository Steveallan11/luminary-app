#!/bin/bash
# Lesson Generation Script for MVP
# Usage: bash scripts/generate-lessons.sh
# Prerequisites: .env.local file with Supabase and Anthropic credentials

echo "🎓 Luminary MVP Lesson Generation"
echo "================================="

# 1. Seed topics and subjects
echo ""
echo "Step 1/2: Seeding subjects and topics..."
npx ts-node scripts/seed_db.ts

if [ $? -ne 0 ]; then
  echo "❌ Failed to seed database. Check your .env.local credentials."
  exit 1
fi

echo ""
echo "✓ Topics seeded successfully!"
echo ""
echo "Step 2/2: Generate lessons via admin API"
echo "========================================="
echo ""
echo "6 lessons are ready to be generated:"
echo "  1. Maths: Number Sense"
echo "  2. Maths: Fractions"
echo "  3. English: Phonics"
echo "  4. English: Reading"
echo "  5. Science: Life Cycles"
echo "  6. Science: States of Matter"
echo ""
echo "To generate these lessons, use the admin UI:"
echo "  1. Start the app: npm run dev"
echo "  2. Go to: http://localhost:3000/admin/lessons"
echo "  3. Or use curl to trigger generation via API:"
echo ""
echo "Example curl (requires your Supabase/topic IDs):"
echo 'curl -X POST http://localhost:3000/api/admin/generate-lesson \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "YOUR_TOPIC_ID",
    "age_group": "8-11",
    "title": "Number Sense",
    "subject": "Maths",
    "key_concepts": ["place value", "counting", "number recognition"],
    "misconceptions": ["confusing digits with values"],
    "real_world_examples": ["money", "age", "sports scores"],
    "curriculum_objectives": ["understand place value", "count accurately"]
  }'
echo ""
echo "Once generated and approved in the admin UI, lessons will be marked 'live' and appear in the child experience."
