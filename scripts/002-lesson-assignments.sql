-- ═══════════════════════════════════════
-- Migration: Lesson Assignments
-- Allows admin to assign lessons to specific children
-- ═══════════════════════════════════════

-- Create lesson_assignments table
CREATE TABLE IF NOT EXISTS lesson_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_structure_id uuid NOT NULL REFERENCES topic_lesson_structures(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  assigned_by text, -- Admin email or 'system'
  assigned_at timestamptz DEFAULT now(),
  due_date date,
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at timestamptz,
  completed_at timestamptz,
  session_id uuid REFERENCES lesson_sessions(id) ON DELETE SET NULL,
  notes text,
  UNIQUE (lesson_structure_id, child_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_child 
  ON lesson_assignments(child_id, status);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_pending 
  ON lesson_assignments(child_id, due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_lesson 
  ON lesson_assignments(lesson_structure_id);

-- Enable RLS
ALTER TABLE lesson_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view their children assignments') THEN
        DROP POLICY "Parents can view their children assignments" ON lesson_assignments;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Children can view their own assignments') THEN
        DROP POLICY "Children can view their own assignments" ON lesson_assignments;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage all assignments') THEN
        DROP POLICY "Service role can manage all assignments" ON lesson_assignments;
    END IF;
END $$;

-- RLS Policies
-- Parents can view their children's assignments
CREATE POLICY "Parents can view their children assignments"
  ON lesson_assignments FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.parent_user_id = auth.uid()
    )
  );

-- Allow reading for anonymous users (children) based on child_id match
-- Note: We use service role for admin operations
CREATE POLICY "Public read for assigned lessons"
  ON lesson_assignments FOR SELECT USING (true);

-- Service role bypass for admin operations (admin uses service role key)
CREATE POLICY "Service role full access"
  ON lesson_assignments FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Also allow authenticated users (for admin dashboard)
CREATE POLICY "Authenticated users can manage assignments"
  ON lesson_assignments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
