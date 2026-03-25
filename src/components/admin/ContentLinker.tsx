'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  X, Search, Loader2, Check, BookOpen, Gamepad2, FileText,
  Globe, Sparkles, Link2, ChevronDown, ChevronUp, Filter,
  Zap, Target, PenTool, Trophy, PartyPopper, Lightbulb,
  Eye, EyeOff, Plus
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TopicAsset {
  id: string;
  title: string;
  asset_type: string;
  asset_subtype: string | null;
  content_json: Record<string, unknown> | null;
  topic_id: string | null;
  linked_lesson_id: string | null;
  age_group: string | null;
  key_stage: string | null;
  status: string;
  created_at: string;
  subject_name?: string;
}

interface LinkedAsset {
  id: string;
  asset_id: string;
  lesson_id: string;
  phase: string;
  position: number;
  lumi_instruction: string | null;
  asset?: TopicAsset;
}

interface ContentLinkerProps {
  lessonId: string;
  lessonTitle: string;
  currentPhase: string;
  onClose: () => void;
  onLinked: (linkedAsset: LinkedAsset) => void;
}

// ─── Phase config ─────────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<string, { label: string; icon: React.ElementType; colour: string }> = {
  spark:    { label: 'Spark',    icon: Zap,         colour: '#F59E0B' },
  explore:  { label: 'Explore',  icon: BookOpen,    colour: '#3B82F6' },
  explain:  { label: 'Explain',  icon: Lightbulb,   colour: '#8B5CF6' },
  apply:    { label: 'Apply',    icon: Target,      colour: '#10B981' },
  create:   { label: 'Create',   icon: PenTool,     colour: '#EC4899' },
  review:   { label: 'Review',   icon: Trophy,      colour: '#F97316' },
  celebrate:{ label: 'Celebrate',icon: PartyPopper, colour: '#EF4444' },
};

const ASSET_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; colour: string }> = {
  concept_card:   { label: 'Concept Card',   icon: BookOpen,  colour: '#3B82F6' },
  game_questions: { label: 'Game',           icon: Gamepad2,  colour: '#F59E0B' },
  worksheet:      { label: 'Worksheet',      icon: FileText,  colour: '#10B981' },
  realworld_card: { label: 'Real World',     icon: Globe,     colour: '#8B5CF6' },
};

// ─── Mini asset preview ───────────────────────────────────────────────────────

function AssetMiniPreview({ asset }: { asset: TopicAsset }) {
  const [expanded, setExpanded] = useState(false);
  const c = (asset.content_json ?? {}) as Record<string, unknown>;
  const cfg = ASSET_TYPE_CONFIG[asset.asset_type] || { label: asset.asset_type, icon: Sparkles, colour: '#6B7280' };
  const Icon = cfg.icon;

  const getPreviewText = () => {
    if (asset.asset_type === 'concept_card') {
      return (c.body || c.definition || c.subtitle || c.tagline || '') as string;
    }
    if (asset.asset_type === 'realworld_card') {
      const everyday = (c.everyday || c) as Record<string, unknown>;
      return (everyday.description || '') as string;
    }
    if (asset.asset_type === 'game_questions') {
      const statements = c.statements as Array<{ statement: string }> | undefined;
      if (statements && statements.length > 0) return `${statements.length} questions`;
      return 'Interactive game';
    }
    if (asset.asset_type === 'worksheet') {
      const recall = c.recall as Array<{ question: string }> | undefined;
      if (recall && recall.length > 0) return `${recall.length} recall questions + activities`;
      return 'Worksheet with exercises';
    }
    return '';
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${cfg.colour}20` }}>
          <Icon size={14} style={{ color: cfg.colour }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{asset.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.colour }}>
              {cfg.label}
            </span>
            {asset.age_group && (
              <span className="text-[10px] text-slate-500">Ages {asset.age_group}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors shrink-0"
        >
          {expanded ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t border-white/5">
          <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3">
            {getPreviewText() || 'No preview available'}
          </p>
          {asset.asset_type === 'game_questions' && (() => {
            const statements = c.statements as Array<{ statement: string; is_true: boolean }> | undefined;
            return statements && statements.length > 0 ? (
              <div className="mt-2 space-y-1">
                {statements.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-[10px] font-bold shrink-0 mt-0.5 ${s.is_true ? 'text-emerald-400' : 'text-red-400'}`}>
                      {s.is_true ? 'T' : 'F'}
                    </span>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{s.statement}</p>
                  </div>
                ))}
                {statements.length > 3 && (
                  <p className="text-[10px] text-slate-600">+{statements.length - 3} more...</p>
                )}
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Main ContentLinker component ────────────────────────────────────────────

