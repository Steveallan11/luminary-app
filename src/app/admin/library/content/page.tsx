'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Layers, Search, ArrowLeft, Loader2, Eye, Edit3, Trash2,
  FileText, Image as ImageIcon, Gamepad2, BookOpen, Lightbulb,
  X, Save, Check, AlertCircle, Sparkles, Link,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const ASSET_TYPE_CONFIG: Record<string, { label: string; icon: any; colour: string }> = {
  concept_card: { label: 'Concept Card', icon: Lightbulb, colour: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  game_questions: { label: 'Game Questions', icon: Gamepad2, colour: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  realworld_card: { label: 'Real World Card', icon: BookOpen, colour: 'text-sky-400 bg-sky-400/10 border-sky-400/30' },
  worksheet: { label: 'Worksheet', icon: FileText, colour: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  image: { label: 'Image', icon: ImageIcon, colour: 'text-pink-400 bg-pink-400/10 border-pink-400/30' },
  diagram: { label: 'Diagram', icon: Layers, colour: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
};

export default function ContentLibraryPage() {
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('topic_assets')
      .select('*, topics(title, subjects(name))')
      .order('created_at', { ascending: false });
    if (!error && data) setAssets(data);
    setLoading(false);
  };

  const filtered = assets.filter(a => {
    const title = a.title?.toLowerCase() || a.topics?.title?.toLowerCase() || '';
    const subject = a.topics?.subjects?.name?.toLowerCase() || '';
    const matchSearch = !search || title.includes(search.toLowerCase()) || subject.includes(search.toLowerCase());
    const matchType = filterType === 'all' || a.asset_type === filterType;
    return matchSearch && matchType;
  });

  const handleDelete = async (assetId: string) => {
    if (!confirm('Delete this content? This cannot be undone.')) return;
    setIsDeleting(true);
    await supabase.from('topic_assets').delete().eq('id', assetId);
    setSelectedAsset(null);
    await fetchAssets();
    setIsDeleting(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedAsset || !editedContent) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('topic_assets')
      .update({ content: editedContent })
      .eq('id', selectedAsset.id);
    if (!error) {
      setSelectedAsset((prev: any) => ({ ...prev, content: editedContent }));
      setEditMode(false);
    }
    setIsSaving(false);
  };

  const getAssetConfig = (type: string) => ASSET_TYPE_CONFIG[type] || { label: type, icon: FileText, colour: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };

  const renderAssetContent = (asset: any) => {
    const content = asset.content;
    if (!content) return <p className="text-slate-light/40 text-sm">No content available</p>;

    if (asset.asset_type === 'concept_card') {
      return (
        <div className="space-y-3">
          {content.title && <h3 className="text-lg font-bold text-white">{content.title}</h3>}
          {content.definition && (
            <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
              <p className="text-[10px] font-bold text-yellow-400 uppercase mb-1">Definition</p>
              <p className="text-sm text-white">{content.definition}</p>
            </div>
          )}
          {content.key_facts?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-2">Key Facts</p>
              <ul className="space-y-1">
                {content.key_facts.map((fact: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-light/80">
                    <span className="text-yellow-400">•</span><span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.analogy && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-1">Analogy</p>
              <p className="text-sm text-slate-light/80 italic">{content.analogy}</p>
            </div>
          )}
        </div>
      );
    }

    if (asset.asset_type === 'game_questions') {
      const questions = content.questions || content;
      if (!Array.isArray(questions)) return <pre className="text-xs text-slate-light/60 overflow-auto">{JSON.stringify(content, null, 2)}</pre>;
      return (
        <div className="space-y-3">
          {questions.map((q: any, i: number) => (
            <div key={i} className="p-3 rounded-xl bg-purple-400/10 border border-purple-400/20">
              <p className="text-sm font-semibold text-white mb-2">{i + 1}. {q.question}</p>
              {q.options && (
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {q.options.map((opt: string, j: number) => (
                    <span key={j} className={`text-xs px-2 py-1 rounded ${opt === q.correct_answer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-light/60'}`}>
                      {opt}
                    </span>
                  ))}
                </div>
              )}
              {q.explanation && <p className="text-xs text-slate-light/40 italic">{q.explanation}</p>}
            </div>
          ))}
        </div>
      );
    }

    if (asset.asset_type === 'realworld_card') {
      return (
        <div className="space-y-3">
          {content.title && <h3 className="text-lg font-bold text-white">{content.title}</h3>}
          {content.scenario && (
            <div className="p-3 rounded-xl bg-sky-400/10 border border-sky-400/20">
              <p className="text-[10px] font-bold text-sky-400 uppercase mb-1">Real World Scenario</p>
              <p className="text-sm text-white">{content.scenario}</p>
            </div>
          )}
          {content.connection && <p className="text-sm text-slate-light/80">{content.connection}</p>}
          {content.discussion_questions?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-light/40 uppercase mb-2">Discussion Questions</p>
              <ul className="space-y-1">
                {content.discussion_questions.map((q: string, i: number) => (
                  <li key={i} className="text-sm text-slate-light/80">• {q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Generic JSON display for other types
    return <pre className="text-xs text-slate-light/60 overflow-auto max-h-64 bg-black/20 p-3 rounded-xl">{JSON.stringify(content, null, 2)}</pre>;
  };

  return (
    <div className="min-h-screen bg-navy text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push('/admin/library')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-white">Content Library</h1>
          <p className="text-slate-light/60 text-sm mt-1">{assets.length} assets • Concept cards, games, worksheets, and more</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Asset List */}
        <div className="col-span-4 space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search content..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-light/40 focus:outline-none focus:border-amber/50"
              />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">All Content Types</option>
              <option value="concept_card">Concept Cards</option>
              <option value="game_questions">Game Questions</option>
              <option value="realworld_card">Real World Cards</option>
              <option value="worksheet">Worksheets</option>
              <option value="diagram">Diagrams</option>
              <option value="image">Images</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-amber" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-white/10 bg-white/5">
              <Layers size={32} className="text-slate-light/20 mx-auto mb-3" />
              <p className="text-sm text-slate-light/40">No content found</p>
              <p className="text-xs text-slate-light/30 mt-1">Generate content from the Lessons page</p>
            </div>
          ) : (
            filtered.map(asset => {
              const cfg = getAssetConfig(asset.asset_type);
              const Icon = cfg.icon;
              return (
                <button
                  key={asset.id}
                  onClick={() => { setSelectedAsset(asset); setEditMode(false); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedAsset?.id === asset.id
                      ? 'border-amber bg-amber/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${cfg.colour}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{asset.title || asset.topics?.title || 'Untitled'}</p>
                      <p className="text-xs text-slate-light/60 mt-0.5">
                        {asset.topics?.subjects?.name || 'Unknown'} • {cfg.label}
                      </p>
                      <p className="text-[10px] text-slate-light/40 mt-0.5">{new Date(asset.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Asset Detail */}
        <div className="col-span-8">
          {selectedAsset ? (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {(() => {
                      const cfg = getAssetConfig(selectedAsset.asset_type);
                      const Icon = cfg.icon;
                      return (
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-xl border ${cfg.colour}`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <h2 className="text-xl font-black text-white">{selectedAsset.title || selectedAsset.topics?.title || 'Untitled'}</h2>
                            <p className="text-sm text-slate-light/60">{selectedAsset.topics?.subjects?.name} • {cfg.label}</p>
                          </div>
                        </div>
                      );
                    })()}
                    {selectedAsset.linked_lesson_id && (
                      <div className="flex items-center gap-1 text-xs text-sky-400">
                        <Link size={10} /> Linked to lesson
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!editMode && (
                      <button
                        onClick={() => { setEditMode(true); setEditedContent(selectedAsset.content); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20"
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                    )}
                    {editMode && (
                      <>
                        <button onClick={() => setEditMode(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20">
                          <X size={12} /> Cancel
                        </button>
                        <button onClick={handleSaveEdit} disabled={isSaving} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50">
                          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(selectedAsset.id)}
                      disabled={isDeleting}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
                    </button>
                  </div>
                </div>

                {editMode ? (
                  <textarea
                    value={JSON.stringify(editedContent, null, 2)}
                    onChange={e => {
                      try { setEditedContent(JSON.parse(e.target.value)); } catch {}
                    }}
                    className="w-full h-96 bg-black/20 border border-white/10 rounded-xl p-4 text-xs text-white font-mono focus:outline-none focus:border-amber/50 resize-none"
                  />
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto pr-1">
                    {renderAssetContent(selectedAsset)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
              <Layers size={56} className="text-slate-light/20 mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">Select content to view</h3>
              <p className="text-sm text-slate-light/40 max-w-xs">
                Click any content item from the list to view, edit, or manage it. Generate new content from the Lessons page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
