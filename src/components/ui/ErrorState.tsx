'use client';

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Lumi had a little hiccup! Try again in a moment.',
  onRetry,
}: ErrorStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6">
        <AlertCircle size={36} className="text-red-400" />
      </div>
      <h3
        className="text-xl font-bold text-white mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Oops!
      </h3>
      <p className="text-sm text-slate-light/50 max-w-xs mb-6">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="md" onClick={onRetry} className="gap-2">
          <RefreshCw size={16} />
          Try Again
        </Button>
      )}
    </motion.div>
  );
}
