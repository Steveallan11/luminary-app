import { getAnthropicClient, LUMI_MODEL } from '@/lib/anthropic';
import { AgentType, AgentContext, AgentResponse, TaskRouting, AgentDefinition } from './types';

// Agent definitions for the CEO to understand capabilities
const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    type: 'content',
    name: 'Content Agent',
    description: 'Generates educational lesson content using Claude AI',
    capabilities: [
      {
        name: 'Generate Lesson',
        description: 'Creates a complete lesson structure with spark, explore, anchor, practise, create, check, and celebrate phases',
        examples: ['Generate a lesson on fractions for Year 4', 'Create content for the Roman Empire topic'],
      },
      {
        name: 'Generate Topic Brief',
        description: 'Creates a topic brief with key concepts, misconceptions, and curriculum objectives',
        examples: ['Create a brief for photosynthesis', 'Draft objectives for multiplication'],
      },
      {
        name: 'Batch Generate',
        description: 'Queue multiple lessons for generation',
        examples: ['Generate all pending lessons for Maths', 'Create lessons for the entire Science curriculum'],
      },
    ],
    systemPrompt: 'You are the Content Agent for Luminary educational platform.',
  },
  {
    type: 'debug',
    name: 'Debug Agent', 
    description: 'Analyzes errors, logs, and system health',
    capabilities: [
      {
        name: 'Analyze Error',
        description: 'Examines error logs and suggests fixes',
        examples: ['Why did lesson generation fail?', 'Check the signup error logs'],
      },
      {
        name: 'Check System Health',
        description: 'Reviews API response times, error rates, and database status',
        examples: ['Is the Claude API responding?', 'Check database connection status'],
      },
      {
        name: 'Debug User Issue',
        description: 'Investigates specific user-reported problems',
        examples: ['User cannot log in', 'Lesson not loading for child ID xyz'],
      },
    ],
    systemPrompt: 'You are the Debug Agent for Luminary. Analyze issues methodically.',
  },
  {
    type: 'marketing',
    name: 'Marketing Agent',
    description: 'Creates marketing content, social posts, and email campaigns',
    capabilities: [
      {
        name: 'Generate Social Post',
        description: 'Creates engaging social media content',
        examples: ['Write a Twitter thread about homeschooling benefits', 'Create an Instagram caption'],
      },
      {
        name: 'Draft Email',
        description: 'Writes email campaigns and newsletters',
        examples: ['Welcome email for new users', 'Monthly newsletter draft'],
      },
      {
        name: 'Generate Copy',
        description: 'Creates website copy, ads, and promotional content',
        examples: ['Landing page headline options', 'App store description'],
      },
    ],
    systemPrompt: 'You are the Marketing Agent for Luminary. Create compelling, parent-friendly content.',
  },
  {
    type: 'analytics',
    name: 'Analytics Agent',
    description: 'Analyzes usage data, learning outcomes, and business metrics',
    capabilities: [
      {
        name: 'Usage Report',
        description: 'Summarizes platform usage statistics',
        examples: ['How many active users this week?', 'Which topics are most popular?'],
      },
      {
        name: 'Learning Outcomes',
        description: 'Analyzes student progress and mastery data',
        examples: ['Average mastery scores by subject', 'Which lessons have lowest completion?'],
      },
      {
        name: 'Business Metrics',
        description: 'Reports on signups, retention, and engagement',
        examples: ['Weekly signup funnel', 'User retention rates'],
      },
    ],
    systemPrompt: 'You are the Analytics Agent for Luminary. Provide clear, actionable insights.',
  },
  {
    type: 'support',
    name: 'Support Agent',
    description: 'Handles user inquiries and provides help documentation',
    capabilities: [
      {
        name: 'Answer FAQ',
        description: 'Responds to common user questions',
        examples: ['How do I add another child?', 'How does the PIN system work?'],
      },
      {
        name: 'Draft Response',
        description: 'Creates support ticket responses',
        examples: ['Respond to billing inquiry', 'Help with login issue'],
      },
      {
        name: 'Update Docs',
        description: 'Suggests improvements to help documentation',
        examples: ['FAQ for onboarding', 'Troubleshooting guide'],
      },
    ],
    systemPrompt: 'You are the Support Agent for Luminary. Be helpful and empathetic.',
  },
];

