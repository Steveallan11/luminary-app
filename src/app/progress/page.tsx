'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Check, Clock, Star } from 'lucide-react';
import ChildLayout from '@/components/layout/ChildLayout';
import { MOCK_SUBJECTS, MOCK_CHILD, MOCK_TOPIC_PROGRESS } from '@/lib/mock-data';
import { AVATAR_EMOJI_MAP } from '@/types';

export default function ProgressPage() {
  const child = MOCK_CHILD;

  const totalTopics = Object.values(MOCK_TOPIC_PROGRESS).reduce(
    (acc, topics) => acc + Object.keys(topics).length,
    0
  );
  const completedTopics = Object.values(MOCK_TOPIC_PROGRESS).reduce(
    (acc, topics) => acc + Object.values(topics).filter(s => s === 'completed').length,
    0
  );
  const inProgressTopics = Object.values(MOCK_TOPIC_PROGRESS).reduce(
    (acc, topics) => acc + Object.values(topics).filter(s => s === 'in_progress').length,
    0
  );

  return (
    <ChildLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
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
            My Progress
          </h1>
          <p className="text-slate-light/70">See how far you&apos;ve come, {child.name}!</p>
        </motion.div>

        {/* Overview stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            className="rounded-2xl bg-navy-light/60 border border-white/10 p-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald/20 flex items-center justify-center mx-auto mb-2">
              <Check size={18} className="text-emerald" />
            </div>
            <p className="text-2xl font-bold text-white">{completedTopics}</p>
            <p className="text-xs text-slate-light/60">Completed</p>
          </motion.div>
          <motion.div
            className="rounded-2xl bg-navy-light/60 border border-white/10 p-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-10 h-10 rounded-xl bg-sky/20 flex items-center justify-center mx-auto mb-2">
              <Clock size={18} className="text-sky" />
            </div>
            <p className="text-2xl font-bold text-white">{inProgressTopics}</p>
            <p className="text-xs text-slate-light/60">In Progress</p>
          </motion.div>
          <motion.div
            className="rounded-2xl bg-navy-light/60 border border-white/10 p-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-10 h-10 rounded-xl bg-amber/20 flex items-center justify-center mx-auto mb-2">
              <TrendingUp size={18} className="text-amber" />
            </div>
            <p className="text-2xl font-bold text-white">{totalTopics}</p>
            <p className="text-xs text-slate-light/60">Total Topics</p>
          </motion.div>
        </div>

        {/* Subject progress list */}
        <div className="space-y-4">
          {MOCK_SUBJECTS.map((subject, i) => {
            const progress = MOCK_TOPIC_PROGRESS[subject.slug];
            const completed = progress
              ? Object.values(progress).filter(s => s === 'completed').length
              : 0;
            const total = progress ? Object.keys(progress).length : 5;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <motion.div
                key={subject.slug}
                className="rounded-2xl bg-navy-light/60 border border-white/10 p-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${subject.colour_hex}20` }}
                  >
                    {subject.icon_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-white">{subject.name}</h3>
                      <span className="text-sm font-bold" style={{ color: subject.colour_hex }}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: subject.colour_hex }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                      />
                    </div>
                    <p className="text-xs text-slate-light/50 mt-1">{completed}/{total} topics</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </ChildLayout>
  );
}
