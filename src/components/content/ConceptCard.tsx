'use client';

import { motion } from 'framer-motion';
import { Lightbulb, HelpCircle } from 'lucide-react';
import { TopicAsset } from '@/types';

interface ConceptCardProps {
  asset: TopicAsset;
  subjectColour: string;
}

export default function ConceptCard({ asset, subjectColour }: ConceptCardProps) {
  const content = asset.content_json as {
    tagline?: string;
    hook_question?: string;
    definition?: string;
    image_prompt?: string;
  };

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, ${subjectColour}30, ${subjectColour}10)` }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${subjectColour}30` }}>
          <Lightbulb size={20} style={{ color: subjectColour }} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: subjectColour }}>Concept Card</p>
          <h3 className="text-white font-bold">{asset.title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 bg-navy-light/40 space-y-4">
        {content.tagline && (
          <p className="text-lg font-bold text-white/90 italic" style={{ fontFamily: 'var(--font-display)' }}>
            &ldquo;{content.tagline}&rdquo;
          </p>
        )}

        {content.hook_question && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber/10 border border-amber/20">
            <HelpCircle size={18} className="text-amber flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber/90">{content.hook_question}</p>
          </div>
        )}

        {content.definition && (
          <p className="text-sm text-slate-light/80 leading-relaxed">{content.definition}</p>
        )}

        {/* Image placeholder */}
        {content.image_prompt && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-8 text-center">
            <p className="text-xs text-slate-light/40 italic">{content.image_prompt}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
