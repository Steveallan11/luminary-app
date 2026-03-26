import { createClient } from '@supabase/supabase-js';
import type { AgentLog, AgentTask, AgentTaskDraft, BusinessMetric } from '@/types/agents';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function getLatestBusinessMetric(): Promise<BusinessMetric | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('business_metrics')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('Failed to fetch business metrics:', error.message);
    return null;
  }

  return (data as BusinessMetric | null) ?? null;
}

export async function getRecentAgentLogs(limit = 10): Promise<AgentLog[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('agent_logs')
    .select('*')
    .order('run_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Failed to fetch agent logs:', error.message);
    return [];
  }

  return (data as AgentLog[]) ?? [];
}

export async function getOpenAgentTasks(limit = 20): Promise<AgentTask[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('agent_tasks')
    .select('*')
    .in('status', ['pending', 'in_progress', 'blocked'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Failed to fetch agent tasks:', error.message);
    return [];
  }

  return (data as AgentTask[]) ?? [];
}

export async function insertAgentLog(log: {
  agent_name: string;
  run_type?: string;
  summary: string;
  details?: Record<string, unknown>;
  metrics_snapshot?: Record<string, unknown>;
  actions_taken?: unknown[];
  severity?: string | null;
  created_tasks_count?: number;
}): Promise<AgentLog | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('agent_logs')
    .insert({
      agent_name: log.agent_name,
      run_type: log.run_type ?? 'manual',
      summary: log.summary,
      details: log.details ?? {},
      metrics_snapshot: log.metrics_snapshot ?? {},
      actions_taken: log.actions_taken ?? [],
      severity: log.severity ?? null,
      created_tasks_count: log.created_tasks_count ?? 0,
    })
    .select('*')
    .single();

  if (error) {
    console.warn('Failed to insert agent log:', error.message);
    return null;
  }

  return (data as AgentLog) ?? null;
}

export async function insertAgentTasks(agentName: string, tasks: AgentTaskDraft[]): Promise<AgentTask[]> {
  const supabase = getServiceSupabase();
  if (!supabase || tasks.length === 0) return [];

  const { data, error } = await supabase
    .from('agent_tasks')
    .insert(
      tasks.map((task) => ({
        agent_name: agentName,
        task_type: task.task_type,
        title: task.title,
        description: task.description,
        payload: task.payload ?? {},
        priority: task.priority,
        status: 'pending',
        source: 'agent_run',
      }))
    )
    .select('*');

  if (error) {
    console.warn('Failed to insert agent tasks:', error.message);
    return [];
  }

  return (data as AgentTask[]) ?? [];
}
