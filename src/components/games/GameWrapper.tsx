'use client';

import { motion } from 'framer-motion';
import { Timer, Trophy, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GameWrapperProps {
  title: string;
  gameType: string;
  subjectColour: string;
  showTimer?: boolean;
  timeLimit?: number;
  onTimeUp?: () => void;
  children: React.ReactNode;
}

export default function GameWrapper({
  title,
  gameType,
  subjectColour,
  showTimer = false,
  timeLimit = 60,
  onTimeUp,
  children,
}: GameWrapperProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (showTimer && timeLimit && next >= timeLimit) {
          onTimeUp?.();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showTimer, timeLimit, onTimeUp]);

  const remaining = Math.max(0, timeLimit - elapsed);
  const minutes = Math.floor((showTimer ? remaining : elapsed) / 60);
  const seconds = (showTimer ? remaining : elapsed) % 60;

  const GAME_LABELS: Record<string, string> = {
    match_it: 'Match It',
    sort_it: 'Sort It',
    fill_it: 'Fill It',
    true_false: 'True or False',
    build_it: 'Build It',
    quick_fire: 'Quick Fire',
  };

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-white/10"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: `${subjectColour}20`, borderBottom: `2px solid ${subjectColour}40` }}
      >
        <div className="flex items-center gap-3">
          <Trophy size={18} style={{ color: subjectColour }} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: subjectColour }}>
              {GAME_LABELS[gameType] || gameType}
            </p>
            <p className="text-sm text-white font-semibold">{title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono" style={{ color: subjectColour }}>
          <Timer size={14} />
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Game content */}
      <div className="p-4 bg-navy-light/40">
        {children}
      </div>
    </motion.div>
  );
}
