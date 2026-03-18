'use client';

import { useState } from 'react';
import {
  Activity,
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Award,
  BarChart3,
} from 'lucide-react';

interface MetricCard {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  colour: string;
}

const METRICS: MetricCard[] = [
  { label: 'Active Learners', value: '1', change: 'Beta', changeType: 'neutral', icon: <Users size={18} />, colour: '#3B82F6' },
  { label: 'Lessons Completed', value: '14', change: '+3 this week', changeType: 'up', icon: <BookOpen size={18} />, colour: '#10B981' },
  { label: 'Avg Session Time', value: '18m', change: '+2m vs last week', changeType: 'up', icon: <Clock size={18} />, colour: '#8B5CF6' },
  { label: 'Avg Mastery Score', value: '76%', change: '+4% vs last week', changeType: 'up', icon: <Target size={18} />, colour: '#F59E0B' },
  { label: 'Total XP Awarded', value: '847', change: '+125 this week', changeType: 'up', icon: <Zap size={18} />, colour: '#EAB308' },
  { label: 'Hints Used', value: '23', change: '-5 vs last week', changeType: 'down', icon: <Award size={18} />, colour: '#EC4899' },
  { label: 'Games Played', value: '8', change: '+2 this week', changeType: 'up', icon: <BarChart3 size={18} />, colour: '#14B8A6' },
  { label: 'Avg Accuracy', value: '82%', change: '+3% vs last week', changeType: 'up', icon: <TrendingUp size={18} />, colour: '#6366F1' },
];

interface SubjectPerformance {
  name: string;
  icon: string;
  colour: string;
  lessons: number;
  avgMastery: number;
  avgTime: number;
  topBand: string;
}

const SUBJECT_PERFORMANCE: SubjectPerformance[] = [
  { name: 'Maths', icon: '🔢', colour: '#3B82F6', lessons: 6, avgMastery: 74, avgTime: 19, topBand: 'Secure' },
  { name: 'English', icon: '📖', colour: '#8B5CF6', lessons: 3, avgMastery: 81, avgTime: 17, topBand: 'Strong' },
  { name: 'History', icon: '🏛️', colour: '#F59E0B', lessons: 3, avgMastery: 88, avgTime: 22, topBand: 'Strong' },
  { name: 'Art & Design', icon: '🎨', colour: '#EC4899', lessons: 2, avgMastery: 72, avgTime: 15, topBand: 'Secure' },
];

export default function AdminPerformancePage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'term'>('week');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity size={24} className="text-emerald" />
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Performance Dashboard
            </h1>
            <p className="text-sm text-slate-light/60">
              Platform-wide learning analytics and engagement metrics.
            </p>
          </div>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(['week', 'month', 'term'] as const).map((p) => (
            <button
              key={p}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                period === p ? 'bg-white/10 text-white' : 'text-slate-light/60 hover:text-white'
              }`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {METRICS.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${metric.colour}20` }}>
                <span style={{ color: metric.colour }}>{metric.icon}</span>
              </div>
              <span
                className={`text-xs font-bold ${
                  metric.changeType === 'up'
                    ? 'text-emerald'
                    : metric.changeType === 'down'
                    ? 'text-red-400'
                    : 'text-slate-light/40'
                }`}
              >
                {metric.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{metric.value}</p>
            <p className="text-xs text-slate-light/60 mt-1">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Subject performance table */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-bold text-white">Subject Performance</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-white/5">
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-light/60">Subject</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-light/60">Lessons</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-light/60">Avg Mastery</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-light/60">Avg Time</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-slate-light/60">Top Band</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-light/60">Mastery Distribution</th>
            </tr>
          </thead>
          <tbody>
            {SUBJECT_PERFORMANCE.map((subject) => (
              <tr key={subject.name} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{subject.icon}</span>
                    <span className="text-sm text-white font-semibold">{subject.name}</span>
                  </div>
                </td>
                <td className="text-center px-4 py-3 text-sm text-white">{subject.lessons}</td>
                <td className="text-center px-4 py-3">
                  <span
                    className="text-sm font-bold"
                    style={{
                      color:
                        subject.avgMastery >= 80
                          ? '#3B82F6'
                          : subject.avgMastery >= 60
                          ? '#10B981'
                          : '#F59E0B',
                    }}
                  >
                    {subject.avgMastery}%
                  </span>
                </td>
                <td className="text-center px-4 py-3 text-sm text-slate-light/70">{subject.avgTime}m</td>
                <td className="text-center px-4 py-3">
                  <span
                    className="text-xs px-2 py-1 rounded-full font-bold"
                    style={{
                      backgroundColor:
                        subject.topBand === 'Mastered'
                          ? '#8B5CF620'
                          : subject.topBand === 'Strong'
                          ? '#3B82F620'
                          : '#10B98120',
                      color:
                        subject.topBand === 'Mastered'
                          ? '#8B5CF6'
                          : subject.topBand === 'Strong'
                          ? '#3B82F6'
                          : '#10B981',
                    }}
                  >
                    {subject.topBand}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 h-4">
                    <div className="h-full rounded-l-sm bg-emerald/60" style={{ width: `${subject.avgMastery}%` }} />
                    <div className="h-full rounded-r-sm bg-white/10" style={{ width: `${100 - subject.avgMastery}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Engagement insights */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-bold text-white mb-3">Top Performing Topics</h3>
          <div className="space-y-2">
            {[
              { topic: 'Ancient Egyptians', mastery: 91, subject: 'History' },
              { topic: 'Times Tables', mastery: 84, subject: 'Maths' },
              { topic: 'Powerful Adjectives', mastery: 81, subject: 'English' },
            ].map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm text-white">{t.topic}</p>
                  <p className="text-xs text-slate-light/40">{t.subject}</p>
                </div>
                <span className="text-sm font-bold text-emerald">{t.mastery}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-bold text-white mb-3">Topics Needing Attention</h3>
          <div className="space-y-2">
            {[
              { topic: 'Long Division', mastery: 45, subject: 'Maths', reason: 'Low mastery' },
              { topic: 'Figurative Language', mastery: 52, subject: 'English', reason: 'High hint usage' },
              { topic: 'Decimals', mastery: 58, subject: 'Maths', reason: 'Developing band' },
            ].map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm text-white">{t.topic}</p>
                  <p className="text-xs text-amber/60">{t.reason}</p>
                </div>
                <span className="text-sm font-bold text-amber">{t.mastery}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
