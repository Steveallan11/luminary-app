'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, Sparkles, Wand2, RefreshCw, ChevronRight, ChevronLeft,
  Edit3, Loader2, Check, MessageSquare, X, Plus, Trash2, Image as ImageIcon,
  Video, Layers, BarChart2, Film, Smile, AlertCircle, Save, Zap,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type LessonPhase = 'spark' | 'explore' | 'anchor' | 'practise' | 'create' | 'check' | 'celebrate';
type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
type LessonLength = 'full' | 'standard' | 'bite_size';

const PHASE_ORDER: LessonPhase[] = ['spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate'];
const PHASE_ICONS: Record<LessonPhase, string> = {
  spark: '⚡', explore: '🔭', anchor: '⚓', practise: '🎯',
  create: '🎨', check: '✅', celebrate: '🎉',
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
const PHASE_GRADIENTS: Record<LessonPhase, string> = {
  spark: 'from-yellow-500/15 to-orange-500/5',
  explore: 'from-sky-500/15 to-cyan-500/5',
  anchor: 'from-emerald-500/15 to-teal-500/5',
  practise: 'from-orange-500/15 to-amber-500/5',
  create: 'from-purple-500/15 to-pink-500/5',
  check: 'from-blue-500/15 to-indigo-500/5',
  celebrate: 'from-pink-500/15 to-rose-500/5',
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
interface PhaseMedia {
  id: string;
  phase: string;
  media_type: 'image' | 'video' | 'gif' | 'youtube';
  url: string;
  thumbnail: string;
  title: string;
  lumi_instruction: string;
}

// ─── Media Search Modal ───────────────────────────────────────────────────────
function MediaSearchModal({ lessonId, phase, topic, keyConcepts, ageGroup, onAdded, onClose }: {
  lessonId: string; phase: string; topic: string; keyConcepts: string[];
  ageGroup: string; onAdded: (media: PhaseMedia) => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<'search' | 'youtube' | 'gif' | 'url'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [lumiInstruction, setLumiInstruction] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlType, setUrlType] = useState<'image' | 'youtube'>('image');

  const doSearch = async (q?: string) => {
    const searchQ = q || query;
    if (!searchQ.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSelectedMedia(null);
    try {
      const mediaType = tab === 'gif' ? 'gif' : tab === 'youtube' ? 'youtube' : 'image';
      const res = await fetch('/api/admin/search-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: searchQ, phase, key_concepts: keyConcepts,
          age_group: ageGroup, search_type: mediaType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data.results || []);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const autoSearch = () => {
    const q = `${topic} ${keyConcepts.slice(0, 2).join(' ')} ${phase}`.trim();
    setQuery(q);
    void doSearch(q);
  };

  const saveMedia = async (media: any) => {
    setIsSaving(true);
    try {
      const instruction = lumiInstruction || media.lumi_suggestion || `Show this during the ${phase} phase to make it visual and exciting.`;
      const res = await fetch('/api/admin/lesson-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId, phase,
          media_type: media.type || media.media_type,
          url: media.url, thumbnail: media.thumbnail,
          title: media.title, source: media.source,
          lumi_instruction: instruction, display_order: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      onAdded({
        id: data.media?.id || `temp-${Date.now()}`, phase,
        media_type: media.type || media.media_type,
        url: media.url, thumbnail: media.thumbnail,
        title: media.title, lumi_instruction: instruction,
      });
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveUrl = async () => {
    if (!urlInput.trim()) return;
    setIsSaving(true);
    try {
      let finalUrl = urlInput;
      let thumbnail = '';
      if (urlType === 'youtube') {
        const ytMatch = urlInput.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (ytMatch) {
          const vid = ytMatch[1];
          finalUrl = `https://www.youtube.com/embed/${vid}`;
          thumbnail = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
        }
      }
      const instruction = lumiInstruction || `Show this ${urlType} during the ${phase} phase.`;
      const res = await fetch('/api/admin/lesson-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId, phase, media_type: urlType,
          url: finalUrl, thumbnail: thumbnail || finalUrl,
          title: urlTitle || 'Custom media', lumi_instruction: instruction, display_order: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      onAdded({
        id: data.media?.id || `temp-${Date.now()}`, phase, media_type: urlType,
        url: finalUrl, thumbnail: thumbnail || finalUrl,
        title: urlTitle || 'Custom media', lumi_instruction: instruction,
      });
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold">Add Media — {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase</h2>
            <p className="text-slate-400 text-xs mt-0.5">Make this phase visually exciting with images, videos, or GIFs</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'search', label: '🖼️ Images' },
            { id: 'youtube', label: '▶️ YouTube' },
            { id: 'gif', label: '🎞️ GIFs' },
            { id: 'url', label: '🔗 URL / Embed' },
          ].map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id as any); setResults([]); setSelectedMedia(null); setSearchError(null); }}
              className={`px-4 py-2.5 text-xs font-medium transition-colors ${tab === t.id ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-400/5' : 'text-slate-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Search area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {tab !== 'url' && (
              <div className="p-3 border-b border-white/10">
                <div className="flex gap-2">
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void doSearch()}
                    placeholder={tab === 'youtube' ? 'Search YouTube videos...' : tab === 'gif' ? 'Search GIFs...' : 'Search images...'}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-500/50 placeholder-slate-500" />
                  <button onClick={() => void doSearch()} disabled={isSearching || !query.trim()}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-lg disabled:opacity-50 transition-colors">
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                  </button>
                  <button onClick={autoSearch} title="Auto-search based on lesson topic"
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg flex items-center gap-1.5 transition-colors">
                    <Sparkles className="w-3.5 h-3.5" />Auto
                  </button>
                </div>
                {searchError && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />{searchError}
                  </p>
                )}
              </div>
            )}
            {tab === 'url' && (
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <button onClick={() => setUrlType('image')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${urlType === 'image' ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>🖼️ Image URL</button>
                  <button onClick={() => setUrlType('youtube')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${urlType === 'youtube' ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>▶️ YouTube</button>
                </div>
                <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={urlType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com/image.jpg'}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-500/50 placeholder-slate-500" />
                <input type="text" value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} placeholder="Title (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-500/50 placeholder-slate-500" />
                <textarea value={lumiInstruction} onChange={(e) => setLumiInstruction(e.target.value)}
                  placeholder="Tell Lumi when and how to use this in the lesson..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-500/50 placeholder-slate-500 resize-none" rows={3} />
                {searchError && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{searchError}</p>}
                <button onClick={() => void saveUrl()} disabled={isSaving || !urlInput.trim()}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isSaving ? 'Adding...' : 'Add Media'}
                </button>
              </div>
            )}
            {tab !== 'url' && (
              <div className="flex-1 overflow-y-auto p-3">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                    <p className="text-slate-400 text-sm">Searching for child-safe content...</p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {results.map((r) => (
                      <button key={r.id} onClick={() => setSelectedMedia(r)}
                        className={`relative rounded-lg overflow-hidden aspect-video transition-all ${selectedMedia?.id === r.id ? 'ring-2 ring-amber-400 scale-[0.97]' : 'hover:ring-2 hover:ring-white/30'}`}>
                        {r.thumbnail ? (
                          <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-slate-500" />
                          </div>
                        )}
                        {selectedMedia?.id === r.id && (
                          <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                            <div className="bg-amber-400 rounded-full p-1"><Check className="w-4 h-4 text-black" /></div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                          <p className="text-white text-[10px] truncate">{r.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Sparkles className="w-8 h-8 text-slate-600" />
                    <p className="text-slate-500 text-sm text-center">
                      Search above or click <strong className="text-amber-400">Auto</strong> to find the best media for this phase
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Selected media detail */}
          {selectedMedia && tab !== 'url' && (
            <div className="w-60 border-l border-white/10 flex flex-col shrink-0">
              <div className="p-3 border-b border-white/10">
                <div className="rounded-lg overflow-hidden aspect-video bg-white/5">
                  {selectedMedia.thumbnail && <img src={selectedMedia.thumbnail} alt={selectedMedia.title} className="w-full h-full object-cover" />}
                </div>
                <p className="text-white text-xs font-medium mt-2 line-clamp-2">{selectedMedia.title}</p>
                <p className="text-slate-500 text-[10px]">{selectedMedia.source}</p>
              </div>
              <div className="p-3 flex-1">
                <label className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block mb-1.5">Lumi Instruction</label>
                <textarea
                  value={lumiInstruction || selectedMedia.lumi_suggestion || ''}
                  onChange={(e) => setLumiInstruction(e.target.value)}
                  placeholder="Tell Lumi when and how to show this..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs outline-none focus:border-amber-500/50 placeholder-slate-500 resize-none" rows={5} />
              </div>
              <div className="p-3 border-t border-white/10">
                <button onClick={() => void saveMedia(selectedMedia)} disabled={isSaving}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isSaving ? 'Adding...' : 'Add to Phase'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Phase Content Panel ──────────────────────────────────────────────────────
function PhaseContentPanel({ lessonId, phase, phaseData, phaseMedia, topic, keyConcepts, ageGroup, onPhaseUpdated, onMediaAdded, onMediaRemoved }: {
  lessonId: string; phase: LessonPhase; phaseData: any; phaseMedia: PhaseMedia[];
  topic: string; keyConcepts: string[]; ageGroup: string;
  onPhaseUpdated: (phase: LessonPhase, data: any) => void;
  onMediaAdded: (media: PhaseMedia) => void;
  onMediaRemoved: (mediaId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(phaseData || {});
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [removingMedia, setRemovingMedia] = useState<string | null>(null);

  useEffect(() => { setEditedData(phaseData || {}); }, [phaseData]);

  const savePhase = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/lesson-media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, phase, phase_json_override: editedData }),
      });
      if (res.ok) { onPhaseUpdated(phase, editedData); setIsEditing(false); }
      else { const d = await res.json(); alert(d.error || 'Save failed'); }
    } catch (err: any) { alert(`Save failed: ${err.message}`); }
    finally { setIsSaving(false); }
  };

  const removeMedia = async (mediaId: string) => {
    setRemovingMedia(mediaId);
    try {
      await fetch('/api/admin/lesson-media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_id: mediaId }),
      });
      onMediaRemoved(mediaId);
    } catch (err: any) { console.error('Remove failed:', err); }
    finally { setRemovingMedia(null); }
  };

  return (
    <div className="space-y-5">
      {/* Media Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Film className="w-3 h-3" />Media ({phaseMedia.length})
          </h4>
          <button onClick={() => setShowMediaModal(true)}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" />Add Media
          </button>
        </div>
        {phaseMedia.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {phaseMedia.map((media) => (
              <div key={media.id} className="relative group rounded-lg overflow-hidden bg-white/5 aspect-video">
                {media.thumbnail ? (
                  <img src={media.thumbnail} alt={media.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {media.media_type === 'image' && <ImageIcon className="w-5 h-5 text-slate-500" />}
                    {(media.media_type === 'video' || media.media_type === 'youtube') && <Video className="w-5 h-5 text-slate-500" />}
                    {media.media_type === 'gif' && <Smile className="w-5 h-5 text-slate-500" />}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => void removeMedia(media.id)} disabled={removingMedia === media.id}
                    className="bg-red-500 hover:bg-red-400 text-white p-1.5 rounded-lg transition-colors">
                    {removingMedia === media.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                  <p className="text-white text-[10px] truncate">{media.title}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <button onClick={() => setShowMediaModal(true)}
            className="w-full border border-dashed border-white/10 hover:border-amber-500/30 rounded-lg p-4 text-center transition-colors group">
            <Film className="w-5 h-5 text-slate-600 group-hover:text-amber-500/60 mx-auto mb-1.5 transition-colors" />
            <p className="text-slate-500 text-xs group-hover:text-slate-400 transition-colors">Add images, videos or GIFs to make this phase visual and exciting</p>
          </button>
        )}
      </div>

      {/* Phase Content */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Phase Content</h4>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={savePhase} disabled={isSaving}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-colors">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
                </button>
                <button onClick={() => { setEditedData(phaseData || {}); setIsEditing(false); }}
                  className="text-slate-400 hover:text-white text-xs transition-colors">Cancel</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors">
                <Edit3 className="w-3.5 h-3.5" />Edit
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Phase Goal</label>
              <textarea value={editedData.phase_goal || ''} onChange={(e) => setEditedData({ ...editedData, phase_goal: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500/50 resize-none" rows={2} />
            </div>
            <div>
              <label className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Opening Question</label>
              <input type="text" value={editedData.opening_question || ''} onChange={(e) => setEditedData({ ...editedData, opening_question: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Smile className="w-3 h-3 text-yellow-400" />Funny Moment
              </label>
              <input type="text" value={editedData.funny_moment || ''} onChange={(e) => setEditedData({ ...editedData, funny_moment: e.target.value })}
                placeholder="A joke or funny analogy Lumi will use..."
                className="w-full bg-white/5 border border-yellow-500/20 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-yellow-500/50 placeholder-slate-600" />
            </div>
            <div>
              <label className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />Fun Fact
              </label>
              <input type="text" value={editedData.fun_fact || ''} onChange={(e) => setEditedData({ ...editedData, fun_fact: e.target.value })}
                placeholder="An amazing fact that will blow their minds..."
                className="w-full bg-white/5 border border-amber-500/20 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-500/50 placeholder-slate-600" />
            </div>
            <div>
              <label className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Teaching Points</label>
              {(editedData.teaching_points || []).map((tp: string, i: number) => (
                <div key={i} className="flex gap-2 mb-1.5">
                  <input type="text" value={tp} onChange={(e) => {
                    const updated = [...(editedData.teaching_points || [])];
                    updated[i] = e.target.value;
                    setEditedData({ ...editedData, teaching_points: updated });
                  }} className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-amber-500/50" />
                  <button onClick={() => setEditedData({ ...editedData, teaching_points: (editedData.teaching_points || []).filter((_: any, j: number) => j !== i) })}
                    className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button onClick={() => setEditedData({ ...editedData, teaching_points: [...(editedData.teaching_points || []), ''] })}
                className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 mt-1 transition-colors">
                <Plus className="w-3.5 h-3.5" />Add point
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {phaseData?.phase_goal && (
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">Goal</p>
                <p className="text-xs text-slate-300">{phaseData.phase_goal}</p>
              </div>
            )}
            {phaseData?.opening_question && (
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-sky-400 uppercase mb-1">Opening Question</p>
                <p className="text-xs text-slate-300 italic">&ldquo;{phaseData.opening_question}&rdquo;</p>
              </div>
            )}
            {phaseData?.funny_moment && (
              <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-[10px] font-bold text-yellow-400 uppercase mb-1">😄 Funny Moment</p>
                <p className="text-xs text-yellow-200">{phaseData.funny_moment}</p>
              </div>
            )}
            {phaseData?.fun_fact && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">⭐ Fun Fact</p>
                <p className="text-xs text-amber-200">{phaseData.fun_fact}</p>
              </div>
            )}
            {phaseData?.teaching_points?.length > 0 && (
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1.5">Teaching Points ({phaseData.teaching_points.length})</p>
                <ul className="space-y-1">
                  {phaseData.teaching_points.map((tp: string, i: number) => (
                    <li key={i} className="text-xs text-slate-300 flex gap-2">
                      <span className="text-emerald-500 shrink-0">{i + 1}.</span><span>{tp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {phaseData?.questions?.length > 0 && (
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-purple-400 uppercase mb-1.5">Questions ({phaseData.questions.length})</p>
                <ul className="space-y-2">
                  {phaseData.questions.map((q: any, i: number) => (
                    <li key={i} className="text-xs">
                      <p className="text-white">{q.question || q.text || q}</p>
                      {(q.expected_answer || q.answer) && <p className="text-emerald-400 mt-0.5">✓ {q.expected_answer || q.answer}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!phaseData && (
              <p className="text-slate-500 text-xs text-center py-4">No content for this phase yet.</p>
            )}
          </div>
        )}
      </div>

      {showMediaModal && (
        <MediaSearchModal
          lessonId={lessonId} phase={phase} topic={topic}
          keyConcepts={keyConcepts} ageGroup={ageGroup}
          onAdded={(media) => { onMediaAdded(media); setShowMediaModal(false); }}
          onClose={() => setShowMediaModal(false)}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminTestLessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<LessonPhase>('spark');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => `admin-test-${Date.now()}`);
  const [adminPanelTab, setAdminPanelTab] = useState<'content' | 'refine' | 'variants' | 'notes' | 'report'>('content');
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinementHistory, setRefinementHistory] = useState<{ instruction: string; timestamp: Date }[]>([]);
  const [selectedLearningStyle, setSelectedLearningStyle] = useState<LearningStyle>('visual');
  const [selectedLength, setSelectedLength] = useState<LessonLength>('standard');
  const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
  const [variantSuccess, setVariantSuccess] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [phaseMedia, setPhaseMedia] = useState<Record<string, PhaseMedia[]>>({});
  const [engagementScore, setEngagementScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentPhaseIdx = PHASE_ORDER.indexOf(currentPhase);
  const currentPhaseData = lesson ? lesson[`${currentPhase}_json`] : null;
  const currentPhaseMedia = phaseMedia[currentPhase] || [];
  const topicTitle = lesson?.topics?.title || 'Lesson';
  const subjectName = lesson?.topics?.subjects?.name || 'General';

  // ─── Load lesson ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLesson = async () => {
      const { data, error } = await supabase
        .from('topic_lesson_structures')
        .select('*, topics(title, description, subjects(name, colour_hex, color))')
        .eq('id', lessonId).single();
      if (error || !data) { setError('Lesson not found'); setLoading(false); return; }
      setLesson(data);
      setLoading(false);
      const tTitle = data.topics?.title || 'this topic';
      const sName = data.topics?.subjects?.name || 'General';
      setMessages([{
        id: 'opening', role: 'assistant',
        content: `✨ Hey there! I'm Lumi, your learning guide! Today we're diving into **${tTitle}** in **${sName}**! 🚀\n\nWe've got 7 amazing phases to explore together — starting with a **Spark** to get your brain buzzing! ⚡\n\nType anything to begin, or ask me a question!`,
        timestamp: new Date(),
      }]);
      let qCount = 0;
      PHASE_ORDER.forEach(p => { const pd = data[`${p}_json`]; if (pd?.questions) qCount += pd.questions.length; });
      setTotalQuestions(qCount);
    };
    fetchLesson();
  }, [lessonId]);

  // ─── Load KB and media ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!lessonId) return;
    fetch(`/api/admin/knowledge-base?lesson_id=${lessonId}`)
      .then(r => r.json()).then(d => setKnowledgeBase(d.items || [])).catch(() => {});
    fetch(`/api/admin/lesson-media?lesson_id=${lessonId}`)
      .then(r => r.json()).then(d => {
        const byPhase: Record<string, PhaseMedia[]> = {};
        for (const item of (d.media || [])) {
          if (!byPhase[item.phase]) byPhase[item.phase] = [];
          byPhase[item.phase].push({
            id: item.id, phase: item.phase, media_type: item.media_type,
            url: item.url, thumbnail: item.thumbnail, title: item.title,
            lumi_instruction: item.lumi_instruction,
          });
        }
        setPhaseMedia(byPhase);
      }).catch(() => {});
  }, [lessonId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user' && !m.isAdmin).length;
    setEngagementScore(Math.min(100, Math.round((userMessages / Math.max(1, totalQuestions)) * 100)));
  }, [messages, totalQuestions]);

  // ─── Auto-save session ──────────────────────────────────────────────────────
  const saveSession = useCallback(async (action: 'upsert' | 'end' = 'upsert') => {
    if (!lesson) return;
    try {
      await fetch('/api/admin/save-test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId, lesson_id: lessonId, admin_email: 'admin', action,
          chat_transcript: messages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp, phase: currentPhase })),
          admin_notes: adminNotes, refinements_applied: refinementHistory, variants_generated: [],
        }),
      });
    } catch {}
  }, [lesson, sessionId, lessonId, messages, adminNotes, refinementHistory, currentPhase]);

  useEffect(() => {
    const timer = setTimeout(() => saveSession('upsert'), 3000);
    return () => clearTimeout(timer);
  }, [messages, adminNotes, refinementHistory]);

  useEffect(() => {
    const handleUnload = () => saveSession('end');
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [saveSession]);

  // ─── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isStreaming || !lesson) return;
    setInputValue('');
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, userMsg, { id: assistantMsgId, role: 'assistant', content: '', timestamp: new Date() }]);
    setIsStreaming(true);
    try {
      const phaseData = lesson[`${currentPhase}_json`];
      const systemPrompt = buildAdminTestSystemPrompt({
        topicTitle, subjectName, ageGroup: lesson.age_group, keyStage: lesson.key_stage,
        currentPhase, phaseData, lessonStructure: lesson, knowledgeBase,
        phaseMedia: currentPhaseMedia,
      });
      const response = await fetch('/api/lumi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: 'admin-test', topic_id: lesson.topic_id,
          subject_slug: 'admin-test', topic_slug: 'admin-test',
          session_id: sessionId, current_phase: currentPhase,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          admin_mode: true, admin_system_prompt: systemPrompt,
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
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.replace_text !== undefined) { fullText = parsed.replace_text; }
              else { const delta = parsed.text || parsed.delta?.text || parsed.choices?.[0]?.delta?.content || ''; if (delta) fullText += delta; }
              setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fullText } : m));
            } catch {}
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: `Oops! I had a little hiccup there. Error: ${err.message}` } : m));
    } finally { setIsStreaming(false); }
  }, [inputValue, isStreaming, lesson, messages, currentPhase, sessionId, knowledgeBase, currentPhaseMedia, topicTitle, subjectName]);

  // ─── Refinement ─────────────────────────────────────────────────────────────
  const handleRefinement = async () => {
    if (!refinementInput.trim() || isRefining || !lesson) return;
    setIsRefining(true);
    try {
      const res = await fetch('/api/admin/refine-lesson', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, instruction: refinementInput, target_phase: currentPhase, current_lesson: lesson }),
      });
      const data = await res.json();
      if (res.ok && data.updated_lesson) {
        setLesson(data.updated_lesson);
        setRefinementHistory(prev => [{ instruction: refinementInput, timestamp: new Date() }, ...prev]);
        setRefinementInput('');
        setMessages(prev => [...prev, {
          id: `admin-note-${Date.now()}`, role: 'assistant',
          content: `🔧 **Admin Update Applied:** "${refinementInput}"\n\n${data.summary || 'The lesson has been updated based on your instruction.'}`,
          timestamp: new Date(), isAdmin: true,
        }]);
      } else { alert(data.error || 'Refinement failed'); }
    } catch (err: any) { alert(`Refinement failed: ${err.message}`); }
    finally { setIsRefining(false); }
  };

  // ─── Generate Variant ────────────────────────────────────────────────────────
  const handleGenerateVariant = async () => {
    if (!lesson || isGeneratingVariant) return;
    setIsGeneratingVariant(true);
    setVariantSuccess(null);
    try {
      const res = await fetch('/api/admin/generate-variant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId, learning_style: selectedLearningStyle, lesson_length: selectedLength,
          topic_title: lesson.topics?.title, subject_name: lesson.topics?.subjects?.name,
          age_group: lesson.age_group, key_stage: lesson.key_stage, base_lesson: lesson,
        }),
      });
      const data = await res.json();
      if (res.ok) { setVariantSuccess(`✅ ${data.message || 'Variant generated and saved!'}`); }
      else { alert(data.error || 'Variant generation failed'); }
    } catch (err: any) { alert(`Failed: ${err.message}`); }
    finally { setIsGeneratingVariant(false); }
  };

  // ─── Media handlers ──────────────────────────────────────────────────────────
  const handleMediaAdded = (media: PhaseMedia) => {
    setPhaseMedia(prev => ({ ...prev, [media.phase]: [...(prev[media.phase] || []), media] }));
  };
  const handleMediaRemoved = (phase: string, mediaId: string) => {
    setPhaseMedia(prev => ({ ...prev, [phase]: (prev[phase] || []).filter(m => m.id !== mediaId) }));
  };
  const handlePhaseUpdated = (phase: LessonPhase, data: any) => {
    setLesson((prev: any) => ({ ...prev, [`${phase}_json`]: data }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="text-amber-400 animate-spin" />
        <p className="text-slate-400">Loading Production Studio...</p>
      </div>
    </div>
  );
  if (error || !lesson) return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <p className="text-white font-bold mb-2">Lesson not found</p>
        <button onClick={() => router.push('/admin/lessons')} className="text-amber-400 hover:underline">← Back to Lessons</button>
      </div>
    </div>
  );

  const adminTabs = [
    { id: 'content', label: 'Content', icon: Layers },
    { id: 'refine', label: 'Refine', icon: Wand2 },
    { id: 'variants', label: 'Variants', icon: RefreshCw },
    { id: 'notes', label: 'Notes', icon: MessageSquare },
    { id: 'report', label: 'Report', icon: BarChart2 },
  ];
  const totalMediaCount = Object.values(phaseMedia).flat().length;

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0d1117] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={async () => { await saveSession('end'); router.push('/admin/lessons'); }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} />Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div>
            <h1 className="text-white font-bold text-sm">{topicTitle}</h1>
            <p className="text-[10px] text-slate-400">{subjectName} • {lesson.key_stage} • Age {lesson.age_group}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 uppercase tracking-widest">🎬 Production Studio</span>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${lesson.status === 'live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{lesson.status || 'draft'}</span>
          {totalMediaCount > 0 && (
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1">
              <Film size={10} />{totalMediaCount} media
            </span>
          )}
        </div>
      </div>

      {/* ── Phase Navigator ── */}
      <div className="flex items-center gap-1 px-6 py-2.5 border-b border-white/5 overflow-x-auto bg-[#0d1117]">
        {PHASE_ORDER.map((phase, idx) => {
          const isActive = phase === currentPhase;
          const isCompleted = idx < currentPhaseIdx;
          const mediaCount = (phaseMedia[phase] || []).length;
          const hasFunny = lesson[`${phase}_json`]?.funny_moment;
          return (
            <button key={phase} onClick={() => setCurrentPhase(phase)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${isActive ? `border ${PHASE_COLOURS[phase]}` : isCompleted ? 'text-slate-400 bg-white/5 border border-white/5' : 'text-slate-500 bg-transparent border border-transparent hover:border-white/10 hover:text-slate-400'}`}>
              <span>{PHASE_ICONS[phase]}</span>
              <span className="capitalize">{phase}</span>
              {isCompleted && <Check size={10} className="text-emerald-400" />}
              {hasFunny && <span title="Has funny moment" className="text-[9px]">😄</span>}
              {mediaCount > 0 && <span className="bg-blue-500/80 text-white text-[9px] font-bold px-1 rounded-full">{mediaCount}</span>}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button onClick={() => currentPhaseIdx > 0 && setCurrentPhase(PHASE_ORDER[currentPhaseIdx - 1])} disabled={currentPhaseIdx === 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
          <button onClick={() => currentPhaseIdx < PHASE_ORDER.length - 1 && setCurrentPhase(PHASE_ORDER[currentPhaseIdx + 1])} disabled={currentPhaseIdx === PHASE_ORDER.length - 1}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Chat */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/10">
          {/* Phase header */}
          <div className={`px-6 py-3 border-b border-white/5 bg-gradient-to-r ${PHASE_GRADIENTS[currentPhase]}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PHASE_ICONS[currentPhase]}</span>
                <div>
                  <h2 className="text-white font-bold capitalize">{currentPhase} Phase</h2>
                  <p className="text-xs text-slate-400 line-clamp-1">{currentPhaseData?.phase_goal || 'No goal defined yet'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentPhaseData?.funny_moment && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                    <Smile size={10} />Has joke
                  </span>
                )}
                {currentPhaseData?.fun_fact && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                    <Sparkles size={10} />Fun fact
                  </span>
                )}
                {currentPhaseMedia.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1">
                    <Film size={10} />{currentPhaseMedia.length} media
                  </span>
                )}
                {currentPhaseData?.teaching_points?.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                    {currentPhaseData.teaching_points.length} points
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black mr-2 shrink-0 mt-0.5">
                    {msg.isAdmin ? '🔧' : 'L'}
                  </div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-500/20 text-white border border-amber-500/30 rounded-tr-sm'
                    : msg.isAdmin
                    ? 'bg-blue-500/10 text-blue-200 border border-blue-500/20 rounded-tl-sm'
                    : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-sm'
                }`}>
                  <div className="whitespace-pre-wrap">
                    {msg.content || (isStreaming && msg.role === 'assistant' ? (
                      <span className="flex gap-1 py-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    ) : '')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts */}
          {currentPhaseData && (
            <div className="px-6 py-2 flex gap-2 overflow-x-auto border-t border-white/5">
              {currentPhaseData.opening_question && (
                <button onClick={() => sendMessage(currentPhaseData.opening_question)}
                  className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors whitespace-nowrap shrink-0">
                  ⚡ {currentPhaseData.opening_question.substring(0, 40)}...
                </button>
              )}
              {currentPhaseData.questions?.slice(0, 2).map((q: any, i: number) => (
                <button key={i} onClick={() => sendMessage(q.question || q.text || q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0">
                  Q{i + 1}: {(q.question || q.text || q).substring(0, 35)}...
                </button>
              ))}
            </div>
          )}

          {/* Chat input */}
          <div className="px-6 py-4 border-t border-white/5">
            <div className="flex gap-3">
              <input ref={inputRef} type="text" value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void sendMessage()}
                placeholder={`Chat with Lumi as a student in the ${currentPhase} phase...`}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                disabled={isStreaming} />
              <button onClick={() => void sendMessage()} disabled={isStreaming || !inputValue.trim()}
                className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 transition-all">
                {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Testing as a student in {lesson.key_stage} • Age {lesson.age_group} • Powered by Claude
            </p>
          </div>
        </div>

        {/* RIGHT: Admin Panel */}
        <div className="w-80 flex flex-col bg-[#0d1117] shrink-0">
          {/* Panel tabs */}
          <div className="flex border-b border-white/5 overflow-x-auto">
            {adminTabs.map((tab) => (
              <button key={tab.id} onClick={() => setAdminPanelTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${adminPanelTab === tab.id ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-white'}`}>
                <tab.icon size={12} />{tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* ── Content Tab ── */}
            {adminPanelTab === 'content' && (
              <PhaseContentPanel
                lessonId={lessonId} phase={currentPhase}
                phaseData={currentPhaseData} phaseMedia={currentPhaseMedia}
                topic={topicTitle} keyConcepts={lesson?.key_concepts || []}
                ageGroup={lesson?.age_group || '8-11'}
                onPhaseUpdated={handlePhaseUpdated}
                onMediaAdded={handleMediaAdded}
                onMediaRemoved={(mediaId) => handleMediaRemoved(currentPhase, mediaId)}
              />
            )}

            {/* ── Refine Tab ── */}
            {adminPanelTab === 'refine' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-white mb-1">Refine with AI</h3>
                  <p className="text-[10px] text-slate-400 mb-3">Tell Lumi what to change. It will update the lesson structure in real-time.</p>
                  <textarea value={refinementInput} onChange={(e) => setRefinementInput(e.target.value)}
                    placeholder={`e.g. "Make the ${currentPhase} phase more visual"\n"Add a funny analogy"\n"Simplify for younger children"`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 h-28 resize-none" />
                  <button onClick={handleRefinement} disabled={isRefining || !refinementInput.trim()}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 disabled:opacity-50 transition-all">
                    {isRefining ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    {isRefining ? 'Refining...' : 'Apply Refinement'}
                  </button>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Quick Refinements</p>
                  <div className="space-y-1.5">
                    {[
                      { label: '😄 Add funny moment', prompt: `Add a hilarious analogy or joke to the ${currentPhase} phase that children aged ${lesson.age_group} would find funny` },
                      { label: '⭐ Add fun fact', prompt: `Add an amazing mind-blowing fun fact to the ${currentPhase} phase` },
                      { label: '🎨 More visual', prompt: `Make the ${currentPhase} phase more visual with diagrams and imagery descriptions` },
                      { label: '🤲 Hands-on activity', prompt: `Add a kinesthetic hands-on activity to the ${currentPhase} phase` },
                      { label: '📖 Simpler language', prompt: `Simplify the language in the ${currentPhase} phase for younger learners` },
                      { label: '🌍 Real-world examples', prompt: `Add more real-world examples to the ${currentPhase} phase` },
                      { label: '❓ More questions', prompt: `Add 3 more engaging questions to the ${currentPhase} phase` },
                      { label: '⚡ Make it shorter', prompt: `Make the ${currentPhase} phase more concise and punchy` },
                      { label: '🔬 More depth', prompt: `Add more depth and detail to the ${currentPhase} phase for advanced learners` },
                    ].map((shortcut) => (
                      <button key={shortcut.label} onClick={() => setRefinementInput(shortcut.prompt)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-400 hover:text-white transition-colors">
                        {shortcut.label}
                      </button>
                    ))}
                  </div>
                </div>
                {refinementHistory.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">History</p>
                    {refinementHistory.map((h, i) => (
                      <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/5 mb-2">
                        <p className="text-xs text-slate-400">{h.instruction}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{h.timestamp.toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Variants Tab ── */}
            {adminPanelTab === 'variants' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-white mb-1">Generate Lesson Variant</h3>
                  <p className="text-[10px] text-slate-400 mb-4">Create adapted versions for different learning styles and lengths. Each variant is saved separately.</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Learning Style</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LEARNING_STYLES.map((style) => (
                      <button key={style.value} onClick={() => setSelectedLearningStyle(style.value)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${selectedLearningStyle === style.value ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                        <span className="text-lg">{style.icon}</span>
                        <p className="text-xs font-bold text-white mt-1">{style.label}</p>
                        <p className="text-[10px] text-slate-500">{style.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Lesson Length</p>
                  <div className="space-y-2">
                    {LESSON_LENGTHS.map((length) => (
                      <button key={length.value} onClick={() => setSelectedLength(length.value)}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${selectedLength === length.value ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{length.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-white">{length.label}</p>
                              <p className="text-[10px] text-slate-500">{length.desc}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400">{length.minutes}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerateVariant} disabled={isGeneratingVariant}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 disabled:opacity-50 transition-all">
                  {isGeneratingVariant ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isGeneratingVariant ? 'Generating...' : 'Generate Variant'}
                </button>
                {variantSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Check size={16} className="text-emerald-400" />
                    <p className="text-xs text-emerald-400">{variantSuccess}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Notes Tab ── */}
            {adminPanelTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-white mb-1">Admin Notes</h3>
                  <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)}
                    placeholder={`Note about the ${currentPhase} phase...`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 h-20 resize-none" />
                  <button
                    onClick={() => {
                      if (!newNote.trim()) return;
                      setAdminNotes(prev => [...prev, { id: `note-${Date.now()}`, phase: currentPhase, note: newNote, timestamp: new Date(), resolved: false }]);
                      setNewNote('');
                    }}
                    disabled={!newNote.trim()}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 disabled:opacity-50 transition-all">
                    <Plus size={16} />Add Note
                  </button>
                </div>
                {adminNotes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">No notes yet.</div>
                ) : (
                  <div className="space-y-2">
                    {adminNotes.map((note) => (
                      <div key={note.id} className={`p-3 rounded-xl border ${note.resolved ? 'border-white/5 opacity-50' : 'border-white/10'} bg-white/5`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PHASE_COLOURS[note.phase]}`}>{PHASE_ICONS[note.phase]} {note.phase}</span>
                              <span className="text-[10px] text-slate-500">{note.timestamp.toLocaleTimeString()}</span>
                            </div>
                            <p className="text-sm text-slate-300">{note.note}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setAdminNotes(prev => prev.map(n => n.id === note.id ? { ...n, resolved: !n.resolved } : n))}
                              className="p-1 rounded text-slate-500 hover:text-emerald-400 transition-colors"><Check size={12} /></button>
                            <button onClick={() => setAdminNotes(prev => prev.filter(n => n.id !== note.id))}
                              className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Report Tab ── */}
            {adminPanelTab === 'report' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-white mb-1">LA Report Preview</h3>
                  <p className="text-[10px] text-slate-400 mb-3">Live metrics from this test session — proof of learning for Local Authority reports.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Engagement Score</p>
                    <p className="text-lg font-bold text-amber-400">{engagementScore}%</p>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${engagementScore}%` }} />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Messages Sent</p>
                    <p className="text-lg font-bold text-purple-400">{messages.filter(m => m.role === 'user').length}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Phases Visited</p>
                    <p className="text-lg font-bold text-blue-400">{currentPhaseIdx + 1}/7</p>
                  </div>
                  <div className="flex gap-1">
                    {PHASE_ORDER.map((p, i) => (
                      <div key={p} title={p} className={`flex-1 h-2 rounded-full transition-colors ${i <= currentPhaseIdx ? 'bg-blue-400' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Media Attached</p>
                    <p className="text-lg font-bold text-pink-400">{totalMediaCount}</p>
                  </div>
                  {totalMediaCount > 0 && (
                    <div className="mt-2 space-y-1">
                      {PHASE_ORDER.map(p => {
                        const count = (phaseMedia[p] || []).length;
                        if (count === 0) return null;
                        return (
                          <div key={p} className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 capitalize">{PHASE_ICONS[p]} {p}</span>
                            <span className="text-slate-300">{count} item{count > 1 ? 's' : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {refinementHistory.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Refinements Applied</p>
                      <p className="text-lg font-bold text-orange-400">{refinementHistory.length}</p>
                    </div>
                  </div>
                )}
                {adminNotes.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Admin Notes</p>
                      <p className="text-lg font-bold text-slate-300">{adminNotes.length}</p>
                    </div>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Curriculum Coverage</p>
                  <p className="text-xs text-emerald-300">{lesson.key_stage} • {subjectName} • Age {lesson.age_group}</p>
                  <p className="text-[10px] text-emerald-400/60 mt-1">Aligned with UK National Curriculum</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatPhaseForLumi(phaseName: string, phaseData: any): string {
  if (!phaseData) return `${phaseName.toUpperCase()}: No content yet.`;
  const lines: string[] = [];
  lines.push(`=== ${phaseName.toUpperCase()} PHASE ===`);
  if (phaseData.phase_goal) lines.push(`Goal: ${phaseData.phase_goal}`);
  if (phaseData.opening_question) lines.push(`Opening Question: "${phaseData.opening_question}"`);
  if (phaseData.funny_moment) lines.push(`\n🎭 FUNNY MOMENT TO USE: "${phaseData.funny_moment}"\n→ Weave this in naturally — don't just read it out. Make the child laugh!`);
  if (phaseData.fun_fact) lines.push(`\n⭐ FUN FACT TO SHARE: "${phaseData.fun_fact}"\n→ Say "Did you know..." and deliver it with excitement!`);
  if (phaseData.teaching_points?.length) {
    lines.push(`\nTeaching Points (cover these naturally in conversation):`);
    phaseData.teaching_points.forEach((tp: string, i: number) => lines.push(`  ${i + 1}. ${tp}`));
  }
  if (phaseData.questions?.length) {
    lines.push(`\nQuestions to Ask (one at a time, wait for answer):`);
    phaseData.questions.forEach((q: any, i: number) => {
      const qText = q.question || q.text || q;
      const answer = q.expected_answer || q.answer || '';
      const hints = q.hints || (q.hint ? [q.hint] : []);
      lines.push(`  Q${i + 1}: ${qText}`);
      if (answer) lines.push(`    ✓ Expected: ${answer}`);
      if (hints.length) lines.push(`    💡 Hint if stuck: ${hints[0]}`);
    });
  }
  if (phaseData.activities?.length) {
    lines.push(`\nActivities:`);
    phaseData.activities.forEach((a: any, i: number) => {
      const act = typeof a === 'string' ? a : (a.description || a.title || JSON.stringify(a));
      lines.push(`  ${i + 1}. ${act}`);
    });
  }
  if (phaseData.closing_message) lines.push(`\nClosing Message: "${phaseData.closing_message}"`);
  if (phaseData.transition_to_next) lines.push(`Transition: "${phaseData.transition_to_next}"`);
  if (phaseData.summary) lines.push(`Summary: ${phaseData.summary}`);
  return lines.join('\n');
}

function buildAdminTestSystemPrompt({
  topicTitle, subjectName, ageGroup, keyStage, currentPhase, phaseData,
  lessonStructure, knowledgeBase = [], phaseMedia = [],
}: {
  topicTitle: string; subjectName: string; ageGroup: string; keyStage: string;
  currentPhase: string; phaseData: any; lessonStructure: any;
  knowledgeBase?: any[]; phaseMedia?: PhaseMedia[];
}): string {
  const ageCalibration = getAgeCalibration(ageGroup);
  const phaseOrder = ['spark', 'explore', 'anchor', 'practise', 'create', 'check', 'celebrate'];
  const phaseIndex = phaseOrder.indexOf(currentPhase);
  const completedPhases = phaseOrder.slice(0, phaseIndex);
  const upcomingPhases = phaseOrder.slice(phaseIndex + 1);
  const fullLessonMap = phaseOrder.map(p => {
    const pd = lessonStructure[`${p}_json`];
    return `${p.toUpperCase()}: ${pd?.phase_goal || 'Not yet generated'}`;
  }).join('\n');
  const mediaContext = phaseMedia.length > 0
    ? `\nMEDIA AVAILABLE FOR THIS PHASE (reference these to make the lesson visual):\n${phaseMedia.map((m, i) => `[${i + 1}] ${m.media_type.toUpperCase()}: "${m.title}" — ${m.lumi_instruction}`).join('\n')}`
    : '';
  const kbContext = knowledgeBase.filter(kb => kb.is_active).length > 0
    ? `\nKNOWLEDGE BASE (use to enrich your teaching):\n${knowledgeBase.filter(kb => kb.is_active).map((kb, i) => {
        let entry = `[${i + 1}] ${kb.title}`;
        if (kb.extracted_summary) entry += `: ${kb.extracted_summary}`;
        if (kb.text_content && kb.content_type === 'text') entry += `\n    ${kb.text_content.slice(0, 400)}${kb.text_content.length > 400 ? '...' : ''}`;
        if (kb.key_concepts?.length > 0) entry += `\n    Key concepts: ${kb.key_concepts.join(', ')}`;
        return entry;
      }).join('\n\n')}`
    : '';

  return `You are Lumi, an enthusiastic, warm, and genuinely funny AI tutor for Luminary, a UK homeschooling platform.

YOUR PERSONALITY — THIS IS CRITICAL:
- You are GENUINELY excited about learning and it shows in every single message
- You have a GREAT sense of humour — you make age-appropriate jokes, funny analogies, and witty observations that make children actually laugh out loud
- Examples of your humour style: "Photosynthesis is basically plants eating sunlight — imagine if YOU could eat sunlight instead of having to make sandwiches!" or "The mitochondria is the powerhouse of the cell — which sounds impressive until you realise it's basically just a tiny battery"
- You celebrate correct answers with REAL enthusiasm ("YES! That's exactly right! You're basically a genius! 🎉")
- You handle wrong answers with warmth and humour ("Ooh, close! But not quite — think of it like this...")
- You use CREATIVE ANALOGIES to explain complex things — always relate to things children know (food, games, superheroes, animals)
- You NEVER lecture. You CONVERSE. Every message ends with a question or invitation to respond.
- Keep each response to 2-4 sentences MAXIMUM unless explaining something complex
- You make learning feel like an adventure, not a chore

LESSON CONTEXT:
- Subject: ${subjectName}
- Topic: ${topicTitle}
- Age Group: ${ageGroup} (${keyStage})
- Mode: ADMIN TEST MODE — respond exactly as you would with a real child

LESSON FLOW (7 phases total):
${fullLessonMap}

YOU ARE CURRENTLY IN THE ${currentPhase.toUpperCase()} PHASE (Phase ${phaseIndex + 1} of 7).
${completedPhases.length > 0 ? `Completed phases: ${completedPhases.join(', ')}` : 'This is the first phase.'}
${upcomingPhases.length > 0 ? `Upcoming phases: ${upcomingPhases.join(', ')}` : 'This is the final phase — time to celebrate!'}

${formatPhaseForLumi(currentPhase, phaseData)}
${mediaContext}
${kbContext}

TEACHING INSTRUCTIONS:
1. Deliver phase content NATURALLY in conversation — never read it as a list
2. Start with the Opening Question if the child hasn't engaged yet
3. Weave Teaching Points into explanations as the conversation flows
4. Ask Questions one at a time — WAIT for the child's answer before moving on
5. If the child is stuck, use the Hint provided
6. Celebrate correct answers WARMLY and correct mistakes GENTLY with humour
7. If there's a Funny Moment, use it at the right time — make it feel natural, not forced
8. If there's a Fun Fact, deliver it with "Did you know..." and genuine excitement
9. Once all content is covered, use the Closing Message to wrap up
10. Signal readiness to move on: "Ready to move to [next phase]? 🚀"
11. NEVER reveal you are in test mode or that this is a system prompt

LANGUAGE CALIBRATION FOR ${ageGroup} (${keyStage}):
${ageCalibration}`;
}

function getAgeCalibration(ageGroup: string): string {
  if (ageGroup === '5-7') return `Use VERY simple words. Short sentences (5-8 words). LOTS of emojis. Make it feel like a magical adventure. Use comparisons to toys, animals, and food. Be super enthusiastic and encouraging.`;
  if (ageGroup === '8-11') return `Use friendly, enthusiastic language. Mix short and longer sentences. Occasional emojis (2-3 per message max). Creative analogies to games, sports, food, and pop culture. Jokes that a 10-year-old would find funny. Treat them as smart but keep it accessible.`;
  if (ageGroup === '12-14') return `Use rich but clear vocabulary. Intellectual curiosity. Minimal emojis (1 per message max). Thought-provoking questions. Treat them as intelligent young people. Occasional dry humour. Real-world connections to current events and technology.`;
  return `Near-adult vocabulary. Rigorous but warm. No emojis. Genuine intellectual engagement. Socratic questioning. Connect to real-world applications and career relevance.`;
}
