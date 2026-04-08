'use client';

import { useState, useCallback } from 'react';
import { Search, Image, Video, Smile, Sparkles, X, Plus, ExternalLink, Loader2, Upload } from 'lucide-react';

interface MediaResult {
  id: string;
  type: 'image' | 'video' | 'gif' | 'youtube';
  url: string;
  thumbnail: string;
  title: string;
  source: string;
  relevance_score: number;
  lumi_suggestion: string;
}

interface MediaPickerProps {
  lessonId: string;
  phase: string;
  topic: string;
  keyConcepts?: string[];
  ageGroup?: string;
  onMediaAdded: (media: MediaResult, lumiInstruction: string) => void;
  onClose: () => void;
}

const TABS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'image', label: 'Images', icon: Image },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'gif', label: 'GIFs', icon: Smile },
];

export default function MediaPicker({
  lessonId,
  phase,
  topic,
  keyConcepts = [],
  ageGroup = '8-11',
  onMediaAdded,
  onClose,
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<MediaResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaResult | null>(null);
  const [lumiInstruction, setLumiInstruction] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [addingMedia, setAddingMedia] = useState(false);

  const handleLumiSearch = useCallback(async () => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/admin/search-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: searchQuery || topic,
          phase,
          key_concepts: keyConcepts,
          age_group: ageGroup,
          search_type: activeTab === 'all' ? 'all' : activeTab,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      }
    } catch (err) {
      console.error('Media search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, topic, phase, keyConcepts, ageGroup, activeTab]);

  const handleAddMedia = useCallback(async (media: MediaResult) => {
    setAddingMedia(true);
    try {
      const instruction = lumiInstruction || media.lumi_suggestion;
      const res = await fetch('/api/admin/lesson-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          phase,
          media_type: media.type,
          url: media.url,
          thumbnail: media.thumbnail,
          title: media.title,
          source: media.source,
          lumi_instruction: instruction,
          display_order: 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onMediaAdded(media, instruction);
      }
    } catch (err) {
      console.error('Failed to add media:', err);
    } finally {
      setAddingMedia(false);
    }
  }, [lessonId, phase, lumiInstruction, onMediaAdded]);

  const handleAddManualUrl = useCallback(async () => {
    if (!manualUrl.trim()) return;
    const isYoutube = manualUrl.includes('youtube.com') || manualUrl.includes('youtu.be');
    const isGif = manualUrl.toLowerCase().includes('.gif');
    const type = isYoutube ? 'youtube' : isGif ? 'gif' : 'image';

    let embedUrl = manualUrl;
    if (isYoutube) {
      const videoId = manualUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    const media: MediaResult = {
      id: `manual-${Date.now()}`,
      type,
      url: embedUrl,
      thumbnail: isYoutube ? `https://img.youtube.com/vi/${embedUrl.split('/').pop()}/mqdefault.jpg` : embedUrl,
      title: 'Custom media',
      source: 'Manual',
      relevance_score: 1,
      lumi_suggestion: lumiInstruction || `Show this ${type} during the ${phase} phase`,
    };
    await handleAddMedia(media);
    setManualUrl('');
    setShowManual(false);
  }, [manualUrl, lumiInstruction, phase, handleAddMedia]);

  const filteredResults = activeTab === 'all' ? results : results.filter(r => r.type === activeTab || (activeTab === 'video' && r.type === 'youtube'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Add Media to {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">Search for images, videos, and GIFs to make this phase visually exciting</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-5 border-b border-gray-700">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLumiSearch()}
                placeholder={`Search for ${topic} media...`}
                className="w-full bg-gray-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm border border-gray-600 focus:border-amber-500 focus:outline-none placeholder-gray-500"
              />
            </div>
            <button
              onClick={handleLumiSearch}
              disabled={isSearching}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-3 rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isSearching ? 'Searching...' : 'Lumi Search'}
            </button>
            <button
              onClick={() => setShowManual(!showManual)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              URL
            </button>
          </div>

          {/* Manual URL input */}
          {showManual && (
            <div className="mt-3 flex gap-3">
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="Paste image URL, YouTube URL, or GIF URL..."
                className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-600 focus:border-purple-500 focus:outline-none placeholder-gray-500"
              />
              <button
                onClick={handleAddManualUrl}
                disabled={!manualUrl.trim() || addingMedia}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {addingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lumi instruction */}
        <div className="px-5 py-3 border-b border-gray-700 bg-gray-800/50">
          <label className="text-gray-400 text-xs font-medium block mb-1.5">How should Lumi use this? (optional)</label>
          <input
            type="text"
            value={lumiInstruction}
            onChange={(e) => setLumiInstruction(e.target.value)}
            placeholder={`e.g. "Show this when explaining ${topic} to help children visualise it"`}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-amber-500 focus:outline-none placeholder-gray-500"
          />
        </div>

        {/* Results grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Sparkles className="w-12 h-12 text-amber-400/40 mb-3" />
              <p className="text-gray-400 text-sm">Click &quot;Lumi Search&quot; to find the best media for this phase</p>
              <p className="text-gray-500 text-xs mt-1">Lumi will suggest images, videos, and GIFs that make the lesson exciting</p>
            </div>
          )}

          {isSearching && (
            <div className="flex flex-col items-center justify-center h-48">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3" />
              <p className="text-gray-400 text-sm">Lumi is searching for the best content...</p>
            </div>
          )}

          {hasSearched && !isSearching && filteredResults.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-gray-400 text-sm">No results found. Try a different search term or add a URL manually.</p>
            </div>
          )}

          {!isSearching && filteredResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredResults.map((media) => (
                <div
                  key={media.id}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedMedia?.id === media.id
                      ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedMedia(media)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-800 relative">
                    {media.thumbnail ? (
                      <img
                        src={media.thumbnail}
                        alt={media.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {media.type === 'image' && <Image className="w-8 h-8 text-gray-600" />}
                        {(media.type === 'video' || media.type === 'youtube') && <Video className="w-8 h-8 text-gray-600" />}
                        {media.type === 'gif' && <Smile className="w-8 h-8 text-gray-600" />}
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        media.type === 'image' ? 'bg-blue-500/80 text-white' :
                        media.type === 'youtube' || media.type === 'video' ? 'bg-red-500/80 text-white' :
                        'bg-purple-500/80 text-white'
                      }`}>
                        {media.type === 'youtube' ? 'YouTube' : media.type.toUpperCase()}
                      </span>
                    </div>

                    {/* Source badge */}
                    <div className="absolute top-2 right-2">
                      <span className="text-xs bg-black/60 text-gray-300 px-2 py-0.5 rounded-full">
                        {media.source}
                      </span>
                    </div>

                    {/* Lumi suggestion overlay */}
                    {media.source === 'Lumi Suggestion' && (
                      <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                        <div className="text-center p-3">
                          <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                          <p className="text-amber-300 text-xs font-medium">Lumi Suggestion</p>
                          <p className="text-gray-300 text-xs mt-1 line-clamp-2">{media.title}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5 bg-gray-800">
                    <p className="text-white text-xs font-medium line-clamp-1">{media.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{media.lumi_suggestion}</p>
                  </div>

                  {/* Add button overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleAddMedia(media);
                      }}
                      disabled={addingMedia}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      {addingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add to Lesson
                    </button>
                    {media.url && (
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedMedia && (
          <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded overflow-hidden bg-gray-700">
                {selectedMedia.thumbnail && (
                  <img src={selectedMedia.thumbnail} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <p className="text-white text-sm font-medium line-clamp-1">{selectedMedia.title}</p>
                <p className="text-gray-400 text-xs">{selectedMedia.type} · {selectedMedia.source}</p>
              </div>
            </div>
            <button
              onClick={() => void handleAddMedia(selectedMedia)}
              disabled={addingMedia}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {addingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add to {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
