'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
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
  Sparkles,
  Wand2,
  PartyPopper,
} from 'lucide-react';
import Starfield from '@/components/ui/Starfield';
import Button from '@/components/ui/Button';
import ContentRenderer from '@/components/content/ContentRenderer';
import { MOCK_CHILD, MOCK_SUBJECTS, MOCK_TOPICS, LESSON_PHASE_LABELS } from '@/lib/mock-data';
import { clampMastery, detectCorrectResponse, detectExplanation } from '@/lib/mastery';
import { getXPLevel, LessonPhase, ParsedContentSignal } from '@/types';
import { buildContentManifest, getTopicProgress } from '@/lib/lesson-engine';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase';
import { MOCK_TOPIC_ASSETS, MOCK_FRACTION_BAR_DIAGRAM, MOCK_NUMBER_LINE } from '@/lib/mock-content';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contentSignals?: ParsedContentSignal[];
  phase?: LessonPhase;
}

type SessionState = 'booting' | 'generating' | 'loading' | 'chatting' | 'ending' | 'summary';

const PHASE_ORDER: LessonPhase[] = ['spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate'];

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const topicSlug = params.topic as string;

  const subject = MOCK_SUBJECTS.find((s) => s.slug === slug);
  const topics = MOCK_TOPICS[slug] || [];
  const topic = topics.find((t) => t.slug === topicSlug);
  const subjectColour = subject?.colour_hex ?? '#8B5CF6';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>('booting');
  const [sessionId, setSessionId] = useState(() => `session-${Date.now()}`);
  const [masteryScore, setMasteryScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [floatingXp, setFloatingXp] = useState<number | null>(null);
  const [sessionStartTime] = useState(() => Date.now());
  const [currentPhase, setCurrentPhase] = useState<LessonPhase>('spark');
  const [phaseMoments, setPhaseMoments] = useState<LessonPhase[]>(['spark']);
  const [sessionSummary, setSessionSummary] = useState<{
    text: string;
    xp: number;
    mastery: number;
    status: string;
    newXpTotal: number;
    newStreak: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationMessage, setGenerationMessage] = useState('Lumi is preparing your personalised lesson…');
  const [generationProgress, setGenerationProgress] = useState(0.15);
  const [generatedManifest, setGeneratedManifest] = useState(() => (topic ? buildContentManifest(topic.id) : undefined));
  const [completionBurst, setCompletionBurst] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const generationRef = useRef<number | null>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const contentAssets = useMemo(() => {
    if (!topic) return [];
    return MOCK_TOPIC_ASSETS.filter((asset) => asset.topic_id === topic.id);
  }, [topic]);

  const diagrams = useMemo(() => {
    if (!topic) return [];
    return [MOCK_FRACTION_BAR_DIAGRAM, MOCK_NUMBER_LINE].filter((diagram) => diagram.topic_id === topic.id);
  }, [topic]);

  const topicProgress = getTopicProgress(slug, topicSlug);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (subject && topic) {
      void bootstrapLesson();
    }
    return () => {
      if (generationRef.current) clearInterval(generationRef.current);
      if (realtimeChannelRef.current) {
        const supabase = createSupabaseBrowserClient();
        void supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [subject, topic]);

  const awardXp = (amount: number) => {
    if (amount <= 0) return;
    setXpEarned((prev) => prev + amount);
    setFloatingXp(amount);
    window.setTimeout(() => setFloatingXp(null), 1800);
  };

  const bootstrapLesson = async () => {
    setSessionState('booting');
    setError(null);

    try {
      const startRes = await fetch('/api/lesson/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: MOCK_CHILD.id,
          subject_slug: slug,
          topic_slug: topicSlug,
        }),
      });

      if (!startRes.ok) throw new Error('Failed to start lesson');
      const startData = await startRes.json();
      setSessionId(startData.lesson.sessionId);
      setCurrentPhase(startData.lesson.phase ?? 'spark');
      setPhaseMoments(['spark']);
      setGeneratedManifest(startData.lesson.contentManifest ?? generatedManifest);

      if (startData.lesson.state === 'generating') {
        setSessionState('generating');
        setGenerationMessage(startData.lesson.progressMessage ?? 'Generating a fresh lesson for you…');
        setMessages([
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: `${startData.lesson.openingPrompt}\n\nHang tight while I prepare your examples, questions, and activities!`,
            timestamp: new Date(),
            phase: 'spark',
          },
        ]);
        generationRef.current = window.setInterval(() => {
          setGenerationProgress((prev) => (prev >= 0.9 ? prev : prev + 0.1));
        }, 900);
        await fetchGeneratedLesson(startData.lesson.sessionId, startData.lesson.topic.id, startData.lesson.ageGroup);
        return;
      }

      await fetchOpeningMessage(startData.lesson.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start lesson');
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Hey ${MOCK_CHILD.name}! ✨ I’m Lumi, and I’m ready to explore ${topic?.title} with you. What do you already know about it?`,
          timestamp: new Date(),
          phase: 'spark',
        },
      ]);
      setSessionState('chatting');
    }
  };

  const handleGeneratedLessonReady = useCallback(
    async (payload?: { content_manifest?: typeof generatedManifest }) => {
      if (generationRef.current) clearInterval(generationRef.current);
      if (realtimeChannelRef.current) {
        const supabase = createSupabaseBrowserClient();
        void supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      setGenerationProgress(1);
      if (payload?.content_manifest) {
        setGeneratedManifest(payload.content_manifest);
      }
      await fetchOpeningMessage(sessionId, true);
    },
    [sessionId]
  );

  const subscribeToLessonGeneration = useCallback((topicId: string, ageGroup: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      if (realtimeChannelRef.current) {
        void supabase.removeChannel(realtimeChannelRef.current);
      }

      const channel = supabase
        .channel(`lesson-generation:${topicId}:${ageGroup}`)
        .on('broadcast', { event: 'lesson_structure_ready' }, async ({ payload }) => {
          const eventPayload = payload as {
            session_id?: string;
            content_manifest?: typeof generatedManifest;
          };

          if (eventPayload.session_id && eventPayload.session_id !== sessionId) return;
          await handleGeneratedLessonReady(eventPayload);
        })
        .subscribe();

      realtimeChannelRef.current = channel;
    } catch {
      // Realtime setup is optional; API response fallback will still complete the flow.
    }
  }, [handleGeneratedLessonReady, sessionId]);

  const fetchGeneratedLesson = async (activeSessionId: string, topicId: string, ageGroup: string) => {
    try {
      subscribeToLessonGeneration(topicId, ageGroup);

      const res = await fetch('/api/lesson/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: MOCK_CHILD.id,
          session_id: activeSessionId,
          subject_slug: slug,
          topic_slug: topicSlug,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate lesson');
      const data = await res.json();

      if (data.realtime_payload?.session_id === activeSessionId) {
        await handleGeneratedLessonReady(data.realtime_payload);
        return;
      }

      if (data.lesson?.contentManifest) {
        await handleGeneratedLessonReady({ content_manifest: data.lesson.contentManifest });
        return;
      }

      throw new Error('No generated lesson payload returned');
    } catch (err) {
      if (generationRef.current) clearInterval(generationRef.current);
      setError(err instanceof Error ? err.message : 'Failed to generate lesson');
      setSessionState('chatting');
    }
  };

  const fetchOpeningMessage = async (activeSessionId?: string, afterGeneration: boolean = false) => {
    setSessionState('loading');
    try {
      const res = await fetch(`/api/lumi/opening-message?child_id=${MOCK_CHILD.id}&subject_slug=${slug}&topic_slug=${topicSlug}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get opening message');
      }
      const data = await res.json();
      if (data.session_id && !activeSessionId) setSessionId(data.session_id);
      if (data.phase) {
        setCurrentPhase(data.phase);
        setPhaseMoments([data.phase]);
      }
      if (data.content_manifest) setGeneratedManifest(data.content_manifest);
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: afterGeneration ? `All set! ${data.message}` : data.message,
          timestamp: new Date(),
          phase: data.phase ?? 'spark',
        },
      ]);
      setSessionState('chatting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start lesson');
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Hey ${MOCK_CHILD.name}! ✨ I’m Lumi, your learning buddy! Today we’re exploring ${topic?.title}. Before we dive in, what do you think you already know?`,
          timestamp: new Date(),
          phase: 'spark',
        },
      ]);
      setSessionState('chatting');
    }
  };

  const updateAssistantMessage = (assistantMsgId: string, updater: (message: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? updater(m) : m)));
  };

  const streamResponse = async (allMessages: ChatMessage[], isHint: boolean = false) => {
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
        phase: currentPhase,
        contentSignals: [],
      },
    ]);

    try {
      const apiMessages = allMessages.map((m) => ({ role: m.role, content: m.content }));
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
          current_phase: currentPhase,
          prior_knowledge: messages.find((m) => m.role === 'user')?.content,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response from Lumi');

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
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                updateAssistantMessage(assistantMsgId, (message) => ({ ...message, content: fullText }));
              }
              if (parsed.replace_text) {
                fullText = parsed.replace_text;
                updateAssistantMessage(assistantMsgId, (message) => ({ ...message, content: parsed.replace_text }));
              }
              if (parsed.content_signals) {
                updateAssistantMessage(assistantMsgId, (message) => ({
                  ...message,
                  contentSignals: parsed.content_signals,
                }));
              }
              if (parsed.phase) {
                setCurrentPhase(parsed.phase);
                setPhaseMoments((prev) => (prev.includes(parsed.phase) ? prev : [...prev, parsed.phase]));
                updateAssistantMessage(assistantMsgId, (message) => ({ ...message, phase: parsed.phase }));
              }
              if (parsed.error) throw new Error(parsed.error);
            } catch {
              // ignore malformed chunks
            }
          }
        }
      }

      if (fullText) {
        if (detectCorrectResponse(fullText)) {
          setMasteryScore((prev) => clampMastery(prev + 5));
          awardXp(2);
        }
        if (detectExplanation(fullText)) {
          setMasteryScore((prev) => clampMastery(prev + 10));
          awardXp(5);
        }
      }
    } catch (err) {
      updateAssistantMessage(assistantMsgId, (message) => ({
        ...message,
        content: "Oops! I had a little hiccup there. Could you try saying that again? I'm all ears! 👂✨",
      }));
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
      phase: currentPhase,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    inputRef.current?.focus();
    await streamResponse(updatedMessages);
  };

  const handleHint = async () => {
    if (isStreaming || sessionState !== 'chatting') return;
    setMasteryScore((prev) => clampMastery(prev - 2));
    const hintMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: "I'm stuck — can you give me a hint?",
      timestamp: new Date(),
      phase: currentPhase,
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
      setCompletionBurst(true);
      awardXp(data.session.xp_earned);
      setSessionState('summary');
    } catch {
      const fallbackXP = 10 + Math.floor(messages.length / 2) * 2 + 5;
      setSessionSummary({
        text: `Explored ${topic?.title} with Lumi`,
        xp: fallbackXP,
        mastery: clampMastery(masteryScore + 15),
        status: masteryScore + 15 >= 70 ? 'completed' : 'in_progress',
        newXpTotal: MOCK_CHILD.xp_total + fallbackXP,
        newStreak: MOCK_CHILD.streak_days,
      });
      setCompletionBurst(true);
      awardXp(fallbackXP);
      setSessionState('summary');
    }
  }, [sessionState, sessionId, messages.length, masteryScore, topic]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const mins = Math.floor((Date.now() - sessionStartTime) / 60000);
      setElapsedMinutes(mins);
      if (mins >= 20 && sessionState === 'chatting') {
        void handleEndSession();
      }
    }, 10000);
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [sessionStartTime, sessionState, handleEndSession]);

  if (!subject || !topic) {
    return (
      <div className="min-h-screen bg-midnight text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">🌌</p>
          <h1 className="text-3xl font-bold mb-3">Lesson not found</h1>
          <p className="text-slate-light/70 mb-6">We couldn’t find that subject or topic.</p>
          <Link href="/learn">
            <Button>Back to Learning Universe</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentLevel = getXPLevel((sessionSummary?.newXpTotal ?? MOCK_CHILD.xp_total) + xpEarned);

  return (
    <div className="min-h-screen bg-midnight text-white relative overflow-hidden">
      <Starfield />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/learn/${slug}`)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-light/55">{subject.name}</p>
              <h1 className="text-lg font-black sm:text-2xl">{topic.title}</h1>
              <p className="text-xs text-slate-light/60 sm:text-sm">{topic.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 text-right">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-light/50">Timer</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold text-white"><Clock className="h-4 w-4" /> {elapsedMinutes} min</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-light/50">Phase</p>
              <p className="mt-1 text-sm font-bold" style={{ color: subjectColour }}>{LESSON_PHASE_LABELS[currentPhase]}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-light/50">Lesson XP</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold text-amber"><Zap className="h-4 w-4" /> {xpEarned}</p>
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-light/50">Learner</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-3xl">🦄</div>
                <div>
                  <p className="text-lg font-black">{MOCK_CHILD.name}</p>
                  <p className="text-sm text-slate-light/60">{MOCK_CHILD.year_group} · {currentLevel.name}</p>
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-light/50">Mastery</p>
                <p className="text-sm font-bold" style={{ color: subjectColour }}>{masteryScore}%</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: subjectColour }} animate={{ width: `${masteryScore}%` }} />
              </div>
              <p className="mt-3 text-sm text-slate-light/65">Current topic status: <span className="font-bold text-white">{topicProgress.status.replace('_', ' ')}</span></p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-slate-light/50">Lesson Arc</p>
              <div className="space-y-3">
                {PHASE_ORDER.map((phase, index) => {
                  const completed = phaseMoments.includes(phase) && phase !== currentPhase;
                  const active = currentPhase === phase;
                  return (
                    <div key={phase} className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full border text-xs font-black"
                        style={{
                          borderColor: active || completed ? `${subjectColour}88` : 'rgba(255,255,255,0.1)',
                          backgroundColor: active ? `${subjectColour}25` : completed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                          color: active ? subjectColour : completed ? '#fff' : 'rgba(226,232,240,0.55)',
                        }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-light/75'}`}>{LESSON_PHASE_LABELS[phase]}</p>
                        <p className="text-xs text-slate-light/45">{active ? 'Happening now' : completed ? 'Completed' : 'Coming up'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="relative flex min-h-[70vh] flex-col rounded-[30px] border border-white/10 bg-slate-950/70 backdrop-blur-xl">
            <AnimatePresence>
              {floatingXp !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -24, scale: 1 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="pointer-events-none absolute right-6 top-6 z-30 rounded-full border border-amber/40 bg-amber/15 px-4 py-2 text-sm font-black text-amber"
                >
                  +{floatingXp} XP
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {completionBurst && sessionState === 'summary' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                  {Array.from({ length: 18 }).map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 0, x: 0, rotate: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        y: [0, 120 + index * 8],
                        x: [0, (index % 2 === 0 ? 1 : -1) * (40 + index * 6)],
                        rotate: [0, 180, 320],
                      }}
                      transition={{ duration: 1.6, delay: index * 0.03 }}
                      className="absolute left-1/2 top-20 text-2xl"
                    >
                      {index % 3 === 0 ? '✨' : index % 3 === 1 ? '🎉' : '🌟'}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl">✨</div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-light/50">Lumi session</p>
                  <p className="text-base font-black sm:text-lg">Let’s learn together</p>
                </div>
              </div>
            </div>

            {sessionState === 'generating' && (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }} className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5 text-4xl">
                  <Wand2 className="h-10 w-10" style={{ color: subjectColour }} />
                </motion.div>
                <h2 className="text-3xl font-black">Lumi is preparing your lesson</h2>
                <p className="mt-3 max-w-lg text-slate-light/70">{generationMessage}</p>
                <div className="mt-6 h-3 w-full max-w-md overflow-hidden rounded-full bg-white/10">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: subjectColour }} animate={{ width: `${generationProgress * 100}%` }} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-light/45">Generating examples, practice, and celebrations</p>
              </div>
            )}

            {(sessionState === 'loading' || sessionState === 'booting') && (
              <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="text-center">
                  <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-4xl">
                    <Sparkles className="h-10 w-10" style={{ color: subjectColour }} />
                  </motion.div>
                  <p className="text-lg font-bold">Getting everything ready…</p>
                </div>
              </div>
            )}

            {sessionState === 'summary' && sessionSummary && (
              <div className="flex flex-1 items-center justify-center px-6 py-8">
                <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-white/5 p-6 text-center sm:p-8">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-amber/30 bg-amber/10 text-4xl text-amber">
                    <PartyPopper className="h-10 w-10" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-amber/80">Session complete</p>
                  <h2 className="mt-3 text-3xl font-black">Fantastic work, {MOCK_CHILD.name}!</h2>
                  <p className="mt-3 text-slate-light/70">{sessionSummary.text}</p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <StatCard label="XP earned" value={`+${sessionSummary.xp}`} icon={<Zap className="h-5 w-5" />} colour={subjectColour} />
                    <StatCard label="Mastery" value={`${sessionSummary.mastery}%`} icon={<Trophy className="h-5 w-5" />} colour={subjectColour} />
                    <StatCard label="Streak" value={`${sessionSummary.newStreak} days`} icon={<Sparkles className="h-5 w-5" />} colour={subjectColour} />
                  </div>

                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link href={`/learn/${slug}`}>
                      <Button variant="secondary">Back to topic map</Button>
                    </Link>
                    <Link href="/achievements">
                      <Button>
                        View achievements
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {sessionState === 'chatting' && (
              <>
                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                  {error && (
                    <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                      {error}
                    </div>
                  )}

                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-3xl ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-3`}>
                        <div
                          className={`rounded-[26px] px-5 py-4 shadow-xl ${
                            message.role === 'user'
                              ? 'bg-white text-slate-950'
                              : 'border border-white/10 bg-white/5 text-white'
                          }`}
                          style={message.role === 'assistant' ? { boxShadow: `0 12px 40px ${subjectColour}15` } : undefined}
                        >
                          {message.phase && message.role === 'assistant' && (
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: subjectColour }}>
                              {LESSON_PHASE_LABELS[message.phase]}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap text-sm leading-7 sm:text-[15px]">{message.content || (isStreaming && message.role === 'assistant' ? 'Lumi is thinking…' : '')}</p>
                        </div>

                        {message.role === 'assistant' && message.contentSignals && message.contentSignals.length > 0 && (
                          <div className="w-full space-y-3">
                            {message.contentSignals.map((signal) => (
                              <div key={`${message.id}-${signal.type}-${signal.id}`} className="rounded-[26px] border border-white/10 bg-slate-950/60 p-4">
                                <ContentRenderer
                                  contentType={signal.type}
                                  contentId={signal.id}
                                  assets={contentAssets}
                                  diagrams={diagrams}
                                  subjectColour={subjectColour}
                                  childAge={MOCK_CHILD.age}
                                  onGameComplete={(result) => awardXp(result.xpEarned)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isStreaming && (
                    <div className="flex justify-start">
                      <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-light/75">
                        Lumi is thinking…
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="border-t border-white/10 px-4 py-4 sm:px-6">
                  <div className="mb-4 flex flex-wrap gap-3">
                    <button
                      onClick={handleHint}
                      disabled={isStreaming}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-light/85 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      <Lightbulb className="h-4 w-4 text-amber" /> I’m stuck — give me a hint
                    </button>
                    <button
                      onClick={handleEndSession}
                      disabled={isStreaming}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-light/85 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      <Trophy className="h-4 w-4" /> Finish for now
                    </button>
                  </div>

                  <div className="flex items-end gap-3 rounded-[26px] border border-white/10 bg-white/5 p-3">
                    <input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder={`Tell Lumi what you’re thinking about ${topic.title.toLowerCase()}…`}
                      className="h-12 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-light/45"
                      disabled={isStreaming}
                    />
                    <button
                      onClick={() => void handleSend()}
                      disabled={!inputValue.trim() || isStreaming}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white transition disabled:opacity-40"
                      style={{ backgroundColor: subjectColour }}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, colour }: { label: string; value: string; icon: React.ReactNode; colour: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${colour}20`, color: colour }}>
        {icon}
      </div>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-light/45">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}
