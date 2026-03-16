'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameProps, SortItData, GameAnswer } from '@/types';
import GameWrapper from './GameWrapper';
import GameResults from './GameResults';

export default function SortItGame({ asset, childAge, subjectColour, onComplete }: GameProps) {
  const data = asset.content_json as unknown as SortItData;
  const [pool, setPool] = useState(() => [...data.items].sort(() => Math.random() - 0.5));
  const [sorted, setSorted] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    data.categories.forEach(c => { init[c.id] = []; });
    return init;
  });
  const [feedback, setFeedback] = useState<{ itemId: string; correct: boolean } | null>(null);
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [finished, setFinished] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const startTime = useRef(Date.now());
  const totalItems = data.items.length;

  const handleSort = (itemId: string, categoryId: string) => {
    const item = data.items.find(i => i.id === itemId);
    if (!item) return;

    const isCorrect = item.correct_category === categoryId;
    setAnswers(prev => [...prev, {
      question_id: itemId,
      child_answer: categoryId,
      correct_answer: item.correct_category,
      is_correct: isCorrect,
      time_taken: Math.round((Date.now() - startTime.current) / 1000),
    }]);

    setFeedback({ itemId, correct: isCorrect });

    if (isCorrect) {
      setTimeout(() => {
        setPool(prev => prev.filter(i => i.id !== itemId));
        setSorted(prev => ({ ...prev, [categoryId]: [...prev[categoryId], itemId] }));
        setFeedback(null);
        setSelectedItem(null);

        if (pool.length <= 1) {
          setTimeout(() => setFinished(true), 400);
        }
      }, 400);
    } else {
      setTimeout(() => {
        setFeedback(null);
        setSelectedItem(null);
      }, 800);
    }
  };

  if (finished) {
    const correct = new Set(answers.filter(a => a.is_correct).map(a => a.question_id)).size;
    const score = Math.round((correct / totalItems) * 100);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    const xpEarned = Math.round(score / 10) + 5;
    const wrongOnes = data.items
      .filter(item => {
        const lastAnswer = [...answers].reverse().find(a => a.question_id === item.id);
        return lastAnswer && !lastAnswer.is_correct;
      })
      .map(item => {
        const cat = data.categories.find(c => c.id === item.correct_category);
        return { question: item.text, correctAnswer: cat?.name || '', explanation: item.explanation };
      });

    return (
      <GameWrapper title={asset.title} gameType="sort_it" subjectColour={subjectColour}>
        <GameResults
          score={score}
          maxScore={100}
          timeTaken={timeTaken}
          xpEarned={xpEarned}
          subjectColour={subjectColour}
          wrongAnswers={wrongOnes}
          onContinue={() => onComplete({ score, maxScore: 100, timeTaken, answersJson: answers, xpEarned })}
        />
      </GameWrapper>
    );
  }

  return (
    <GameWrapper title={asset.title} gameType="sort_it" subjectColour={subjectColour}>
      <p className="text-sm text-slate-light/70 mb-4">Tap an item, then tap the category it belongs to.</p>

      {/* Item pool */}
      <div className="flex flex-wrap gap-2 mb-6 min-h-[48px]">
        <AnimatePresence>
          {pool.map((item) => (
            <motion.button
              key={item.id}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                selectedItem === item.id ? 'ring-2 ring-offset-2 ring-offset-navy' : ''
              }`}
              style={{
                borderColor: selectedItem === item.id ? subjectColour : feedback?.itemId === item.id ? (feedback.correct ? '#10B981' : '#EF4444') : 'rgba(255,255,255,0.15)',
                backgroundColor: selectedItem === item.id ? `${subjectColour}20` : 'rgba(255,255,255,0.05)',
                color: 'white',
              }}
              onClick={() => setSelectedItem(item.id)}
              animate={feedback?.itemId === item.id && !feedback.correct ? { x: [0, -6, 6, -3, 3, 0] } : {}}
              exit={{ scale: 0, opacity: 0 }}
              layout
            >
              {item.text}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Categories */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(data.categories.length, 3)}, 1fr)` }}>
        {data.categories.map((cat) => (
          <motion.button
            key={cat.id}
            className="rounded-xl border-2 border-dashed p-4 min-h-[100px] transition-all"
            style={{
              borderColor: `${cat.colour}60`,
              backgroundColor: `${cat.colour}10`,
            }}
            onClick={() => {
              if (selectedItem) handleSort(selectedItem, cat.id);
            }}
            whileHover={selectedItem ? { scale: 1.02, borderColor: cat.colour } : {}}
          >
            <p className="text-sm font-bold mb-2" style={{ color: cat.colour }}>{cat.name}</p>
            <div className="flex flex-wrap gap-1">
              {sorted[cat.id]?.map(itemId => {
                const item = data.items.find(i => i.id === itemId);
                return (
                  <span key={itemId} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: `${cat.colour}30`, color: cat.colour }}>
                    {item?.text}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-slate-light/40 mt-1">{sorted[cat.id]?.length || 0} items</p>
          </motion.button>
        ))}
      </div>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: subjectColour }}
            animate={{ width: `${((totalItems - pool.length) / totalItems) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-light/60">{totalItems - pool.length}/{totalItems}</span>
      </div>
    </GameWrapper>
  );
}
