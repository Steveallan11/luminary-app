'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Lock, Play, Clock, X, Star } from 'lucide-react';
import ChildLayout from '@/components/layout/ChildLayout';
import Button from '@/components/ui/Button';
import { MOCK_SUBJECTS, MOCK_TOPICS, MOCK_TOPIC_PROGRESS } from '@/lib/mock-data';
import { TopicStatus, Topic } from '@/types';

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const subject = MOCK_SUBJECTS.find(s => s.slug === slug);
  const topics = MOCK_TOPICS[slug] || [];
  const progress = MOCK_TOPIC_PROGRESS[slug] || {};

  if (!subject) {
    return (
      <ChildLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-light">Subject not found</p>
        </div>
      </ChildLayout>
    );
  }

  const completedCount = Object.values(progress).filter(s => s === 'completed').length;
  const totalCount = topics.length || 5;

  const getStatusIcon = (status: TopicStatus) => {
    switch (status) {
      case 'completed': return <Check size={16} className="text-white" />;
      case 'in_progress': return <Play size={14} className="text-white" />;
      case 'available': return <Star size={14} className="text-white" />;
      case 'locked': return <Lock size={14} className="text-white/50" />;
    }
  };

  const getNodeStyles = (status: TopicStatus) => {
    switch (status) {
      case 'completed':
        return {
          bg: subject.colour_hex,
          border: subject.colour_hex,
          opacity: '1',
          glow: `0 0 20px ${subject.colour_hex}60`,
        };
      case 'in_progress':
        return {
          bg: `${subject.colour_hex}40`,
          border: subject.colour_hex,
          opacity: '1',
          glow: `0 0 25px ${subject.colour_hex}50, 0 0 50px ${subject.colour_hex}20`,
        };
      case 'available':
        return {
          bg: 'transparent',
          border: subject.colour_hex,
          opacity: '1',
          glow: `0 0 15px ${subject.colour_hex}30`,
        };
      case 'locked':
        return {
          bg: '#1a2040',
          border: '#2d3a5c',
          opacity: '0.5',
          glow: 'none',
        };
    }
  };

  return (
    <ChildLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/learn"
            className="inline-flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to subjects
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
              style={{ backgroundColor: `${subject.colour_hex}20` }}
            >
              {subject.icon_emoji}
            </div>
            <div>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {subject.name}
              </h1>
              <p className="text-slate-light/70">{subject.description}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: subject.colour_hex }}
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-light/70">
              {completedCount} of {totalCount} topics explored
            </span>
          </div>
        </motion.div>

        {/* Learning Map */}
        <div className="relative">
          <h2
            className="text-xl font-bold text-white mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Learning Map
          </h2>

          <div className="space-y-4">
            {topics.map((topic, i) => {
              const status = (progress[topic.slug] || 'locked') as TopicStatus;
              const styles = getNodeStyles(status);
              const isClickable = status !== 'locked';

              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  {/* Connection line */}
                  {i > 0 && (
                    <div className="flex justify-start ml-8 -mt-4 mb-0">
                      <div
                        className="w-0.5 h-4"
                        style={{
                          backgroundColor: Object.values(progress).slice(0, i).every(s => s === 'completed')
                            ? subject.colour_hex
                            : '#2d3a5c',
                        }}
                      />
                    </div>
                  )}

                  <motion.button
                    whileHover={isClickable ? { scale: 1.02, x: 4 } : undefined}
                    whileTap={isClickable ? { scale: 0.98 } : undefined}
                    onClick={() => isClickable && setSelectedTopic(topic)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                    style={{
                      borderColor: styles.border,
                      backgroundColor: `${styles.bg}15`,
                      opacity: styles.opacity,
                      boxShadow: styles.glow,
                    }}
                  >
                    {/* Status node */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2"
                      style={{
                        backgroundColor: status === 'completed' || status === 'in_progress' ? styles.bg : 'transparent',
                        borderColor: styles.border,
                      }}
                    >
                      {getStatusIcon(status)}
                    </div>

                    {/* Topic info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{topic.title}</h3>
                      <p className="text-sm text-slate-light/60 truncate">{topic.description}</p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-xs text-slate-light/50 flex-shrink-0">
                      <Clock size={12} />
                      <span>{topic.estimated_minutes}min</span>
                    </div>
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Topic detail panel (slide-in) */}
      <AnimatePresence>
        {selectedTopic && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedTopic(null)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-navy-light border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-6"
                >
                  <X size={18} />
                </button>

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
                  style={{ backgroundColor: `${subject.colour_hex}20` }}
                >
                  {subject.icon_emoji}
                </div>

                <h2
                  className="text-2xl font-bold text-white mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {selectedTopic.title}
                </h2>

                <p className="text-slate-light/70 mb-6">{selectedTopic.description}</p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-slate-light/50" />
                    <span className="text-slate-light/70">About {selectedTopic.estimated_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Star size={16} className="text-slate-light/50" />
                    <span className="text-slate-light/70">Key Stage: {selectedTopic.key_stage}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-navy/40 border border-white/10 p-5 mb-6">
                  <h3 className="text-sm font-bold text-white mb-2">What you&apos;ll learn</h3>
                  <ul className="space-y-2 text-sm text-slate-light/70">
                    <li className="flex items-start gap-2">
                      <Check size={14} className="text-emerald mt-0.5 flex-shrink-0" />
                      <span>Core concepts and key vocabulary</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="text-emerald mt-0.5 flex-shrink-0" />
                      <span>Interactive activities with Lumi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="text-emerald mt-0.5 flex-shrink-0" />
                      <span>Practice questions and challenges</span>
                    </li>
                  </ul>
                </div>

                <Link href={`/learn/${slug}/${selectedTopic.slug}`}>
                  <Button variant="primary" size="lg" className="w-full gap-2">
                    Start with Lumi <ArrowLeft size={18} className="rotate-180" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ChildLayout>
  );
}
