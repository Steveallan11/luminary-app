import { createClient } from '@supabase/supabase-js';
import { AgentTask, AgentType, AgentContext, AgentResponse, TaskRouting } from './types';
import { processCEORequest } from './ceo-agent';
import { processContentTask } from './content-agent';

// Agent task processors
const AGENT_PROCESSORS: Record<AgentType, (task: AgentTask) => Promise<AgentResponse>> = {
  ceo: async () => ({ message: 'CEO handles conversations, not tasks directly.' }),
  content: processContentTask,
  debug: async (task) => ({ message: `Debug task received: ${task.title}. Analysis would go here.` }),
  marketing: async (task) => ({ message: `Marketing task received: ${task.title}. Content generation would go here.` }),
  analytics: async (task) => ({ message: `Analytics task received: ${task.title}. Report generation would go here.` }),
  support: async (task) => ({ message: `Support task received: ${task.title}. Response drafting would go here.` }),
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Process a chat message through the CEO agent and route any resulting tasks
 */
export async function processAgentChat(
  sessionId: string,
  userMessage: string,
  userId: string
): Promise<{ response: AgentResponse; tasks: AgentTask[] }> {
  const supabase = getSupabaseClient();
  
  // Load conversation history
  let conversationHistory: AgentContext['conversationHistory'] = [];
  if (supabase) {
    const { data: messages } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20);
    
    if (messages) {
      conversationHistory = messages.map(m => ({
        id: m.id,
        session_id: m.session_id,
        role: m.role,
        content: m.content,
        agent_type: m.agent_type,
        task_ids: m.task_ids || [],
        metadata: m.metadata || {},
        created_at: m.created_at,
      }));
    }
  }

  // Build context for CEO
  const context: AgentContext = {
    sessionId,
    conversationHistory,
    activeTaskIds: [],
  };

  // Process through CEO
  const ceoResponse = await processCEORequest(userMessage, context);
  
  // Create tasks from routing
  const createdTasks: AgentTask[] = [];
  if (ceoResponse.tasks && ceoResponse.tasks.length > 0 && supabase) {
    for (const taskRouting of ceoResponse.tasks as TaskRouting[]) {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      
      const task: AgentTask = {
        id: taskId,
        agent_type: taskRouting.agent,
        status: 'pending',
        priority: taskRouting.priority,
        title: taskRouting.title,
        description: taskRouting.description,
        input_data: taskRouting.inputData,
        output_data: {},
        created_at: new Date().toISOString(),
        created_by: userId,
      };

      // Save task to database
      await supabase.from('agent_tasks').insert({
        id: task.id,
        agent_type: task.agent_type,
        status: task.status,
        priority: task.priority,
        title: task.title,
        description: task.description,
        input_data: task.input_data,
        output_data: task.output_data,
        created_by: task.created_by,
      });

      createdTasks.push(task);
    }
  }

  // Save conversation messages
  if (supabase) {
    // Save user message
    await supabase.from('agent_conversations').insert({
      session_id: sessionId,
      role: 'user',
      content: userMessage,
      task_ids: [],
      metadata: {},
    });

    // Save assistant response
    await supabase.from('agent_conversations').insert({
      session_id: sessionId,
      role: 'assistant',
      content: ceoResponse.message,
      agent_type: 'ceo',
      task_ids: createdTasks.map(t => t.id),
      metadata: ceoResponse.metadata || {},
    });
  }

  return {
    response: ceoResponse,
    tasks: createdTasks,
  };
}

/**
 * Execute a queued task
 */
export async function executeTask(taskId: string): Promise<AgentResponse> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { message: 'Database not configured' };
  }

  // Get task
  const { data: task, error } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error || !task) {
    return { message: `Task not found: ${taskId}` };
  }

  // Update status to running
  await supabase
    .from('agent_tasks')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', taskId);

  // Process task with appropriate agent
  const processor = AGENT_PROCESSORS[task.agent_type as AgentType];
  if (!processor) {
    await supabase
      .from('agent_tasks')
      .update({ status: 'failed', error_message: 'Unknown agent type' })
      .eq('id', taskId);
    return { message: `Unknown agent type: ${task.agent_type}` };
  }

  try {
    const result = await processor(task as AgentTask);

    // Update task with result
    await supabase
      .from('agent_tasks')
      .update({
        status: 'completed',
        output_data: result.metadata || {},
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Task execution failed';
    
    await supabase
      .from('agent_tasks')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    return { message: errorMessage };
  }
}

/**
 * Get tasks for a session or all pending tasks
 */
export async function getTasks(options?: { 
  sessionId?: string; 
  status?: string; 
  agentType?: AgentType;
  limit?: number;
}): Promise<AgentTask[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('agent_tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.agentType) {
    query = query.eq('agent_type', options.agentType);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  return (data as AgentTask[]) || [];
}

/**
 * Get conversation history for a session
 */
export async function getConversationHistory(sessionId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  return data || [];
}
