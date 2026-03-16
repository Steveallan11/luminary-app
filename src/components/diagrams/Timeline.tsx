'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { DiagramProps, TimelineData } from '@/types';

export default function Timeline({ diagram, subjectColour, onComplete }: DiagramProps) {
  const data = diagram.data_json as unknown as TimelineData;
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const sortedEvents = [...data.events].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  const selected = sortedEvents.find((e) => e.id === selectedEvent);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {diagram.title}
      </h3>
      <p className="text-sm text-slate-light/60 mb-6">Tap each event to learn more.</p>

      {/* Timeline line */}
      <div className="relative">
        {/* Scroll controls */}
        <div className="flex items-center gap-2 mb-4">
          <button
            className="p-1 rounded-lg bg-white/5 text-slate-light/60 hover:text-white"
            onClick={() => setScrollOffset(Math.max(0, scrollOffset - 1))}
            disabled={scrollOffset === 0}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 text-center text-xs text-slate-light/40">
            <Clock size={12} className="inline mr-1" />
            Scroll through time
          </div>
          <button
            className="p-1 rounded-lg bg-white/5 text-slate-light/60 hover:text-white"
            onClick={() => setScrollOffset(Math.min(Math.max(0, sortedEvents.length - 4), scrollOffset + 1))}
            disabled={scrollOffset >= sortedEvents.length - 4}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Eras background */}
        {data.eras && data.eras.length > 0 && (
          <div className="flex gap-1 mb-2">
            {data.eras.map((era, i) => (
              <div
                key={i}
                className="flex-1 rounded-lg px-2 py-1 text-center"
                style={{ backgroundColor: `${era.colour}20`, borderBottom: `2px solid ${era.colour}` }}
              >
                <span className="text-xs font-bold" style={{ color: era.colour }}>{era.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timeline track */}
        <div className="relative py-8">
          {/* Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2" style={{ backgroundColor: `${subjectColour}40` }} />

          {/* Events */}
          <div className="flex justify-between relative">
            {sortedEvents.slice(scrollOffset, scrollOffset + 5).map((event, i) => (
              <motion.button
                key={event.id}
                className="flex flex-col items-center relative z-10"
                onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {/* Date above */}
                <span className="text-xs text-slate-light/50 mb-2 whitespace-nowrap">{event.date}</span>

                {/* Dot */}
                <motion.div
                  className="w-5 h-5 rounded-full border-3 cursor-pointer"
                  style={{
                    backgroundColor: selectedEvent === event.id ? subjectColour : 'var(--navy)',
                    borderColor: subjectColour,
                    borderWidth: '3px',
                  }}
                  whileHover={{ scale: 1.3 }}
                />

                {/* Title below */}
                <span className="text-xs text-white/70 mt-2 max-w-[80px] text-center leading-tight">
                  {event.title}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Selected event detail */}
        <AnimatePresence>
          {selected && (
            <motion.div
              className="rounded-xl p-4 mt-2 border"
              style={{ backgroundColor: `${subjectColour}10`, borderColor: `${subjectColour}30` }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className="font-bold text-white text-sm">{selected.title}</h4>
              <p className="text-xs text-slate-light/50 mb-1">{selected.date}</p>
              <p className="text-sm text-slate-light/70">{selected.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
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