const CEO_SYSTEM_PROMPT = `You are the CEO Agent for Luminary, an AI-powered educational platform for homeschooling families in the UK.

Your role is to:
1. Understand admin requests and route them to the appropriate specialized agent
2. Provide high-level status updates and summaries
3. Coordinate complex tasks that span multiple agents
4. Make decisions about priorities and resource allocation

Available Agents:
${AGENT_DEFINITIONS.map(a => `
**${a.name}** (${a.type})
${a.description}
Capabilities: ${a.capabilities.map(c => c.name).join(', ')}
`).join('\n')}

When responding:
- If the request should be handled by a specialized agent, indicate which one and what task to create
- Format task routing as JSON in a <task> block
- Always provide a natural language response along with any task routing
- If you need clarification, ask specific questions
- For status requests, summarize what you know and what agents could help

Task routing format:
<task>
{
  "agent": "content|debug|marketing|analytics|support",
  "taskType": "specific_action",
  "title": "Brief task title",
  "description": "Detailed description of what to do",
  "priority": 1-5 (1=highest),
  "inputData": { any relevant data }
}
</task>

You can route multiple tasks by including multiple <task> blocks.`;

export async function processCEORequest(
  userMessage: string,
  context: AgentContext
): Promise<AgentResponse> {
  const client = getAnthropicClient();

  // Build conversation history for Claude
  const messages = context.conversationHistory
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  // Add the new message
  messages.push({ role: 'user', content: userMessage });

  try {
    const response = await client.messages.create({
      model: LUMI_MODEL,
      max_tokens: 2048,
      system: CEO_SYSTEM_PROMPT,
      messages,
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const fullText = textBlock && 'text' in textBlock ? textBlock.text : '';

    // Parse task routing from response
    const tasks = parseTaskRouting(fullText);
    
    // Clean the message (remove task blocks)
    const cleanMessage = fullText.replace(/<task>[\s\S]*?<\/task>/g, '').trim();

    // Extract suggestions if any
    const suggestions = extractSuggestions(fullText);

    return {
      message: cleanMessage || 'Task routed to specialized agent.',
      tasks,
      suggestions,
      metadata: {
        model: LUMI_MODEL,
        agentsAvailable: AGENT_DEFINITIONS.map(a => a.type),
      },
    };
  } catch (error) {
    console.error('CEO Agent error:', error);
    return {
      message: 'I encountered an issue processing your request. Please try again.',
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}

function parseTaskRouting(text: string): TaskRouting[] {
  const tasks: TaskRouting[] = [];
  const taskRegex = /<task>([\s\S]*?)<\/task>/g;
  let match;

  while ((match = taskRegex.exec(text)) !== null) {
    try {
      const taskJson = JSON.parse(match[1].trim());
      if (taskJson.agent && taskJson.title) {
        tasks.push({
          agent: taskJson.agent as AgentType,
          taskType: taskJson.taskType || 'general',
          title: taskJson.title,
          description: taskJson.description || '',
          priority: taskJson.priority || 3,
          inputData: taskJson.inputData || {},
        });
      }
    } catch (e) {
      console.error('Failed to parse task JSON:', e);
    }
  }

  return tasks;
}

function extractSuggestions(text: string): string[] {
  const suggestions: string[] = [];
  
  // Look for numbered suggestions or bullet points
  const suggestionRegex = /(?:suggestion|you could|you might|consider)[:\s]+([^\n.]+)/gi;
  let match;
  
  while ((match = suggestionRegex.exec(text)) !== null) {
    suggestions.push(match[1].trim());
  }

  return suggestions;
}

export function getAgentDefinitions(): AgentDefinition[] {
  return AGENT_DEFINITIONS;
}

export function getAgentByType(type: AgentType): AgentDefinition | undefined {
  return AGENT_DEFINITIONS.find(a => a.type === type);
}
