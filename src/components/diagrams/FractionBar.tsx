'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DiagramProps, FractionBarData } from '@/types';

export default function FractionBar({ diagram, subjectColour, onComplete }: DiagramProps) {
  const data = diagram.data_json as unknown as FractionBarData;
  const [denominator, setDenominator] = useState(data.initial_denominator || 4);
  const [numerator, setNumerator] = useState(1);
  const [compareDenom, setCompareDenom] = useState(0);
  const [compareNum, setCompareNum] = useState(0);

  const segments = Array.from({ length: denominator }, (_, i) => i);
  const compareSegments = compareDenom > 0 ? Array.from({ length: compareDenom }, (_, i) => i) : [];

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {diagram.title}
      </h3>
      <p className="text-sm text-slate-light/60 mb-6">Tap the segments to shade them. Adjust the slider to change the denominator.</p>

      {/* Main fraction bar */}
      <div className="mb-4">
        <div className="flex gap-0.5 h-16 rounded-xl overflow-hidden border-2" style={{ borderColor: `${subjectColour}40` }}>
          {segments.map((i) => (
            <motion.button
              key={i}
              className="flex-1 transition-all relative"
              style={{
                backgroundColor: i < numerator ? subjectColour : 'rgba(255,255,255,0.05)',
              }}
              onClick={() => setNumerator(i < numerator && numerator === i + 1 ? i : i + 1)}
              whileHover={{ opacity: 0.8 }}
            >
              {data.show_notation && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white/50">
                  {i + 1}
                </span>
              )}
            </motion.button>
          ))}
        </div>
        <div className="text-center mt-3">
          <span className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: subjectColour }}>{numerator}</span>
            <span className="text-slate-light/40"> / </span>
            <span>{denominator}</span>
          </span>
          <p className="text-sm text-slate-light/50 mt-1">
            {numerator} out of {denominator} equal parts
            {numerator === denominator && ' = 1 whole'}
            {numerator === 0 && ' = zero'}
          </p>
        </div>
      </div>

      {/* Denominator slider */}
      <div className="mb-6">
        <label className="text-xs text-slate-light/60 block mb-2">Split into how many parts?</label>
        <input
          type="range"
          min={2}
          max={data.max_denominator || 12}
          value={denominator}
          onChange={(e) => {
            const newDenom = parseInt(e.target.value);
            setDenominator(newDenom);
            setNumerator(Math.min(numerator, newDenom));
          }}
          className="w-full accent-amber"
        />
        <div className="flex justify-between text-xs text-slate-light/40">
          <span>2</span>
          <span>{data.max_denominator || 12}</span>
        </div>
      </div>

      {/* Comparison bar */}
      {data.allow_comparison && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-slate-light/60 mb-2">Compare with another fraction:</p>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="text-xs text-slate-light/40">Denominator</label>
              <input
                type="number"
                min={2}
                max={data.max_denominator || 12}
                value={compareDenom || ''}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  setCompareDenom(v);
                  setCompareNum(Math.min(compareNum, v));
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="e.g. 6"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-light/40">Numerator</label>
              <input
                type="number"
                min={0}
                max={compareDenom}
                value={compareNum || ''}
                onChange={(e) => setCompareNum(Math.min(parseInt(e.target.value) || 0, compareDenom))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="e.g. 3"
              />
            </div>
          </div>

          {compareDenom > 0 && (
            <>
              <div className="flex gap-0.5 h-12 rounded-xl overflow-hidden border-2 border-amber/40">
                {compareSegments.map((i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{ backgroundColor: i < compareNum ? '#F59E0B' : 'rgba(255,255,255,0.05)' }}
                  />
                ))}
              </div>
              <div className="text-center mt-2">
                <span className="text-xl font-bold font-mono text-amber">{compareNum}/{compareDenom}</span>
                {compareDenom > 0 && denominator > 0 && (
                  <p className="text-sm text-slate-light/50 mt-1">
                    {numerator / denominator === compareNum / compareDenom
                      ? 'These fractions are equivalent!'
                      : numerator / denominator > compareNum / compareDenom
                      ? `${numerator}/${denominator} is larger`
                      : `${compareNum}/${compareDenom} is larger`}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
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
