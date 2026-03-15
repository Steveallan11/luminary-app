'use client';

import { motion } from 'framer-motion';
import { Zap, Flame, Calendar, BookOpen, LogOut, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ChildLayout from '@/components/layout/ChildLayout';
import Button from '@/components/ui/Button';
import { MOCK_CHILD } from '@/lib/mock-data';
import { AVATAR_EMOJI_MAP, AVATARS } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const child = MOCK_CHILD;

  const profileStats = [
    { label: 'Total XP', value: child.xp_total.toLocaleString(), icon: Zap, color: '#F59E0B' },
    { label: 'Day Streak', value: child.streak_days.toString(), icon: Flame, color: '#F97316' },
    { label: 'Year Group', value: child.year_group, icon: Calendar, color: '#38BDF8' },
    { label: 'Age', value: child.age.toString(), icon: BookOpen, color: '#10B981' },
  ];

  return (
    <ChildLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-lg mx-auto">
        {/* Profile header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="w-24 h-24 rounded-3xl bg-amber/10 border-2 border-amber/30 flex items-center justify-center text-5xl mx-auto mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {AVATAR_EMOJI_MAP[child.avatar]}
          </motion.div>
          <h1
            className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {child.name}
          </h1>
          <p className="text-slate-light/70">
            {child.name} the {AVATARS.find(a => a.value === child.avatar)?.label}
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {profileStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="rounded-2xl bg-navy-light/60 border border-white/10 p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-light/60">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Learning mode */}
        <motion.div
          className="rounded-2xl bg-navy-light/60 border border-white/10 p-5 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Learning Mode</p>
              <p className="text-xs text-slate-light/60">
                {child.learning_mode === 'full_homeschool' ? 'Full Homeschool' : 'School Supplement'}
              </p>
            </div>
            <div className="text-2xl">
              {child.learning_mode === 'full_homeschool' ? '🏠' : '🏫'}
            </div>
          </div>
        </motion.div>

        {/* Avatar selection */}
        <motion.div
          className="rounded-2xl bg-navy-light/60 border border-white/10 p-5 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm font-bold text-white mb-3">Your Avatar</p>
          <div className="flex items-center gap-3">
            {AVATARS.map((a) => (
              <div
                key={a.value}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 transition-all ${
                  child.avatar === a.value
                    ? 'border-amber bg-amber/10'
                    : 'border-white/10 opacity-40'
                }`}
              >
                {a.emoji}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            size="md"
            className="w-full gap-2 text-slate-light/60 hover:text-white"
          >
            <LogOut size={16} />
            Switch User
          </Button>
        </motion.div>
      </div>
    </ChildLayout>
  );
}
