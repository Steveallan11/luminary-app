'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BookOpen, Search, Filter, FlaskConical, Check, Loader2,
  ChevronRight, Sparkles, Eye, Edit3, Trash2, AlertCircle,
  Clock, Users, Layers, ArrowLeft, X, Save, Zap, Target,
  Lightbulb, Trophy, PartyPopper, PenTool, Gamepad2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const PHASE_ICONS: Record<string, string> = {
  spark: '⚡', explore: '🔭', anchor: '⚓', practise: '🎯',
  create: '🎨', check: '✅', celebrate: '🎉',
};

const PHASE_COLOURS: Record<string, string> = {
  spark: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  explore: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  anchor: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  practise: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  create: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  check: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  celebrate: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
};

export default function LessonLibraryPage() {
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterKS, setFilterKS] = useState<string>('all');
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [activePhase, setActivePhase] = useState<string>('spark');
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedPhaseData, setEditedPhaseData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('topic_lesson_structures')
      .select('*, topics(title, description, subjects(name, colour_hex, color))')
      .order('created_at', { ascending: false });
    if (!error && data) setLessons(data);
    setLoading(false);
  };

  const filtered = lessons.filter(l => {
    const title = l.topics?.title?.toLowerCase() || '';
    const subject = l.topics?.subjects?.name?.toLowerCase() || '';
    const matchSearch = !search || title.includes(search.toLowerCase()) || subject.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchKS = filterKS === 'all' || l.key_stage === filterKS;
    return matchSearch && matchStatus && matchKS;
  });

  const handleApprove = async (lessonId: string) => {
    setIsApproving(true);
    const res = await fetch('/api/admin/approve-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structure_id: lessonId }),
    });
    if (res.ok) {
      await fetchLessons();
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson((prev: any) => ({ ...prev, status: 'live' }));
      }
    }
    setIsApproving(false);
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Delete this lesson? This cannot be undone.')) return;
    setIsDeleting(true);
    await supabase.from('topic_lesson_structures').delete().eq('id', lessonId);
    setSelectedLesson(null);
    await fetchLessons();
    setIsDeleting(false);
  };

  const handleSavePhaseEdit = async () => {
    if (!selectedLesson || !editedPhaseData) return;
    setIsSaving(true);
    const update: any = {};
    update[`${activePhase}_json`] = editedPhaseData;
    const { error } = await supabase
      .from('topic_lesson_structures')
      .update(update)
      .eq('id', selectedLesson.id);
    if (!error) {
      setSelectedLesson((prev: any) => ({ ...prev, [`${activePhase}_json`]: editedPhaseData }));
      setEditMode(false);
    }
    setIsSaving(false);
  };

  const statusBadge = (status: string) => {
    if (status === 'live') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    if (status === 'generating') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
  };

  return (
    <div className="min-h-screen bg-navy text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push('/admin/library')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-white">Lesson Library</h1>
          <p className="text-slate-light/60 text-sm mt-1">{lessons.length} lessons • Click any lesson to view, edit, or test</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Lesson List */}
        <div className="col-span-4 space-y-4">
          {/* Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search lessons..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-light/40 focus:outline-none focus:border-amber/50"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="live">Live</option>
                <option value="generating">Pending</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={filterKS}
                onChange={e => setFilterKS(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="all">All Key Stages</option>
                <option value="KS1">KS1 (5-7)</option>
                <option value="KS2">KS2 (8-11)</option>
                <option value="KS3">KS3 (12-14)</option>
                <option value="KS4">KS4 (15-16)</option>
              </select>
            </div>
          </div>

          {/* Lesson Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-amber" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-white/10 bg-white/5">
              <BookOpen size={32} className="text-slate-light/20 mx-auto mb-3" />
              <p className="text-sm text-slate-light/40">No lessons found</p>
            </div>
          ) : (
            filtered.map(lesson => (
              <button
                key={lesson.id}
                onClick={() => { setSelectedLesson(lesson); setActivePhase('spark'); setEditMode(false); }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedLesson?.id === lesson.id
                    ? 'border-amber bg-amber/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusBadge(lesson.status)}`}>
                    {lesson.status}
                  </span>
                  <span className="text-[10px] text-slate-light/40">{new Date(lesson.created_at).toLocaleDateString()}</span>
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{lesson.topics?.title || 'Untitled'}</h4>
                <p className="text-xs text-slate-light/60">
                  {lesson.topics?.subjects?.name || 'Unknown'} • {lesson.key_stage} • Age {lesson.age_group}
                </p>
                <div className="flex gap-1 mt-2">
                  {['spark','explore','anchor','practise','create','check','celebrate'].map(p => (
                    <span key={p} className={`text-[8px] px-1.5 py-0.5 rounded ${lesson[`${p}_json`] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-light/20'}`}>
                      {PHASE_ICONS[p]}
                    </span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right: Lesson Detail */}
        <div className="col-span-8">
          {selectedLesson ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-white mb-1">{selectedLesson.topics?.title}</h2>
                    <p className="text-slate-light/60 text-sm">
                      {selectedLesson.topics?.subjects?.name} • {selectedLesson.key_stage} • Age {selectedLesson.age_group}
                    </p>
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusBadge(selectedLesson.status)}`}>
                      {selectedLesson.status}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      onClick={() => window.open(`/admin/test-lesson/${selectedLesson.id}`, '_blank')}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold text-xs hover:bg-purple-500/30"
                    >
                      <FlaskConical size={14} /> Test with Lumi
                    </button>
                    {selectedLesson.status !== 'live' && (
                      <button
                        onClick={() => handleApprove(selectedLesson.id)}
                        disabled={isApproving}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        {isApproving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedLesson.id)}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Delete
                    </button>
                  </div>
                </div>

                {/* Phase Navigation */}
                <div className="flex gap-2 flex-wrap">
                  {['spark','explore','anchor','practise','create','check','celebrate'].map(phase => (
                    <button
                      key={phase}
                      onClick={() => { setActivePhase(phase); setEditMode(false); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        activePhase === phase
                          ? PHASE_COLOURS[phase]
                          : 'border-white/10 bg-white/5 text-slate-light/60 hover:border-white/20'
                      }`}
                    >
                      {PHASE_ICONS[phase]} {phase.charAt(0).toUpperCase() + phase.slice(1)}
                      {!selectedLesson[`${phase}_json`] && <AlertCircle size={10} className="text-red-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase Content */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                {(() => {
                  const phaseData = selectedLesson[`${activePhase}_json`];
                  if (!phaseData) return (
                    <div className="text-center py-8">
                      <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
                      <p className="text-slate-light/60">No data for {activePhase} phase</p>
                    </div>
                  );

                  if (editMode) {
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-sm font-bold text-amber uppercase tracking-widest">
                            Editing {activePhase.toUpperCase()} Phase
                          </h3>
                          <div className="flex gap-2">
                            <button onClick={() => setEditMode(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20">
                              <X size={12} /> Cancel
                            </button>
                            <button onClick={handleSavePhaseEdit} disabled={isSaving} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50">
                              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={JSON.stringify(editedPhaseData, null, 2)}
                          onChange={e => {
                            try { setEditedPhaseData(JSON.parse(e.target.value)); } catch {}
                          }}
                          className="w-full h-96 bg-black/20 border border-white/10 rounded-xl p-4 text-xs text-white font-mono focus:outline-none focus:border-amber/50 resize-none"
                        />
                      </div>
                    );
                  }

                  return (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-sm font-bold uppercase tracking-widest ${PHASE_COLOURS[activePhase].split(' ')[0]}`}>
                          {PHASE_ICONS[activePhase]} {activePhase.toUpperCase()} Phase
                        </h3>
                        <button
                          onClick={() => { setEditMode(true); setEditedPhaseData(phaseData); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20"
                        >
                          <Edit3 size={12} /> Edit Phase
                        </button>
                      </div>
                      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                        {phaseData.phase_goal && (
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-1">Phase Goal</p>
                            <p className="text-sm font-semibold text-white">{phaseData.phase_goal}</p>
                          </div>
                        )}
                        {phaseData.opening_question && (
                          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                            <p className="text-[10px] font-bold text-sky-400 uppercase mb-1">Opening Question</p>
                            <p className="text-sm text-sky-300 italic">&ldquo;{phaseData.opening_question}&rdquo;</p>
                          </div>
                        )}
                        {phaseData.teaching_points?.length > 0 && (
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-2">Teaching Points ({phaseData.teaching_points.length})</p>
                            <ul className="space-y-1.5">
                              {phaseData.teaching_points.map((tp: string, i: number) => (
                                <li key={i} className="flex gap-2 text-sm text-slate-light/80">
                                  <span className="text-amber shrink-0">•</span><span>{tp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {phaseData.questions?.length > 0 && (
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-2">Questions ({phaseData.questions.length})</p>
                            <div className="space-y-2">
                              {phaseData.questions.map((q: any, i: number) => (
                                <div key={i} className="p-2 rounded-lg bg-black/20 border border-white/5">
                                  <p className="text-sm text-white">{q.question || q.text}</p>
                                  {q.expected_answer && <p className="text-xs text-emerald-400 mt-1">✓ {q.expected_answer}</p>}
                                  {q.hints?.[0] && <p className="text-xs text-slate-light/40 mt-1">Hint: {q.hints[0]}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {phaseData.activities?.length > 0 && (
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-2">Activities</p>
                            <ul className="space-y-1.5">
                              {phaseData.activities.map((act: string, i: number) => (
                                <li key={i} className="flex gap-2 text-sm text-slate-light/80">
                                  <span className="text-sky shrink-0">{i + 1}.</span><span>{act}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {phaseData.closing_message && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Closing Message</p>
                            <p className="text-sm text-emerald-300 italic">&ldquo;{phaseData.closing_message}&rdquo;</p>
                          </div>
                        )}
                        {phaseData.transition_to_next && (
                          <p className="text-xs text-slate-light/40 italic">→ {phaseData.transition_to_next}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
              <BookOpen size={56} className="text-slate-light/20 mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">Select a lesson</h3>
              <p className="text-sm text-slate-light/40 max-w-xs">
                Click any lesson from the list to view all 7 phases, edit content, test with Lumi, or approve for delivery.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
