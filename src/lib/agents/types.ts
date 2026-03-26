// Agent System Types

export type AgentType = 'ceo' | 'content' | 'debug' | 'marketing' | 'analytics' | 'support';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentTask {
  id: string;
  agent_type: AgentType;
  parent_task_id?: string;
  status: TaskStatus;
  priority: number;
  title: string;
  description?: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  created_by: string;
}

export interface AgentMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent_type?: AgentType;
  task_ids: string[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AgentContext {
  sessionId: string;
  conversationHistory: AgentMessage[];
  activeTaskIds: string[];
}

export interface AgentResponse {
  message: string;
  tasks?: Partial<AgentTask>[];
  suggestions?: string[];
  metadata?: Record<string, unknown>;
}

export interface AgentCapability {
  name: string;
  description: string;
  examples: string[];
}

export interface AgentDefinition {
  type: AgentType;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  systemPrompt: string;
}

// Task routing result from CEO
export interface TaskRouting {
  agent: AgentType;
  taskType: string;
  title: string;
  description: string;
  priority: number;
  inputData: Record<string, unknown>;
}
