'use client';

import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Trophy, BarChart3 } from 'lucide-react';
import Button from './Button';
import Link from 'next/link';

interface EmptyStateProps {
  type: 'no-activity' | 'no-achievements' | 'no-progress' | 'no-sessions';
  childName?: string;
}

const states = {
  'no-activity': {
    icon: Sparkles,
    title: 'Ready for an adventure!',
    description: 'Start exploring subjects and Lumi will guide you through amazing topics.',
    action: { label: 'Start Learning', href: '/learn' },
    colour: '#F59E0B',
  },
  'no-achievements': {
    icon: Trophy,
    title: 'Badges are waiting!',
    description: 'Complete lessons and reach milestones to earn your first badge.',
    action: { label: 'Start a Lesson', href: '/learn' },
    colour: '#F59E0B',
  },
  'no-progress': {
    icon: BarChart3,
    title: 'No progress yet',
    description: 'Once you start learning, your progress will appear here.',
    action: { label: 'Explore Subjects', href: '/learn' },
    colour: '#3B82F6',
  },
  'no-sessions': {
    icon: BookOpen,
    title: 'No recent activity',
    description: 'This child hasn\'t started any lessons yet. Time to begin the adventure!',
    action: null,
    colour: '#8B5CF6',
  },
};

export default function EmptyState({ type, childName }: EmptyStateProps) {
  const state = states[type];
  const Icon = state.icon;

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ backgroundColor: `${state.colour}15` }}
      >
        <Icon size={36} style={{ color: state.colour }} />
      </div>
      <h3
        className="text-xl font-bold text-white mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {state.title}
      </h3>
      <p className="text-sm text-slate-light/50 max-w-xs mb-6">
        {childName ? state.description.replace('you', childName) : state.description}
      </p>
      {state.action && (
        <Link href={state.action.href}>
          <Button variant="primary" size="md">
            {state.action.label}
          </Button>
        </Link>
      )}
    </motion.div>
  );
}
