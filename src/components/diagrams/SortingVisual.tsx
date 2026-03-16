'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiagramProps, SortingVisualData } from '@/types';

export default function SortingVisual({ diagram, subjectColour, onComplete }: DiagramProps) {
  const data = diagram.data_json as unknown as SortingVisualData;
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    data.items.forEach((item) => {
      if (item.initial_group) init[item.id] = item.initial_group;
    });
    return init;
  });
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const unassigned = data.items.filter((item) => !assignments[item.id]);
  const getGroupItems = (groupId: string) =>
    data.items.filter((item) => assignments[item.id] === groupId);

  const handleAssign = (groupId: string) => {
    if (!selectedItem) return;
    setAssignments((prev) => ({ ...prev, [selectedItem]: groupId }));
    setSelectedItem(null);
  };

  const handleRemove = (itemId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {diagram.title}
      </h3>
      <p className="text-sm text-slate-light/60 mb-4">Tap an item, then tap a group to sort it.</p>

      {/* Unassigned pool */}
      {unassigned.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-light/40 mb-2">Items to sort:</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((item) => (
              <motion.button
                key={item.id}
                className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                  selectedItem === item.id ? 'ring-2 ring-offset-2 ring-offset-navy' : ''
                }`}
                style={{
                  borderColor: selectedItem === item.id ? subjectColour : 'rgba(255,255,255,0.15)',
                  backgroundColor: selectedItem === item.id ? `${subjectColour}20` : 'rgba(255,255,255,0.05)',
                  color: 'white',
                }}
                onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                layout
              >
                {item.text}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(data.groups.length, 3)}, 1fr)` }}>
        {data.groups.map((group) => {
          const items = getGroupItems(group.id);
          return (
            <motion.button
              key={group.id}
              className="rounded-xl border-2 border-dashed p-4 min-h-[100px] transition-all text-left"
              style={{
                borderColor: `${group.colour}60`,
                backgroundColor: `${group.colour}10`,
              }}
              onClick={() => handleAssign(group.id)}
              whileHover={selectedItem ? { scale: 1.02, borderColor: group.colour } : {}}
            >
              <p className="text-sm font-bold mb-2" style={{ color: group.colour }}>{group.name}</p>
              <div className="flex flex-wrap gap-1">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.span
                      key={item.id}
                      className="text-xs px-2 py-1 rounded-lg cursor-pointer hover:opacity-70"
                      style={{ backgroundColor: `${group.colour}30`, color: group.colour }}
                      onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      layout
                    >
                      {item.text} ×
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
              {items.length === 0 && (
                <p className="text-xs text-slate-light/30 italic">Drop items here</p>
              )}
            </motion.button>
          );
        })}
      </div>

      {onComplete && (
        <button
          className="mt-4 px-6 py-2 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: subjectColour }}
          onClick={onComplete}
        >
          Done sorting
        </button>
      )}
    </div>
  );
}
