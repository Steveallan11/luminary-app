'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { GameProps, BuildItData, GameAnswer } from '@/types';
import GameWrapper from './GameWrapper';
import GameResults from './GameResults';

export default function BuildItGame({ asset, childAge, subjectColour, onComplete }: GameProps) {
  const data = asset.content_json as unknown as BuildItData;
  const [items, setItems] = useState(() =>
    [...data.items].sort(() => Math.random() - 0.5)
  );
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);
  const startTime = useRef(Date.now());

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (submitted) return;
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
  };

  const handleSubmit = () => {
    const res: Record<string, boolean> = {};
    items.forEach((item, i) => {
      res[item.id] = item.correct_position === i + 1;
    });
    setResults(res);
    setSubmitted(true);

    setTimeout(() => {
      // Show correct order
      setItems([...data.items].sort((a, b) => a.correct_position - b.correct_position));
      setTimeout(() => setFinished(true), 1500);
    }, 2000);
  };

  if (finished) {
    const correct = Object.values(results).filter(Boolean).length;
    const score = Math.round((correct / data.items.length) * 100);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    const xpEarned = Math.round(score / 10) + 5;
    const answersJson: GameAnswer[] = items.map((item, i) => ({
      question_id: item.id,
      child_answer: String(i + 1),
      correct_answer: String(item.correct_position),
      is_correct: results[item.id] || false,
      time_taken: timeTaken,
    }));

    return (
      <GameWrapper title={asset.title} gameType="build_it" subjectColour={subjectColour}>
        <GameResults
          score={score}
          maxScore={100}
          timeTaken={timeTaken}
          xpEarned={xpEarned}
          subjectColour={subjectColour}
          onContinue={() => onComplete({ score, maxScore: 100, timeTaken, answersJson, xpEarned })}
        />
      </GameWrapper>
    );
  }

  return (
    <GameWrapper title={asset.title} gameType="build_it" subjectColour={subjectColour}>
      <p className="text-sm text-slate-light/70 mb-2">{data.title}</p>
      <p className="text-xs text-slate-light/50 mb-4">Use the arrows to reorder the steps, then submit.</p>

      <div className="space-y-2 mb-6">
        {items.map((item, index) => {
          const isCorrect = submitted && results[item.id];
          const isWrong = submitted && !results[item.id];
          return (
            <motion.div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                isCorrect ? 'border-emerald bg-emerald/10' : isWrong ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-white/5'
              }`}
              layout
              animate={isWrong ? { x: [0, -6, 6, -3, 3, 0] } : {}}
              transition={{ layout: { duration: 0.3 } }}
            >
              {/* Position number */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  backgroundColor: isCorrect ? '#10B98120' : `${subjectColour}20`,
                  color: isCorrect ? '#10B981' : subjectColour,
                }}
              >
                {index + 1}
              </div>

              {/* Content */}
              <p className={`flex-1 text-sm ${isCorrect ? 'text-emerald' : isWrong ? 'text-red-400' : 'text-white'}`}>
                {item.content}
              </p>

              {/* Move buttons */}
              {!submitted && (
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    className="p-1 rounded hover:bg-white/10 text-slate-light/50 hover:text-white transition-colors disabled:opacity-30"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    className="p-1 rounded hover:bg-white/10 text-slate-light/50 hover:text-white transition-colors disabled:opacity-30"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              )}

              {/* Result icon */}
              {submitted && (
                <div className="flex-shrink-0">
                  {isCorrect ? (
                    <Check size={18} className="text-emerald" />
                  ) : (
                    <span className="text-xs text-red-400">→ {item.correct_position}</span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {!submitted && (
        <motion.button
          className="w-full py-3 rounded-xl font-bold text-white text-sm"
          style={{ backgroundColor: subjectColour }}
          onClick={handleSubmit}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Check Order
        </motion.button>
      )}
    </GameWrapper>
  );
}
