'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Clock,
  AlertCircle,
} from 'lucide-react';
import { MOCK_SUBJECTS, MOCK_TOPICS } from '@/lib/mock-data';
import { Topic, Subject } from '@/types';

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
  const [customTopicName, setCustomTopicName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [ageGroup, setAgeGroup] = useState('8-11');
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Review state
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  // Job tracking state
  const [latestJob, setLatestJob] = useState<any | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Brief editing state
  const [briefData, setBriefData] = useState<LessonBrief>({
    keyConcepts: [],
    misconceptions: [],
    realWorldExamples: [],
    curriculumObjectives: [],
  });
  const [briefEdited, setBriefEdited] = useState(false);

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('name');
      if (!error && data && data.length > 0) {
        setSubjects(data);
      } else {
        // Fallback to mock subjects if DB is empty
        setSubjects(MOCK_SUBJECTS as any);
      }
    };
    fetchSubjects();
  }, []);

  // Poll for latest job status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling && latestJob?.id) {
      interval = setInterval(async () => {
        const { data, error } = await supabase
          .from('generation_jobs')
          .select('*')
          .eq('id', latestJob.id)
          .single();
        
        if (!error && data) {
          setLatestJob(data);
          if (data.status === 'completed' || data.status === 'failed') {
            setIsPolling(false);
            if (data.status === 'completed') {
              fetchLessons();
            }
          }
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPolling, latestJob?.id]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId),
    [selectedSubjectId, subjects]
  );

  // Auto-generate brief when topic and subject are ready
  const handleAutoBrief = async () => {
    if (!customTopicName || !selectedSubjectId) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/admin/auto-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_title: customTopicName,
          subject_name: selectedSubject?.name || 'General',
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
      const res = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: lesson.topic_id,
          title: lesson.topics?.title,
          subject_name: lesson.topics?.subjects?.name,
          key_stage: lesson.key_stage,
          age_group: lesson.age_group,
          asset_types: ['concept_card', 'game_questions', 'realworld_card', 'worksheet'],
          linked_lesson_id: lesson.id,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Content generated successfully! ${data.assets?.length || 0} assets saved to the Library.`);
      } else {
        alert(`Content generation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to generate content. Please try again.');
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleGenerate = async () => {
    if (!customTopicName) {
      setGenerationError('Please enter a topic name');
      return;
    }
    if (!selectedSubjectId) {
      setGenerationError('Please select a subject');
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

      const estimatedMinutesMap: Record<string, number> = {
        'KS1': 20,
        'KS2': 30,
        'KS3': 45,
        'KS4': 60,
      };

      const keyStage = keyStageMap[ageGroup] || 'KS2';
      const estimatedMinutes = estimatedMinutesMap[keyStage] || 30;

      // Create or find the topic
      let topicId = '';
      const slug = customTopicName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      try {
        // Try to create the topic
        const { data: newTopic, error: topicError } = await supabase
          .from('topics')
          .insert({
            title: customTopicName,
            subject_id: selectedSubjectId,
            slug: slug || `custom-${Date.now()}`,
          })
          .select()
          .single();

        if (topicError || !newTopic) {
          console.warn('Topic creation failed, using fallback logic:', topicError);
          // Fallback: try to find an existing topic with this title and subject
          const { data: existingTopic } = await supabase
            .from('topics')
            .select('id')
            .eq('title', customTopicName)
            .eq('subject_id', selectedSubjectId)
            .single();
          
          if (existingTopic) {
            topicId = existingTopic.id;
          } else {
            // If it still fails, we'll use a placeholder UUID and let the API handle it
            // This ensures the user is NEVER blocked by a database error during generation
            topicId = '00000000-0000-0000-0000-000000000000';
          }
        } else {
          topicId = newTopic.id;
        }
      } catch (e) {
        console.error('Exception during topic handling:', e);
        topicId = '00000000-0000-0000-0000-000000000000';
      }

      // Queue the generation job
      const res = await fetch('/api/admin/queue-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lesson',
          topic_id: topicId,
          title: customTopicName,
          subject_name: selectedSubject?.name || 'General',
          key_stage: keyStage,
          age_group: ageGroup,
          estimated_minutes: estimatedMinutes,
          brief: briefData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // The API now runs synchronously — status is already final when we get the response
        setLatestJob({
          id: data.job_id,
          status: data.status || 'completed',
          progress: data.status === 'completed' ? 100 : data.status === 'failed' ? 0 : 50,
          topic_title: customTopicName,
          error_message: data.error_message || null,
        });
        // Only poll if somehow still processing (shouldn't happen with sync API)
        if (data.status === 'processing') {
          setIsPolling(true);
        }
        setActiveView('review');
        fetchLessons();
      } else {
        const err = await res.json();
        setGenerationError(err.error || 'Failed to generate lesson');
      }
    } catch (err: any) {
      setGenerationError(err.message || 'An unexpected error occurred');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Lesson Generation</h1>
            <p className="text-slate-light/60">Create and review high-quality, curriculum-aligned lessons.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveView('generate')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeView === 'generate' ? 'bg-amber text-navy' : 'text-white hover:bg-white/5'
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => {
                setActiveView('review');
                fetchLessons();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeView === 'review' ? 'bg-amber text-navy' : 'text-white hover:bg-white/5'
              }`}
            >
              Review & Approve
            </button>
          </div>
        </div>

        {activeView === 'generate' ? (
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column: Form */}
            <div className="col-span-5 space-y-6">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-amber" />
                  Topic Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-light/40 uppercase mb-2">Topic Name</label>
                    <input
                      type="text"
                      value={customTopicName}
                      onChange={(e) => setCustomTopicName(e.target.value)}
                      placeholder="e.g. Photosynthesis, Roman Empire..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/10 focus:outline-none focus:border-amber/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-light/40 uppercase mb-2">Subject</label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber/50 transition-all appearance-none"
                    >
                      <option value="">Select a subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-light/40 uppercase mb-2">Age Group</label>
                    <div className="grid grid-cols-2 gap-2">
                      {AGE_GROUPS.map((group) => (
                        <button
                          key={group.value}
                          onClick={() => setAgeGroup(group.value)}
                          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                            ageGroup === group.value
                              ? 'bg-amber/20 border-amber text-amber'
                              : 'bg-white/5 border-white/10 text-slate-light/60 hover:border-white/20'
                          }`}
                        >
                          {group.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleAutoBrief}
                    disabled={generating || !customTopicName || !selectedSubjectId}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all disabled:opacity-50"
                  >
                    {generating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                    Auto-Generate Brief
                  </button>
                </div>
              </div>

              {generationError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-500">{generationError}</p>
                </div>
              )}
            </div>

            {/* Right Column: Brief Preview & Final Action */}
            <div className="col-span-7">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Target size={20} className="text-amber" />
                    Lesson Brief
                  </h3>
                  {briefEdited && (
                    <span className="text-[10px] font-bold text-amber uppercase tracking-widest">Edited</span>
                  )}
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-light/40 uppercase mb-2">Key Concepts (comma separated)</label>
                    <textarea
                      value={briefData.keyConcepts.join(', ')}
                      onChange={(e) => handleBriefChange('keyConcepts', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber/50 transition-all h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-light/40 uppercase mb-2">Common Misconceptions</label>
                    <textarea
                      value={briefData.misconceptions.join(', ')}
                      onChange={(e) => handleBriefChange('misconceptions', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber/50 transition-all h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-light/40 uppercase mb-2">Real-World Examples</label>
                    <textarea
                      value={briefData.realWorldExamples.join(', ')}
                      onChange={(e) => handleBriefChange('realWorldExamples', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber/50 transition-all h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-light/40 uppercase mb-2">Curriculum Objectives (one per line)</label>
                    <textarea
                      value={briefData.curriculumObjectives.join('\n')}
                      onChange={(e) => handleBriefChange('curriculumObjectives', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber/50 transition-all h-32 resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !customTopicName || briefData.keyConcepts.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-amber text-navy font-bold text-lg hover:bg-amber/90 transition-all disabled:opacity-50 shadow-lg shadow-amber/20"
                  >
                    {generating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                    Generate Full Lesson Structure
                  </button>
                  <p className="text-center text-[10px] text-slate-light/30 mt-3 uppercase tracking-widest">
                    Powered by Claude Opus 4.6 • ~30-60s generation time
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8">
            {/* Lesson List */}
            <div className="col-span-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-light/40 uppercase tracking-widest mb-2">Recent Lessons</h3>
              
              {/* Latest Job Status Card */}
              {latestJob && (
                <div className={`p-4 rounded-xl border transition-all mb-4 ${
                  latestJob.status === 'failed' ? 'border-red-500/50 bg-red-500/10' : 'border-amber/50 bg-amber/10'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {latestJob.status === 'completed' ? (
                        <Check size={16} className="text-emerald" />
                      ) : latestJob.status === 'failed' ? (
                        <AlertCircle size={16} className="text-red-500" />
                      ) : (
                        <Loader2 size={16} className="text-amber animate-spin" />
                      )}
                      <span className="text-[10px] font-bold text-white uppercase">
                        {latestJob.status === 'completed' ? 'Generation Complete' : 
                         latestJob.status === 'failed' ? 'Generation Failed' : 'Generating Lesson...'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-light/40">
                      {latestJob.progress}%
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{latestJob.topic_title || 'New Lesson'}</h4>
                  {latestJob.status === 'failed' && (
                    <p className="text-[10px] text-red-400 mt-1">{latestJob.error_message}</p>
                  )}
                  {latestJob.status !== 'completed' && latestJob.status !== 'failed' && (
                    <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-amber h-full transition-all duration-500" 
                        style={{ width: `${latestJob.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

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

                    {/* Full Phase Content Preview */}
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      {['spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate'].map((phase) => {
                        const phaseData = selectedLesson[`${phase}_json`];
                        if (!phaseData) return (
                          <div key={phase} className="p-4 rounded-xl bg-white/5 border border-white/10 opacity-40">
                            <h5 className="text-xs font-bold text-amber uppercase tracking-widest">{phase}</h5>
                            <p className="text-xs text-slate-light/40 mt-1">No data</p>
                          </div>
                        );
                        return (
                          <div key={phase} className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <h5 className="text-xs font-bold text-amber uppercase tracking-widest mb-2">{phase}</h5>
                            {phaseData.phase_goal && (
                              <p className="text-sm font-semibold text-white mb-3">{phaseData.phase_goal}</p>
                            )}
                            {phaseData.opening_question && (
                              <div className="mb-3">
                                <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-1">Opening Question</p>
                                <p className="text-sm text-sky-300 italic">&ldquo;{phaseData.opening_question}&rdquo;</p>
                              </div>
                            )}
                            {phaseData.teaching_points && phaseData.teaching_points.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-1">Teaching Points</p>
                                <ul className="space-y-1">
                                  {phaseData.teaching_points.map((tp: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-light/80 flex gap-2">
                                      <span className="text-amber shrink-0">&#8226;</span>
                                      <span>{tp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {phaseData.questions && phaseData.questions.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-1">Questions ({phaseData.questions.length})</p>
                                <div className="space-y-2">
                                  {phaseData.questions.map((q: any, i: number) => (
                                    <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/5">
                                      <p className="text-sm text-white">{q.question || q.text}</p>
                                      {q.expected_answer && (
                                        <p className="text-xs text-emerald-400 mt-1">&#10003; {q.expected_answer}</p>
                                      )}
                                      {q.hints && q.hints.length > 0 && (
                                        <p className="text-xs text-slate-light/40 mt-1">Hint: {q.hints[0]}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {phaseData.activities && phaseData.activities.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-1">Activities</p>
                                <ul className="space-y-1">
                                  {phaseData.activities.map((act: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-light/80 flex gap-2">
                                      <span className="text-sky shrink-0">{i + 1}.</span>
                                      <span>{act}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {phaseData.transition_to_next && (
                              <p className="text-xs text-slate-light/40 italic mt-2">&#8594; {phaseData.transition_to_next}</p>
                            )}
                          </div>
                        );
                      })}
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
