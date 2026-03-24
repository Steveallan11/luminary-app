'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
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

const AGE_GROUPS = [
  { value: '5-7', label: 'Ages 5-7 (KS1)' },
  { value: '8-11', label: 'Ages 8-11 (KS2)' },
  { value: '12-14', label: 'Ages 12-14 (KS3)' },
  { value: '15-16', label: 'Ages 15-16 (KS4)' },
];

interface LessonBrief {
  keyConcepts: string[];
  misconceptions: string[];
  realWorldExamples: string[];
  curriculumObjectives: string[];
}

export default function AdminLessonsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [activeView, setActiveView] = useState<'generate' | 'queue' | 'review'>('generate');

  // Generation form state
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [customTopicName, setCustomTopicName] = useState('');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [useCustomTopic, setUseCustomTopic] = useState(false);
  const [ageGroup, setAgeGroup] = useState('8-11');
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Review state
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  // Brief editing state
  const [briefData, setBriefData] = useState<LessonBrief>({
    keyConcepts: [],
    misconceptions: [],
    realWorldExamples: [],
    curriculumObjectives: [],
  });
  const [briefEdited, setBriefEdited] = useState(false);

  const selectedTopic = useMemo(
    () => !useCustomTopic ? ALL_TOPICS.find((t) => t.id === selectedTopicId) : null,
    [selectedTopicId, useCustomTopic]
  );

  const selectedSubject = useMemo(
    () => (!useCustomTopic && selectedTopic ? MOCK_SUBJECTS.find((s) => s.id === selectedTopic.subject_id) : null),
    [selectedTopic, useCustomTopic]
  );

  // Auto-generate brief when topic is selected
  const handleTopicSelect = async (topicId: string) => {
    setSelectedTopicId(topicId);
    setUseCustomTopic(false);
    const topic = ALL_TOPICS.find((t) => t.id === topicId);
    if (!topic) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/admin/auto-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_title: topic.title,
          subject_name: MOCK_SUBJECTS.find((s) => s.id === topic.subject_id)?.name || 'Unknown',
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

  const handleCustomTopicSelect = async () => {
    if (!customTopicName || !customSubjectName) {
      alert('Please enter both topic and subject names');
      return;
    }

    setUseCustomTopic(true);
    setSelectedTopicId('');
    setGenerating(true);

    try {
      const res = await fetch('/api/admin/auto-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_title: customTopicName,
          subject_name: customSubjectName,
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

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from('topic_lesson_structures')
      .select('*, topics(title, subjects(name))')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setLessons(data);
    }
  };

  const handleApprove = async (lessonId: string) => {
    setIsApproving(true);
    try {
      const res = await fetch('/api/admin/approve-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structure_id: lessonId }),
      });
      
      if (res.ok) {
        alert('Lesson approved! You can now generate supporting content.');
        fetchLessons();
        if (selectedLesson?.id === lessonId) {
          setSelectedLesson({ ...selectedLesson, status: 'live' });
        }
      }
    } catch (err) {
      alert('Failed to approve lesson');
    } finally {
      setIsApproving(false);
    }
  };

  const handleGenerateContent = async (lesson: any) => {
    setGeneratingContent(true);
    try {
      const res = await fetch('/api/admin/queue-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'content',
          topic_id: lesson.topic_id,
          title: lesson.topics?.title,
          subject_name: lesson.topics?.subjects?.name,
          key_stage: lesson.key_stage,
          age_group: lesson.age_group,
          asset_types: ['concept_card', 'game_questions', 'realworld_card', 'worksheet'],
          linked_lesson_id: lesson.id
        }),
      });
      
      if (res.ok) {
        alert('Content generation queued! Check the Library for progress.');
      }
    } catch (err) {
      alert('Failed to queue content generation');
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleGenerate = async () => {
    if (useCustomTopic && !customTopicName) {
      setGenerationError('Please enter a custom topic name');
      return;
    }
    if (!useCustomTopic && !selectedTopicId) {
      setGenerationError('Please select a topic');
      return;
    }

    setGenerating(true);
    setGenerationError(null);

    try {
      const keyStageMap: Record<string, string> = {
        '5-7': 'KS1',
        '8-11': 'KS2',
        '12-14': 'KS3',
        '15-16': 'KS4',
      };

      // Estimated minutes based on Key Stage
      const estimatedMinutesMap: Record<string, number> = {
        'KS1': 20,
        'KS2': 30,
        'KS3': 45,
        'KS4': 60,
      };

      const topicTitle = useCustomTopic ? customTopicName : selectedTopic?.title;
      const subjectName = useCustomTopic ? customSubjectName : selectedSubject?.name;

      // For custom topics, we need to create a topic first
      let topicId = selectedTopicId;
      const keyStage = keyStageMap[ageGroup] || 'KS2';
      const estimatedMinutes = estimatedMinutesMap[keyStage] || 30;

      // FIX: If the topicId is a mock ID (like 't9'), we need to use a real UUID for the database
      // In a real app, we'd fetch the real ID or create it. For now, we'll use a placeholder UUID
      // if it's not a valid UUID format.
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(topicId);
      if (!isUuid && !useCustomTopic) {
        // This is a mock ID from mock-data.ts, we need a real UUID for the generation_jobs table
        // We'll use a consistent placeholder for mock topics to avoid UUID errors
        topicId = '00000000-0000-0000-0000-000000000000'; 
      }

      if (useCustomTopic) {
        // Create a temporary topic in Supabase
        const slug = customTopicName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const topicData: any = {
          title: customTopicName,
          subject_id: '00000000-0000-0000-0000-000000000000', // Placeholder
          slug: slug || `custom-${Date.now()}`,
        };

        try {
          const { data: newTopic, error: topicError } = await supabase
            .from('topics')
            .insert(topicData)
            .select()
            .single();

          if (topicError || !newTopic) {
            console.warn('Supabase topic creation failed, will proceed with null topic_id:', topicError);
            // We'll set topicId to a placeholder that the API will handle
            topicId = '00000000-0000-0000-0000-000000000000';
          } else {
            topicId = newTopic.id;
          }
        } catch (e) {
          console.error('Exception during topic creation:', e);
          topicId = '00000000-0000-0000-0000-000000000000';
        }
      }

      // Queue the generation job in the background
      const res = await fetch('/api/admin/queue-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lesson',
          topic_id: topicId,
          title: topicTitle,
          subject_name: subjectName,
          key_stage: keyStage,
          age_group: ageGroup,
          estimated_minutes: estimatedMinutes,
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
      setActiveView('review');
      fetchLessons();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      console.error('Generation error:', message);
      setGenerationError(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy/95 to-navy/90 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Generate Lessons</h1>
          <p className="text-slate-light/60">Create full 7-phase lessons with AI in just a few steps</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveView('generate')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeView === 'generate'
                ? 'text-amber border-b-2 border-amber'
                : 'text-slate-light/60 hover:text-white'
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => {
              setActiveView('review');
              fetchLessons();
            }}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeView === 'review'
                ? 'text-amber border-b-2 border-amber'
                : 'text-slate-light/60 hover:text-white'
            }`}
          >
            Review & Approve
          </button>
        </div>

        {/* Generate Tab */}
        {activeView === 'generate' && (
          <div className="space-y-8">
            {/* Step 1: Choose Topic */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center text-navy font-bold">1</div>
                <h2 className="text-xl font-bold text-white">Choose a Topic</h2>
              </div>

              <div className="space-y-4">
                {/* Existing Topics */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Select from Curriculum</label>
                  <select
                    value={useCustomTopic ? '' : selectedTopicId}
                    onChange={(e) => handleTopicSelect(e.target.value)}
                    disabled={useCustomTopic}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber disabled:opacity-50"
                  >
                    <option value="">Choose a topic...</option>
                    {ALL_TOPICS.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-xs text-slate-light/60 font-semibold">OR</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {/* Custom Topic */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-white">Create Custom Topic</label>
                  <input
                    type="text"
                    placeholder="Topic name (e.g., 'The Water Cycle')"
                    value={customTopicName}
                    onChange={(e) => setCustomTopicName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-amber"
                  />
                  <input
                    type="text"
                    placeholder="Subject (e.g., 'Science')"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-amber"
                  />
                  <button
                    onClick={handleCustomTopicSelect}
                    disabled={generating || !customTopicName || !customSubjectName}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {generating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    Use Custom Topic
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Age Group */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-sky flex items-center justify-center text-navy font-bold">2</div>
                <h2 className="text-xl font-bold text-white">Age Group</h2>
              </div>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber"
              >
                {AGE_GROUPS.map((ag) => (
                  <option key={ag.value} value={ag.value}>
                    {ag.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Review Brief */}
            {(selectedTopicId || useCustomTopic) && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald flex items-center justify-center text-navy font-bold">3</div>
                  <h2 className="text-xl font-bold text-white">Review & Edit Brief</h2>
                </div>

                <div className="space-y-4">
                  {/* Key Concepts */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Key Concepts (comma-separated)</label>
                    <textarea
                      value={briefData.keyConcepts.join(', ')}
                      onChange={(e) => handleBriefChange('keyConcepts', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-amber"
                      rows={2}
                    />
                  </div>

                  {/* Misconceptions */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Common Misconceptions (comma-separated)</label>
                    <textarea
                      value={briefData.misconceptions.join(', ')}
                      onChange={(e) => handleBriefChange('misconceptions', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-amber"
                      rows={2}
                    />
                  </div>

                  {/* Real-World Examples */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Real-World Examples (comma-separated)</label>
                    <textarea
                      value={briefData.realWorldExamples.join(', ')}
                      onChange={(e) => handleBriefChange('realWorldExamples', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-amber"
                      rows={2}
                    />
                  </div>

                  {/* Curriculum Objectives */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Curriculum Objectives (one per line)</label>
                    <textarea
                      value={briefData.curriculumObjectives.join('\n')}
                      onChange={(e) => handleBriefChange('curriculumObjectives', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-amber"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {generationError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex gap-3">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-400">Generation Error</h3>
                  <p className="text-sm text-red-300">{generationError}</p>
                </div>
              </div>
            )}

            {/* Generate Button */}
            {(selectedTopicId || useCustomTopic) && (
              <button
                onClick={handleGenerate}
                disabled={generating || !briefData.keyConcepts.length}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-amber hover:bg-amber/90 text-navy font-bold transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Lesson
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Review Tab */}
        {activeView === 'review' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Lesson List */}
            <div className="col-span-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-light/60 uppercase tracking-wider mb-4">Recent Lessons</h3>
              {lessons.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-white/10 bg-white/5">
                  <p className="text-sm text-slate-light/40">No lessons found</p>
                </div>
              ) : (
                lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedLesson?.id === lesson.id
                        ? 'border-amber bg-amber/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        lesson.status === 'live' ? 'bg-emerald/20 text-emerald' : 'bg-amber/20 text-amber'
                      }`}>
                        {lesson.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-light/40">
                        {new Date(lesson.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1">{lesson.topics?.title}</h4>
                    <p className="text-xs text-slate-light/60">{lesson.topics?.subjects?.name} • {lesson.key_stage}</p>
                  </button>
                ))
              )}
            </div>

            {/* Lesson Preview & Actions */}
            <div className="col-span-8">
              {selectedLesson ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{selectedLesson.topics?.title}</h2>
                        <p className="text-slate-light/60">
                          {selectedLesson.topics?.subjects?.name} • {selectedLesson.key_stage} • Age {selectedLesson.age_group}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        {selectedLesson.status !== 'live' && (
                          <button
                            onClick={() => handleApprove(selectedLesson.id)}
                            disabled={isApproving}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald text-navy font-bold text-sm hover:bg-emerald/90 disabled:opacity-50"
                          >
                            {isApproving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Approve Layout
                          </button>
                        )}
                        {selectedLesson.status === 'live' && (
                          <button
                            onClick={() => handleGenerateContent(selectedLesson)}
                            disabled={generatingContent}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber text-navy font-bold text-sm hover:bg-amber/90 disabled:opacity-50"
                          >
                            {generatingContent ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            Generate Supporting Content
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Preview of Phases */}
                    <div className="space-y-4">
                      {['spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate'].map((phase) => (
                        <div key={phase} className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <h5 className="text-xs font-bold text-amber uppercase tracking-widest mb-2">{phase}</h5>
                          <p className="text-sm text-white line-clamp-2">
                            {selectedLesson[`${phase}_json`]?.phase_goal || 'No goal defined'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
                  <BookOpen size={48} className="text-slate-light/20 mb-4" />
                  <h3 className="text-white font-bold mb-2">Select a lesson to review</h3>
                  <p className="text-sm text-slate-light/40 max-w-xs">
                    Choose a generated lesson from the list to review its layout and approve it for content generation.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
