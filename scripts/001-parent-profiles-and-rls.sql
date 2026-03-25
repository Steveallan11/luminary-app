-- ═══════════════════════════════════════
-- Parent Profiles & Enhanced RLS Migration
-- Links Supabase Auth users to families and children
-- ═══════════════════════════════════════

-- ═══════════════════════════════════════
-- A. PARENT PROFILES TABLE
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS parent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════
-- B. RLS POLICIES FOR PARENT_PROFILES
-- ═══════════════════════════════════════

-- Drop existing policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view own profile' AND tablename = 'parent_profiles') THEN
        DROP POLICY "Parents can view own profile" ON parent_profiles;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can update own profile' AND tablename = 'parent_profiles') THEN
        DROP POLICY "Parents can update own profile" ON parent_profiles;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage all parent profiles' AND tablename = 'parent_profiles') THEN
        DROP POLICY "Service role can manage all parent profiles" ON parent_profiles;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile' AND tablename = 'parent_profiles') THEN
        DROP POLICY "Users can insert own profile" ON parent_profiles;
    END IF;
END $$;

-- Parent can view their own profile
CREATE POLICY "Parents can view own profile" ON parent_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Parent can update their own profile
CREATE POLICY "Parents can update own profile" ON parent_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON parent_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can manage all profiles (for server-side operations)
CREATE POLICY "Service role can manage all parent profiles" ON parent_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════
-- C. FAMILIES TABLE - Ensure parent_user_id exists
-- ═══════════════════════════════════════

-- Add parent_user_id if not exists
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update families RLS to allow parent access
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Drop existing family policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view own family' AND tablename = 'families') THEN
        DROP POLICY "Parents can view own family" ON families;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can update own family' AND tablename = 'families') THEN
        DROP POLICY "Parents can update own family" ON families;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create family' AND tablename = 'families') THEN
        DROP POLICY "Users can create family" ON families;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage families' AND tablename = 'families') THEN
        DROP POLICY "Service role can manage families" ON families;
    END IF;
END $$;

CREATE POLICY "Parents can view own family" ON families
  FOR SELECT USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can update own family" ON families
  FOR UPDATE USING (parent_user_id = auth.uid());

CREATE POLICY "Users can create family" ON families
  FOR INSERT WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Service role can manage families" ON families
  FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════
-- D. CHILDREN TABLE - Enhanced RLS
-- ═══════════════════════════════════════

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Drop existing children policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view family children' AND tablename = 'children') THEN
        DROP POLICY "Parents can view family children" ON children;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can insert family children' AND tablename = 'children') THEN
        DROP POLICY "Parents can insert family children" ON children;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can update family children' AND tablename = 'children') THEN
        DROP POLICY "Parents can update family children" ON children;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can delete family children' AND tablename = 'children') THEN
        DROP POLICY "Parents can delete family children" ON children;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage children' AND tablename = 'children') THEN
        DROP POLICY "Service role can manage children" ON children;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read children by family' AND tablename = 'children') THEN
        DROP POLICY "Public can read children by family" ON children;
    END IF;
END $$;

-- Parents can view their family's children
CREATE POLICY "Parents can view family children" ON children
  FOR SELECT USING (
    family_id IN (SELECT id FROM families WHERE parent_user_id = auth.uid())
  );

-- Parents can insert children into their family
CREATE POLICY "Parents can insert family children" ON children
  FOR INSERT WITH CHECK (
    family_id IN (SELECT id FROM families WHERE parent_user_id = auth.uid())
  );

-- Parents can update their family's children
CREATE POLICY "Parents can update family children" ON children
  FOR UPDATE USING (
    family_id IN (SELECT id FROM families WHERE parent_user_id = auth.uid())
  );

-- Parents can delete their family's children
CREATE POLICY "Parents can delete family children" ON children
  FOR DELETE USING (
    family_id IN (SELECT id FROM families WHERE parent_user_id = auth.uid())
  );

-- Service role can manage all children (for server-side operations)
CREATE POLICY "Service role can manage children" ON children
  FOR ALL USING (auth.role() = 'service_role');

-- Public can read children by family (for child login - verify by family lookup)
CREATE POLICY "Public can read children by family" ON children
  FOR SELECT USING (true);

-- ═══════════════════════════════════════
-- E. LESSON_SESSIONS TABLE - RLS
-- ═══════════════════════════════════════

ALTER TABLE lesson_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing lesson_sessions policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can view children lesson sessions' AND tablename = 'lesson_sessions') THEN
        DROP POLICY "Parents can view children lesson sessions" ON lesson_sessions;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage lesson sessions' AND tablename = 'lesson_sessions') THEN
        DROP POLICY "Service role can manage lesson sessions" ON lesson_sessions;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can insert lesson sessions' AND tablename = 'lesson_sessions') THEN
        DROP POLICY "Public can insert lesson sessions" ON lesson_sessions;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read lesson sessions' AND tablename = 'lesson_sessions') THEN
        DROP POLICY "Public can read lesson sessions" ON lesson_sessions;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can update lesson sessions' AND tablename = 'lesson_sessions') THEN
        DROP POLICY "Public can update lesson sessions" ON lesson_sessions;
    END IF;
END $$;

-- Parents can view their children's lesson sessions
CREATE POLICY "Parents can view children lesson sessions" ON lesson_sessions
  FOR SELECT USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN families f ON c.family_id = f.id
      WHERE f.parent_user_id = auth.uid()
    )
  );

-- Service role can manage all lesson sessions
CREATE POLICY "Service role can manage lesson sessions" ON lesson_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Public can create and read lesson sessions (children aren't authenticated users)
CREATE POLICY "Public can insert lesson sessions" ON lesson_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read lesson sessions" ON lesson_sessions
  FOR SELECT USING (true);

CREATE POLICY "Public can update lesson sessions" ON lesson_sessions
  FOR UPDATE USING (true);

-- ═══════════════════════════════════════
-- F. INDEXES
-- ═══════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_parent_profiles_user_id ON parent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_parent_profiles_family_id ON parent_profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_parent_profiles_email ON parent_profiles(email);
CREATE INDEX IF NOT EXISTS idx_families_parent_user_id ON families(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_children_family_id ON children(family_id);
