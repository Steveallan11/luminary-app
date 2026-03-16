'use client';

import { motion } from 'framer-motion';
import { Globe, Rocket } from 'lucide-react';
import { TopicAsset } from '@/types';

interface RealWorldCardProps {
  asset: TopicAsset;
  subjectColour: string;
}

export default function RealWorldCard({ asset, subjectColour }: RealWorldCardProps) {
  const content = asset.content_json as {
    type?: string;
    title?: string;
    description?: string;
    scenario?: string;
    image_prompt?: string;
  };

  const isInspiring = content.type === 'inspiring' || asset.asset_subtype === 'inspiring';
  const Icon = isInspiring ? Rocket : Globe;
  const label = isInspiring ? 'Inspiring' : 'Everyday';
  const accentColour = isInspiring ? '#8B5CF6' : '#10B981';

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
        style={{ background: `linear-gradient(135deg, ${accentColour}30, ${accentColour}10)` }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColour}30` }}>
          <Icon size={20} style={{ color: accentColour }} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColour }}>
            Real World — {label}
          </p>
          <h3 className="text-white font-bold">{content.title || asset.title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 bg-navy-light/40 space-y-4">
        {content.description && (
          <p className="text-sm text-slate-light/80 leading-relaxed">{content.description}</p>
        )}

        {content.scenario && (
          <div
            className="p-4 rounded-xl border"
            style={{ backgroundColor: `${accentColour}10`, borderColor: `${accentColour}20` }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColour }}>
              Scenario
            </p>
            <p className="text-sm text-white/80 leading-relaxed">{content.scenario}</p>
          </div>
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
