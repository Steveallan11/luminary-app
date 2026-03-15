'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ParentNav from '@/components/layout/ParentNav';
import Starfield from '@/components/ui/Starfield';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Calendar, Clock, Zap, BookOpen, Flame, TrendingUp,
  Plus, Download, Settings, ChevronRight, User, Edit3, Save, X
} from 'lucide-react';
import { MOCK_SUBJECTS, MOCK_CHILD, MOCK_SESSIONS } from '@/lib/mock-data';
import { AVATAR_EMOJI_MAP, YEAR_GROUPS, Avatar } from '@/types';
import { formatTimeAgo } from '@/lib/utils';

const mockChildren = [
  { ...MOCK_CHILD },
  {
    id: 'child-2',
    family_id: 'family-1',
    name: 'Amelia',
    age: 9,
    year_group: 'Year 5',
    avatar: 'unicorn' as Avatar,
    learning_mode: 'school_supplement' as const,
    pin_hash: '',
    xp_total: 2340,
    streak_days: 12,
    streak_last_date: new Date().toISOString().split('T')[0],
    created_at: '',
  },
];

const stats = [
  { label: 'Days Active This Week', value: '5', icon: Calendar, color: '#38BDF8' },
  { label: 'Total Learning Time', value: '4h 32m', icon: Clock, color: '#10B981' },
  { label: 'XP Earned', value: '1,250', icon: Zap, color: '#F59E0B' },
  { label: 'Subjects Explored', value: '5', icon: BookOpen, color: '#8B5CF6' },
];

export default function ParentDashboard() {
  const [selectedChildId, setSelectedChildId] = useState(mockChildren[0].id);
  const [showSettings, setShowSettings] = useState(false);
  const [editingChild, setEditingChild] = useState<typeof mockChildren[0] | null>(null);

  const selectedChild = mockChildren.find(c => c.id === selectedChildId) || mockChildren[0];

  return (
    <div className="min-h-screen bg-navy relative">
      <Starfield />
      <ParentNav />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-2xl sm:text-3xl font-bold text-white mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Welcome back, Parent
          </h1>
          <p className="text-slate-light/70">The Smith Family</p>
        </motion.div>

        {/* Child selector tabs */}
        <motion.div
          className="flex items-center gap-3 mb-8 overflow-x-auto no-scrollbar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {mockChildren.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all whitespace-nowrap ${
                selectedChildId === child.id
                  ? 'border-amber bg-amber/10 text-white'
                  : 'border-white/10 text-slate-light/70 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="text-xl">{AVATAR_EMOJI_MAP[child.avatar]}</span>
              <div className="text-left">
                <p className="text-sm font-bold">{child.name}</p>
                <p className="text-xs opacity-60">{child.year_group}</p>
              </div>
            </button>
          ))}
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="rounded-2xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-xs text-slate-light/60">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Subject progress */}
          <motion.div
            className="lg:col-span-2 rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2
              className="text-lg font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Subject Progress
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MOCK_SUBJECTS.slice(0, 9).map((subject) => {
                const progress = Math.floor(Math.random() * 80) + 10;
                return (
                  <div
                    key={subject.slug}
                    className="rounded-2xl bg-navy/40 border border-white/5 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{subject.icon_emoji}</span>
                      <span className="text-sm font-semibold text-white truncate">{subject.name}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${progress}%`, backgroundColor: subject.colour_hex }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-light/50">
                      <span>{progress}%</span>
                      <span>2d ago</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Streak & Activity */}
          <div className="space-y-6">
            {/* Streak */}
            <motion.div
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Flame size={18} className="text-orange-400" />
                Streak
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-400">{selectedChild.streak_days}</p>
                  <p className="text-xs text-slate-light/60">Current</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber">{selectedChild.streak_days + 3}</p>
                  <p className="text-xs text-slate-light/60">Longest</p>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              className="rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {MOCK_SESSIONS.slice(0, 5).map((session) => (
                  <div key={session.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0">
                      <Zap size={14} className="text-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{session.summary_text}</p>
                      <p className="text-xs text-slate-light/50">{formatTimeAgo(session.started_at)}</p>
                    </div>
                    <span className="text-xs font-bold text-amber flex-shrink-0">+{session.xp_earned}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Quick actions */}
        <motion.div
          className="grid sm:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={() => {}}
            className="flex items-center gap-3 p-4 rounded-2xl bg-navy-light/60 border border-white/10 hover:border-amber/30 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald/20 flex items-center justify-center">
              <Plus size={18} className="text-emerald" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Add Child</p>
              <p className="text-xs text-slate-light/60">Add another learner</p>
            </div>
            <ChevronRight size={16} className="ml-auto text-slate-light/30 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => {}}
            className="flex items-center gap-3 p-4 rounded-2xl bg-navy-light/60 border border-white/10 hover:border-amber/30 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky/20 flex items-center justify-center">
              <Download size={18} className="text-sky" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Download Report</p>
              <p className="text-xs text-slate-light/60">Progress PDF</p>
            </div>
            <ChevronRight size={16} className="ml-auto text-slate-light/30 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-3 p-4 rounded-2xl bg-navy-light/60 border border-white/10 hover:border-amber/30 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber/20 flex items-center justify-center">
              <Settings size={18} className="text-amber" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Manage Settings</p>
              <p className="text-xs text-slate-light/60">Child profiles & PIN</p>
            </div>
            <ChevronRight size={16} className="ml-auto text-slate-light/30 group-hover:text-white transition-colors" />
          </button>
        </motion.div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            className="mt-6 rounded-3xl bg-navy-light/60 backdrop-blur-sm border border-white/10 p-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-bold text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Settings — {selectedChild.name}
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-light/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Name"
                  defaultValue={selectedChild.name}
                />
                <div>
                  <label className="block text-sm font-semibold text-slate-light mb-2">Year Group</label>
                  <select
                    defaultValue={selectedChild.year_group}
                    className="w-full px-4 py-3 rounded-2xl bg-navy/60 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-amber/50 appearance-none"
                  >
                    {YEAR_GROUPS.map((yg) => (
                      <option key={yg} value={yg} className="bg-navy-light">{yg}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-light mb-2">Learning Mode</label>
                  <div className="flex rounded-2xl bg-navy/60 p-1">
                    <button
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        selectedChild.learning_mode === 'full_homeschool'
                          ? 'bg-amber text-navy'
                          : 'text-slate-light'
                      }`}
                    >
                      Full Homeschool
                    </button>
                    <button
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        selectedChild.learning_mode === 'school_supplement'
                          ? 'bg-amber text-navy'
                          : 'text-slate-light'
                      }`}
                    >
                      Supplement
                    </button>
                  </div>
                </div>
                <Button variant="outline" size="md" className="w-full gap-2">
                  <Edit3 size={14} /> Reset PIN
                </Button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="primary" size="md" className="gap-2">
                <Save size={14} /> Save Changes
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
