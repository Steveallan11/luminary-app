'use client';

import { motion } from 'framer-motion';
import { Trophy, Lock, Star, Flame, BookOpen, Zap, Target, Award } from 'lucide-react';
import ChildLayout from '@/components/layout/ChildLayout';
import { MOCK_CHILD } from '@/lib/mock-data';

const achievements = [
  { id: 1, title: 'First Steps', description: 'Complete your first topic', icon: Star, color: '#F59E0B', earned: true },
  { id: 2, title: 'Bookworm', description: 'Complete 5 English topics', icon: BookOpen, color: '#3B82F6', earned: true },
  { id: 3, title: 'Number Ninja', description: 'Complete 5 Maths topics', icon: Target, color: '#8B5CF6', earned: false },
  { id: 4, title: 'Science Explorer', description: 'Complete 5 Science topics', icon: Zap, color: '#10B981', earned: false },
  { id: 5, title: 'On Fire', description: 'Reach a 7-day streak', icon: Flame, color: '#F97316', earned: false },
  { id: 6, title: 'Super Streak', description: 'Reach a 30-day streak', icon: Flame, color: '#EF4444', earned: false },
  { id: 7, title: 'XP Hunter', description: 'Earn 1,000 XP', icon: Zap, color: '#F59E0B', earned: true },
  { id: 8, title: 'XP Master', description: 'Earn 5,000 XP', icon: Award, color: '#F59E0B', earned: false },
  { id: 9, title: 'All-Rounder', description: 'Explore all 15 subjects', icon: Star, color: '#06B6D4', earned: false },
  { id: 10, title: 'Future Ready', description: 'Complete a Future Skills topic', icon: Trophy, color: '#A78BFA', earned: false },
  { id: 11, title: 'History Buff', description: 'Complete 5 History topics', icon: BookOpen, color: '#F59E0B', earned: false },
  { id: 12, title: 'Globe Trotter', description: 'Complete 5 Geography topics', icon: Target, color: '#06B6D4', earned: false },
];

export default function AchievementsPage() {
  const child = MOCK_CHILD;
  const earnedCount = achievements.filter(a => a.earned).length;

  return (
    <ChildLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={28} className="text-amber" />
            <h1
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Achievements
            </h1>
          </div>
          <p className="text-slate-light/70">
            {earnedCount} of {achievements.length} badges earned
          </p>
        </motion.div>

        {/* Achievements grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {achievements.map((achievement, i) => {
            const Icon = achievement.icon;
            return (
              <motion.div
                key={achievement.id}
                className={`rounded-2xl border p-5 text-center transition-all ${
                  achievement.earned
                    ? 'bg-navy-light/60 border-white/10'
                    : 'bg-navy-light/30 border-white/5 opacity-50'
                }`}
                style={
                  achievement.earned
                    ? { boxShadow: `0 0 20px ${achievement.color}15` }
                    : undefined
                }
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: achievement.earned ? 1 : 0.5, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{
                    backgroundColor: achievement.earned ? `${achievement.color}20` : '#1a2040',
                  }}
                >
                  {achievement.earned ? (
                    <Icon size={24} style={{ color: achievement.color }} />
                  ) : (
                    <Lock size={20} className="text-white/30" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{achievement.title}</h3>
                <p className="text-xs text-slate-light/50">{achievement.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </ChildLayout>
  );
}
