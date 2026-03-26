export type AgentName =
  | 'ceo'
  | 'product_tech'
  | 'content_curriculum'
  | 'growth'
  | 'support_success'
  | 'finance_ops';

export type AgentTaskStatus = 'pending' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type AgentPriority = 'low' | 'medium' | 'high' | 'critical';
export type AgentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AgentRunType = 'manual' | 'scheduled' | 'triggered';

export interface AgentTask {
  id: string;
  agent_name: AgentName;
  task_type: string;
  title: string;
  description: string | null;
  payload: Record<string, unknown>;
  status: AgentTaskStatus;
  priority: AgentPriority;
  source: string;
  owner: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface AgentLog {
  id: string;
  agent_name: AgentName;
  run_type: AgentRunType;
  run_at: string;
  summary: string;
  details: Record<string, unknown>;
  metrics_snapshot: Record<string, unknown>;
  actions_taken: unknown[];
  severity: AgentSeverity | null;
  created_tasks_count: number;
  created_at: string;
}

export interface BusinessMetric {
  id: string;
  date: string;
  mrr: number;
  subscriber_count: number;
  new_subs: number;
  churned: number;
  trial_count: number;
  active_sessions: number;
  completed_lessons: number | null;
  support_count: number | null;
  waitlist_count: number | null;
  site_conversion_rate: number | null;
  created_at: string;
}

export interface AgentFinding {
  title: string;
  detail: string;
  severity: AgentSeverity;
}

export interface AgentRecommendedAction {
  title: string;
  reason: string;
  priority: AgentPriority;
}

export interface AgentTaskDraft {
  task_type: string;
  title: string;
  description: string;
  priority: AgentPriority;
  payload?: Record<string, unknown>;
}

export interface AgentOutput {
  summary: string;
  findings: AgentFinding[];
  recommended_actions: AgentRecommendedAction[];
  tasks: AgentTaskDraft[];
}

export interface AgentStatusSummary {
  agent_name: AgentName;
  latest_run_at: string | null;
  summary: string;
  status: 'ok' | 'attention' | 'blocked';
  created_tasks_count: number;
  open_tasks_count: number;
}

export interface CeoDashboardData {
  overview: {
    last_ceo_run_at: string | null;
    open_high_priority_tasks: number;
    blockers: number;
  };
  metrics: BusinessMetric | null;
  ceo_brief: {
    summary: string;
    priorities: string[];
    blockers: string[];
    next_actions: string[];
  };
  agents: AgentStatusSummary[];
  tasks: AgentTask[];
  logs: AgentLog[];
}
