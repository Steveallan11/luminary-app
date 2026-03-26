import { createClient } from '@supabase/supabase-js';
import type { AgentLog, AgentName, AgentTask, AgentTaskDraft, AgentTaskStatus, BusinessMetric, LessonStructureRecord } from '@/types/agents';

export function getServiceSupabaseClient() {
  return getServiceSupabase();
}

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

export async function getOpenAgentTasks(limit = 20, agentName?: AgentName): Promise<AgentTask[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];

  let query = supabase
    .from('agent_tasks')
    .select('*')
    .in('status', ['pending', 'in_progress', 'blocked'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (agentName) {
    query = query.eq('agent_name', agentName);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('Failed to fetch agent tasks:', error.message);
    return [];
  }

  return (data as AgentTask[]) ?? [];
}

export async function updateAgentTask(taskId: string, updates: {
  status?: AgentTaskStatus;
  owner?: string | null;
  priority?: AgentTask['priority'];
}): Promise<AgentTask | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const patch: Record<string, unknown> = {};

  if (typeof updates.status === 'string') {
    patch.status = updates.status;
    patch.completed_at = updates.status === 'done' ? new Date().toISOString() : null;
  }

  if (typeof updates.owner === 'string' || updates.owner === null) {
    patch.owner = updates.owner;
  }

  if (typeof updates.priority === 'string') {
    patch.priority = updates.priority;
  }

  const { data, error } = await supabase
    .from('agent_tasks')
    .update(patch)
    .eq('id', taskId)
    .select('*')
    .single();

  if (error) {
    console.warn('Failed to update agent task:', error.message);
    return null;
  }

  return (data as AgentTask) ?? null;
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

export async function getRecentLessonStructures(limit = 10): Promise<LessonStructureRecord[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('topic_lesson_structures')
    .select('id, topic_id, key_stage, age_group, status, spark_json, explore_json, anchor_json, practise_json, create_json, check_json, celebrate_json, created_at, topics(title, subjects(name))')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Failed to fetch lesson structures:', error.message);
    return [];
  }

  return (data as LessonStructureRecord[]) ?? [];
}
