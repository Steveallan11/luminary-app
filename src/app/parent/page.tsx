'use client';

import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Zap, BookOpen, Flame, BarChart3,
  ChevronRight, Plus, Download, Settings, ChevronDown,
} from 'lucide-react';
import ParentNav from '@/components/layout/ParentNav';
import {
  MOCK_CHILDREN, MOCK_SUBJECTS, MOCK_SESSIONS,
  MOCK_TOPIC_PROGRESS, MOCK_TOPICS, MOCK_FAMILY,
} from '@/lib/mock-data';
import { AVATAR_EMOJI_MAP, getXPLevel, getXPProgress } from '@/types';
import { formatTimeAgo } from '@/lib/utils';

export default function ParentDashboard() {
  const [selectedChildId, setSelectedChildId] = useState(MOCK_CHILDREN[0].id);
  const child = MOCK_CHILDREN.find((c) => c.id === selectedChildId) || MOCK_CHILDREN[0];
  const family = MOCK_FAMILY;
  const level = getXPLevel(child.xp_total);
  const xpProgress = getXPProgress(child.xp_total);

  const childSessions = useMemo(
    () => MOCK_SESSIONS.filter((s) => s.child_id === child.id),
    [child.id]
  );

  // Overview stats
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const weekSessions = childSessions.filter(
    (s) => new Date(s.started_at).getTime() > weekAgo
  );
  const totalLearningMinutes = weekSessions.reduce(
    (sum, s) => sum + (s.duration_minutes || 0),
    0
  );
  const daysActiveThisWeek = new Set(
    weekSessions.map((s) => new Date(s.started_at).toDateString())
  ).size;
  const subjectsActive = Object.entries(MOCK_TOPIC_PROGRESS).filter(([, topics]) =>
    Object.values(topics).some((t) => t.status !== 'locked')
  ).length;

  // Subject progress
  const subjectProgress = useMemo(() => {
    return MOCK_SUBJECTS.map((subject) => {
      const topics = MOCK_TOPICS[subject.slug] || [];
      const progress = MOCK_TOPIC_PROGRESS[subject.slug] || {};
      const completed = Object.values(progress).filter(
        (t) => t.status === 'completed'
      ).length;
      const total = topics.length || 1;
      const percent = Math.round((completed / total) * 100);
      const hasActivity = Object.values(progress).some((t) => t.status !== 'locked');
      const subjectSessions = childSessions.filter((s) => {
        const topic = topics.find((t) => t.id === s.topic_id);
        return !!topic;
      });
      const lastActive = subjectSessions.length > 0 ? subjectSessions[0].started_at : null;
      let statusLabel = 'Not Started';
      let statusColor = 'text-slate-light/40';
      if (percent > 60) {
        statusLabel = 'Strong';
        statusColor = 'text-emerald-400';
      } else if (hasActivity) {
        statusLabel = 'In Progress';
        statusColor = 'text-amber';
      }
      return { subject, completed, total, percent, hasActivity, lastActive, statusLabel, statusColor };
    });
  }, [child.id, childSessions]);

  // Activity feed with pagination
  const [activityPage, setActivityPage] = useState(1);
  const [reportPeriod, setReportPeriod] = useState<'term' | 'month' | 'year'>('term');
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportMenuRef = useRef<HTMLDivElement>(null);

  const downloadReport = async (period: 'term' | 'month' | 'year') => {
    setIsDownloading(true);
    setShowReportMenu(false);
    try {
      const liveChildId =
        typeof window !== 'undefined'
          ? localStorage.getItem('luminary_child_id') ?? sessionStorage.getItem('luminary_child_id')
          : null;
      const childId = liveChildId || child.id;
      const url = `/api/reports/generate?child_id=${encodeURIComponent(childId)}&period=${period}`;
      const response = await fetch(url);

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || 'Could not generate LA report PDF.');
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Luminary-LA-Report-${child.name.replace(/ /g, '-')}-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('LA report download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };
  const pageSize = 5;
  const paginatedSessions = childSessions.slice(0, activityPage * pageSize);
  const hasMoreSessions = childSessions.length > activityPage * pageSize;

  const allTopics = Object.values(MOCK_TOPICS).flat();
  const getTopicInfo = (topicId: string) => {
    const topic = allTopics.find((t) => t.id === topicId);
    if (!topic) return { title: 'Unknown', subjectEmoji: '', subjectColor: '#666' };
    const subject = MOCK_SUBJECTS.find((s) => s.id === topic.subject_id);
    return {
      title: topic.title,
      subjectEmoji: subject?.icon_emoji || '',
      subjectColor: subject?.colour_hex || '#666',
    };
  };

  // Weekly heatmap (last 4 weeks)
  const heatmapData = useMemo(() => {
    const days: { date: Date; count: number; level: number }[] = [];
    for (let i = 27; i >= 0; i--) {
      const date = new Date(now - i * 86400000);
      const dateStr = date.toDateString();
      const count = childSessions.filter(
        (s) => new Date(s.started_at).toDateString() === dateStr
      ).length;
      let lvl = 0;
      if (count >= 3) lvl = 3;
      else if (count >= 2) lvl = 2;
      else if (count >= 1) lvl = 1;
      days.push({ date, count, level: lvl });
    }
    return days;
  }, [child.id, childSessions]);

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="min-h-screen bg-navy">
      <ParentNav />
      <main className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Welcome back, Parent
          </h1>
          <p className="text-slate-light/60">{family.family_name}</p>
        </motion.div>

        {/* Child selector */}
        <motion.div className="flex gap-3 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          {MOCK_CHILDREN.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelectedChildId(c.id); setActivityPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedChildId === c.id
                  ? 'bg-electric/20 text-electric border border-electric/40'
                  : 'bg-navy-light/40 text-slate-light/60 border border-white/5 hover:border-white/20'
              }`}
            >
              <span>{AVATAR_EMOJI_MAP[c.avatar]}</span>
              <span>{c.name}</span>
              <span className="text-xs opacity-60">{c.year_group}</span>
            </button>
          ))}
        </motion.div>

        {/* Overview stats */}
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {[
            { icon: Calendar, label: 'Days Active This Week', value: String(daysActiveThisWeek), color: '#3B82F6' },
            { icon: Clock, label: 'Total Learning Time', value: formatHours(totalLearningMinutes), color: '#8B5CF6' },
            { icon: Zap, label: 'XP Earned', value: child.xp_total.toLocaleString(), color: '#F59E0B' },
            { icon: BookOpen, label: 'Subjects Explored', value: String(subjectsActive), color: '#10B981' },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl bg-navy-light/60 border border-white/10 p-4">
              <stat.icon size={20} style={{ color: stat.color }} className="mb-2" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-light/50">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Subject Progress */}
          <motion.div className="lg:col-span-2 rounded-2xl bg-navy-light/60 border border-white/10 p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-electric" />
              Subject Progress
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjectProgress.slice(0, 9).map(({ subject, completed, total, percent, lastActive, statusLabel, statusColor }) => (
                <div key={subject.id} className="flex items-center gap-3 p-3 rounded-xl bg-navy/40 border border-white/5">
                  <span className="text-lg">{subject.icon_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white truncate">{subject.name}</span>
                      <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-navy overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: subject.colour_hex }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-light/40">{completed}/{total} topics</span>
                      {lastActive && <span className="text-xs text-slate-light/30">{formatTimeAgo(lastActive)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Streak */}
            <motion.div className="rounded-2xl bg-navy-light/60 border border-white/10 p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Flame size={18} className="text-orange-400" />
                Streak
              </h2>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-400">{child.streak_days}</p>
                  <p className="text-xs text-slate-light/50">Current</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400">{Math.max(child.streak_days, 8)}</p>
                  <p className="text-xs text-slate-light/50">Longest</p>
                </div>
              </div>
            </motion.div>

            {/* Weekly Heatmap */}
            <motion.div className="rounded-2xl bg-navy-light/60 border border-white/10 p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-electric" />
                Activity (4 weeks)
              </h2>
              <div className="grid grid-cols-7 gap-1.5">
                {dayLabels.map((d) => (
                  <div key={d} className="text-center text-[10px] text-slate-light/40 mb-1">{d}</div>
                ))}
                {heatmapData.map((day, i) => {
                  const opacity = [0.08, 0.25, 0.5, 0.85][day.level];
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-sm transition-colors"
                      style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                      title={`${day.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="text-[10px] text-slate-light/30">Less</span>
                {[0.08, 0.25, 0.5, 0.85].map((op, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(59, 130, 246, ${op})` }} />
                ))}
                <span className="text-[10px] text-slate-light/30">More</span>
              </div>
            </motion.div>

            {/* XP Level */}
            <motion.div className="rounded-2xl bg-navy-light/60 border border-white/10 p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">Level {level.level}: {level.name}</span>
                <span className="text-xs text-amber font-bold">{child.xp_total} XP</span>
              </div>
              <div className="h-2 rounded-full bg-navy/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber to-amber/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress.percent}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Activity Feed */}
        <motion.div className="mt-6 rounded-2xl bg-navy-light/60 border border-white/10 p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {paginatedSessions.map((session, i) => {
              const info = getTopicInfo(session.topic_id);
              return (
                <motion.div
                  key={session.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-navy/40 border border-white/5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <span className="text-lg">{info.subjectEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{info.title}</p>
                    {session.summary_text && (
                      <p className="text-xs text-slate-light/50 truncate">{session.summary_text}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-light/40">{formatTimeAgo(session.started_at)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {session.duration_minutes > 0 && (
                        <span className="text-xs text-slate-light/30">{session.duration_minutes}m</span>
                      )}
                      <span className="text-xs text-amber font-bold">+{session.xp_earned} XP</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {hasMoreSessions && (
            <button
              onClick={() => setActivityPage((p) => p + 1)}
              className="mt-4 w-full py-2 rounded-xl bg-navy/40 border border-white/10 text-sm text-slate-light/60 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-1"
            >
              Load more <ChevronDown size={14} />
            </button>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <a href="/auth/onboarding" className="flex items-center gap-3 p-4 rounded-2xl bg-navy-light/40 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Plus size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Add Child</p>
              <p className="text-xs text-slate-light/50">Add another learner</p>
            </div>
            <ChevronRight size={16} className="text-slate-light/30 group-hover:text-white transition-colors" />
          </a>
          <div className="relative" ref={reportMenuRef}>
            <button
              onClick={() => setShowReportMenu((v) => !v)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-navy-light/40 border border-electric/20 hover:border-electric/40 transition-all group text-left"
              disabled={isDownloading}
            >
              <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center">
                <Download size={18} className={isDownloading ? 'text-electric/40 animate-bounce' : 'text-electric'} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{isDownloading ? 'Generating...' : 'Download LA Report'}</p>
                <p className="text-xs text-slate-light/50">
                  {reportPeriod === 'month' ? 'Monthly' : reportPeriod === 'year' ? 'Annual' : 'Termly'} report
                </p>
              </div>
              <ChevronDown size={16} className={`text-slate-light/30 group-hover:text-white transition-all ${showReportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showReportMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl bg-navy-light border border-electric/20 shadow-xl overflow-hidden z-50">
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-light/40">Report Period</p>
                {[
                  { value: 'month' as const, label: 'Monthly', desc: 'Last 30 days' },
                  { value: 'term' as const, label: 'Termly', desc: 'Last 90 days' },
                  { value: 'year' as const, label: 'Annual', desc: 'Last 12 months' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setReportPeriod(opt.value); void downloadReport(opt.value); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-electric/10 ${
                      reportPeriod === opt.value ? 'text-electric font-bold' : 'text-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-xs text-slate-light/40">{opt.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <a href="/pricing" className="flex items-center gap-3 p-4 rounded-2xl bg-navy-light/40 border border-purple-500/20 hover:border-purple-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Settings size={18} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Manage Settings</p>
              <p className="text-xs text-slate-light/50">Subscription & profiles</p>
            </div>
            <ChevronRight size={16} className="text-slate-light/30 group-hover:text-white transition-colors" />
          </a>
        </motion.div>
      </main>
    </div>
  );
}
