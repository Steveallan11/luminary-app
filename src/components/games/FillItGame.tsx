'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { GameProps, FillItData, GameAnswer } from '@/types';
import GameWrapper from './GameWrapper';
import GameResults from './GameResults';

export default function FillItGame({ asset, childAge, subjectColour, onComplete }: GameProps) {
  const data = asset.content_json as unknown as FillItData;
  const [currentQ, setCurrentQ] = useState(0);
  const [blankValues, setBlankValues] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [blankResults, setBlankResults] = useState<Record<number, boolean>>({});
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [finalTimeTaken, setFinalTimeTaken] = useState<number | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();
  }, [data.questions]);

  const question = data.questions[currentQ];

  const handleSubmit = () => {
    if (submitted) return;
    const results: Record<number, boolean> = {};
    let allCorrect = true;

    question.blanks.forEach((blank) => {
      const userAnswer = (blankValues[blank.position] || '').trim().toLowerCase();
      const correct = blank.answer.toLowerCase();
      const isCorrect = userAnswer === correct;
      results[blank.position] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });

    setBlankResults(results);
    setSubmitted(true);

    const elapsed = Math.round((Date.now() - startTime.current) / 1000);
    setAnswers(prev => [...prev, {
      question_id: question.id,
      child_answer: JSON.stringify(blankValues),
      correct_answer: JSON.stringify(question.blanks.map(b => b.answer)),
      is_correct: allCorrect,
      time_taken: elapsed,
    }]);

    setTimeout(() => {
      if (currentQ + 1 >= data.questions.length) {
        setFinalTimeTaken(elapsed);
        setFinished(true);
      } else {
        setCurrentQ(prev => prev + 1);
        setBlankValues({});
        setSubmitted(false);
        setBlankResults({});
        setShowHint(null);
      }
    }, 2000);
  };

  if (finished) {
    const correct = answers.filter(a => a.is_correct).length;
    const score = Math.round((correct / data.questions.length) * 100);
    const timeTaken = finalTimeTaken ?? 0;
    const xpEarned = Math.max(5, Math.round(score / 10) + 5 - hintsUsed * 3);
    const wrongOnes = data.questions
      .filter((_, i) => answers[i] && !answers[i].is_correct)
      .map(q => ({
        question: q.template,
        correctAnswer: q.blanks.map(b => b.answer).join(', '),
        explanation: '',
      }));

    return (
      <GameWrapper title={asset.title} gameType="fill_it" subjectColour={subjectColour}>
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

  // Render template with blanks
  const renderTemplate = () => {
    const parts = question.template.split('___');
    const elements: React.ReactNode[] = [];

    parts.forEach((part, i) => {
      elements.push(<span key={`t-${i}`}>{part}</span>);
      if (i < question.blanks.length) {
        const blank = question.blanks[i];
        const result = blankResults[blank.position];
        elements.push(
          <input
            key={`b-${blank.position}`}
            type="text"
            className={`inline-block w-28 mx-1 px-2 py-1 rounded-lg border-2 text-sm font-bold text-center bg-transparent outline-none transition-all ${
              submitted
                ? result
                  ? 'border-emerald text-emerald'
                  : 'border-red-500 text-red-500'
                : 'border-white/20 text-white focus:border-amber'
            }`}
            value={blankValues[blank.position] || ''}
            onChange={(e) => setBlankValues(prev => ({ ...prev, [blank.position]: e.target.value }))}
            disabled={submitted}
            placeholder="..."
          />
        );
        if (submitted && !result) {
          elements.push(
            <span key={`correct-${blank.position}`} className="text-xs text-emerald ml-1">({blank.answer})</span>
          );
        }
      }
    });

    return elements;
  };

  return (
    <GameWrapper title={asset.title} gameType="fill_it" subjectColour={subjectColour}>
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {data.questions.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < currentQ ? 'bg-emerald' : i === currentQ ? 'scale-125' : 'bg-white/20'
            }`}
            style={i === currentQ ? { backgroundColor: subjectColour } : {}}
          />
        ))}
      </div>

      {/* Question */}
      <motion.div
        key={currentQ}
        className="text-lg text-white leading-relaxed mb-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {question.context && (
          <p className="text-sm text-slate-light/60 mb-2 italic">{question.context}</p>
        )}
        <div className="flex flex-wrap items-center gap-1">
          {renderTemplate()}
        </div>
      </motion.div>

      {/* Hint buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {question.blanks.map((blank, i) => (
          <button
            key={i}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-light/60 hover:text-amber hover:border-amber/30 transition-all"
            onClick={() => { setShowHint(blank.position); setHintsUsed(prev => prev + 1); }}
          >
            <Lightbulb size={12} /> Hint {i + 1}
          </button>
        ))}
      </div>

      {showHint !== null && (
        <motion.p
          className="text-sm text-amber/80 mb-4 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Hint: {question.blanks.find(b => b.position === showHint)?.hint}
        </motion.p>
      )}

      {/* Submit */}
      {!submitted && (
        <motion.button
          className="w-full py-3 rounded-xl font-bold text-white text-sm"
          style={{ backgroundColor: subjectColour }}
          onClick={handleSubmit}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Check Answer
        </motion.button>
      )}
    </GameWrapper>
  );
}
