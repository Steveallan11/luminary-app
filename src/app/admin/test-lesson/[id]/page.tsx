'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Sparkles,
  Wand2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Eye,
  Edit3,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Zap,
  BookOpen,
  Clock,
  Users,
  Layers,
  MessageSquare,
  Settings,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type LessonPhase = 'spark' | 'explore' | 'anchor' | 'practise' | 'create' | 'check' | 'celebrate';
type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
type LessonLength = 'full' | 'standard' | 'bite_size';

const PHASE_ORDER: LessonPhase[] = ['spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate'];

const PHASE_ICONS: Record<LessonPhase, string> = {
  spark: '⚡',
  explore: '🔭',
  anchor: '⚓',
  practise: '🎯',
  create: '🎨',
  check: '✅',
  celebrate: '🎉',
};

const PHASE_COLOURS: Record<LessonPhase, string> = {
  spark: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  explore: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  anchor: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  practise: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  create: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  check: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  celebrate: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
};

const LEARNING_STYLES: { value: LearningStyle; label: string; icon: string; desc: string }[] = [
  { value: 'visual', label: 'Visual', icon: '👁️', desc: 'Diagrams, images, colour-coded notes' },
  { value: 'auditory', label: 'Auditory', icon: '🎧', desc: 'Verbal explanations, discussion, storytelling' },
  { value: 'kinesthetic', label: 'Kinesthetic', icon: '🤲', desc: 'Hands-on activities, movement, building' },
  { value: 'reading_writing', label: 'Reading/Writing', icon: '📝', desc: 'Written notes, lists, definitions' },
];

const LESSON_LENGTHS: { value: LessonLength; label: string; icon: string; desc: string; minutes: string }[] = [
  { value: 'full', label: 'Full Lesson', icon: '📚', desc: 'All 7 phases, deep learning', minutes: '45-60 min' },
  { value: 'standard', label: 'Standard', icon: '⏱️', desc: 'Core phases, balanced', minutes: '25-35 min' },
  { value: 'bite_size', label: 'Bite-Size', icon: '🍎', desc: 'On-the-go, key concepts only', minutes: '8-12 min' },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isAdmin?: boolean;
}

