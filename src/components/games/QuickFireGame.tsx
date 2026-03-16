'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Timer } from 'lucide-react';
import { GameProps, QuickFireData, GameAnswer } from '@/types';
import GameWrapper from './GameWrapper';
import GameResults from './GameResults';

export default function QuickFireGame({ asset, childAge, subjectColour, onComplete }: GameProps) {
  const data = asset.content_json as unknown as QuickFireData;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(data.time_limit || 90);
  const [finished, setFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const startTime = useRef(Date.now());
  const questionStartTime = useRef(Date.now());

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [finished]);

  const question = data.questions[currentIdx];

  const handleAnswer = (option: string) => {
    if (feedback || finished) return;
    const isCorrect = option === question.correct;
    const qTime = Math.round((Date.now() - questionStartTime.current) / 1000);

    if (isCorrect) {
      setStreak((prev) => {
        const newStreak = prev + 1;
        setMaxStreak((max) => Math.max(max, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    setAnswers((prev) => [
      ...prev,
      {
        question_id: question.id,
        child_answer: option,
        correct_answer: question.correct,
        is_correct: isCorrect,
        time_taken: qTime,
      },
    ]);

    setFeedback({ correct: isCorrect, explanation: question.explanation });

    setTimeout(
      () => {
        setFeedback(null);
        if (currentIdx + 1 >= data.questions.length) {
          setFinished(true);
        } else {
          setCurrentIdx((prev) => prev + 1);
          questionStartTime.current = Date.now();
        }
      },
      isCorrect ? 400 : 1500
    );
  };

  if (finished) {
    const correct = answers.filter((a) => a.is_correct).length;
    const score = Math.round((correct / data.questions.length) * 100);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    const streakBonus = maxStreak >= 5 ? 10 : maxStreak >= 3 ? 5 : 0;
    const xpEarned = Math.round(score / 10) + streakBonus + 5;
    const wrongOnes = data.questions
      .filter((q) => {
        const a = answers.find((a) => a.question_id === q.id);
        return a && !a.is_correct;
      })
      .map((q) => ({
        question: q.question,
        correctAnswer: q.correct,
        explanation: q.explanation,
      }));

    return (
      <GameWrapper title={asset.title} gameType="quick_fire" subjectColour={subjectColour}>
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
    <GameWrapper title={asset.title} gameType="quick_fire" subjectColour={subjectColour}>
      {/* Timer + streak */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer size={14} className={timeLeft <= 15 ? 'text-red-500' : 'text-slate-light/60'} />
          <span className={`text-sm font-mono ${timeLeft <= 15 ? 'text-red-500' : 'text-slate-light/60'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
        {streak >= 2 && (
          <motion.div
            className="flex items-center gap-1 text-amber text-sm font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            key={streak}
          >
            <Zap size={14} /> {streak} streak!
          </motion.div>
        )}
        <span className="text-xs text-slate-light/60">
          {currentIdx + 1}/{data.questions.length}
        </span>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: timeLeft > 15 ? subjectColour : '#EF4444' }}
          animate={{ width: `${(timeLeft / (data.time_limit || 90)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-lg font-bold text-white mb-6">{question.question}</p>

          <div className="grid grid-cols-2 gap-3">
            {question.options.map((option, i) => {
              const isSelected = feedback && answers[answers.length - 1]?.child_answer === option;
              const isCorrectOption = feedback && option === question.correct;
              const isWrong = isSelected && !feedback?.correct;

              return (
                <motion.button
                  key={`${currentIdx}-${i}`}
                  className={`p-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                    isCorrectOption
                      ? 'border-emerald bg-emerald/20 text-emerald'
                      : isWrong
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : 'border-white/10 bg-white/5 text-white hover:border-white/30'
                  }`}
                  onClick={() => handleAnswer(option)}
                  whileHover={!feedback ? { scale: 1.03 } : {}}
                  whileTap={!feedback ? { scale: 0.97 } : {}}
                  animate={isWrong ? { x: [0, -6, 6, -3, 3, 0] } : {}}
                  disabled={!!feedback}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>

          {feedback && !feedback.correct && (
            <motion.p
              className="text-xs text-slate-light/60 mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {feedback.explanation}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </GameWrapper>
  );
}
