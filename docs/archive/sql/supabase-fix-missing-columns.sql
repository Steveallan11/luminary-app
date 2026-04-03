-- Fix: Add missing columns to topic_lesson_structures that were added in later migrations
-- Run this in Supabase SQL Editor to fix lesson generation

-- Add key_stage column (used to filter lessons by curriculum stage)
ALTER TABLE topic_lesson_structures
  ADD COLUMN IF NOT EXISTS key_stage text NOT NULL DEFAULT 'KS2';

-- Add game and content columns (added in scaling migration)
ALTER TABLE topic_lesson_structures
  ADD COLUMN IF NOT EXISTS game_type text,
  ADD COLUMN IF NOT EXISTS game_content jsonb,
  ADD COLUMN IF NOT EXISTS concept_card_json jsonb,
  ADD COLUMN IF NOT EXISTS realworld_json jsonb;

-- Add approval tracking columns
ALTER TABLE topic_lesson_structures
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by text;

-- Add topics table columns needed for generation tracking
ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS lesson_generation_status text,
  ADD COLUMN IF NOT EXISTS last_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS key_stage text,
  ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer DEFAULT 30;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'topic_lesson_structures' 
ORDER BY ordinal_position;
