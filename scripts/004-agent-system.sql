-- Agent System Schema
-- Run this in Supabase SQL Editor

-- Agent tasks table - tracks all dispatched tasks
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL CHECK (agent_type IN ('ceo', 'content', 'debug', 'marketing', 'analytics', 'support')),
  parent_task_id UUID REFERENCES agent_tasks(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  title TEXT NOT NULL,
  description TEXT,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by TEXT DEFAULT 'system'
);

-- Agent conversations table - stores chat history with CEO
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_type TEXT DEFAULT 'ceo',
  task_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent activity log - detailed logging for debugging
CREATE TABLE IF NOT EXISTS agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES agent_tasks(id),
  agent_type TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_type ON agent_tasks(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_parent ON agent_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_session ON agent_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_task ON agent_activity_log(task_id);

-- View for task hierarchy
CREATE OR REPLACE VIEW agent_task_tree AS
SELECT 
  t.*,
  p.title as parent_title,
  (SELECT COUNT(*) FROM agent_tasks c WHERE c.parent_task_id = t.id) as subtask_count,
  (SELECT COUNT(*) FROM agent_tasks c WHERE c.parent_task_id = t.id AND c.status = 'completed') as completed_subtasks
FROM agent_tasks t
LEFT JOIN agent_tasks p ON t.parent_task_id = p.id;
