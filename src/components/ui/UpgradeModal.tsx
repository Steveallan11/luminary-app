'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Zap, BookOpen, Users } from 'lucide-react';
import Button from './Button';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'subjects' | 'sessions' | 'children' | 'reports';
}

const reasonMessages = {
  subjects: {
    title: "You're doing amazing!",
    message: 'Unlock all 15 subjects with Luminary Family',
    icon: BookOpen,
  },
  sessions: {
    title: 'Keep the momentum going!',
    message: "You've used your 3 free sessions this week. Upgrade for unlimited learning.",
    icon: Zap,
  },
  children: {
    title: 'Room for the whole family!',
    message: 'Add more children to your Luminary account.',
    icon: Users,
  },
  reports: {
    title: 'Track progress like a pro!',
    message: 'Download detailed PDF progress reports for Local Authority submissions.',
    icon: BookOpen,
  },
};

export default function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const info = reasonMessages[reason];
  const Icon = info.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-navy-light border border-amber/20 rounded-3xl p-8 max-w-md w-full relative"
              style={{ boxShadow: '0 0 60px rgba(245, 158, 11, 0.1)' }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-light/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={28} className="text-amber" />
                </div>

                <h2
                  className="text-2xl font-bold text-white mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {info.title}
                </h2>
                <p className="text-slate-light/60 mb-6">{info.message}</p>

                <div className="space-y-3 mb-6 text-left">
                  {[
                    'All 15 subjects unlocked',
                    'Unlimited learning sessions',
                    'PDF progress reports',
                    'Up to 3 children',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-amber/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles size={10} className="text-amber" />
                      </div>
                      <span className="text-slate-light/80">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href="/pricing">
                  <Button variant="primary" size="lg" className="w-full mb-3">
                    Upgrade to Family — £9.99/mo
                  </Button>
                </Link>
                <button
                  onClick={onClose}
                  className="text-sm text-slate-light/40 hover:text-slate-light/60 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
