'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap } from 'lucide-react';
import { GameProps, TrueFalseData, GameAnswer } from '@/types';
import GameWrapper from './GameWrapper';
import GameResults from './GameResults';

export default function TrueFalseGame({ asset, childAge, subjectColour, onComplete }: GameProps) {
  const data = asset.content_json as unknown as TrueFalseData;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const startTime = useRef(Date.now());
  const questionStartTime = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const statement = data.statements[currentIdx];

  const handleAnswer = (answeredTrue: boolean) => {
    if (feedback || finished) return;
    const isCorrect = answeredTrue === statement.is_true;
    const qTime = Math.round((Date.now() - questionStartTime.current) / 1000);

    // Speed bonus
    if (isCorrect && qTime < 3) setBonusPoints(prev => prev + 1);

    setAnswers(prev => [...prev, {
      question_id: statement.id,
      child_answer: answeredTrue ? 'true' : 'false',
      correct_answer: statement.is_true ? 'true' : 'false',
      is_correct: isCorrect,
      time_taken: qTime,
    }]);

    setFeedback({ correct: isCorrect, explanation: statement.explanation });

    setTimeout(() => {
      setFeedback(null);
      if (currentIdx + 1 >= data.statements.length) {
        setFinished(true);
      } else {
        setCurrentIdx(prev => prev + 1);
        questionStartTime.current = Date.now();
      }
    }, isCorrect ? 600 : 2000);
  };

  if (finished) {
    const correct = answers.filter(a => a.is_correct).length;
    const total = Math.max(answers.length, 1);
    const score = Math.round((correct / data.statements.length) * 100);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    const xpEarned = Math.round(score / 10) + bonusPoints + 5;
    const wrongOnes = data.statements
      .filter(s => {
        const a = answers.find(a => a.question_id === s.id);
        return a && !a.is_correct;
      })
      .map(s => ({
        question: s.statement,
        correctAnswer: s.is_true ? 'TRUE' : 'FALSE',
        explanation: s.explanation,
      }));

    return (
      <GameWrapper title={asset.title} gameType="true_false" subjectColour={subjectColour}>
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
    <GameWrapper title={asset.title} gameType="true_false" subjectColour={subjectColour} showTimer timeLimit={60} onTimeUp={() => setFinished(true)}>
      {/* Timer bar */}
      <div className="h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: timeLeft > 15 ? subjectColour : '#EF4444' }}
          animate={{ width: `${(timeLeft / 60) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-light/60">{currentIdx + 1} / {data.statements.length}</span>
        {bonusPoints > 0 && (
          <span className="text-xs text-amber flex items-center gap-1">
            <Zap size={12} /> +{bonusPoints} speed bonus
          </span>
        )}
      </div>

      {/* Statement card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6 text-center min-h-[120px] flex items-center justify-center"
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.3 }}
        >
          {feedback ? (
            <div>
              <div className={`text-4xl mb-2 ${feedback.correct ? 'text-emerald' : 'text-red-500'}`}>
                {feedback.correct ? '✓' : '✗'}
              </div>
              {!feedback.correct && (
                <p className="text-sm text-slate-light/70">{feedback.explanation}</p>
              )}
            </div>
          ) : (
            <p className="text-lg text-white font-semibold">{statement.statement}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* True / False buttons */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          className="py-4 rounded-xl font-bold text-lg border-2 border-emerald/40 bg-emerald/10 text-emerald flex items-center justify-center gap-2"
          onClick={() => handleAnswer(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={!!feedback}
        >
          <Check size={20} /> TRUE
        </motion.button>
        <motion.button
          className="py-4 rounded-xl font-bold text-lg border-2 border-red-500/40 bg-red-500/10 text-red-500 flex items-center justify-center gap-2"
          onClick={() => handleAnswer(false)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={!!feedback}
        >
          <X size={20} /> FALSE
        </motion.button>
      </div>
    </GameWrapper>
  );
}
