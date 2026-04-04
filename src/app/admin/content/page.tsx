'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Wand2,
  Lightbulb,
  Video,
  Gamepad2,
  FileText,
  Image as ImageIcon,
  BookOpen,
  Loader2,
  Edit,
  Trash2,
  Sparkles,
  Globe,
  Rocket,
  Check,
  X,
  RefreshCw,
  Search,
  ChevronDown,
  ListChecks,
  Star,
  Zap,
  Download,
  Eye,
  Filter,
} from 'lucide-react';
import { MOCK_SUBJECTS, MOCK_TOPICS } from '@/lib/mock-data';
import { TopicAsset, AssetType, Topic } from '@/types';

const ALL_TOPICS: Topic[] = Object.values(MOCK_TOPICS).flat();

const ASSET_TYPES: { type: AssetType; label: string; icon: React.ReactNode; colour: string }[] = [
  { type: 'concept_card', label: 'Concept Card', icon: <Lightbulb size={14} />, colour: '#F59E0B' },
  { type: 'video', label: 'Video', icon: <Video size={14} />, colour: '#3B82F6' },
  { type: 'realworld_card', label: 'Real-World Card', icon: <Globe size={14} />, colour: '#10B981' },
  { type: 'diagram', label: 'Diagram', icon: <ImageIcon size={14} />, colour: '#8B5CF6' },
  { type: 'game_questions', label: 'Game', icon: <Gamepad2 size={14} />, colour: '#EC4899' },
  { type: 'worksheet', label: 'Worksheet', icon: <FileText size={14} />, colour: '#6366F1' },
];

// ─── Rich Content Renderers ───────────────────────────────────────────────────