export default function ContentLinker({ lessonId, lessonTitle, currentPhase, onClose, onLinked }: ContentLinkerProps) {
  const [assets, setAssets] = useState<TopicAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<string>(currentPhase);
  const [selectedAsset, setSelectedAsset] = useState<TopicAsset | null>(null);
  const [lumiInstruction, setLumiInstruction] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkedSuccess, setLinkedSuccess] = useState<string | null>(null);
  const [existingLinks, setExistingLinks] = useState<LinkedAsset[]>([]);
  const [showPhaseSelector, setShowPhaseSelector] = useState(false);

  // Fetch all assets and existing links
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [assetsRes, linksRes] = await Promise.all([
          fetch('/api/admin/topic-assets'),
          fetch(`/api/admin/lesson-content-links?lesson_id=${lessonId}`),
        ]);
        if (assetsRes.ok) {
          const data = await assetsRes.json();
          setAssets(data.assets || []);
        }
        if (linksRes.ok) {
          const data = await linksRes.json();
          setExistingLinks(data.links || []);
        }
      } catch (e) {
        console.error('Failed to fetch assets:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lessonId]);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchQuery ||
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.asset_type.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || asset.asset_type === filterType;
    return matchesSearch && matchesType;
  });

  const isAlreadyLinked = (assetId: string) =>
    existingLinks.some(l => l.asset_id === assetId && l.phase === selectedPhase);

  const handleLink = async () => {
    if (!selectedAsset) return;
    setLinking(true);
    try {
      const res = await fetch('/api/admin/lesson-content-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          asset_id: selectedAsset.id,
          phase: selectedPhase,
          position: existingLinks.filter(l => l.phase === selectedPhase).length,
          lumi_instruction: lumiInstruction || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newLink: LinkedAsset = {
          ...data.link,
          asset: selectedAsset,
        };
        setExistingLinks(prev => [...prev, newLink]);
        setLinkedSuccess(`"${selectedAsset.title}" linked to ${PHASE_CONFIG[selectedPhase]?.label || selectedPhase} phase!`);
        onLinked(newLink);
        setTimeout(() => {
          setLinkedSuccess(null);
          setSelectedAsset(null);
          setLumiInstruction('');
        }, 2000);
      }
    } catch (e) {
      console.error('Failed to link asset:', e);
    } finally {
      setLinking(false);
    }
  };

  const phaseLinks = existingLinks.filter(l => l.phase === selectedPhase);
  const phaseCfg = PHASE_CONFIG[selectedPhase] || { label: selectedPhase, icon: BookOpen, colour: '#6B7280' };
  const PhaseIcon = phaseCfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0D1117] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/20">
              <Link2 size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Insert Content into Lesson</h2>
              <p className="text-[11px] text-slate-500 truncate max-w-xs">{lessonTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: Asset browser */}
          <div className="w-1/2 border-r border-white/10 flex flex-col">
            {/* Search + filter */}
            <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search content library..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'concept_card', label: '📚 Cards' },
                  { id: 'game_questions', label: '🎮 Games' },
                  { id: 'worksheet', label: '📝 Worksheets' },
                  { id: 'realworld_card', label: '🌍 Real World' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterType === f.id
                        ? 'bg-amber-500 text-black'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-amber-400" />
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No content found</p>
                  <p className="text-xs text-slate-600 mt-1">Try a different search or generate content first</p>
                </div>
              ) : (
                filteredAssets.map(asset => {
                  const alreadyLinked = isAlreadyLinked(asset.id);
                  const cfg = ASSET_TYPE_CONFIG[asset.asset_type] || { label: asset.asset_type, icon: Sparkles, colour: '#6B7280' };
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAsset(selectedAsset?.id === asset.id ? null : asset)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedAsset?.id === asset.id
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : alreadyLinked
                          ? 'border-emerald-500/30 bg-emerald-500/5 opacity-60'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${cfg.colour}20` }}>
                          <Icon size={14} style={{ color: cfg.colour }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-white truncate flex-1">{asset.title}</p>
                            {alreadyLinked && (
                              <span className="shrink-0 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                                <Check size={10} /> Linked
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.colour }}>
                              {cfg.label}
                            </span>
                            {asset.age_group && (
                              <span className="text-[10px] text-slate-600">Ages {asset.age_group}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Stats footer */}
            <div className="px-4 py-3 border-t border-white/10 shrink-0">
              <p className="text-[10px] text-slate-600">
                {filteredAssets.length} of {assets.length} assets • {existingLinks.length} total links in this lesson
              </p>
            </div>
          </div>

          {/* Right: Preview + link config */}
          <div className="w-1/2 flex flex-col">
            {/* Phase selector */}
            <div className="p-4 border-b border-white/10 shrink-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Insert into Phase</p>
              <div className="relative">
                <button
                  onClick={() => setShowPhaseSelector(!showPhaseSelector)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${phaseCfg.colour}20` }}>
                    <PhaseIcon size={14} style={{ color: phaseCfg.colour }} />
                  </div>
                  <span className="flex-1 text-left text-sm font-bold text-white">{phaseCfg.label}</span>
                  {phaseLinks.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
                      {phaseLinks.length} linked
                    </span>
                  )}
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${showPhaseSelector ? 'rotate-180' : ''}`} />
                </button>
                {showPhaseSelector && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A2332] border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl">
                    {Object.entries(PHASE_CONFIG).map(([phaseId, cfg]) => {
                      const Icon = cfg.icon;
                      const count = existingLinks.filter(l => l.phase === phaseId).length;
                      return (
                        <button
                          key={phaseId}
                          onClick={() => { setSelectedPhase(phaseId); setShowPhaseSelector(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors ${selectedPhase === phaseId ? 'bg-white/5' : ''}`}
                        >
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${cfg.colour}20` }}>
                            <Icon size={12} style={{ color: cfg.colour }} />
                          </div>
                          <span className="flex-1 text-left text-sm text-white">{cfg.label}</span>
                          {count > 0 && (
                            <span className="text-[10px] text-slate-400">{count}</span>
                          )}
                          {selectedPhase === phaseId && <Check size={12} className="text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Asset preview + link config */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {linkedSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                    <Check size={28} className="text-emerald-400" />
                  </div>
                  <p className="text-white font-bold text-sm">{linkedSuccess}</p>
                  <p className="text-xs text-slate-500 mt-1">Lumi will now use this content in the {phaseCfg.label} phase</p>
                </div>
              ) : selectedAsset ? (
                <>
                  <AssetMiniPreview asset={selectedAsset} />
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                      Lumi Instruction (optional)
                    </label>
                    <textarea
                      value={lumiInstruction}
                      onChange={e => setLumiInstruction(e.target.value)}
                      placeholder={`e.g. "Show this game after explaining the key concept"\n"Use this card when introducing the topic"\n"Present this worksheet at the end of the phase"`}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 h-24 resize-none"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">Tell Lumi exactly when and how to use this content during the lesson</p>
                  </div>
                  <button
                    onClick={handleLink}
                    disabled={linking || isAlreadyLinked(selectedAsset.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: isAlreadyLinked(selectedAsset.id) ? '#10B98120' : '#F59E0B',
                      color: isAlreadyLinked(selectedAsset.id) ? '#10B981' : '#000',
                    }}
                  >
                    {linking ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isAlreadyLinked(selectedAsset.id) ? (
                      <><Check size={16} /> Already linked to {phaseCfg.label}</>
                    ) : (
                      <><Plus size={16} /> Insert into {phaseCfg.label} Phase</>
                    )}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Link2 size={24} className="text-slate-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Select an asset to link</p>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs">
                    Choose any content from the library on the left, then insert it into the lesson phase
                  </p>
                </div>
              )}

              {/* Existing links for selected phase */}
              {phaseLinks.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">
                    Already linked to {phaseCfg.label} ({phaseLinks.length})
                  </p>
                  <div className="space-y-2">
                    {phaseLinks.map(link => {
                      const asset = assets.find(a => a.id === link.asset_id);
                      if (!asset) return null;
                      const cfg = ASSET_TYPE_CONFIG[asset.asset_type] || { label: asset.asset_type, icon: Sparkles, colour: '#6B7280' };
                      const Icon = cfg.icon;
                      return (
                        <div key={link.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${cfg.colour}20` }}>
                            <Icon size={12} style={{ color: cfg.colour }} />
                          </div>
                          <p className="text-xs text-white flex-1 truncate">{asset.title}</p>
                          <Check size={12} className="text-emerald-400 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
