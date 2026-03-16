'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { DiagramProps, LabelledDiagramData } from '@/types';

export default function LabelledDiagram({ diagram, subjectColour, onComplete }: DiagramProps) {
  const data = diagram.data_json as unknown as LabelledDiagramData;
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const selected = data.hotspots.find((h) => h.id === selectedHotspot);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {diagram.title}
        </h3>
        <button
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-light/60 hover:text-white transition-all"
          onClick={() => setShowLabels(!showLabels)}
        >
          {showLabels ? <EyeOff size={12} /> : <Eye size={12} />}
          {showLabels ? 'Hide labels' : 'Show labels'}
        </button>
      </div>
      <p className="text-sm text-slate-light/60 mb-4">Tap the markers to explore each part.</p>

      {/* Diagram area */}
      <div className="relative bg-white/5 rounded-xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
        {/* Image placeholder */}
        {data.image_url ? (
          <img src={data.image_url} alt={diagram.title} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-light/30 text-sm">
            Diagram image
          </div>
        )}

        {/* Hotspots */}
        {data.hotspots.map((hotspot) => {
          const isSelected = selectedHotspot === hotspot.id;
          const isRevealed = revealed.has(hotspot.id);
          return (
            <motion.button
              key={hotspot.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              onClick={() => {
                setSelectedHotspot(isSelected ? null : hotspot.id);
                setRevealed((prev) => new Set([...Array.from(prev), hotspot.id]));
              }}
              whileHover={{ scale: 1.2 }}
            >
              {/* Pulse ring */}
              {!isRevealed && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: `${subjectColour}40` }}
                  animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Dot */}
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center relative z-10"
                style={{
                  backgroundColor: isSelected ? subjectColour : isRevealed ? `${subjectColour}80` : 'white',
                  borderColor: subjectColour,
                }}
              >
                <span className="text-[10px] font-bold" style={{ color: isSelected ? 'white' : 'var(--navy)' }}>
                  {data.hotspots.indexOf(hotspot) + 1}
                </span>
              </div>

              {/* Label */}
              {showLabels && (
                <span
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs font-bold whitespace-nowrap px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${subjectColour}90`, color: 'white' }}
                >
                  {hotspot.label}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected hotspot detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="rounded-xl p-4 mt-4 border"
            style={{ backgroundColor: `${subjectColour}10`, borderColor: `${subjectColour}30` }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <h4 className="font-bold text-white text-sm">{selected.label}</h4>
            <p className="text-sm text-slate-light/70 mt-1">{selected.description}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: subjectColour }}
            animate={{ width: `${(revealed.size / data.hotspots.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-light/60">{revealed.size}/{data.hotspots.length} explored</span>
      </div>

      {onComplete && (
        <button
          className="mt-4 px-6 py-2 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: subjectColour }}
          onClick={onComplete}
        >
          Done exploring
        </button>
      )}
    </div>
  );
}
