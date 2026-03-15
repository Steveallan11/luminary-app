'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Star } from 'lucide-react';
import ChildLayout from '@/components/layout/ChildLayout';
import { MOCK_ACHIEVEMENTS, MOCK_CHILD_ACHIEVEMENTS, MOCK_CHILD } from '@/lib/mock-data';
import { getAchievementProgress } from '@/lib/achievements';
import { getXPLevel, getXPProgress } from '@/types';

export default function AchievementsPage() {
  const child = MOCK_CHILD;
  const achievements = MOCK_ACHIEVEMENTS;
  const earned = MOCK_CHILD_ACHIEVEMENTS.filter((ca) => ca.child_id === child.id);
  const earnedIds = new Set(earned.map((ca) => ca.achievement_id));
  const level = getXPLevel(child.xp_total);
  const xpProgress = getXPProgress(child.xp_total);
  const totalAchievementXP = earned.reduce((sum, ca) => {
    const a = achievements.find((ach) => ach.id === ca.achievement_id);
    return sum + (a?.xp_reward || 0);
  }, 0);

  const [showConfetti, setShowConfetti] = useState(false);
  const [recentId, setRecentId] = useState<string | null>(null);

  useEffect(() => {
    const recent = earned.find((ca) => {
      const diff = Date.now() - new Date(ca.earned_at).getTime();
      return diff < 3600000;
    });
    if (recent) {
      setRecentId(recent.achievement_id);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, []);

  return (
    <ChildLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto">
        {/* Confetti overlay */}
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              className="fixed inset-0 z-50 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6'][
                      Math.floor(Math.random() * 5)
                    ],
                  }}
                  initial={{ top: '-5%', rotate: 0, opacity: 1 }}
                  animate={{
                    top: '105%',
                    rotate: Math.random() * 720 - 360,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    ease: 'easeIn',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-amber" size={28} />
            <h1
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Achievements
            </h1>
          </div>
          <p className="text-slate-light/60">
            {earned.length} of {achievements.length} unlocked
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          className="grid grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="rounded-2xl bg-navy-light/60 border border-white/10 p-4 text-center">
            <Trophy size={20} className="text-amber mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{earned.length}</p>
            <p className="text-xs text-slate-light/60">Badges Earned</p>
          </div>
          <div className="rounded-2xl bg-navy-light/60 border border-white/10 p-4 text-center">
            <Zap size={20} className="text-amber mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber">+{totalAchievementXP}</p>
            <p className="text-xs text-slate-light/60">XP from Badges</p>
          </div>
          <div className="rounded-2xl bg-navy-light/60 border border-white/10 p-4 text-center">
            <Star size={20} className="text-amber mx-auto mb-1" />
            <p className="text-lg font-bold text-white">Level {level.level}</p>
            <p className="text-xs text-slate-light/60">{level.name}</p>
          </div>
        </motion.div>

        {/* XP Level Progress */}
        <motion.div
          className="rounded-2xl bg-navy-light/60 border border-white/10 p-4 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">
              Level {level.level}: {level.name}
            </span>
            {level.maxXP !== Infinity && (
              <span className="text-xs text-slate-light/60">
                {child.xp_total} / {level.maxXP + 1} XP
              </span>
            )}
          </div>
          <div className="h-3 rounded-full bg-navy/60 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber to-amber/70"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress.percent}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          {level.maxXP !== Infinity ? (
            <p className="text-xs text-slate-light/50 mt-1">
              {xpProgress.needed - xpProgress.current} XP to Level {level.level + 1}
            </p>
          ) : (
            <p className="text-xs text-amber mt-1">Maximum level reached!</p>
          )}
        </motion.div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => {
            const isEarned = earnedIds.has(achievement.id);
            const earnedData = earned.find((ca) => ca.achievement_id === achievement.id);
            const isRecent = recentId === achievement.id;
            const progress = !isEarned
              ? getAchievementProgress(achievement, child.id)
              : '';

            return (
              <motion.div
                key={achievement.id}
                className={`rounded-2xl border p-5 transition-all ${
                  isEarned
                    ? 'bg-navy-light/80 border-amber/30'
                    : 'bg-navy-light/30 border-white/5 opacity-60'
                } ${isRecent ? 'ring-2 ring-amber ring-offset-2 ring-offset-navy' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isEarned ? 1 : 0.6, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                      isEarned ? '' : 'grayscale'
                    }`}
                    style={{
                      backgroundColor: isEarned ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    {achievement.icon_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm">{achievement.name}</h3>
                    <p className="text-xs text-slate-light/60 mt-0.5">
                      {achievement.description}
                    </p>
                    {isEarned && earnedData && (
                      <p className="text-xs text-amber mt-1">
                        Earned{' '}
                        {new Date(earnedData.earned_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    )}
                    {!isEarned && progress && (
                      <p className="text-xs text-slate-light/40 mt-1">{progress}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-xs font-bold ${
                        isEarned ? 'text-amber' : 'text-slate-light/30'
                      }`}
                    >
                      +{achievement.xp_reward} XP
                    </span>
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
