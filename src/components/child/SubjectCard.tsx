'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Subject } from '@/types';
import Link from 'next/link';

interface SubjectCardProps {
  subject: Subject;
  index: number;
  completedTopics?: number;
  totalTopics?: number;
  onPick?: (subjectSlug: string) => void;
}

export default function SubjectCard({
  subject,
  index,
  completedTopics = 0,
  totalTopics = 5,
  onPick,
}: SubjectCardProps) {
  const progress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
    >
      <Link href={`/learn/${subject.slug}`} onClick={() => onPick?.(subject.slug)}>
        <div
          className="subject-card relative rounded-3xl p-5 sm:p-6 border border-white/10 backdrop-blur-sm overflow-hidden group min-h-[160px] flex flex-col justify-between"
          style={{
            background: `linear-gradient(135deg, ${subject.colour_hex}20 0%, ${subject.colour_hex}10 50%, #112069 100%)`,
            boxShadow: `0 0 20px ${subject.colour_hex}15, 0 0 40px ${subject.colour_hex}08`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${subject.colour_hex}35, 0 0 60px ${subject.colour_hex}18`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${subject.colour_hex}15, 0 0 40px ${subject.colour_hex}08`;
          }}
        >
          {/* Future skill badge */}
          {subject.is_future_skill && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 bg-amber/20 text-amber px-2 py-0.5 rounded-full text-xs font-bold">
                <Star size={10} fill="currentColor" />
                <span>Future</span>
              </div>
            </div>
          )}

          {/* Subject icon */}
          <div className="text-3xl sm:text-4xl mb-3">{subject.icon_emoji}</div>

          {/* Subject name */}
          <h3
            className="text-base sm:text-lg font-bold text-white mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {subject.name}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-light/70 mb-3 line-clamp-2">
            {subject.description}
          </p>

          {/* Progress bar */}
          <div className="mt-auto">
            <div className="flex items-center justify-between text-xs text-slate-light/60 mb-1">
              <span>{completedTopics}/{totalTopics} topics</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: subject.colour_hex,
                }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