function ConceptCardPreview({ asset, colour }: { asset: TopicAsset; colour: string }) {
  const c = (asset.content_json ?? {}) as Record<string, unknown>;
  // Handle both old schema (tagline/definition) and new schema (subtitle/body/key_facts)
  const tagline = (c.tagline || c.subtitle) as string | undefined;
  const hook = (c.hook_question) as string | undefined;
  const definition = (c.definition || c.body) as string | undefined;
  const keyFacts = (c.key_facts) as string[] | undefined;
  const imagePrompt = (c.image_prompt) as string | undefined;
  const icon = (c.icon) as string | undefined;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10">
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${colour}30, ${colour}10)` }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${colour}30` }}>
          {icon || <Lightbulb size={22} style={{ color: colour }} />}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colour }}>Concept Card</p>
          <h3 className="text-white font-bold text-lg">{asset.title}</h3>
        </div>
      </div>
      <div className="p-5 bg-navy-light/40 space-y-4">
        {tagline && (
          <p className="text-lg font-bold text-white/90 italic">&ldquo;{tagline}&rdquo;</p>
        )}
        {hook && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber/10 border border-amber/20">
            <span className="text-amber text-lg">💡</span>
            <p className="text-sm text-amber/90">{hook}</p>
          </div>
        )}
        {definition && (
          <p className="text-sm text-slate-light/80 leading-relaxed">{definition}</p>
        )}
        {keyFacts && keyFacts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-light/40">Key Facts</p>
            {keyFacts.map((fact, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
                <Star size={14} className="mt-0.5 flex-shrink-0" style={{ color: colour }} />
                <p className="text-sm text-slate-light/80">{fact}</p>
              </div>
            ))}
          </div>
        )}
        {imagePrompt && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
          <ImageIcon size={20} className="mx-auto mb-2 text-slate-light/30" aria-hidden="true" />
            <p className="text-xs text-slate-light/40 italic">{imagePrompt}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RealWorldCardPreview({ asset, colour }: { asset: TopicAsset; colour: string }) {
  const c = (asset.content_json ?? {}) as Record<string, unknown>;
  const [tab, setTab] = useState<'everyday' | 'inspiring'>('everyday');

  // Handle both flat schema and nested {everyday, inspiring} schema
  const hasNested = !!(c.everyday || c.inspiring);
  const everyday = (hasNested ? (c.everyday as Record<string, unknown>) : c) as Record<string, unknown>;
  const inspiring = hasNested ? (c.inspiring as Record<string, unknown> | null) : null;

  const current: Record<string, unknown> = (tab === 'everyday' ? everyday : (inspiring || everyday)) as Record<string, unknown>;
  const isInspiring = tab === 'inspiring';
  const accentColour = isInspiring ? '#8B5CF6' : '#10B981';
  const Icon = isInspiring ? Rocket : Globe;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10">
      {hasNested && (
        <div className="flex border-b border-white/10">
          {(['everyday', 'inspiring'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === t ? 'bg-white/10 text-white' : 'text-slate-light/40 hover:text-white'
              }`}
            >
              {t === 'everyday' ? '🌍 Everyday' : '🚀 Inspiring'}
            </button>
          ))}
        </div>
      )}
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${accentColour}30, ${accentColour}10)` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColour}30` }}>
          <Icon size={20} style={{ color: accentColour }} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColour }}>Real World — {isInspiring ? 'Inspiring' : 'Everyday'}</p>
          <h3 className="text-white font-bold">{(current?.title as string) || asset.title}</h3>
        </div>
      </div>
      <div className="p-5 bg-navy-light/40 space-y-4">
        {typeof current?.description === 'string' && (
          <p className="text-sm text-slate-light/80 leading-relaxed">{current.description}</p>
        )}
        {typeof current?.scenario === 'string' && (
          <div className="p-4 rounded-xl border" style={{ backgroundColor: `${accentColour}10`, borderColor: `${accentColour}20` }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColour }}>Scenario</p>
            <p className="text-sm text-white/80">{current.scenario}</p>
          </div>
        )}
        {typeof current?.image_prompt === 'string' && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-xs text-slate-light/40 italic">{current.image_prompt}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GameQuestionsPreview({ asset, colour }: { asset: TopicAsset; colour: string }) {
  const c = (asset.content_json ?? {}) as Record<string, unknown>;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const statements = (c.statements as Array<{ id: string; statement: string; is_true: boolean; explanation: string }>) || [];
  const questions = (c.questions as Array<{ id: string; question: string; type: string; expected_answer: string; marks: number }>) || [];
  const gameType = (c.game_type as string) || 'true_false';
  const title = (c.title as string) || asset.title;
  const instructions = (c.instructions as string) || '';

  if (statements.length > 0) {
    const stmt = statements[currentIdx];
    const answered = answers[currentIdx] !== undefined;
    const isCorrect = answered && answers[currentIdx] === stmt.is_true;

    return (
      <div className="rounded-2xl overflow-hidden border border-white/10">
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${colour}30, ${colour}10)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colour}30` }}>
              <Gamepad2 size={20} style={{ color: colour }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colour }}>True or False Game</p>
              <h3 className="text-white font-bold">{title}</h3>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-light/40">{currentIdx + 1}/{statements.length}</span>
        </div>
        <div className="p-5 bg-navy-light/40 space-y-4">
          {instructions && <p className="text-xs text-slate-light/50 italic">{instructions}</p>}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-base font-bold text-white leading-relaxed">{stmt.statement}</p>
          </div>
          {!answered ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAnswers(prev => ({ ...prev, [currentIdx]: true }))}
                className="py-3 rounded-xl font-bold text-sm transition-all bg-emerald/20 border border-emerald/30 text-emerald hover:bg-emerald/30"
              >
                ✅ True
              </button>
              <button
                onClick={() => setAnswers(prev => ({ ...prev, [currentIdx]: false }))}
                className="py-3 rounded-xl font-bold text-sm transition-all bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
              >
                ❌ False
              </button>
            </div>
          ) : (
            <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald/10 border-emerald/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <p className={`font-bold text-sm mb-1 ${isCorrect ? 'text-emerald' : 'text-red-400'}`}>
                {isCorrect ? '🎉 Correct!' : `❌ The answer is ${stmt.is_true ? 'True' : 'False'}`}
              </p>
              <p className="text-xs text-slate-light/70">{stmt.explanation}</p>
            </div>
          )}
          {answered && currentIdx < statements.length - 1 && (
            <button
              onClick={() => setCurrentIdx(prev => prev + 1)}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all"
              style={{ backgroundColor: colour }}
            >
              Next Statement →
            </button>
          )}
          {answered && currentIdx === statements.length - 1 && (
            <div className="text-center p-4 rounded-xl bg-amber/10 border border-amber/20">
              <p className="text-amber font-bold">🏆 Game Complete!</p>
              <p className="text-xs text-slate-light/60 mt-1">
                Score: {Object.entries(answers).filter(([i, a]) => a === statements[parseInt(i)].is_true).length}/{statements.length}
              </p>
              <button
                onClick={() => { setCurrentIdx(0); setAnswers({}); }}
                className="mt-2 text-xs text-amber/70 hover:text-amber underline"
              >
                Play again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (questions.length > 0) {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/10">
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${colour}30, ${colour}10)` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colour}30` }}>
            <ListChecks size={20} style={{ color: colour }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colour }}>Check Questions</p>
            <h3 className="text-white font-bold">{asset.title}</h3>
          </div>
        </div>
        <div className="p-5 bg-navy-light/40 space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: `${colour}20`, color: colour }}>Q{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{q.question}</p>
                  {revealed[i] && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald/10 border border-emerald/20">
                      <p className="text-xs text-emerald font-bold">Answer: {q.expected_answer}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setRevealed(prev => ({ ...prev, [i]: !prev[i] }))}
                  className="text-xs text-slate-light/40 hover:text-white transition-colors"
                >
                  {revealed[i] ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <GenericPreview asset={asset} colour={colour} />;
}

