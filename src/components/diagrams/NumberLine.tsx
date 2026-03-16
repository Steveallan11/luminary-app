'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { DiagramProps, NumberLineData } from '@/types';

export default function NumberLine({ diagram, subjectColour, onComplete }: DiagramProps) {
  const data = diagram.data_json as unknown as NumberLineData;
  const [placedMarkers, setPlacedMarkers] = useState<{ value: number; label: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [inputLabel, setInputLabel] = useState('');
  const lineRef = useRef<HTMLDivElement>(null);

  const range = data.max - data.min;
  const ticks: number[] = [];
  for (let v = data.min; v <= data.max; v += data.step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }

  const getPosition = (value: number) => ((value - data.min) / range) * 100;

  const formatValue = (v: number) => {
    if (data.show_fractions && v !== Math.floor(v)) {
      const denom = Math.round(1 / data.step);
      const num = Math.round(v * denom);
      return `${num}/${denom}`;
    }
    if (data.show_decimals) return v.toFixed(1);
    return String(v);
  };

  const handlePlace = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val) || val < data.min || val > data.max) return;
    setPlacedMarkers((prev) => [...prev, { value: val, label: inputLabel || formatValue(val) }]);
    setInputValue('');
    setInputLabel('');
  };

  const handleLineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!data.allow_placement || !lineRef.current) return;
    const rect = lineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const value = Math.round((data.min + pct * range) / data.step) * data.step;
    const clamped = Math.max(data.min, Math.min(data.max, Math.round(value * 1000) / 1000));
    setPlacedMarkers((prev) => [...prev, { value: clamped, label: formatValue(clamped) }]);
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {diagram.title}
      </h3>
      <p className="text-sm text-slate-light/60 mb-6">
        {data.allow_placement ? 'Click on the line to place markers, or type a value below.' : 'Explore the number line.'}
      </p>

      {/* Number line */}
      <div className="relative py-12 px-4">
        {/* Main line */}
        <div
          ref={lineRef}
          className="relative h-1 rounded-full cursor-pointer"
          style={{ backgroundColor: `${subjectColour}40` }}
          onClick={handleLineClick}
        >
          {/* Arrow ends */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px]" style={{ borderRightColor: subjectColour }} />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px]" style={{ borderLeftColor: subjectColour }} />

          {/* Tick marks */}
          {ticks.map((v) => (
            <div
              key={v}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${getPosition(v)}%` }}
            >
              <div className="w-0.5 h-4 -translate-x-1/2" style={{ backgroundColor: `${subjectColour}60` }} />
              <span className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-slate-light/50 whitespace-nowrap font-mono">
                {formatValue(v)}
              </span>
            </div>
          ))}

          {/* Pre-set markers */}
          {data.markers?.map((marker, i) => (
            <motion.div
              key={`preset-${i}`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${getPosition(marker.value)}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: subjectColour, borderColor: 'white' }} />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap px-1.5 py-0.5 rounded" style={{ backgroundColor: subjectColour, color: 'white' }}>
                {marker.label}
              </span>
            </motion.div>
          ))}

          {/* Placed markers */}
          {placedMarkers.map((marker, i) => (
            <motion.div
              key={`placed-${i}`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer"
              style={{ left: `${getPosition(marker.value)}%` }}
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={() => setPlacedMarkers((prev) => prev.filter((_, j) => j !== i))}
            >
              <div className="w-5 h-5 rounded-full border-2 border-amber" style={{ backgroundColor: '#F59E0B' }} />
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-amber whitespace-nowrap bg-amber/20 px-1.5 py-0.5 rounded">
                {marker.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Place marker input */}
      {data.allow_placement && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Value..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="text"
            placeholder="Label (optional)"
            value={inputLabel}
            onChange={(e) => setInputLabel(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            className="px-4 py-2 rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: subjectColour }}
            onClick={handlePlace}
          >
            Place
          </button>
        </div>
      )}

      {placedMarkers.length > 0 && (
        <button
          className="mt-2 text-xs text-slate-light/50 hover:text-red-400 transition-colors"
          onClick={() => setPlacedMarkers([])}
        >
          Clear all markers
        </button>
      )}

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
