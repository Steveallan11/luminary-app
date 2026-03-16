'use client';

import { motion } from 'framer-motion';
import { Trophy, Star, Clock, ArrowRight } from 'lucide-react';

interface GameResultsProps {
  score: number;
  maxScore: number;
  timeTaken: number;
  xpEarned: number;
  subjectColour: string;
  wrongAnswers?: { question: string; correctAnswer: string; explanation: string }[];
  onContinue: () => void;
}

export default function GameResults({
  score,
  maxScore,
  timeTaken,
  xpEarned,
  subjectColour,
  wrongAnswers = [],
  onContinue,
}: GameResultsProps) {
  const percentage = Math.round((score / maxScore) * 100);
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  const getMessage = () => {
    if (percentage === 100) return 'Perfect score! You are amazing!';
    if (percentage >= 80) return 'Brilliant work! Nearly perfect!';
    if (percentage >= 60) return 'Great effort! Keep practising!';
    if (percentage >= 40) return 'Good try! You are learning!';
    return 'Keep going! Practice makes perfect!';
  };

  const getEmoji = () => {
    if (percentage === 100) return '🌟';
    if (percentage >= 80) return '🎉';
    if (percentage >= 60) return '👏';
    if (percentage >= 40) return '💪';
    return '🌱';
  };

  return (
    <motion.div
      className="text-center py-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-5xl mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        {getEmoji()}
      </motion.div>

      <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {getMessage()}
      </h3>

      <div className="flex items-center justify-center gap-6 my-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${subjectColour}20` }}>
            <Trophy size={24} style={{ color: subjectColour }} />
          </div>
          <p className="text-2xl font-bold text-white">{percentage}%</p>
          <p className="text-xs text-slate-light/60">Score</p>
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-amber/20 flex items-center justify-center mx-auto mb-2">
            <Star size={24} className="text-amber" />
          </div>
          <p className="text-2xl font-bold text-white">+{xpEarned}</p>
          <p className="text-xs text-slate-light/60">XP Earned</p>
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-sky/20 flex items-center justify-center mx-auto mb-2">
            <Clock size={24} className="text-sky" />
          </div>
          <p className="text-2xl font-bold text-white">{minutes}:{seconds.toString().padStart(2, '0')}</p>
          <p className="text-xs text-slate-light/60">Time</p>
        </motion.div>
      </div>

      {/* Wrong answers review */}
      {wrongAnswers.length > 0 && (
        <motion.div
          className="text-left mt-4 mb-6 space-y-2 max-h-48 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm font-semibold text-white/70 mb-2">Review:</p>
          {wrongAnswers.map((wa, i) => (
            <div key={i} className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm">
              <p className="text-white/80">{wa.question}</p>
              <p className="text-emerald text-xs mt-1">Correct: {wa.correctAnswer}</p>
              <p className="text-slate-light/50 text-xs">{wa.explanation}</p>
            </div>
          ))}
        </motion.div>
      )}

      <motion.button
        className="px-8 py-3 rounded-xl font-bold text-white text-sm"
        style={{ backgroundColor: subjectColour }}
        onClick={onContinue}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Continue <ArrowRight size={14} className="inline ml-1" />
      </motion.button>
    </motion.div>
  );
}
