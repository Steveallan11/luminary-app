'use client';

import { useState, useMemo } from 'react';
import {
  Wand2,
  Check,
  X,
  Loader2,
  Eye,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Image,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Gamepad2,
  Lightbulb,
  PenTool,
  Trophy,
  PartyPopper,
  Search,
} from 'lucide-react';
import { MOCK_SUBJECTS, MOCK_TOPICS } from '@/lib/mock-data';
import { Topic } from '@/types';

const ALL_TOPICS: Topic[] = Object.values(MOCK_TOPICS).flat();

const PHASE_LABELS: Record<string, { label: string; icon: JSX.Element; colour: string }> = {
  spark_json: { label: 'Spark', icon: <Zap size={14} />, colour: '#F59E0B' },
  explore_json: { label: 'Explore', icon: <Search size={14} />, colour: '#3B82F6' },
  anchor_json: { label: 'Anchor', icon: <Target size={14} />, colour: '#8B5CF6' },
  practise_json: { label: 'Practise', icon: <PenTool size={14} />, colour: '#10B981' },
  create_json: { label: 'Create', icon: <Lightbulb size={14} />, colour: '#EC4899' },
  check_json: { label: 'Check', icon: <Check size={14} />, colour: '#14B8A6' },
  celebrate_json: { label: 'Celebrate', icon: <PartyPopper size={14} />, colour: '#EAB308' },
};

const AGE_GROUPS = [
  { value: '5-7', label: 'Ages 5-7 (KS1)' },
  { value: '8-11', label: 'Ages 8-11 (KS2)' },
  { value: '12-14', label: 'Ages 12-14 (KS3)' },
  { value: '15-16', label: 'Ages 15-16 (KS4)' },
];

interface GeneratedLesson {
  id: string;
  topic_title: string;
  subject_name: string;
  age_group: string;
  quality_score: number;
  status: 'pending_review' | 'live' | 'rejected';
  generated_at: string;
  structure: Record<string, unknown>;
  brief: Record<string, unknown>;
}

