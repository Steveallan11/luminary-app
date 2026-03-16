'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameProps, MatchItData, GameAnswer } from '@/types';
import GameWrapper from './GameWrapper';
import GameResults from './GameResults';

export default function MatchItGame({ asset, childAge, subjectColour, onComplete }: GameProps) {
  const data = asset.content_json as unknown as MatchItData;
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ left: string; right: string } | null>(null);
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [finished, setFinished] = useState(false);
  const startTime = useRef(Date.now());

  const shuffledRight = useRef(
    [...data.pairs].sort(() => Math.random() - 0.5)
  );

  const tryMatch = useCallback((leftId: string, rightId: string) => {
    const pair = data.pairs.find(p => p.id === leftId);
    const rightPair = data.pairs.find(p => p.id === rightId);
    if (!pair || !rightPair) return;

    const isCorrect = leftId === rightId;
    setAnswers(prev => [...prev, {
      question_id: leftId,
      child_answer: rightPair.right,
      correct_answer: pair.right,
      is_correct: isCorrect,
      time_taken: Math.round((Date.now() - startTime.current) / 1000),
    }]);

    if (isCorrect) {
      setMatched(prev => new Set([...Array.from(prev), leftId]));
      setSelectedLeft(null);
      setSelectedRight(null);

      if (matched.size + 1 === data.pairs.length) {
        setTimeout(() => setFinished(true), 600);
      }
    } else {
      setWrongPair({ left: leftId, right: rightId });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 800);
    }
  }, [data.pairs, matched.size]);

  const handleLeftClick = (id: string) => {
    if (matched.has(id)) return;
    setSelectedLeft(id);
    if (selectedRight) tryMatch(id, selectedRight);
  };

  const handleRightClick = (id: string) => {
    if (matched.has(id)) return;
    setSelectedRight(id);
    if (selectedLeft) tryMatch(selectedLeft, id);
  };

  if (finished) {
    const correct = answers.filter(a => a.is_correct).length;
    const uniqueCorrect = new Set(answers.filter(a => a.is_correct).map(a => a.question_id)).size;
    const score = Math.round((uniqueCorrect / data.pairs.length) * 100);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    const xpEarned = Math.round(score / 10) + 5;
    const wrongOnes = data.pairs
      .filter(p => !answers.some(a => a.question_id === p.id && a.is_correct))
      .map(p => ({ question: p.left, correctAnswer: p.right, explanation: p.explanation }));

    return (
      <GameWrapper title={asset.title} gameType="match_it" subjectColour={subjectColour}>
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
    <GameWrapper title={asset.title} gameType="match_it" subjectColour={subjectColour}>
      <p className="text-sm text-slate-light/70 mb-4">Tap one item from each column to match them together.</p>
      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {data.pairs.map((pair) => {
            const isMatched = matched.has(pair.id);
            const isSelected = selectedLeft === pair.id;
            const isWrong = wrongPair?.left === pair.id;
            return (
              <motion.button
                key={`l-${pair.id}`}
                className={`w-full p-3 rounded-xl text-sm font-bold text-center transition-all border-2 ${
                  isMatched ? 'opacity-60 cursor-default' : 'cursor-pointer'
                }`}
                style={{
                  borderColor: isMatched ? subjectColour : isSelected ? subjectColour : isWrong ? '#EF4444' : 'rgba(255,255,255,0.1)',
                  backgroundColor: isMatched ? `${subjectColour}20` : isSelected ? `${subjectColour}10` : 'rgba(255,255,255,0.05)',
                  color: isMatched ? subjectColour : 'white',
                }}
                onClick={() => handleLeftClick(pair.id)}
                animate={isWrong ? { x: [0, -8, 8, -4, 4, 0] } : isMatched ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
                disabled={isMatched}
              >
                {pair.left}
              </motion.button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {shuffledRight.current.map((pair) => {
            const isMatched = matched.has(pair.id);
            const isSelected = selectedRight === pair.id;
            const isWrong = wrongPair?.right === pair.id;
            return (
              <motion.button
                key={`r-${pair.id}`}
                className={`w-full p-3 rounded-xl text-sm font-semibold text-center transition-all border-2 ${
                  isMatched ? 'opacity-60 cursor-default' : 'cursor-pointer'
                }`}
                style={{
                  borderColor: isMatched ? subjectColour : isSelected ? subjectColour : isWrong ? '#EF4444' : 'rgba(255,255,255,0.1)',
                  backgroundColor: isMatched ? `${subjectColour}20` : isSelected ? `${subjectColour}10` : 'rgba(255,255,255,0.05)',
                  color: isMatched ? subjectColour : 'white',
                }}
                onClick={() => handleRightClick(pair.id)}
                animate={isWrong ? { x: [0, -8, 8, -4, 4, 0] } : isMatched ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
                disabled={isMatched}
              >
                {pair.right}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: subjectColour }}
            animate={{ width: `${(matched.size / data.pairs.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-light/60">{matched.size}/{data.pairs.length}</span>
      </div>
    </GameWrapper>
  );
}
