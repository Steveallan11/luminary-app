'use client';

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for debugging
    console.error('[Error Boundary]', error);
    console.error('[Error Message]', error.message);
    console.error('[Error Stack]', error.stack);
  }, [error]);

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={36} className="text-red-400" />
        </div>
        <h1
          className="text-2xl font-bold text-white mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Something went wrong
        </h1>
        <p className="text-slate-light/60 mb-8">
          Lumi had a little hiccup. Don&apos;t worry, your progress is safe!
        </p>

        {/* Show error details in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-red-500/10 rounded-lg border border-red-500/20 text-left">
            <p className="text-xs text-red-300 font-mono break-words">{error.message}</p>
            {error.digest && (
              <p className="text-xs text-red-200/60 mt-2">Digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" onClick={reset} className="gap-2">
            <RefreshCw size={16} />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="secondary" className="gap-2">
              <Home size={16} />
              Go Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
