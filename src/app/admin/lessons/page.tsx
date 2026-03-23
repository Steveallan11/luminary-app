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
  Image as ImageIcon,
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
  Plus,
  Save,
  RefreshCw,
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

interface LessonBrief {
  keyConcepts: string[];
  misconceptions: string[];
  realWorldExamples: string[];
  curriculumObjectives: string[];
}

export default function AdminLessonsPage() {
  const [activeView, setActiveView] = useState<'generate' | 'queue' | 'review'>('generate');

  // Generation form state
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [ageGroup, setAgeGroup] = useState('8-11');
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Brief editing state
  const [briefData, setBriefData] = useState<LessonBrief>({
    keyConcepts: [],
    misconceptions: [],
    realWorldExamples: [],
    curriculumObjectives: [],
  });
  const [briefEdited, setBriefEdited] = useState(false);

  // Queue state
  const [generatedLessons, setGeneratedLessons] = useState<GeneratedLesson[]>([]);
  const [reviewLesson, setReviewLesson] = useState<GeneratedLesson | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  // Image search state
  const [searchingImages, setSearchingImages] = useState(false);
  const [foundImages, setFoundImages] = useState<Array<{ url: string; source: string; title: string; score: number }>>([]);
  const [selectedImagePhase, setSelectedImagePhase] = useState<string | null>(null);

  const selectedTopic = useMemo(
    () => ALL_TOPICS.find((t) => t.id === selectedTopicId),
    [selectedTopicId]
  );

  const selectedSubject = useMemo(
    () => (selectedTopic ? MOCK_SUBJECTS.find((s) => s.id === selectedTopic.subject_id) : null),
    [selectedTopic]
  );

  // Auto-generate brief when topic is selected
  const handleTopicSelect = async (topicId: string) => {
    setSelectedTopicId(topicId);
    const topic = ALL_TOPICS.find((t) => t.id === topicId);
    if (!topic) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/admin/auto-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_title: topic.title,
          subject_name: selectedSubject?.name || 'Unknown',
          age_group: ageGroup,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBriefData(data.brief);
        setBriefEdited(false);
      }
    } catch (error) {
      console.error('Failed to auto-generate brief:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleBriefChange = (field: keyof LessonBrief, value: string) => {
    setBriefData((prev) => ({
      ...prev,
      [field]: field.includes('Concepts') || field.includes('misconceptions') || field.includes('Examples')
        ? value.split(',').map((s) => s.trim()).filter(Boolean)
        : value.split('\n').map((s) => s.trim()).filter(Boolean),
    }));
    setBriefEdited(true);
  };

  const handleGenerate = async () => {
    if (!selectedTopicId || !selectedTopic || !selectedSubject) return;
    setGenerating(true);
    setGenerationError(null);

    try {
      const keyStageMap: Record<string, string> = {
        '5-7': 'KS1',
        '8-11': 'KS2',
        '12-14': 'KS3',
        '15-16': 'KS4',
      };

      // Queue the generation job in the background
      const res = await fetch('/api/admin/queue-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lesson',
          topic_id: selectedTopicId,
          title: selectedTopic.title,
          subject_name: selectedSubject.name,
          key_stage: keyStageMap[ageGroup] || 'KS2',
          age_group: ageGroup,
          brief: {
            key_concepts: briefData.keyConcepts,
            common_misconceptions: briefData.misconceptions,
            real_world_examples: briefData.realWorldExamples,
            curriculum_objectives: briefData.curriculumObjectives,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.details || `Queuing failed: ${res.status}`);
      }

      const result = await res.json();
      setGenerationError(null);
      alert(`Lesson generation queued! Job ID: ${result.job_id}\n\nYou can now switch screens. Check the Library page to see when it's ready.`);
      setActiveView('queue');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      console.error('Generation error:', message);
      setGenerationError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (lesson: GeneratedLesson) => {
    try {
      const res = await fetch('/api/admin/approve-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lesson.id }),
      });

      if (res.ok) {
        setGeneratedLessons((prev) =>
          prev.map((l) => (l.id === lesson.id ? { ...l, status: 'live' } : l))
        );
        setReviewLesson((prev) => (prev?.id === lesson.id ? { ...prev, status: 'live' } : prev));
      }
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleReject = async (lesson: GeneratedLesson) => {
    try {
      const res = await fetch('/api/admin/reject-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lesson.id }),
      });

      if (res.ok) {
        setGeneratedLessons((prev) =>
          prev.map((l) => (l.id === lesson.id ? { ...l, status: 'rejected' } : l))
        );
        setReviewLesson(null);
      }
    } catch (error) {
      console.error('Rejection failed:', error);
    }
  };

  const togglePhase = (key: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSearchImages = async (phase: string) => {
    setSelectedImagePhase(phase);
    setSearchingImages(true);

    try {
      const res = await fetch('/api/lumi/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${selectedTopic?.title} ${phase}`,
          topic_id: selectedTopicId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFoundImages(data.images || []);
      }
    } catch (error) {
      console.error('Image search failed:', error);
    } finally {
      setSearchingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy/95 to-navy/90 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Lesson Generation</h1>
          <p className="text-slate-light/60">Create and manage AI-generated lessons</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-white/10">
          {(['generate', 'queue', 'review'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveView(tab)}
              className={`px-4 py-3 font-semibold text-sm transition-colors ${
                activeView === tab
                  ? 'text-white border-b-2 border-amber'
                  : 'text-slate-light/60 hover:text-slate-light/80'
              }`}
            >
              {tab === 'generate' && 'Generate'}
              {tab === 'queue' && `Queue (${generatedLessons.length})`}
              {tab === 'review' && 'Review'}
            </button>
          ))}
        </div>

        {/* Generate Tab */}
        {activeView === 'generate' && (
          <div className="space-y-6">
            {/* Step 1: Select Topic */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber/20 text-amber font-bold text-sm">1</span>
                Choose a Topic
              </h2>
              <select
                value={selectedTopicId}
                onChange={(e) => handleTopicSelect(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-navy/50 border border-white/10 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-amber"
              >
                <option value="">Select a topic...</option>
                {ALL_TOPICS.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title} ({MOCK_SUBJECTS.find((s) => s.id === topic.subject_id)?.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Age Group */}
            {selectedTopic && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky/20 text-sky font-bold text-sm">2</span>
                  Age Group
                </h2>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-navy/50 border border-white/10 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-sky"
                >
                  {AGE_GROUPS.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 3: Review & Edit Brief */}
            {selectedTopic && briefData.keyConcepts.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald/20 text-emerald font-bold text-sm">3</span>
                  Review & Edit Brief
                  {briefEdited && <span className="ml-auto text-xs bg-amber/20 text-amber px-2 py-1 rounded-full">Edited</span>}
                </h2>

                <div className="space-y-4">
                  {/* Key Concepts */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Key Concepts (comma-separated)</label>
                    <textarea
                      value={briefData.keyConcepts.join(', ')}
                      onChange={(e) => handleBriefChange('keyConcepts', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-navy/50 border border-white/10 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-emerald text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Misconceptions */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Common Misconceptions (comma-separated)</label>
                    <textarea
                      value={briefData.misconceptions.join(', ')}
                      onChange={(e) => handleBriefChange('misconceptions', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-navy/50 border border-white/10 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-emerald text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Real-World Examples */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Real-World Examples (comma-separated)</label>
                    <textarea
                      value={briefData.realWorldExamples.join(', ')}
                      onChange={(e) => handleBriefChange('realWorldExamples', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-navy/50 border border-white/10 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-emerald text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Curriculum Objectives */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Curriculum Objectives (one per line)</label>
                    <textarea
                      value={briefData.curriculumObjectives.join('\n')}
                      onChange={(e) => handleBriefChange('curriculumObjectives', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-navy/50 border border-white/10 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-emerald text-sm"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            {selectedTopic && briefData.keyConcepts.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-amber to-amber/80 text-white font-bold hover:from-amber/90 hover:to-amber/70 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} /> Generate Lesson
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleTopicSelect(selectedTopicId)}
                  disabled={generating}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} /> Regenerate Brief
                </button>
              </div>
            )}

            {generationError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-300">Generation Error</p>
                  <p className="text-red-200 text-sm">{generationError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Queue Tab */}
        {activeView === 'queue' && (
          <div className="space-y-4">
            {generatedLessons.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <Sparkles size={32} className="text-slate-light/30 mx-auto mb-3" />
                <p className="text-white font-semibold mb-2">No lessons generated yet</p>
                <p className="text-slate-light/50 text-sm">Generate your first lesson to see it here</p>
              </div>
            ) : (
              generatedLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => {
                    setReviewLesson(lesson);
                    setActiveView('review');
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">{lesson.topic_title}</h3>
                      <p className="text-slate-light/60 text-sm">{lesson.subject_name} • {lesson.age_group}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        lesson.status === 'live'
                          ? 'bg-emerald/20 text-emerald'
                          : lesson.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber/20 text-amber'
                      }`}
                    >
                      {lesson.status === 'pending_review' ? 'Pending' : lesson.status === 'live' ? 'Live' : 'Rejected'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-light/50">
                    <span>Quality: {lesson.quality_score}%</span>
                    <span>{new Date(lesson.generated_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Review Tab */}
        {activeView === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setReviewLesson(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white text-sm font-bold hover:bg-white/10"
              >
                <ArrowLeft size={16} /> Back to Queue
              </button>
            </div>

            {!reviewLesson ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <Eye size={32} className="text-slate-light/30 mx-auto mb-3" />
                <p className="text-white font-semibold mb-2">No lesson selected</p>
                <p className="text-slate-light/50 text-sm">Select a lesson from the queue to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status & Actions */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{reviewLesson.topic_title}</h2>
                      <p className="text-slate-light/60">{reviewLesson.subject_name} • {reviewLesson.age_group}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        reviewLesson.status === 'live'
                          ? 'bg-emerald/20 text-emerald'
                          : reviewLesson.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber/20 text-amber'
                      }`}
                    >
                      {reviewLesson.status === 'pending_review' ? 'Pending Review' : reviewLesson.status === 'live' ? 'Live' : 'Rejected'}
                    </span>
                  </div>

                  {reviewLesson.status === 'pending_review' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(reviewLesson)}
                        className="flex-1 px-4 py-2 rounded-lg bg-emerald/20 text-emerald text-sm font-bold hover:bg-emerald/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check size={16} /> Approve & Go Live
                      </button>
                      <button
                        onClick={() => handleReject(reviewLesson)}
                        className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Phase Breakdown */}
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

                            {/* Image Search for this Phase */}
                            <div>
                              <button
                                onClick={() => handleSearchImages(key)}
                                disabled={searchingImages}
                                className="text-xs font-semibold text-sky hover:text-sky/80 flex items-center gap-1 mt-2"
                              >
                                {searchingImages ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" /> Searching...
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon size={12} /> Search Images for this phase
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Found Images */}
                {foundImages.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h3 className="font-bold text-white mb-3">Found Images</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {foundImages.map((img, i) => (
                        <div key={i} className="rounded-lg overflow-hidden border border-white/10 hover:border-white/30 cursor-pointer transition-colors">
                          <img src={img.url} alt={img.title} className="w-full h-32 object-cover" />
                          <div className="p-2 bg-navy/50">
                            <p className="text-xs font-semibold text-white truncate">{img.title}</p>
                            <p className="text-xs text-slate-light/60">{img.source}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
