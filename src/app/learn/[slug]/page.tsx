'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Lock, Play, Clock, X, Star, Zap, Loader2 } from 'lucide-react';
import ChildLayout from '@/components/layout/ChildLayout';
import Button from '@/components/ui/Button';
import { TopicStatus, Topic } from '@/types';
import type { Subject } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getChildIdFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('luminary_child_id') || sessionStorage.getItem('luminary_child_id');
}

export default function SubjectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [rawProgress, setRawProgress] = useState<Record<string, { status: TopicStatus; mastery_score: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSubject() {
      setIsLoading(true);
      setError(null);

      const childId = getChildIdFromStorage();
      if (!childId) {
        if (!cancelled) {
          setError('Learner session missing. Log in again to continue.');
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`/api/learn/subjects?child_id=${encodeURIComponent(childId)}`);
        const data = await response.json().catch(() => null) as {
          subjects?: Subject[];
          topics?: Topic[];
          progress?: Record<string, Record<string, { status: TopicStatus; mastery_score: number }>>;
          error?: string;
        } | null;

        if (!response.ok || !data?.subjects || !data?.topics) {
          throw new Error(data?.error || 'Could not load this subject.');
        }

        const foundSubject = data.subjects.find((entry) => entry.slug === slug) ?? null;
        if (!foundSubject) {
          throw new Error('Subject not found.');
        }

        const subjectTopics = data.topics
          .filter((entry) => entry.subject_id === foundSubject.id)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

        if (!cancelled) {
          setSubject(foundSubject);
          setTopics(subjectTopics);
          setRawProgress((data.progress?.[slug] || {}) as Record<string, { status: TopicStatus; mastery_score: number }>);
        }
      } catch (err) {
        if (!cancelled) {
          setSubject(null);
          setTopics([]);
          setRawProgress({});
          setError(err instanceof Error ? err.message : 'Could not load this subject.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSubject();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Build data-driven progress with sequential unlock logic
  const topicProgress = useMemo(() => {
    const result: Record<string, { status: TopicStatus; mastery_score: number }> = {};
    topics.forEach((topic, i) => {
      const raw = rawProgress[topic.slug];
      if (raw) {
        result[topic.slug] = raw;
      } else {
        if (i === 0) {
          result[topic.slug] = { status: 'available', mastery_score: 0 };
        } else {
          const prevTopic = topics[i - 1];
          const prevStatus = result[prevTopic.slug]?.status;
          result[topic.slug] = {
            status: prevStatus === 'completed' ? 'available' : 'locked',
            mastery_score: 0,
          };
        }
      }
    });
    return result;
  }, [topics, rawProgress]);

  if (isLoading) {
    return (
      <ChildLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 size={32} className="text-amber animate-spin mx-auto mb-3" />
            <p className="text-slate-light/60 text-sm">Loading subject...</p>
          </div>
        </div>
      </ChildLayout>
    );
  }

  if (!subject) {
    return (
      <ChildLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-10 max-w-3xl mx-auto">
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6">
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Can&apos;t open this subject
            </h1>
            <p className="mt-2 text-sm text-slate-light/70">
              {error || 'The subject could not be found in Supabase.'}
            </p>
            <div className="mt-5">
              <Link href="/learn">
                <Button variant="secondary">Back to learning world</Button>
              </Link>
            </div>
          </div>
        </div>
      </ChildLayout>
    );
  }

  const completedCount = Object.values(topicProgress).filter((t) => t.status === 'completed').length;
  const totalCount = topics.length || 1;

  const getStatusIcon = (status: TopicStatus, mastery: number) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex flex-col items-center">
            <Check size={14} className="text-white" />
            <span className="text-[9px] text-white/80 font-bold mt-0.5">{mastery}%</span>
          </div>
        );
      case 'in_progress':
        return <Play size={14} className="text-white" />;
      case 'available':
        return <Star size={14} className="text-white" />;
      case 'locked':
        return <Lock size={14} className="text-white/40" />;
    }
  };

  const getNodeStyles = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return {
          bg: subject.colour_hex,
          border: subject.colour_hex,
          opacity: '1',
          glow: `0 0 20px ${subject.colour_hex}60`,
        };
      case 'in_progress':
        return {
          bg: `${subject.colour_hex}40`,
          border: subject.colour_hex,
          opacity: '1',
          glow: `0 0 25px ${subject.colour_hex}50, 0 0 50px ${subject.colour_hex}20`,
        };
      case 'available':
        return {
          bg: 'transparent',
          border: subject.colour_hex,
          opacity: '1',
          glow: `0 0 15px ${subject.colour_hex}30`,
        };
      case 'locked':
        return {
          bg: '#1a2040',
          border: '#2d3a5c',
          opacity: '0.5',
          glow: 'none',
        };
    }
  };

  const selectedStatus = selectedTopic ? topicProgress[selectedTopic.slug] : null;
  const isSelectedClickable = selectedStatus && selectedStatus.status !== 'locked';

  return (
    <ChildLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link
            href="/learn"
            className="inline-flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to subjects
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
              style={{ backgroundColor: `${subject.colour_hex}20` }}
            >
              {subject.icon_emoji}
            </div>
            <div>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {subject.name}
              </h1>
              <p className="text-slate-light/70">{subject.description}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: subject.colour_hex }}
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-light/70">
              {completedCount} of {totalCount} topics explored
            </span>
          </div>
        </motion.div>

        {/* Learning Map */}
        <div className="relative">
          <h2
            className="text-xl font-bold text-white mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Learning Map
          </h2>

          <div className="space-y-1">
            {topics.map((topic, i) => {
              const tp = topicProgress[topic.slug] || { status: 'locked' as TopicStatus, mastery_score: 0 };
              const status = tp.status;
              const mastery = tp.mastery_score;
              const styles = getNodeStyles(status);
              const isClickable = status !== 'locked';

              const prevCompleted = i > 0 && topicProgress[topics[i - 1].slug]?.status === 'completed';

              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  {/* Connection line */}
                  {i > 0 && (
                    <div className="flex justify-start ml-[1.9rem] py-0">
                      <motion.div
                        className="w-0.5 h-5 rounded-full"
                        style={{
                          backgroundColor: prevCompleted ? subject.colour_hex : '#2d3a5c',
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.08 + 0.1, duration: 0.3 }}
                      />
                    </div>
                  )}

                  <motion.button
                    whileHover={isClickable ? { scale: 1.02, x: 4 } : undefined}
                    whileTap={isClickable ? { scale: 0.98 } : undefined}
                    onClick={() => isClickable && setSelectedTopic(topic)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                    style={{
                      borderColor: styles.border,
                      backgroundColor: `${styles.bg}15`,
                      opacity: styles.opacity,
                      boxShadow: styles.glow,
                    }}
                  >
                    {/* Status node */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2 ${
                        status === 'in_progress' ? 'animate-pulse' : ''
                      }`}
                      style={{
                        backgroundColor:
                          status === 'completed' || status === 'in_progress' ? styles.bg : 'transparent',
                        borderColor: styles.border,
                      }}
                    >
                      {getStatusIcon(status, mastery)}
                    </div>

                    {/* Topic info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{topic.title}</h3>
                      <p className="text-sm text-slate-light/60 truncate">{topic.description}</p>
                      {status === 'in_progress' && mastery > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${mastery}%`, backgroundColor: subject.colour_hex }}
                            />
                          </div>
                          <span className="text-xs text-slate-light/40">{mastery}% mastery</span>
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-xs text-slate-light/50 flex-shrink-0">
                      <Clock size={12} />
                      <span>{topic.estimated_minutes}min</span>
                    </div>
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Topic detail panel (slide-in) */}
      <AnimatePresence>
        {selectedTopic && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedTopic(null)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-navy-light border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-6"
                >
                  <X size={18} />
                </button>

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
                  style={{ backgroundColor: `${subject.colour_hex}20` }}
                >
                  {subject.icon_emoji}
                </div>

                <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {selectedTopic.title}
                </h2>
                <p className="text-slate-light/60 mb-4">{selectedTopic.description}</p>

                <div className="flex items-center gap-4 mb-6 text-sm text-slate-light/50">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {selectedTopic.estimated_minutes} minutes
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap size={14} className="text-amber" />
                    +{selectedTopic.estimated_minutes * 3} XP
                  </span>
                </div>

                {selectedStatus && selectedStatus.status === 'completed' && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-sm font-semibold text-emerald-400">
                      ✅ Completed — {selectedStatus.mastery_score}% mastery
                    </p>
                  </div>
                )}

                {isSelectedClickable ? (
                  <Link href={`/learn/${slug}/${selectedTopic.slug}`}>
                    <Button
                      variant="primary"
                      className="w-full"
                      style={{ backgroundColor: subject.colour_hex, borderColor: subject.colour_hex }}
                    >
                      {selectedStatus?.status === 'completed' ? '🔄 Revisit Topic' : '🚀 Start Learning'}
                    </Button>
                  </Link>
                ) : (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <Lock size={20} className="text-slate-light/30 mx-auto mb-2" />
                    <p className="text-sm text-slate-light/40">Complete the previous topic to unlock</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ChildLayout>
  );
}
