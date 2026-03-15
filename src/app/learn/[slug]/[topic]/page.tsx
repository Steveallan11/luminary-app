'use client';

import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import ChildLayout from '@/components/layout/ChildLayout';
import { MOCK_SUBJECTS, MOCK_TOPICS } from '@/lib/mock-data';

export default function LessonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const topicSlug = params.topic as string;

  const subject = MOCK_SUBJECTS.find(s => s.slug === slug);
  const topics = MOCK_TOPICS[slug] || [];
  const topic = topics.find(t => t.slug === topicSlug);

  if (!subject || !topic) {
    return (
      <ChildLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-light">Topic not found</p>
        </div>
      </ChildLayout>
    );
  }

  return (
    <ChildLayout>
      <div className="flex flex-col h-[calc(100vh-80px)] lg:h-screen max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          className="px-4 sm:px-6 py-4 border-b border-white/10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href={`/learn/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-slate-light/60 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back to {subject.name}
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: `${subject.colour_hex}20` }}
            >
              {subject.icon_emoji}
            </div>
            <h1 className="text-lg font-bold text-white">{topic.title}</h1>
          </div>
        </motion.div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {/* Lumi avatar */}
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-amber/30 to-amber/10 border-2 border-amber/30 flex items-center justify-center mx-auto mb-6 lumi-pulse"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(245, 158, 11, 0.3)',
                  '0 0 40px rgba(245, 158, 11, 0.5)',
                  '0 0 20px rgba(245, 158, 11, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-4xl">✨</span>
            </motion.div>

            <h2
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Lumi is warming up...
            </h2>
            <p className="text-slate-light/70 mb-2">
              Your AI tutor will be ready soon
            </p>
            <p className="text-sm text-slate-light/50">
              Topic: {topic.description}
            </p>

            {/* Animated dots */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-amber/60"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Input area (non-functional placeholder) */}
        <motion.div
          className="px-4 sm:px-6 py-4 border-t border-white/10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type your message to Lumi..."
                disabled
                className="w-full px-5 py-3.5 rounded-2xl bg-navy-light/60 border border-white/10 text-white placeholder-slate-mid/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <button
              disabled
              className="w-12 h-12 rounded-2xl bg-amber/20 flex items-center justify-center text-amber/50 cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-slate-light/30 mt-2">
            AI tutor integration coming in Session 2
          </p>
        </motion.div>
      </div>
    </ChildLayout>
  );
}
