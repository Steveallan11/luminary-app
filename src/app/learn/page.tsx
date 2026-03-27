'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Clock, Loader2 } from 'lucide-react';
import ChildLayout from '@/components/layout/ChildLayout';
import SubjectCard from '@/components/child/SubjectCard';
import FirstRunMissions, { markFirstRunMission, resumeFirstRunMissions } from '@/components/child/FirstRunMissions';
import { MOCK_SUBJECTS, MOCK_CHILD, MOCK_SESSIONS, MOCK_TOPIC_PROGRESS } from '@/lib/mock-data';
import { getGreeting, formatTimeAgo } from '@/lib/utils';
import { AVATAR_EMOJI_MAP } from '@/types';
import type { Subject } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────
interface SubjectData {
  subjects: Subject[];
  topics: Array<{ id: string; subject_id: string; slug: string }>;
  progress: Record<string, Record<string, { status: string; mastery_score: number }>>;
  source: 'supabase' | 'mock';
}

interface ChildData {
  child: typeof MOCK_CHILD;
  sessions: typeof MOCK_SESSIONS;
  source: 'supabase' | 'mock';
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getChildIdFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('luminary_child_id') || sessionStorage.getItem('luminary_child_id');
}

export default function LearnPage() {
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null);
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const childId = getChildIdFromStorage();
    const params = childId ? `?child_id=${childId}` : '';

    Promise.all([
      fetch(`/api/learn/subjects${params}`).then((r) => r.json()).catch(() => null),
      fetch(`/api/learn/child-profile${params}`).then((r) => r.json()).catch(() => null),
    ]).then(([sData, cData]) => {
      setSubjectData(sData || {
        subjects: MOCK_SUBJECTS,
        topics: [],
        progress: MOCK_TOPIC_PROGRESS as any,
        source: 'mock',
      });
      setChildData(cData || {
        child: MOCK_CHILD,
        sessions: MOCK_SESSIONS,
        source: 'mock',
      });
      setIsLoading(false);
    });
  }, []);

  const child = childData?.child || MOCK_CHILD;
  const subjects = subjectData?.subjects || MOCK_SUBJECTS;
  const progress = subjectData?.progress || (MOCK_TOPIC_PROGRESS as any);
  const sessions = childData?.sessions || MOCK_SESSIONS;
  const childId = getChildIdFromStorage();

  const getSubjectProgress = (slug: string) => {
    const subjectProgress = progress[slug];
    if (!subjectProgress) return { completed: 0, total: 5 };
    const completed = Object.values(subjectProgress).filter((s: any) => s.status === 'completed').length;
    return { completed, total: Object.keys(subjectProgress).length || 5 };
  };

  const handlePickedSubject = (subjectSlug: string) => {
    markFirstRunMission(childId, 'pick_subject');
  };

  if (isLoading) {
    return (
      <ChildLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 size={32} className="text-amber animate-spin mx-auto mb-3" />
            <p className="text-slate-light/60 text-sm">Loading your learning world...</p>
          </div>
        </div>
      </ChildLayout>
    );
  }

  return (
    <ChildLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Top bar */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber/10 flex items-center justify-center text-2xl">
              {AVATAR_EMOJI_MAP[child.avatar] || '🌟'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{child.name}</h2>
              <p className="text-xs text-slate-light/60">{child.year_group}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* XP */}
            <div className="flex items-center gap-2 bg-amber/10 rounded-2xl px-3 py-2">
              <Zap size={16} className="text-amber" />
              <span className="text-sm font-bold text-amber">{child.xp_total.toLocaleString()} XP</span>
            </div>
            {/* Streak */}
            <div className="flex items-center gap-2 bg-orange-500/10 rounded-2xl px-3 py-2">
              <Flame size={16} className="text-orange-400" />
              <span className="text-sm font-bold text-orange-400">{child.streak_days}</span>
            </div>
          </div>
        </motion.div>

        {/* Welcome message */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1
            className="text-2xl sm:text-3xl font-bold text-white mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {getGreeting(child.name)}
          </h1>
          <p className="text-slate-light/70">Ready to explore?</p>
        </motion.div>

        <FirstRunMissions
          childId={childId}
          childName={child.name}
          yearGroup={child.year_group}
          sessionsCount={sessions.length}
        />

        <div className="mb-8 text-right">
          <button
            type="button"
            onClick={() => resumeFirstRunMissions(childId)}
            className="text-xs font-semibold text-slate-light/40 hover:text-slate-light/70"
          >
            Resume mission
          </button>
        </div>

        {/* Subject cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-10">
          {subjects.map((subject, i) => {
            const prog = getSubjectProgress(subject.slug);
            return (
              <SubjectCard
                key={subject.slug}
                subject={subject}
                index={i}
                completedTopics={prog.completed}
                totalTopics={prog.total}
                onPick={handlePickedSubject}
              />
            );
          })}
        </div>

        {/* Bottom section */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Streak */}
          <motion.div
            className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Flame size={20} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Your streak: {child.streak_days} days</h3>
                <p className="text-xs text-slate-light/60">Keep it going!</p>
              </div>
            </div>
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full ${
                    i < child.streak_days ? 'bg-orange-400' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Recent XP */}
          <motion.div
            className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={18} className="text-amber" />
              Recent XP
            </h3>
            <div className="space-y-3">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center">
                      <Zap size={14} className="text-amber" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{session.summary_text || 'Learning session'}</p>
                      <p className="text-xs text-slate-light/50 flex items-center gap-1">
                        <Clock size={10} />
                        {formatTimeAgo(session.started_at)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-amber">+{session.xp_earned} XP</span>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-sm text-slate-light/40 text-center py-4">No sessions yet — start learning!</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </ChildLayout>
  );
}