export default function AdminLessonsPage() {
  const [activeView, setActiveView] = useState<'generate' | 'queue' | 'review'>('generate');

  // Generation form state
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [ageGroup, setAgeGroup] = useState('8-11');
  const [keyConcepts, setKeyConcepts] = useState('');
  const [misconceptions, setMisconceptions] = useState('');
  const [realWorldExamples, setRealWorldExamples] = useState('');
  const [curriculumObjectives, setCurriculumObjectives] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Queue state
  const [generatedLessons, setGeneratedLessons] = useState<GeneratedLesson[]>([]);
  const [reviewLesson, setReviewLesson] = useState<GeneratedLesson | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  // Visual Lumi state
  const [searchingImages, setSearchingImages] = useState(false);
  const [foundImages, setFoundImages] = useState<Array<{ url: string; source: string; title: string; score: number }>>([]);

  const selectedTopic = useMemo(
    () => ALL_TOPICS.find((t) => t.id === selectedTopicId),
    [selectedTopicId]
  );

  const selectedSubject = useMemo(
    () => (selectedTopic ? MOCK_SUBJECTS.find((s) => s.id === selectedTopic.subject_id) : null),
    [selectedTopic]
  );

  const handleGenerate = async () => {
    if (!selectedTopicId || !selectedTopic || !selectedSubject) return;
    setGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/admin/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: selectedTopicId,
          title: selectedTopic.title,
          subject_name: selectedSubject.name,
          key_stage: selectedTopic.key_stage ?? 'KS2',
          age_group: ageGroup,
          key_concepts: keyConcepts.split(',').map((s) => s.trim()).filter(Boolean),
          common_misconceptions: misconceptions.split(',').map((s) => s.trim()).filter(Boolean),
          real_world_examples: realWorldExamples.split(',').map((s) => s.trim()).filter(Boolean),
          curriculum_objectives: curriculumObjectives.split('\n').map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Generation failed');
      }

      const data = await res.json();

      const lesson: GeneratedLesson = {
        id: `gen-${Date.now()}`,
        topic_title: selectedTopic.title,
        subject_name: selectedSubject.name,
        age_group: ageGroup,
        quality_score: data.quality_score,
        status: 'pending_review',
        generated_at: data.generated_at,
        structure: data.structure,
        brief: data.brief,
      };

      setGeneratedLessons((prev) => [lesson, ...prev]);
      setReviewLesson(lesson);
      setActiveView('review');
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (lesson: GeneratedLesson) => {
    try {
      await fetch('/api/admin/approve-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structure_id: lesson.id }),
      });

      setGeneratedLessons((prev) =>
        prev.map((l) => (l.id === lesson.id ? { ...l, status: 'live' } : l))
      );
      if (reviewLesson?.id === lesson.id) {
        setReviewLesson({ ...lesson, status: 'live' });
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleReject = (lesson: GeneratedLesson) => {
    setGeneratedLessons((prev) =>
      prev.map((l) => (l.id === lesson.id ? { ...l, status: 'rejected' } : l))
    );
    if (reviewLesson?.id === lesson.id) {
      setReviewLesson({ ...lesson, status: 'rejected' });
    }
  };

  const handleSearchImages = async () => {
    if (!selectedTopic || !selectedSubject) return;
    setSearchingImages(true);
    setFoundImages([]);

    try {
      const res = await fetch(
        `/api/lumi/visual-search?topic=${encodeURIComponent(selectedTopic.title)}&subject=${encodeURIComponent(selectedSubject.name)}&age_group=${ageGroup}`
      );
      const data = await res.json();

      if (data.found && data.image) {
        setFoundImages([
          {
            url: data.image.url,
            source: data.source_used,
            title: data.image.title,
            score: data.verification?.score ?? 0,
          },
        ]);
      }
    } catch (err) {
      console.error('Image search failed:', err);
    } finally {
      setSearchingImages(false);
    }
  };

  const togglePhase = (phase: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
        {[
          { id: 'generate' as const, label: 'Generate Lesson', icon: <Wand2 size={16} /> },
          { id: 'queue' as const, label: 'Generation Queue', icon: <BookOpen size={16} /> },
          { id: 'review' as const, label: 'Review Lesson', icon: <Eye size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === tab.id ? 'bg-white/10 text-white' : 'text-slate-light/60 hover:text-white'
            }`}
            onClick={() => setActiveView(tab.id)}
          >
            {tab.icon} {tab.label}
            {tab.id === 'queue' && generatedLessons.length > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber/20 text-amber">
                {generatedLessons.filter((l) => l.status === 'pending_review').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── GENERATE TAB ─── */}
      {activeView === 'generate' && (
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Generate a Full Lesson Structure
          </h2>
          <p className="text-sm text-slate-light/60 mb-6">
            Provide a topic brief and Claude will generate a complete 7-phase lesson with questions, games, concept cards, and real-world examples.
          </p>

          <div className="space-y-5">
            {/* Topic selector */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">Topic</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
              >
                <option value="">Select a topic...</option>
                {MOCK_SUBJECTS.map((subject) => (
                  <optgroup key={subject.id} label={`${subject.icon_emoji} ${subject.name}`}>
                    {ALL_TOPICS.filter((t) => t.subject_id === subject.id).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Age group */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">Age Group</label>
              <div className="flex gap-2">
                {AGE_GROUPS.map((ag) => (
                  <button
                    key={ag.value}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      ageGroup === ag.value
                        ? 'bg-amber/20 text-amber border border-amber/40'
                        : 'bg-white/5 text-slate-light/60 border border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setAgeGroup(ag.value)}
                  >
                    {ag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Key concepts */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Key Concepts <span className="text-slate-light/40 font-normal">(comma-separated)</span>
              </label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-light/30"
                placeholder="e.g. numerator, denominator, equivalent fractions, simplifying"
                value={keyConcepts}
                onChange={(e) => setKeyConcepts(e.target.value)}
              />
            </div>

            {/* Common misconceptions */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Common Misconceptions <span className="text-slate-light/40 font-normal">(comma-separated)</span>
              </label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-light/30"
                placeholder="e.g. bigger denominator means bigger fraction, adding fractions by adding tops and bottoms"
                value={misconceptions}
                onChange={(e) => setMisconceptions(e.target.value)}
              />
            </div>

            {/* Real-world examples */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Real-World Examples <span className="text-slate-light/40 font-normal">(comma-separated)</span>
              </label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-light/30"
                placeholder="e.g. pizza slices, recipe measurements, telling time"
                value={realWorldExamples}
                onChange={(e) => setRealWorldExamples(e.target.value)}
              />
            </div>

            {/* Curriculum objectives */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Curriculum Objectives <span className="text-slate-light/40 font-normal">(one per line)</span>
              </label>
              <textarea
                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-light/30 resize-none"
                placeholder={`e.g.\nRecognise and show fractions of a set of objects\nAdd and subtract fractions with the same denominator\nRecognise equivalent fractions`}
                value={curriculumObjectives}
                onChange={(e) => setCurriculumObjectives(e.target.value)}
              />
            </div>

            {/* Visual Lumi image search */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Image size={16} className="text-sky" />
                  <p className="text-sm font-bold text-white">Visual Lumi — Find Teaching Images</p>
                </div>
                <button
                  className="px-3 py-1.5 rounded-lg bg-sky/20 text-sky text-xs font-bold hover:bg-sky/30 disabled:opacity-50"
                  onClick={handleSearchImages}
                  disabled={!selectedTopicId || searchingImages}
                >
                  {searchingImages ? (
                    <><Loader2 size={12} className="inline animate-spin mr-1" /> Searching...</>
                  ) : (
                    <><Search size={12} className="inline mr-1" /> Search Images</>
                  )}
                </button>
              </div>
              {foundImages.length > 0 && (
                <div className="space-y-2">
                  {foundImages.map((img, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-navy/50 p-3">
                      <img src={img.url} alt={img.title} className="w-20 h-20 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate">{img.title}</p>
                        <p className="text-xs text-slate-light/50">Source: {img.source}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-xs font-bold ${img.score >= 8 ? 'text-emerald' : 'text-amber'}`}>
                            Accuracy: {img.score}/10
                          </span>
                          {img.score >= 8 && <Check size={12} className="text-emerald" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!searchingImages && foundImages.length === 0 && selectedTopicId && (
                <p className="text-xs text-slate-light/40">Click "Search Images" to find teaching visuals for this topic.</p>
              )}
            </div>

            {/* Generate button */}
            <div className="flex gap-3 pt-2">
              <button
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber to-amber/80 text-navy font-bold text-sm disabled:opacity-50"
                onClick={handleGenerate}
                disabled={!selectedTopicId || generating}
              >
                {generating ? (
                  <><Loader2 size={16} className="animate-spin" /> Generating Full Lesson...</>
                ) : (
                  <><Wand2 size={16} /> Generate 7-Phase Lesson</>
                )}
              </button>
            </div>

            {generationError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400" />
                  <p className="text-sm text-red-300">{generationError}</p>
                </div>
              </div>
            )}

            {generating && (
              <div className="p-4 rounded-xl bg-amber/10 border border-amber/20">
                <div className="flex items-center gap-3">
                  <Loader2 size={20} className="text-amber animate-spin" />
                  <div>
                    <p className="text-sm text-white font-bold">Generating complete lesson structure...</p>
                    <p className="text-xs text-slate-light/60">
                      Claude is building all 7 phases, game content, concept cards, and real-world examples. This may take 30-60 seconds.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── QUEUE TAB ─── */}
      {activeView === 'queue' && (
        <div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Generation Queue
          </h2>
          <p className="text-sm text-slate-light/60 mb-6">
            All generated lessons awaiting review. Approve to make them live, or reject to regenerate.
          </p>

          {generatedLessons.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <BookOpen size={32} className="text-slate-light/30 mx-auto mb-3" />
              <p className="text-white font-semibold mb-2">No lessons generated yet</p>
              <p className="text-slate-light/50 text-sm mb-4">
                Go to the Generate tab to create your first lesson structure.
              </p>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber/20 text-amber text-sm font-bold hover:bg-amber/30"
                onClick={() => setActiveView('generate')}
              >
                <Wand2 size={16} /> Generate a Lesson
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {generatedLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-white">{lesson.topic_title}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          lesson.status === 'live'
                            ? 'bg-emerald/20 text-emerald'
                            : lesson.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber/20 text-amber'
                        }`}
                      >
                        {lesson.status === 'pending_review' ? 'Pending Review' : lesson.status === 'live' ? 'Live' : 'Rejected'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-light/50">
                      {lesson.subject_name} &middot; {lesson.age_group} &middot; Quality: {lesson.quality_score}/100
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-white text-xs font-bold hover:bg-white/10"
                      onClick={() => {
                        setReviewLesson(lesson);
                        setActiveView('review');
                      }}
                    >
                      <Eye size={12} className="inline mr-1" /> Review
                    </button>
                    {lesson.status === 'pending_review' && (
                      <>
                        <button
                          className="px-3 py-1.5 rounded-lg bg-emerald/20 text-emerald text-xs font-bold hover:bg-emerald/30"
                          onClick={() => handleApprove(lesson)}
                        >
                          <Check size={12} className="inline mr-1" /> Approve
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30"
                          onClick={() => handleReject(lesson)}
                        >
                          <X size={12} className="inline mr-1" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── REVIEW TAB ─── */}
      {activeView === 'review' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                {reviewLesson ? `Review: ${reviewLesson.topic_title}` : 'Review Lesson'}
              </h2>
              {reviewLesson && (
                <p className="text-sm text-slate-light/60">
                  {reviewLesson.subject_name} &middot; {reviewLesson.age_group} &middot; Quality Score: {reviewLesson.quality_score}/100
                </p>
              )}
            </div>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white text-sm font-bold hover:bg-white/10"
              onClick={() => setActiveView('queue')}
            >
              <ArrowLeft size={16} /> Back to Queue
            </button>
          </div>

          {!reviewLesson ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <Eye size={32} className="text-slate-light/30 mx-auto mb-3" />
              <p className="text-white font-semibold mb-2">No lesson selected for review</p>
              <p className="text-slate-light/50 text-sm">
                Generate a lesson or select one from the queue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status bar */}
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-bold ${
                        reviewLesson.status === 'live'
                          ? 'bg-emerald/20 text-emerald'
                          : reviewLesson.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber/20 text-amber'
                      }`}
                    >
                      {reviewLesson.status === 'pending_review' ? 'Pending Review' : reviewLesson.status === 'live' ? 'Live' : 'Rejected'}
                    </span>
                    <span className="text-xs text-slate-light/40">
                      Generated {new Date(reviewLesson.generated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                {reviewLesson.status === 'pending_review' && (
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 rounded-lg bg-emerald/20 text-emerald text-sm font-bold hover:bg-emerald/30"
                      onClick={() => handleApprove(reviewLesson)}
                    >
                      <Check size={14} className="inline mr-1" /> Approve &amp; Go Live
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/30"
                      onClick={() => handleReject(reviewLesson)}
                    >
                      <X size={14} className="inline mr-1" /> Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Phase-by-phase review */}
              <div className="space-y-2">
                {(Object.entries(PHASE_LABELS) as [string, { label: string; icon: JSX.Element; colour: string }][]).map(([key, meta]) => {
                  const phaseData = (reviewLesson.structure as Record<string, unknown>)[key] as Record<string, unknown> | undefined;
                  if (!phaseData) return null;
                  const isExpanded = expandedPhases.has(key);

                  return (
                    <div key={key} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                        onClick={() => togglePhase(key)}
                      >
                        <span style={{ color: meta.colour }}>{meta.icon}</span>
                        <span className="text-sm font-bold text-white">{meta.label}</span>
                        <span className="text-xs text-slate-light/40 ml-2">
                          {String((phaseData as { phase_goal?: string }).phase_goal ?? '').slice(0, 80)}...
                        </span>
                        <span className="ml-auto text-slate-light/40">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t border-white/5">
                          <div className="pt-3">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-light/40 mb-1">Phase Goal</p>
                            <p className="text-sm text-white">{(phaseData as { phase_goal?: string }).phase_goal}</p>
                          </div>

                          {(phaseData as { opening_question?: string }).opening_question && (
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-light/40 mb-1">Opening Question</p>
                              <p className="text-sm text-amber italic">&ldquo;{(phaseData as { opening_question?: string }).opening_question}&rdquo;</p>
                            </div>
                          )}

                          {((phaseData as { teaching_points?: string[] }).teaching_points ?? []).length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-light/40 mb-1">Teaching Points</p>
                              <ul className="space-y-1">
                                {((phaseData as { teaching_points?: string[] }).teaching_points ?? []).map((point: string, i: number) => (
                                  <li key={i} className="text-sm text-slate-light/80 flex items-start gap-2">
                                    <span className="text-emerald mt-0.5">&#8226;</span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {((phaseData as { questions?: Array<{ question: string; expected_answer: string; hints: string[] }> }).questions ?? []).length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-light/40 mb-1">Questions</p>
                              <div className="space-y-2">
                                {((phaseData as { questions?: Array<{ question: string; expected_answer: string; hints: string[] }> }).questions ?? []).map(
                                  (q: { question: string; expected_answer: string; hints: string[] }, i: number) => (
                                    <div key={i} className="rounded-lg bg-navy/50 p-3">
                                      <p className="text-sm text-white font-semibold mb-1">Q{i + 1}: {q.question}</p>
                                      <p className="text-xs text-emerald/80">Expected: {q.expected_answer}</p>
                                      {q.hints?.length > 0 && (
                                        <p className="text-xs text-amber/60 mt-1">
                                          Hints: {q.hints.join(' | ')}
                                        </p>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {(phaseData as { transition_to_next?: string }).transition_to_next && (
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-light/40 mb-1">Transition</p>
                              <p className="text-sm text-sky/80 italic">{(phaseData as { transition_to_next?: string }).transition_to_next}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Game content */}
              {Boolean((reviewLesson.structure as Record<string, unknown>).game_content) && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Gamepad2 size={16} className="text-red-400" />
                    <p className="text-sm font-bold text-white">Game Content</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                      {((reviewLesson.structure as Record<string, unknown>).game_content as Record<string, unknown>)?.game_type as string}
                    </span>
                  </div>
                  <pre className="text-xs text-slate-light/60 bg-navy/50 rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify((reviewLesson.structure as Record<string, unknown>).game_content, null, 2)}
                  </pre>
                </div>
              )}

              {/* Concept card */}
              {Boolean((reviewLesson.structure as Record<string, unknown>).concept_card_json) && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-amber" />
                    <p className="text-sm font-bold text-white">Concept Card Preview</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-amber/10 to-amber/5 border border-amber/20 p-4">
                    <p className="text-2xl mb-2">
                      {((reviewLesson.structure as Record<string, unknown>).concept_card_json as Record<string, unknown>)?.icon as string}
                    </p>
                    <p className="text-lg font-bold text-white">
                      {((reviewLesson.structure as Record<string, unknown>).concept_card_json as Record<string, unknown>)?.title as string}
                    </p>
                    <p className="text-sm text-amber/80 mb-2">
                      {((reviewLesson.structure as Record<string, unknown>).concept_card_json as Record<string, unknown>)?.subtitle as string}
                    </p>
                    <p className="text-sm text-slate-light/70">
                      {((reviewLesson.structure as Record<string, unknown>).concept_card_json as Record<string, unknown>)?.body as string}
                    </p>
                  </div>
                </div>
              )}

              {/* Real-world examples */}
              {Boolean((reviewLesson.structure as Record<string, unknown>).realworld_json) && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={16} className="text-emerald" />
                    <p className="text-sm font-bold text-white">Real-World Examples</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(['everyday', 'inspiring'] as const).map((key) => {
                      const rw = ((reviewLesson.structure as Record<string, unknown>).realworld_json as Record<string, Record<string, string>>)?.[key];
                      if (!rw) return null;
                      return (
                        <div key={key} className="rounded-lg bg-navy/50 p-3">
                          <p className="text-xs uppercase tracking-[0.15em] text-emerald/60 mb-1">{key}</p>
                          <p className="text-sm font-bold text-white mb-1">{rw.title}</p>
                          <p className="text-xs text-slate-light/60">{rw.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
