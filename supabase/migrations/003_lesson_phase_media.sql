-- ═══════════════════════════════════════
-- Lesson Phase Media Table
-- Stores images, videos, GIFs, and text edits per lesson phase
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS lesson_phase_media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES topic_lesson_structures(id) ON DELETE CASCADE,
  phase text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'gif', 'youtube', 'text_edit')),
  url text,
  thumbnail text,
  title text,
  source text,
  lumi_instruction text,
  display_order integer DEFAULT 0,
  phase_text_override jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create index for efficient querying by lesson_id
CREATE INDEX IF NOT EXISTS idx_lesson_phase_media_lesson_id ON lesson_phase_media(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_phase_media_active ON lesson_phase_media(is_active);
