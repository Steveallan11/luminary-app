import { NextRequest, NextResponse } from 'next/server';
import { processAgentChat, executeTask, getTasks } from '@/lib/agents/orchestrator';
import { getAgentDefinitions } from '@/lib/agents/ceo-agent';

export const maxDuration = 60;

/**
 * POST /api/admin/agents/chat
 * Process a message through the CEO agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, userId, executeTaskId } = body;

    // If executeTaskId is provided, execute that task instead
    if (executeTaskId) {
      const result = await executeTask(executeTaskId);
      return NextResponse.json({
        success: true,
        taskResult: result,
      });
    }

    // Validate required fields
    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'message and sessionId are required' },
        { status: 400 }
      );
    }

    // Process through agent system
    const { response, tasks } = await processAgentChat(
      sessionId,
      message,
      userId || 'admin'
    );

    return NextResponse.json({
      success: true,
      message: response.message,
      tasks,
      suggestions: response.suggestions,
      metadata: response.metadata,
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/agents/chat
 * Get conversation history or task list
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'agents') {
      // Return available agents
      return NextResponse.json({
        agents: getAgentDefinitions(),
      });
    }

    if (action === 'tasks') {
      // Return tasks
      const status = searchParams.get('status') || undefined;
      const limit = parseInt(searchParams.get('limit') || '20');
      
      const tasks = await getTasks({ status, limit });
      return NextResponse.json({ tasks });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Agent GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
