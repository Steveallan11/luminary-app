'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  FileText,
  Bug,
  Megaphone,
  BarChart3,
  HeadphonesIcon,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
  Sparkles,
} from 'lucide-react';

interface AgentTask {
  id: string;
  agent_type: string;
  status: string;
  priority: number;
  title: string;
  description?: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tasks?: AgentTask[];
  timestamp: Date;
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  ceo: Bot,
  content: FileText,
  debug: Bug,
  marketing: Megaphone,
  analytics: BarChart3,
  support: HeadphonesIcon,
};

const AGENT_COLORS: Record<string, string> = {
  ceo: 'text-amber',
  content: 'text-emerald',
  debug: 'text-red-400',
  marketing: 'text-pink-400',
  analytics: 'text-blue-400',
  support: 'text-purple-400',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

export default function CEODashboardPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm the CEO Agent for Luminary. I can help you manage content creation, analyze issues, create marketing materials, and more. What would you like to do today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load recent tasks
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/admin/agents/chat?action=tasks&limit=10');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          userId: 'admin',
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        tasks: data.tasks,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update tasks list if new tasks were created
      if (data.tasks?.length) {
        setTasks((prev) => [...data.tasks, ...prev].slice(0, 10));
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleExecuteTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/admin/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executeTaskId: taskId }),
      });

      if (res.ok) {
        fetchTasks(); // Refresh tasks
      }
    } catch (err) {
      console.error('Failed to execute task:', err);
    }
  };

  const quickActions = [
    { label: 'Generate Maths Lesson', prompt: 'Generate a lesson on fractions for Year 4 students' },
    { label: 'Check System Health', prompt: 'What is the current system status? Are there any errors?' },
    { label: 'Create Social Post', prompt: 'Write a Twitter post about the benefits of personalized learning' },
    { label: 'User Stats', prompt: 'How many active users do we have this week?' },
  ];

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-navy-light/30 rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber/20 flex items-center justify-center">
            <Bot className="text-amber" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">CEO Agent</h1>
            <p className="text-xs text-slate-light/60">Orchestrating your AI workforce</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-amber/20 text-white'
                      : 'bg-white/5 text-slate-light'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {/* Show tasks created by this message */}
                  {message.tasks && message.tasks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      <p className="text-xs text-slate-light/60 uppercase tracking-wider">Tasks Created:</p>
                      {message.tasks.map((task) => {
                        const Icon = AGENT_ICONS[task.agent_type] || Bot;
                        const colorClass = AGENT_COLORS[task.agent_type] || 'text-white';
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 px-3 py-2 bg-navy/50 rounded-lg"
                          >
                            <Icon className={colorClass} size={14} />
                            <span className="text-sm text-white flex-1">{task.title}</span>
                            <span className="text-xs text-slate-light/40 capitalize">{task.agent_type}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-light/40 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="animate-spin text-amber" size={16} />
                <span className="text-slate-light/60 text-sm">Thinking...</span>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-slate-light/60 mb-2">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    setInput(action.prompt);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 text-slate-light rounded-lg border border-white/10 transition-all"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the CEO Agent anything..."
              className="flex-1 bg-navy/60 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-slate-light/40 focus:outline-none focus:border-amber/50 focus:ring-2 focus:ring-amber/20"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-amber text-navy-dark font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber/90 transition-all flex items-center gap-2"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Task Sidebar */}
      <div className="w-80 bg-navy-light/30 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Recent Tasks</h2>
          <button
            onClick={fetchTasks}
            className="text-xs text-slate-light/60 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-light/40 text-center py-8">No tasks yet</p>
          ) : (
            tasks.map((task) => {
              const Icon = AGENT_ICONS[task.agent_type] || Bot;
              const StatusIcon = STATUS_ICONS[task.status] || Clock;
              const colorClass = AGENT_COLORS[task.agent_type] || 'text-white';

              return (
                <div
                  key={task.id}
                  className="p-3 bg-navy/50 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-light/40 capitalize">{task.agent_type}</span>
                        <span className="text-slate-light/20">|</span>
                        <div className="flex items-center gap-1">
                          <StatusIcon
                            size={10}
                            className={
                              task.status === 'completed'
                                ? 'text-emerald'
                                : task.status === 'failed'
                                ? 'text-red-400'
                                : task.status === 'running'
                                ? 'text-amber animate-spin'
                                : 'text-slate-light/40'
                            }
                          />
                          <span className="text-xs text-slate-light/40 capitalize">{task.status}</span>
                        </div>
                      </div>
                    </div>
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleExecuteTask(task.id)}
                        className="p-1.5 rounded-lg bg-emerald/20 text-emerald hover:bg-emerald/30 transition-all"
                        title="Execute task"
                      >
                        <Play size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Agent Legend */}
        <div className="p-3 border-t border-white/10">
          <p className="text-[10px] text-slate-light/40 uppercase tracking-wider mb-2">Agents</p>
          <div className="grid grid-cols-3 gap-1">
            {Object.entries(AGENT_ICONS).map(([type, Icon]) => (
              <div key={type} className="flex items-center gap-1.5">
                <Icon size={10} className={AGENT_COLORS[type]} />
                <span className="text-[10px] text-slate-light/60 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