function WorksheetPreview({ asset, colour }: { asset: TopicAsset; colour: string }) {
  const c = (asset.content_json ?? {}) as Record<string, unknown>;
  const recallQs = (c.recall_questions as Array<{ q: string; lines: number }>) || [];
  const applyQs = (c.apply_questions as Array<{ q: string; lines: number; show_working_space?: boolean }>) || [];
  const createTask = c.create_task as { title?: string; description?: string; lines?: number } | undefined;
  const reflectPrompts = (c.reflect_prompts as string[]) || [];

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10">
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${colour}30, ${colour}10)` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colour}30` }}>
            <FileText size={20} style={{ color: colour }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colour }}>Worksheet</p>
            <h3 className="text-white font-bold">{(c.title as string) || asset.title}</h3>
          </div>
        </div>
        <a
          href={`/api/content/generate-worksheet?asset_id=${asset.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-80"
          style={{ backgroundColor: colour }}
        >
          <Download size={12} />
          Print
        </a>
      </div>
      <div className="p-5 bg-navy-light/40 space-y-5">
        {recallQs.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colour }}>📝 Recall Questions</p>
            <div className="space-y-3">
              {recallQs.map((q, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white font-medium mb-2">{i + 1}. {q.q}</p>
                  {Array.from({ length: q.lines }).map((_, l) => (
                    <div key={l} className="h-6 border-b border-white/10 mb-1" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {applyQs.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colour }}>🧠 Apply Questions</p>
            <div className="space-y-3">
              {applyQs.map((q, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white font-medium mb-2">{i + 1}. {q.q}</p>
                  {q.show_working_space && (
                    <div className="mb-2 p-2 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-[10px] text-slate-light/30 mb-1">Working space</p>
                      <div className="h-12" />
                    </div>
                  )}
                  {Array.from({ length: q.lines }).map((_, l) => (
                    <div key={l} className="h-6 border-b border-white/10 mb-1" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {createTask && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colour }}>✨ Creative Task</p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              {createTask.title && <p className="text-sm font-bold text-white mb-1">{createTask.title}</p>}
              {createTask.description && <p className="text-sm text-slate-light/70 mb-3">{createTask.description}</p>}
              {Array.from({ length: createTask.lines || 6 }).map((_, l) => (
                <div key={l} className="h-6 border-b border-white/10 mb-1" />
              ))}
            </div>
          </div>
        )}
        {reflectPrompts.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colour }}>💭 Reflect</p>
            <div className="space-y-2">
              {reflectPrompts.map((p, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-slate-light/70 italic">{p}</p>
                  <div className="h-6 border-b border-white/10 mt-2" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GenericPreview({ asset, colour }: { asset: TopicAsset; colour: string }) {
  const c = (asset.content_json ?? {}) as Record<string, unknown>;

  function renderValue(value: unknown, depth = 0): React.ReactElement | null {
    if (typeof value === 'string') return (<p className="text-sm text-slate-200 leading-6">{value}</p>);
    if (typeof value === 'number' || typeof value === 'boolean') return (<p className="text-sm text-slate-200">{String(value)}</p>);
    if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          {value.map((item, i) => (
            <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
              {typeof item === 'object' && item !== null
                ? Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{k.replace(/_/g, ' ')}</p>
                      {renderValue(v, depth + 1)}
                    </div>
                  ))
                : renderValue(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-2">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{k.replace(/_/g, ' ')}</p>
              {renderValue(v, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    return (<p className="text-sm text-slate-500">No data</p>);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colour}20` }}>
          <Sparkles size={18} style={{ color: colour }} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">{asset.asset_type.replace('_', ' ')}</p>
          <h4 className="text-base font-bold text-white">{asset.title}</h4>
        </div>
      </div>
      <div className="space-y-3">
        {Object.keys(c).length > 0
          ? Object.entries(c).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-navy/40 p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">{key.replace(/_/g, ' ')}</p>
                {renderValue(value)}
              </div>
            ))
          : <p className="text-sm text-slate-400">No content data available.</p>}
      </div>
    </div>
  );
}