interface AdminNote {
  id: string;
  phase: LessonPhase;
  note: string;
  timestamp: Date;
  resolved: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminTestLessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Lesson data
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lesson player state
  const [currentPhase, setCurrentPhase] = useState<LessonPhase>('spark');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => `admin-test-${Date.now()}`);

  // Admin panel state
  const [adminPanelTab, setAdminPanelTab] = useState<'refine' | 'variants' | 'notes' | 'settings'>('refine');
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinementHistory, setRefinementHistory] = useState<{ instruction: string; timestamp: Date }[]>([]);

  // Variant state
  const [selectedLearningStyle, setSelectedLearningStyle] = useState<LearningStyle>('visual');
  const [selectedLength, setSelectedLength] = useState<LessonLength>('standard');
  const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
  const [variantSuccess, setVariantSuccess] = useState<string | null>(null);

  // Edit mode
  const [editingPhase, setEditingPhase] = useState<LessonPhase | null>(null);
  const [editedPhaseData, setEditedPhaseData] = useState<any>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Load lesson ────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchLesson = async () => {
      const { data, error } = await supabase
        .from('topic_lesson_structures')
        .select('*, topics(title, description, subjects(name, colour_hex, color))')
        .eq('id', lessonId)
        .single();

      if (error || !data) {
        setError('Lesson not found');
        setLoading(false);
        return;
      }
      setLesson(data);
      setLoading(false);

      // Send opening message from Lumi
      const topicTitle = data.topics?.title || 'this topic';
      const subjectName = data.topics?.subjects?.name || 'General';
      setMessages([{
        id: 'opening',
        role: 'assistant',
        content: `✨ Hey there! I'm Lumi, your learning guide. Today we're exploring **${topicTitle}** in **${subjectName}**! 🚀\n\nWe'll go through 7 exciting phases together. Ready to start with a **Spark**? ⚡\n\nType anything to begin, or ask me a question!`,
        timestamp: new Date(),
      }]);
    };

    fetchLesson();
  }, [lessonId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Lumi Chat ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isStreaming || !lesson) return;

    setInputValue('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }]);

    try {
      const phaseData = lesson[`${currentPhase}_json`];
      const topicTitle = lesson.topics?.title || 'this topic';
      const subjectName = lesson.topics?.subjects?.name || 'General';

      const systemPrompt = buildAdminTestSystemPrompt({
        topicTitle,
        subjectName,
        ageGroup: lesson.age_group,
        keyStage: lesson.key_stage,
        currentPhase,
        phaseData,
        lessonStructure: lesson,
        isAdminMode: true,
      });

      const response = await fetch('/api/lumi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: 'admin-test',
          topic_id: lesson.topic_id,
          subject_slug: 'admin-test',
          topic_slug: 'admin-test',
          session_id: sessionId,
          current_phase: currentPhase,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          admin_mode: true,
          admin_system_prompt: systemPrompt,
        }),
      });

      if (!response.ok || !response.body) throw new Error('Failed to get response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.delta?.text || parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullText += delta;
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId ? { ...m, content: fullText } : m
                ));
              }
            } catch {}
          }
        }
      }

      // Check for phase advancement signal
      if (fullText.includes('[PHASE:') || fullText.toLowerCase().includes('move to') || fullText.toLowerCase().includes('next phase')) {
        const phaseIdx = PHASE_ORDER.indexOf(currentPhase);
        if (phaseIdx < PHASE_ORDER.length - 1) {
          // Don't auto-advance — let admin decide
        }
      }

    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? { ...m, content: `Sorry, I had a hiccup! Error: ${err.message}` }
          : m
      ));
    } finally {
      setIsStreaming(false);
    }
  }, [inputValue, isStreaming, lesson, messages, currentPhase, sessionId]);

  // ─── Admin Refinement ───────────────────────────────────────────────────────

  const handleRefinement = async () => {
    if (!refinementInput.trim() || isRefining || !lesson) return;
    setIsRefining(true);

    try {
      const res = await fetch('/api/admin/refine-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          instruction: refinementInput,
          target_phase: currentPhase,
          current_lesson: lesson,
        }),
      });

      const data = await res.json();
      if (res.ok && data.updated_lesson) {
        setLesson(data.updated_lesson);
        setRefinementHistory(prev => [{
          instruction: refinementInput,
          timestamp: new Date(),
        }, ...prev]);
        setRefinementInput('');

        // Add a system note in chat
        setMessages(prev => [...prev, {
          id: `admin-note-${Date.now()}`,
          role: 'assistant',
          content: `🔧 **Admin Update Applied:** "${refinementInput}"\n\n${data.summary || 'The lesson has been updated based on your instruction.'}`,
          timestamp: new Date(),
          isAdmin: true,
        }]);
      } else {
        alert(data.error || 'Refinement failed');
      }
    } catch (err: any) {
      alert(`Refinement failed: ${err.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  // ─── Generate Variant ───────────────────────────────────────────────────────

  const handleGenerateVariant = async () => {
    if (!lesson || isGeneratingVariant) return;
    setIsGeneratingVariant(true);
    setVariantSuccess(null);

    try {
      const res = await fetch('/api/admin/generate-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          learning_style: selectedLearningStyle,
          lesson_length: selectedLength,
          topic_title: lesson.topics?.title,
          subject_name: lesson.topics?.subjects?.name,
          age_group: lesson.age_group,
          key_stage: lesson.key_stage,
          base_lesson: lesson,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setVariantSuccess(`✅ ${data.message || 'Variant generated and saved!'}`);
      } else {
        alert(data.error || 'Variant generation failed');
      }
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setIsGeneratingVariant(false);
    }
  };

  // ─── Save Phase Edit ────────────────────────────────────────────────────────

  const handleSavePhaseEdit = async () => {
    if (!editingPhase || !editedPhaseData || !lesson) return;
    setIsSavingEdit(true);

    try {
      const { error } = await supabase
        .from('topic_lesson_structures')
        .update({ [`${editingPhase}_json`]: editedPhaseData })
        .eq('id', lessonId);

      if (error) throw error;

      setLesson((prev: any) => ({ ...prev, [`${editingPhase}_json`]: editedPhaseData }));
      setEditingPhase(null);
      setEditedPhaseData(null);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ─── Add Note ───────────────────────────────────────────────────────────────

  const addNote = () => {
    if (!newNote.trim()) return;
    setAdminNotes(prev => [...prev, {
      id: `note-${Date.now()}`,
      phase: currentPhase,
      note: newNote,
      timestamp: new Date(),
      resolved: false,
    }]);
    setNewNote('');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="text-amber animate-spin" />
        <p className="text-slate-light/60">Loading lesson...</p>
      </div>
    </div>
  );

  if (error || !lesson) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <p className="text-white font-bold mb-2">Lesson not found</p>
        <button onClick={() => router.push('/admin/lessons')} className="text-amber hover:underline">
          ← Back to Lessons
        </button>
      </div>
    </div>
  );

  const topicTitle = lesson.topics?.title || 'Lesson';
  const subjectName = lesson.topics?.subjects?.name || 'General';
  const subjectColour = lesson.topics?.subjects?.colour_hex || lesson.topics?.subjects?.color || '#f59e0b';
  const currentPhaseData = lesson[`${currentPhase}_json`];
  const currentPhaseIdx = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-navy-dark/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/lessons')}
            className="flex items-center gap-2 text-slate-light/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div>
            <h1 className="text-white font-bold text-sm">{topicTitle}</h1>
            <p className="text-[10px] text-slate-light/40">{subjectName} • {lesson.key_stage} • Age {lesson.age_group}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber/20 text-amber uppercase tracking-widest">
            🧪 Admin Test Mode
          </span>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
            lesson.status === 'live' ? 'bg-emerald/20 text-emerald' : 'bg-slate/20 text-slate-light/60'
          }`}>
            {lesson.status}
          </span>
        </div>
      </div>

      {/* Phase Navigator */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-white/5 overflow-x-auto">
        {PHASE_ORDER.map((phase, idx) => {
          const isActive = phase === currentPhase;
          const isCompleted = idx < currentPhaseIdx;
          return (
            <button
              key={phase}
              onClick={() => setCurrentPhase(phase)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? `border ${PHASE_COLOURS[phase]}`
                  : isCompleted
                  ? 'text-slate-light/40 bg-white/5 border border-white/5'
                  : 'text-slate-light/30 bg-white/3 border border-transparent hover:border-white/10'
              }`}
            >
              <span>{PHASE_ICONS[phase]}</span>
              <span className="capitalize">{phase}</span>
              {isCompleted && <Check size={10} className="text-emerald" />}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button
            onClick={() => currentPhaseIdx > 0 && setCurrentPhase(PHASE_ORDER[currentPhaseIdx - 1])}
            disabled={currentPhaseIdx === 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-light/60 disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => currentPhaseIdx < PHASE_ORDER.length - 1 && setCurrentPhase(PHASE_ORDER[currentPhaseIdx + 1])}
            disabled={currentPhaseIdx === PHASE_ORDER.length - 1}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-light/60 disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Content: Split Screen */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Lumi Chat Player ── */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/10">
          {/* Phase Header */}
          <div className={`px-6 py-4 border-b border-white/5`} style={{ background: `${subjectColour}10` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PHASE_ICONS[currentPhase]}</span>
                <div>
                  <h2 className="text-white font-bold capitalize">{currentPhase} Phase</h2>
                  <p className="text-xs text-slate-light/50 line-clamp-1">
                    {currentPhaseData?.phase_goal || 'No goal defined'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingPhase(currentPhase);
                  setEditedPhaseData(currentPhaseData ? JSON.parse(JSON.stringify(currentPhaseData)) : {});
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-light/60 hover:text-white text-xs transition-colors"
              >
                <Edit3 size={12} />
                Edit Phase
              </button>
            </div>
            {/* Phase quick info */}
            {currentPhaseData && (
              <div className="mt-3 flex flex-wrap gap-2">
                {currentPhaseData.teaching_points?.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-light/40">
                    {currentPhaseData.teaching_points.length} teaching points
                  </span>
                )}
                {currentPhaseData.questions?.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-light/40">
                    {currentPhaseData.questions.length} questions
                  </span>
                )}
                {currentPhaseData.activities?.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-light/40">
                    {currentPhaseData.activities.length} activities
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-amber/20 flex items-center justify-center text-sm mr-3 shrink-0 mt-1">
                    {msg.isAdmin ? '🔧' : '✨'}
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-amber/20 text-white rounded-tr-sm'
                      : msg.isAdmin
                      ? 'bg-purple-500/10 border border-purple-500/20 text-slate-light/80 rounded-tl-sm'
                      : 'bg-white/5 border border-white/10 text-slate-light/90 rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content || (isStreaming ? (
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-amber/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-amber/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-amber/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    ) : '')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Phase Prompts */}
          {currentPhaseData && (
            <div className="px-6 py-2 flex gap-2 overflow-x-auto border-t border-white/5">
              {currentPhaseData.opening_question && (
                <button
                  onClick={() => sendMessage(currentPhaseData.opening_question)}
                  className="text-xs px-3 py-1.5 rounded-full bg-amber/10 text-amber border border-amber/20 hover:bg-amber/20 transition-colors whitespace-nowrap shrink-0"
                >
                  ⚡ {currentPhaseData.opening_question.substring(0, 40)}...
                </button>
              )}
              {currentPhaseData.questions?.slice(0, 2).map((q: any, i: number) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q.question || q.text || q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-slate-light/60 border border-white/10 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
                >
                  Q{i + 1}: {(q.question || q.text || q).substring(0, 35)}...
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={`Chat as a child in the ${currentPhase} phase...`}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-light/30 focus:outline-none focus:border-amber/50 transition-all"
                disabled={isStreaming}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isStreaming || !inputValue.trim()}
                className="px-4 py-3 rounded-xl bg-amber text-navy font-bold hover:bg-amber/90 disabled:opacity-50 transition-all"
              >
                {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-light/30 mt-2 text-center">
              Testing as a child in {lesson.key_stage} • Age {lesson.age_group} • Powered by Claude Opus 4.6
            </p>
          </div>
        </div>

        {/* ── RIGHT: Admin Refinement Panel ── */}
        <div className="w-96 flex flex-col bg-navy-dark/50">
          {/* Panel Tabs */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'refine', icon: Wand2, label: 'Refine' },
              { id: 'variants', icon: Layers, label: 'Variants' },
              { id: 'notes', icon: MessageSquare, label: `Notes${adminNotes.length > 0 ? ` (${adminNotes.length})` : ''}` },
              { id: 'settings', icon: Settings, label: 'Phase' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminPanelTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  adminPanelTab === tab.id
                    ? 'text-amber border-b-2 border-amber'
                    : 'text-slate-light/40 hover:text-white'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">

            {/* ── Refine Tab ── */}
            {adminPanelTab === 'refine' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-white mb-1">Refine with Lumi</h3>
                  <p className="text-[10px] text-slate-light/40 mb-3">
                    Tell Lumi what to change. It will update the lesson structure in real-time.
                  </p>
                  <textarea
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    placeholder={`e.g. "Make the ${currentPhase} phase more visual with diagrams"\n"Add a hands-on activity for kinesthetic learners"\n"Simplify the language for younger children"\n"Add more real-world examples"`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-light/20 focus:outline-none focus:border-amber/50 h-28 resize-none"
                  />
                  <button
                    onClick={handleRefinement}
                    disabled={isRefining || !refinementInput.trim()}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber text-navy font-bold text-sm hover:bg-amber/90 disabled:opacity-50 transition-all"
                  >
                    {isRefining ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    {isRefining ? 'Refining...' : 'Apply Refinement'}
                  </button>
                </div>

                {/* Quick refinement shortcuts */}
                <div>
                  <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-2">Quick Refinements</p>
                  <div className="space-y-1.5">
                    {[
                      { label: '🎨 More visual', prompt: `Make the ${currentPhase} phase more visual with diagrams and imagery` },
                      { label: '🤲 Add hands-on activity', prompt: `Add a kinesthetic hands-on activity to the ${currentPhase} phase` },
                      { label: '📖 Simpler language', prompt: `Simplify the language in the ${currentPhase} phase for younger learners` },
                      { label: '🌍 Real-world examples', prompt: `Add more real-world examples to the ${currentPhase} phase` },
                      { label: '❓ More questions', prompt: `Add 3 more engaging questions to the ${currentPhase} phase` },
                      { label: '⚡ Make it shorter', prompt: `Make the ${currentPhase} phase more concise and punchy` },
                      { label: '🔬 More depth', prompt: `Add more depth and detail to the ${currentPhase} phase for advanced learners` },
                    ].map((shortcut) => (
                      <button
                        key={shortcut.label}
                        onClick={() => setRefinementInput(shortcut.prompt)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-light/60 hover:text-white transition-colors"
                      >
                        {shortcut.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Refinement history */}
                {refinementHistory.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-2">History</p>
                    <div className="space-y-2">
                      {refinementHistory.map((h, i) => (
                        <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/5">
                          <p className="text-xs text-slate-light/60">{h.instruction}</p>
                          <p className="text-[10px] text-slate-light/30 mt-1">
                            {h.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Variants Tab ── */}
            {adminPanelTab === 'variants' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-white mb-1">Generate Lesson Variant</h3>
                  <p className="text-[10px] text-slate-light/40 mb-4">
                    Create adapted versions of this lesson for different learning styles and lengths. Each variant is saved separately and delivered to matching children.
                  </p>
                </div>

                {/* Learning Style */}
                <div>
                  <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-2">Learning Style</p>
                  <div className="space-y-2">
                    {LEARNING_STYLES.map(style => (
                      <button
                        key={style.value}
                        onClick={() => setSelectedLearningStyle(style.value)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          selectedLearningStyle === style.value
                            ? 'border-amber/50 bg-amber/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{style.icon}</span>
                          <span className="text-sm font-bold text-white">{style.label}</span>
                          {selectedLearningStyle === style.value && <Check size={12} className="text-amber ml-auto" />}
                        </div>
                        <p className="text-[10px] text-slate-light/40">{style.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lesson Length */}
                <div>
                  <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-2">Lesson Length</p>
                  <div className="space-y-2">
                    {LESSON_LENGTHS.map(length => (
                      <button
                        key={length.value}
                        onClick={() => setSelectedLength(length.value)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          selectedLength === length.value
                            ? 'border-amber/50 bg-amber/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{length.icon}</span>
                          <span className="text-sm font-bold text-white">{length.label}</span>
                          <span className="text-[10px] text-slate-light/40 ml-auto">{length.minutes}</span>
                          {selectedLength === length.value && <Check size={12} className="text-amber" />}
                        </div>
                        <p className="text-[10px] text-slate-light/40">{length.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {variantSuccess && (
                  <div className="p-3 rounded-xl bg-emerald/10 border border-emerald/20 text-sm text-emerald">
                    {variantSuccess}
                  </div>
                )}

                <button
                  onClick={handleGenerateVariant}
                  disabled={isGeneratingVariant}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber text-navy font-bold text-sm hover:bg-amber/90 disabled:opacity-50 transition-all"
                >
                  {isGeneratingVariant ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isGeneratingVariant ? 'Generating variant...' : `Generate ${selectedLearningStyle} / ${selectedLength} Variant`}
                </button>
                <p className="text-[10px] text-slate-light/30 text-center">
                  ~30-60s • Saved to Library automatically
                </p>
              </div>
            )}

            {/* ── Notes Tab ── */}
            {adminPanelTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-white mb-1">Admin Notes</h3>
                  <p className="text-[10px] text-slate-light/40 mb-3">
                    Add notes while testing. Notes are tagged to the current phase.
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addNote()}
                      placeholder={`Note for ${currentPhase} phase...`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-light/30 focus:outline-none focus:border-amber/50"
                    />
                    <button
                      onClick={addNote}
                      className="px-3 py-2 rounded-xl bg-amber/20 text-amber hover:bg-amber/30 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {adminNotes.length === 0 ? (
                  <div className="text-center py-8 text-slate-light/30 text-sm">
                    No notes yet. Add notes as you test the lesson.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {adminNotes.map(note => (
                      <div key={note.id} className={`p-3 rounded-xl border ${
                        note.resolved ? 'border-white/5 bg-white/3 opacity-50' : 'border-white/10 bg-white/5'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PHASE_COLOURS[note.phase]}`}>
                                {PHASE_ICONS[note.phase]} {note.phase}
                              </span>
                              <span className="text-[10px] text-slate-light/30">
                                {note.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-light/80">{note.note}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setAdminNotes(prev => prev.map(n => n.id === note.id ? { ...n, resolved: !n.resolved } : n))}
                              className="p-1 rounded text-slate-light/30 hover:text-emerald transition-colors"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setAdminNotes(prev => prev.filter(n => n.id !== note.id))}
                              className="p-1 rounded text-slate-light/30 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Phase Settings Tab ── */}
            {adminPanelTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-white mb-1">Phase Content</h3>
                  <p className="text-[10px] text-slate-light/40 mb-3">
                    View and edit the raw content for the <span className="text-amber capitalize">{currentPhase}</span> phase.
                  </p>
                </div>

                {currentPhaseData ? (
                  <div className="space-y-3">
                    {Object.entries(currentPhaseData).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-bold text-amber uppercase mb-1">{key.replace(/_/g, ' ')}</p>
                        {Array.isArray(value) ? (
                          <ul className="space-y-1">
                            {(value as string[]).map((item, i) => (
                              <li key={i} className="text-xs text-slate-light/70 flex gap-2">
                                <span className="text-amber/50 shrink-0">{i + 1}.</span>
                                <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-light/70">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-light/30 text-sm">
                    No data for this phase yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase Edit Modal */}
      {editingPhase && editedPhaseData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-navy-dark border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white capitalize">Edit {editingPhase} Phase</h3>
                <p className="text-sm text-slate-light/60">Changes are saved directly to the lesson in Supabase.</p>
              </div>
              <button onClick={() => { setEditingPhase(null); setEditedPhaseData(null); }} className="p-2 text-slate-light/40 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <textarea
                value={JSON.stringify(editedPhaseData, null, 2)}
                onChange={(e) => {
                  try { setEditedPhaseData(JSON.parse(e.target.value)); } catch {}
                }}
                className="w-full h-80 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-light/80 font-mono focus:outline-none focus:border-amber/50 resize-none"
              />
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
              <button onClick={() => { setEditingPhase(null); setEditedPhaseData(null); }} className="px-4 py-2 rounded-xl bg-white/5 text-slate-light/60 hover:bg-white/10 text-sm">
                Cancel
              </button>
              <button
                onClick={handleSavePhaseEdit}
                disabled={isSavingEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber text-navy font-bold text-sm hover:bg-amber/90 disabled:opacity-50"
              >
                {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper: Build Admin Test System Prompt ──────────────────────────────────

function buildAdminTestSystemPrompt({
  topicTitle,
  subjectName,
  ageGroup,
  keyStage,
  currentPhase,
  phaseData,
  lessonStructure,
  isAdminMode,
}: {
  topicTitle: string;
  subjectName: string;
  ageGroup: string;
  keyStage: string;
  currentPhase: string;
  phaseData: any;
  lessonStructure: any;
  isAdminMode: boolean;
}): string {
  const ageCalibration = getAgeCalibration(ageGroup);

  return `You are Lumi, an enthusiastic and warm AI tutor for Luminary, a UK homeschooling platform.

CURRENT CONTEXT:
- Subject: ${subjectName}
- Topic: ${topicTitle}
- Age Group: ${ageGroup} (${keyStage})
- Current Phase: ${currentPhase.toUpperCase()}
- Mode: ADMIN TEST MODE (you are being tested by an admin — respond as if talking to a real child)

PHASE GOAL: ${phaseData?.phase_goal || 'Engage the learner'}

PHASE CONTENT:
${phaseData ? JSON.stringify(phaseData, null, 2) : 'No phase data available'}

LANGUAGE CALIBRATION:
${ageCalibration}

INSTRUCTIONS:
1. Respond as Lumi would to a real child in the ${currentPhase} phase
2. Use the phase content above to guide your responses
3. Ask questions from the phase's question list when appropriate
4. Cover the teaching points naturally in conversation
5. Be warm, encouraging, and age-appropriate
6. Keep responses concise (2-4 sentences max unless explaining something complex)
7. Use the opening question if this is the start of the phase
8. Signal phase completion with [PHASE_COMPLETE] when all teaching points are covered

FULL LESSON STRUCTURE (for context):
${JSON.stringify({
  spark: lessonStructure.spark_json?.phase_goal,
  explore: lessonStructure.explore_json?.phase_goal,
  anchor: lessonStructure.anchor_json?.phase_goal,
  practise: lessonStructure.practise_json?.phase_goal,
  create: lessonStructure.create_json?.phase_goal,
  check: lessonStructure.check_json?.phase_goal,
  celebrate: lessonStructure.celebrate_json?.phase_goal,
}, null, 2)}`;
}

function getAgeCalibration(ageGroup: string): string {
  if (ageGroup === '5-7') return 'Use very simple words. Short sentences. Lots of emojis. Make it feel like a fun adventure.';
  if (ageGroup === '8-11') return 'Use friendly, enthusiastic language. Mix short and longer sentences. Occasional emojis. Creative analogies.';
  if (ageGroup === '12-14') return 'Use rich but clear vocabulary. Intellectual curiosity. Minimal emojis. Thought-provoking questions.';
  return 'Near-adult vocabulary. Rigorous but warm. No emojis. Genuine intellectual engagement.';
}
