'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Image, Lightbulb, Globe, FileText, Video, ChevronRight, Sparkles } from 'lucide-react';
import GameRenderer from '@/components/games/GameRenderer';
import DiagramRenderer from '@/components/diagrams/DiagramRenderer';
import ConceptCard from '@/components/content/ConceptCard';
import RealWorldCard from '@/components/content/RealWorldCard';
import {
  MOCK_TOPIC_ASSETS,
  MOCK_FRACTION_BAR,
  MOCK_NUMBER_LINE,
  MOCK_MATCH_GAME_ASSET,
  MOCK_TRUE_FALSE_ASSET,
  MOCK_SORT_GAME_ASSET,
  MOCK_FILL_GAME_ASSET,
  MOCK_WORKSHEET,
} from '@/lib/mock-content';
import { GameResult } from '@/types';

const DEMO_SECTIONS = [
  { id: 'games', label: 'Mini-Games', icon: <Gamepad2 size={18} />, colour: '#EF4444' },
  { id: 'diagrams', label: 'Diagrams', icon: <Image size={18} />, colour: '#8B5CF6' },
  { id: 'cards', label: 'Content Cards', icon: <Lightbulb size={18} />, colour: '#F59E0B' },
  { id: 'worksheet', label: 'Worksheet', icon: <FileText size={18} />, colour: '#6366F1' },
] as const;

export default function DemoPage() {
  const [activeSection, setActiveSection] = useState<string>('games');
  const [activeGame, setActiveGame] = useState<string>('match');
  const [activeDiagram, setActiveDiagram] = useState<string>('fraction');
  const [gameResults, setGameResults] = useState<GameResult[]>([]);

  const subjectColour = '#3B82F6';

  const handleGameComplete = (result: GameResult) => {
    setGameResults((prev) => [...prev, result]);
  };

  const conceptAsset = MOCK_TOPIC_ASSETS.find(a => a.asset_type === 'concept_card');
  const realworldAsset = MOCK_TOPIC_ASSETS.find(a => a.asset_type === 'realworld_card');

  return (
    <div className="min-h-screen bg-navy">
      {/* Header */}
      <div className="border-b border-white/10 bg-navy-dark/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles size={24} className="text-amber" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Content Demo — Fractions Walkthrough
            </h1>
          </div>
          <p className="text-sm text-slate-light/60">
            Explore all the interactive content types built in Session 4. This demo uses Maths &gt; Fractions as the example topic.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Section tabs */}
        <div className="flex gap-2 mb-8">
          {DEMO_SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeSection === section.id ? 'text-white' : 'text-slate-light/60 hover:text-white bg-white/5'
              }`}
              style={activeSection === section.id ? { backgroundColor: `${section.colour}20`, color: section.colour } : {}}
              onClick={() => setActiveSection(section.id)}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>

        {/* Games Section */}
        {activeSection === 'games' && (
          <div>
            <div className="flex gap-2 mb-6">
              {[
                { id: 'match', label: 'Match It' },
                { id: 'truefalse', label: 'True / False' },
                { id: 'sort', label: 'Sort It' },
                { id: 'fill', label: 'Fill It' },
              ].map((g) => (
                <button
                  key={g.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeGame === g.id ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-light/60 hover:text-white'
                  }`}
                  onClick={() => setActiveGame(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeGame} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {activeGame === 'match' && (
                  <GameRenderer asset={MOCK_MATCH_GAME_ASSET} childAge={8} subjectColour={subjectColour} onComplete={handleGameComplete} />
                )}
                {activeGame === 'truefalse' && (
                  <GameRenderer asset={MOCK_TRUE_FALSE_ASSET} childAge={8} subjectColour={subjectColour} onComplete={handleGameComplete} />
                )}
                {activeGame === 'sort' && (
                  <GameRenderer asset={MOCK_SORT_GAME_ASSET} childAge={8} subjectColour={subjectColour} onComplete={handleGameComplete} />
                )}
                {activeGame === 'fill' && (
                  <GameRenderer asset={MOCK_FILL_GAME_ASSET} childAge={8} subjectColour={subjectColour} onComplete={handleGameComplete} />
                )}
              </motion.div>
            </AnimatePresence>

            {gameResults.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-2">Game Results This Session</h3>
                {gameResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-light/70 py-1">
                    <span className="text-amber font-bold">{r.score}/{r.maxScore}</span>
                    <span>{Math.round((r.score / r.maxScore) * 100)}%</span>
                    <span className="text-slate-light/40">({r.timeTaken}s)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Diagrams Section */}
        {activeSection === 'diagrams' && (
          <div>
            <div className="flex gap-2 mb-6">
              {[
                { id: 'fraction', label: 'Fraction Bar' },
                { id: 'numberline', label: 'Number Line' },
              ].map((d) => (
                <button
                  key={d.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeDiagram === d.id ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-slate-light/60 hover:text-white'
                  }`}
                  onClick={() => setActiveDiagram(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeDiagram} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {activeDiagram === 'fraction' && (
                  <DiagramRenderer diagram={MOCK_FRACTION_BAR} subjectColour={subjectColour} />
                )}
                {activeDiagram === 'numberline' && (
                  <DiagramRenderer diagram={MOCK_NUMBER_LINE} subjectColour={subjectColour} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Cards Section */}
        {activeSection === 'cards' && (
          <div className="grid grid-cols-2 gap-6">
            {conceptAsset && <ConceptCard asset={conceptAsset} subjectColour={subjectColour} />}
            {realworldAsset && <RealWorldCard asset={realworldAsset} subjectColour={subjectColour} />}
          </div>
        )}

        {/* Worksheet Section */}
        {activeSection === 'worksheet' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
            <FileText size={48} className="text-indigo-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Fractions Worksheet</h3>
            <p className="text-sm text-slate-light/60 mb-6">
              A printable worksheet with recall, apply, create, and reflect sections — age-adapted for the child.
            </p>
            <a
              href={`/api/content/generate-worksheet?asset_id=${MOCK_WORKSHEET.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-colors"
            >
              <FileText size={16} /> Open Worksheet <ChevronRight size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
