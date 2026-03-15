'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Lightbulb,
  Zap,
  Clock,
  Trophy,
  ArrowRight,
  X,
} from 'lucide-react';
import Starfield from '@/components/ui/Starfield';
import Button from '@/components/ui/Button';
import { MOCK_SUBJECTS, MOCK_TOPICS, MOCK_CHILD } from '@/lib/mock-data';
import {
  clampMastery,
  detectCorrectResponse,
  detectExplanation,
} from '@/lib/mastery';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type SessionState = 'loading' | 'chatting' | 'ending' | 'summary';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const topicSlug = params.topic as string;

  const subject = MOCK_SUBJECTS.find((s) => s.slug === slug);
  const topics = MOCK_TOPICS[slug] || [];
  const topic = topics.find((t) => t.slug === topicSlug);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>('loading');
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [masteryScore, setMasteryScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [sessionStartTime] = useState(() => Date.now());
  const [sessionSummary, setSessionSummary] = useState<{
    text: string;
    xp: number;
    mastery: number;
    status: string;
    newXpTotal: number;
    newStreak: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      const mins = Math.floor((Date.now() - sessionStartTime) / 60000);
      setElapsedMinutes(mins);
      if (mins >= 20 && sessionState === 'chatting') {
        handleEndSession();
      }
    }, 10000);
    timerRef.current = interval;
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStartTime, sessionState]);

  // Fetch opening message on mount
  useEffect(() => {
    if (subject && topic) {
      fetchOpeningMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOpeningMessage = async () => {
    setSessionState('loading');
    try {
      const res = await fetch(
        `/api/lumi/opening-message?child_id=${MOCK_CHILD.id}&subject_slug=${slug}&topic_slug=${topicSlug}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get opening message');
      }
      const data = await res.json();
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        },
      ]);
      setSessionState('chatting');
    } catch (err) {
      console.error('Opening message error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to start lesson'
      );
      // Fallback: show a generic opening message
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Hey ${MOCK_CHILD.name}! ✨ I'm Lumi, your learning buddy! Today we're going to explore ${topic?.title}. ${topic?.description}.\n\nBefore we dive in, tell me — do you already know anything about this topic? I'd love to hear what you think!`,
          timestamp: new Date(),
        },
      ]);
      setSessionState('chatting');
    }
  };

  const streamResponse = async (
    allMessages: ChatMessage[],
    isHint: boolean = false
  ) => {
    setIsStreaming(true);
    setError(null);

    const assistantMsgId = `msg-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      },
    ]);

    try {
      const apiMessages = allMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/lumi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: MOCK_CHILD.id,
          topic_id: topic?.id,
          subject_slug: slug,
          topic_slug: topicSlug,
          messages: apiMessages,
          session_id: sessionId,
          is_hint: isHint,
          mastery_score: masteryScore,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response from Lumi');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullText += parsed.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: fullText }
                        : m
                    )
                  );
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch {
                // Skip malformed JSON chunks
              }
            }
          }
        }
      }

      // Update mastery based on Lumi's response
      if (fullText) {
        if (detectCorrectResponse(fullText)) {
          setMasteryScore((prev) => clampMastery(prev + 5));
          setXpEarned((prev) => prev + 2);
        }
        if (detectExplanation(fullText)) {
          setMasteryScore((prev) => clampMastery(prev + 10));
          setXpEarned((prev) => prev + 5);
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  "Oops! I had a little hiccup there. Could you try saying that again? I'm all ears! 👂✨",
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming || sessionState !== 'chatting') return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    inputRef.current?.focus();

    await streamResponse(updatedMessages);
  };

  const handleHint = async () => {
    if (isStreaming || sessionState !== 'chatting') return;

    // Reduce mastery for using hint
    setMasteryScore((prev) => clampMastery(prev - 2));

    const hintMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: "I'm stuck — can you give me a hint?",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, hintMessage];
    setMessages(updatedMessages);

    await streamResponse(updatedMessages, true);
  };

  const handleEndSession = useCallback(async () => {
    if (sessionState === 'ending' || sessionState === 'summary') return;
    setSessionState('ending');

    try {
      const res = await fetch('/api/lumi/session-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: MOCK_CHILD.id,
          topic_id: topic?.id,
          topic_title: topic?.title,
          session_id: sessionId,
          message_count: messages.length,
          mastery_score: masteryScore,
          child_name: MOCK_CHILD.name,
        }),
      });

      if (!res.ok) throw new Error('Failed to end session');

      const data = await res.json();
      setSessionSummary({
        text: data.session.summary_text,
        xp: data.session.xp_earned,
        mastery: data.session.mastery_score,
        status: data.session.topic_status,
        newXpTotal: data.child.xp_total,
        newStreak: data.child.streak_days,
      });
      setSessionState('summary');
    } catch (err) {
      console.error('Session end error:', err);
      // Fallback summary
      const fallbackXP = 10 + Math.floor(messages.length / 2) * 2 + 5;
      setSessionSummary({
        text: `Explored ${topic?.title} with Lumi`,
        xp: fallbackXP,
        mastery: clampMastery(masteryScore + 15),
        status: masteryScore + 15 >= 70 ? 'completed' : 'in_progress',
        newXpTotal: MOCK_CHILD.xp_total + fallbackXP,
        newStreak: MOCK_CHILD.streak_days,
      });
      setSessionState('summary');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState, masteryScore, messages.length, topic]);

  // Not found
  if (!subject || !topic) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center relative">
        <Starfield />
        <div className="text-center relative z-10">
          <p className="text-slate-light mb-4">Topic not found</p>
          <Link href="/learn" className="text-amber hover:underline">
            Back to Learning Universe
          </Link>
        </div>
      </div>
    );
  }

  // Session summary screen
  if (sessionState === 'summary' && sessionSummary) {
    return (
      <div className="min-h-screen bg-navy relative flex items-center justify-center">
        <Starfield />
        <motion.div
          className="relative z-10 max-w-md w-full mx-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-3xl bg-navy-light/80 backdrop-blur-sm border border-white/10 p-8 text-center">
            {/* Lumi celebration */}
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-amber/30 to-amber/10 border-2 border-amber/30 flex items-center justify-center mx-auto mb-6"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(245, 158, 11, 0.3)',
                  '0 0 50px rgba(245, 158, 11, 0.6)',
                  '0 0 20px rgba(245, 158, 11, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-4xl">🎉</span>
            </motion.div>

            <h2
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Great session, {MOCK_CHILD.name}!
            </h2>
            <p className="text-slate-light/70 mb-6">{sessionSummary.text}</p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-navy/60 border border-white/10 p-4">
                <Zap size={20} className="text-amber mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber">
                  +{sessionSummary.xp}
                </p>
                <p className="text-xs text-slate-light/60">XP Earned</p>
              </div>
              <div className="rounded-2xl bg-navy/60 border border-white/10 p-4">
                <Trophy size={20} className="text-emerald mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald">
                  {sessionSummary.mastery}%
                </p>
                <p className="text-xs text-slate-light/60">Mastery</p>
              </div>
            </div>

            {sessionSummary.status === 'completed' && (
              <motion.div
                className="rounded-2xl bg-emerald/10 border border-emerald/30 p-3 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm font-bold text-emerald">
                  Topic completed! 🌟
                </p>
              </motion.div>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => router.push(`/learn/${slug}`)}
                variant="primary"
                size="lg"
                className="w-full gap-2"
              >
                Continue Exploring <ArrowRight size={16} />
              </Button>
              <Button
                onClick={() => router.push('/learn')}
                variant="ghost"
                size="md"
                className="w-full"
              >
                Back to Learning Universe
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy relative flex flex-col">
      <Starfield />

      {/* Top bar */}
      <motion.div
        className="relative z-10 px-4 sm:px-6 py-3 border-b border-white/10 bg-navy/80 backdrop-blur-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/learn/${slug}`}
              className="text-slate-light/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ backgroundColor: `${subject.colour_hex}20` }}
            >
              {subject.icon_emoji}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{subject.name}</p>
              <p className="text-xs text-slate-light/50">{topic.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-light/50">
              <Clock size={12} />
              <span>{elapsedMinutes}m</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber">
              <Zap size={12} />
              <span>+{xpEarned} XP</span>
            </div>
            <button
              onClick={handleEndSession}
              disabled={sessionState !== 'chatting'}
              className="text-xs text-slate-light/50 hover:text-white transition-colors disabled:opacity-30"
            >
              Finish
            </button>
          </div>
        </div>
      </motion.div>

      {/* Chat area */}
      <div className="flex-1 relative z-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Loading state */}
          {sessionState === 'loading' && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-amber/30 to-amber/10 border-2 border-amber/30 flex items-center justify-center mx-auto mb-4"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(245, 158, 11, 0.3)',
                      '0 0 40px rgba(245, 158, 11, 0.5)',
                      '0 0 20px rgba(245, 158, 11, 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-2xl">✨</span>
                </motion.div>
                <p className="text-slate-light/70 text-sm">
                  Lumi is preparing your lesson...
                </p>
                <TypingIndicator />
              </div>
            </div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-start gap-3 max-w-[85%]">
                    {/* Lumi avatar */}
                    <motion.div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-amber/30 to-amber/10 border border-amber/30 flex items-center justify-center flex-shrink-0 mt-1"
                      animate={
                        isStreaming &&
                        message.id === messages[messages.length - 1]?.id
                          ? {
                              boxShadow: [
                                '0 0 8px rgba(245, 158, 11, 0.3)',
                                '0 0 16px rgba(245, 158, 11, 0.5)',
                                '0 0 8px rgba(245, 158, 11, 0.3)',
                              ],
                            }
                          : {}
                      }
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <span className="text-sm">✨</span>
                    </motion.div>
                    {/* Message bubble */}
                    <div
                      className="rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed text-white whitespace-pre-wrap"
                      style={{
                        backgroundColor: `${subject.colour_hex}15`,
                        borderLeft: `2px solid ${subject.colour_hex}40`,
                      }}
                    >
                      {message.content || <TypingIndicator />}
                    </div>
                  </div>
                )}
                {message.role === 'user' && (
                  <div className="max-w-[85%]">
                    <div className="rounded-2xl rounded-tr-md px-4 py-3 text-sm leading-relaxed bg-white/90 text-navy whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming indicator */}
          {isStreaming &&
            messages.length > 0 &&
            messages[messages.length - 1].content === '' && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8" />
                  <TypingIndicator />
                </div>
              </div>
            )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input area */}
      {sessionState === 'chatting' && (
        <motion.div
          className="relative z-10 px-4 sm:px-6 py-3 border-t border-white/10 bg-navy/80 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handleHint}
                disabled={isStreaming}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber/10 border border-amber/20 text-amber text-xs font-semibold hover:bg-amber/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Lightbulb size={12} />
                I&apos;m stuck — give me a hint 💡
              </button>
              <button
                onClick={handleEndSession}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-light/60 text-xs hover:text-white hover:border-white/20 transition-all ml-auto"
              >
                <X size={12} />
                Finish for now
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your message to Lumi..."
                  disabled={isStreaming}
                  className="w-full px-5 py-3.5 rounded-2xl bg-navy-light/60 border border-white/15 text-white placeholder-slate-mid/50 focus:outline-none focus:ring-2 focus:ring-amber/30 focus:border-amber/30 transition-all disabled:opacity-50"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  backgroundColor:
                    inputValue.trim() && !isStreaming
                      ? subject.colour_hex
                      : `${subject.colour_hex}30`,
                }}
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ending state */}
      {sessionState === 'ending' && (
        <div className="relative z-10 px-4 sm:px-6 py-6 border-t border-white/10 bg-navy/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-slate-light/70 text-sm">
              Wrapping up your session...
            </p>
            <TypingIndicator />
          </div>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-amber/60"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