function AssetPreview({ asset }: { asset: TopicAsset }) {
  // Find the subject colour from linked topic
  const topic = ALL_TOPICS.find(t => t.id === asset.topic_id);
  const subject = MOCK_SUBJECTS.find(s => s.id === topic?.subject_id);
  // Also check if asset has topics relation from Supabase
  const supabaseTopic = (asset as any).topics;
  const supabaseSubject = supabaseTopic?.subjects;
  const colour = supabaseSubject?.colour_hex || subject?.colour_hex || '#F59E0B';

  switch (asset.asset_type) {
    case 'concept_card':
      return <ConceptCardPreview asset={asset} colour={colour} />;
    case 'realworld_card':
      return <RealWorldCardPreview asset={asset} colour={colour} />;
    case 'game_questions':
      return <GameQuestionsPreview asset={asset} colour={colour} />;
    case 'worksheet':
      return <WorksheetPreview asset={asset} colour={colour} />;
    default:
      return <GenericPreview asset={asset} colour={colour} />;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'generate'>('library');
  const [selectedAsset, setSelectedAsset] = useState<TopicAsset | null>(null);
  const [assets, setAssets] = useState<TopicAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [filterSubject, setFilterSubject] = useState('all');

  // Generate tab state
  const [generateTopicId, setGenerateTopicId] = useState('');
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<AssetType[]>([]);
  const [ageGroup, setAgeGroup] = useState('8-11');
  const [generating, setGenerating] = useState(false);
  const [customTopicName, setCustomTopicName] = useState('');
  const [customSubjectId, setCustomSubjectId] = useState('');
  const [useCustomTopic, setUseCustomTopic] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/topic-assets');
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (e) {
      console.error('Failed to fetch assets:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || a.asset_type === filterType;
      const topic = ALL_TOPICS.find(t => t.id === a.topic_id);
      const supabaseTopic = (a as any).topics;
      const subjectId = supabaseTopic?.subject_id || topic?.subject_id;
      const matchesSubject = filterSubject === 'all' || subjectId === filterSubject;
      return matchesSearch && matchesType && matchesSubject;
    });
  }, [assets, searchQuery, filterType, filterSubject]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    try {
      await fetch(`/api/admin/topic-assets?id=${id}`, { method: 'DELETE' });
      setAssets(prev => prev.filter(a => a.id !== id));
      if (selectedAsset?.id === id) setSelectedAsset(null);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleGenerate = async () => {
    if (!useCustomTopic && !generateTopicId) return;
    if (useCustomTopic && (!customTopicName || !customSubjectId)) return;
    if (selectedAssetTypes.length === 0) return;

    setGenerating(true);
    try {
      let topicId = '';
      let topicTitle = '';
      let subjectName = '';

      const keyStageMap: Record<string, string> = { "5-7": "KS1", "8-11": "KS2", "12-14": "KS3", "15-16": "KS4" };

      if (useCustomTopic) {
        const subject = MOCK_SUBJECTS.find(s => s.id === customSubjectId);
        const slug = customTopicName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        const res = await fetch('/api/admin/topic-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: customTopicName, subject_id: customSubjectId, slug: slug || `custom-${Date.now()}` }),
        });
        if (!res.ok) throw new Error('Failed to create topic');
        const { topic } = await res.json();
        topicId = topic?.id || `custom-${Date.now()}`;
        topicTitle = customTopicName;
        subjectName = subject?.name || 'Custom Subject';
      } else {
        const topic = ALL_TOPICS.find(t => t.id === generateTopicId);
        if (!topic) throw new Error('Topic not found');
        topicId = topic.id;
        topicTitle = topic.title;
        const subject = MOCK_SUBJECTS.find(s => s.id === topic.subject_id);
        subjectName = subject?.name || 'General';
      }

      const res = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: topicId,
          asset_types: selectedAssetTypes,
          age_group: ageGroup,
          title: topicTitle,
          subject_name: subjectName,
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      alert(`✅ Generated ${data.assets?.length || 0} assets for "${topicTitle}"!`);
      setActiveTab('library');
      await fetchAssets();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const toggleAssetType = (type: AssetType) => {
    setSelectedAssetTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  // Get unique subjects from assets
  const subjectsInAssets = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string }[] = [];
    assets.forEach(a => {
      const supabaseTopic = (a as any).topics;
      const supabaseSubject = supabaseTopic?.subjects;
      const topic = ALL_TOPICS.find(t => t.id === a.topic_id);
      const subject = MOCK_SUBJECTS.find(s => s.id === topic?.subject_id);
      const id = supabaseSubject?.id || subject?.id;
      const name = supabaseSubject?.name || subject?.name;
      if (id && name && !seen.has(id)) {
        seen.add(id);
        result.push({ id, name });
      }
    });
    return result;
  }, [assets]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Content Library</h1>
          <p className="text-slate-light/60">
            {loading ? 'Loading...' : `${assets.length} assets • Concept cards, games, worksheets, and more`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAssets}
            className="p-2 rounded-lg bg-white/5 text-slate-light/60 hover:text-white hover:bg-white/10 transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'library' ? 'bg-amber text-navy' : 'text-slate-light/60 hover:text-white'}`}
            >
              Library
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'generate' ? 'bg-amber text-navy' : 'text-slate-light/60 hover:text-white'}`}
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'library' ? (
        <div className="grid grid-cols-12 gap-8">
          {/* Asset List */}
          <div className="col-span-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light/30" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-light/30 focus:outline-none focus:border-amber/50"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as AssetType | 'all')}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber/50"
              >
                <option value="all">All Types</option>
                {ASSET_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber/50"
              >
                <option value="all">All Subjects</option>
                {subjectsInAssets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Asset List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-amber" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-12 text-slate-light/30">
                <LayoutDashboard size={32} className="mx-auto mb-3" />
                <p className="text-sm">No assets found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredAssets.map(asset => {
                  const typeInfo = ASSET_TYPES.find(t => t.type === asset.asset_type);
                  const supabaseTopic = (asset as any).topics;
                  const topicTitle = supabaseTopic?.title || ALL_TOPICS.find(t => t.id === asset.topic_id)?.title || '';
                  const supabaseSubject = supabaseTopic?.subjects;
                  const subject = MOCK_SUBJECTS.find(s => s.id === ALL_TOPICS.find(t => t.id === asset.topic_id)?.subject_id);
                  const subjectName = supabaseSubject?.name || subject?.name || '';

                  return (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        selectedAsset?.id === asset.id
                          ? 'border-amber bg-amber/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="p-1.5 rounded-lg"
                          style={{ backgroundColor: `${typeInfo?.colour}20`, color: typeInfo?.colour }}
                        >
                          {typeInfo?.icon}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-light/40">
                          {typeInfo?.label}
                        </span>
                        {subjectName && (
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-light/40">
                            {subjectName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold text-sm leading-tight">{asset.title}</h3>
                      {topicTitle && (
                        <p className="text-[11px] text-slate-light/40 mt-0.5 truncate">{topicTitle}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview Area */}
          <div className="col-span-8">
            {selectedAsset ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {/* Preview Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber/20 text-amber">
                      {ASSET_TYPES.find(t => t.type === selectedAsset.asset_type)?.icon}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedAsset.title}</h2>
                      <p className="text-xs text-slate-light/50">
                        {selectedAsset.asset_type.replace('_', ' ')} • Age {selectedAsset.age_group} • {selectedAsset.key_stage || 'KS2'}
                        {selectedAsset.status && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            selectedAsset.status === 'published' ? 'bg-emerald/20 text-emerald' : 'bg-amber/20 text-amber'
                          }`}>
                            {selectedAsset.status}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(selectedAsset.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {/* Preview Content */}
                <div className="p-6 max-h-[640px] overflow-y-auto custom-scrollbar">
                  <AssetPreview asset={selectedAsset} />
                </div>
              </div>
            ) : (
              <div className="h-[640px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl text-slate-light/20">
                <Eye size={48} className="mb-4" />
                <p className="text-lg font-medium">Select an asset to preview</p>
                <p className="text-sm mt-1">{filteredAssets.length} assets available</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Generate Tab */
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8">
            {/* Topic Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white uppercase tracking-wider">1. Select Topic</label>
                <button
                  onClick={() => setUseCustomTopic(!useCustomTopic)}
                  className="text-xs text-amber hover:text-amber/80 transition-colors"
                >
                  {useCustomTopic ? '← Use existing topic' : '+ Custom topic'}
                </button>
              </div>

              {useCustomTopic ? (
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Topic name (e.g. Volcanoes)"
                    value={customTopicName}
                    onChange={e => setCustomTopicName(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-light/30 focus:outline-none focus:border-amber/50"
                  />
                  <select
                    value={customSubjectId}
                    onChange={e => setCustomSubjectId(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber/50"
                  >
                    <option value="">Select subject...</option>
                    {MOCK_SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option value="other">Other</option>
                  </select>
                </div>
              ) : (
                <select
                  value={generateTopicId}
                  onChange={e => setGenerateTopicId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber/50"
                >
                  <option value="">Choose a topic...</option>
                  {MOCK_SUBJECTS.map(subject => (
                    <optgroup key={subject.id} label={subject.name}>
                      {(MOCK_TOPICS[subject.id] || []).map(topic => (
                        <option key={topic.id} value={topic.id}>{topic.title}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            {/* Asset Types */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-white uppercase tracking-wider">2. Asset Types</label>
              <div className="grid grid-cols-3 gap-3">
                {ASSET_TYPES.filter(t => t.type !== 'video' && t.type !== 'diagram').map(typeInfo => (
                  <button
                    key={typeInfo.type}
                    onClick={() => toggleAssetType(typeInfo.type)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedAssetTypes.includes(typeInfo.type)
                        ? 'border-amber bg-amber/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${typeInfo.colour}20`, color: typeInfo.colour }}>
                        {typeInfo.icon}
                      </div>
                      {selectedAssetTypes.includes(typeInfo.type) && (
                        <Check size={14} className="text-amber ml-auto" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-white">{typeInfo.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-white uppercase tracking-wider">3. Age Group</label>
              <div className="grid grid-cols-4 gap-3">
                {['5-7', '8-11', '12-14', '15-16'].map(age => (
                  <button
                    key={age}
                    onClick={() => setAgeGroup(age)}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                      ageGroup === age ? 'border-amber bg-amber/10 text-amber' : 'border-white/10 bg-white/5 text-slate-light/60 hover:border-white/20'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || (!generateTopicId && !useCustomTopic) || selectedAssetTypes.length === 0}
              className="w-full py-4 rounded-xl font-bold text-navy bg-amber hover:bg-amber/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating with Claude...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate {selectedAssetTypes.length > 0 ? selectedAssetTypes.length : ''} Asset{selectedAssetTypes.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
