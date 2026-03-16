'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wand2, Search, Check, X, AlertCircle,
  Lightbulb, Video, Gamepad2, FileText, Image, BookOpen,
  ChevronRight, Loader2, Eye, Edit, Trash2
} from 'lucide-react';
import { MOCK_SUBJECTS, MOCK_TOPICS } from '@/lib/mock-data';
import { MOCK_TOPIC_ASSETS } from '@/lib/mock-content';
import { TopicAsset, AssetType, Topic } from '@/types';

// Flatten MOCK_TOPICS (Record<string, Topic[]>) into a flat array
const ALL_TOPICS: Topic[] = Object.values(MOCK_TOPICS).flat();

const ASSET_TYPES: { type: AssetType; label: string; icon: React.ReactNode; colour: string }[] = [
  { type: 'concept_card', label: 'Concept Card', icon: <Lightbulb size={14} />, colour: '#F59E0B' },
  { type: 'video', label: 'Video', icon: <Video size={14} />, colour: '#3B82F6' },
  { type: 'diagram', label: 'Diagram', icon: <Image size={14} />, colour: '#8B5CF6' },
  { type: 'realworld_card', label: 'Real-World', icon: <BookOpen size={14} />, colour: '#10B981' },
  { type: 'game_questions', label: 'Games', icon: <Gamepad2 size={14} />, colour: '#EF4444' },
  { type: 'worksheet', label: 'Worksheet', icon: <FileText size={14} />, colour: '#6366F1' },
  { type: 'check_questions', label: 'Check Qs', icon: <Check size={14} />, colour: '#14B8A6' },
];

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generate' | 'review'>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateTopicId, setGenerateTopicId] = useState<string>('');
  const [generateTypes, setGenerateTypes] = useState<AssetType[]>([]);
  const [generatedContent, setGeneratedContent] = useState<TopicAsset[]>([]);
  const [reviewAsset, setReviewAsset] = useState<TopicAsset | null>(null);
  const [editJson, setEditJson] = useState('');

  // Get assets for a topic
  const getTopicAssets = (topicId: string) => {
    return MOCK_TOPIC_ASSETS.filter(a => a.topic_id === topicId);
  };

  // Check if a topic has a specific asset type
  const hasAssetType = (topicId: string, type: AssetType) => {
    return MOCK_TOPIC_ASSETS.some(a => a.topic_id === topicId && a.asset_type === type && a.status === 'published');
  };

  // Calculate coverage
  const totalTopics = ALL_TOPICS.length;
  const coveredTopics = ALL_TOPICS.filter(t =>
    ASSET_TYPES.some(at => hasAssetType(t.id, at.type))
  ).length;
  const coveragePercent = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0;

  const handleGenerate = async () => {
    if (!generateTopicId || generateTypes.length === 0) return;
    setGenerating(true);

    try {
      const res = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: generateTopicId,
          asset_types: generateTypes,
          age_group: '8-11',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedContent(data.assets || []);
        setActiveTab('review');
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = (asset: TopicAsset) => {
    setReviewAsset(asset);
    setEditJson(JSON.stringify(asset.content_json, null, 2));
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
        {[
          { id: 'dashboard' as const, label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
          { id: 'generate' as const, label: 'Generate Content', icon: <Wand2 size={16} /> },
          { id: 'review' as const, label: 'Review & Edit', icon: <Eye size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-light/60 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-slate-light/60 mb-1">Total Topics</p>
              <p className="text-2xl font-bold text-white">{totalTopics}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-slate-light/60 mb-1">With Content</p>
              <p className="text-2xl font-bold text-emerald">{coveredTopics}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-slate-light/60 mb-1">Coverage</p>
              <p className="text-2xl font-bold text-amber">{coveragePercent}%</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-slate-light/60 mb-1">Total Assets</p>
              <p className="text-2xl font-bold text-sky">{MOCK_TOPIC_ASSETS.length}</p>
            </div>
          </div>

          {/* Subject filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !selectedSubject ? 'bg-white/10 text-white' : 'text-slate-light/60 hover:text-white'
              }`}
              onClick={() => setSelectedSubject(null)}
            >
              All Subjects
            </button>
            {MOCK_SUBJECTS.map((s) => (
              <button
                key={s.id}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedSubject === s.id ? 'text-white' : 'text-slate-light/60 hover:text-white'
                }`}
                style={selectedSubject === s.id ? { backgroundColor: `${s.colour_hex}30`, color: s.colour_hex } : {}}
                onClick={() => setSelectedSubject(s.id)}
              >
                {s.icon_emoji} {s.name}
              </button>
            ))}
          </div>

          {/* Coverage grid */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-light/60">Topic</th>
                  {ASSET_TYPES.map((at) => (
                    <th key={at.type} className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span style={{ color: at.colour }}>{at.icon}</span>
                        <span className="text-[10px] text-slate-light/40">{at.label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_TOPICS
                  .filter((t) => !selectedSubject || t.subject_id === selectedSubject)
                  .map((topic) => {
                    const subject = MOCK_SUBJECTS.find(s => s.id === topic.subject_id);
                    return (
                      <tr key={topic.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{subject?.icon_emoji}</span>
                            <div>
                              <p className="text-sm text-white font-semibold">{topic.title}</p>
                              <p className="text-xs text-slate-light/40">{subject?.name}</p>
                            </div>
                          </div>
                        </td>
                        {ASSET_TYPES.map((at) => (
                          <td key={at.type} className="px-3 py-3 text-center">
                            {hasAssetType(topic.id, at.type) ? (
                              <span className="inline-flex w-6 h-6 rounded-full bg-emerald/20 items-center justify-center">
                                <Check size={12} className="text-emerald" />
                              </span>
                            ) : (
                              <span className="inline-flex w-6 h-6 rounded-full bg-white/5 items-center justify-center">
                                <X size={12} className="text-slate-light/20" />
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Generate Content with AI
          </h2>
          <p className="text-sm text-slate-light/60 mb-6">
            Select a topic and content types to generate. Claude will create age-appropriate content following the Luminary curriculum standards.
          </p>

          {/* Topic selector */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-white mb-2">Select Topic</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
              value={generateTopicId}
              onChange={(e) => setGenerateTopicId(e.target.value)}
            >
              <option value="">Choose a topic...</option>
              {ALL_TOPICS.map((t) => {
                const subject = MOCK_SUBJECTS.find(s => s.id === t.subject_id);
                return (
                  <option key={t.id} value={t.id}>
                    {subject?.icon_emoji} {subject?.name} — {t.title}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Content type checkboxes */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-white mb-2">Content Types to Generate</label>
            <div className="grid grid-cols-2 gap-2">
              {ASSET_TYPES.map((at) => (
                <label
                  key={at.type}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    generateTypes.includes(at.type)
                      ? 'border-amber bg-amber/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={generateTypes.includes(at.type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setGenerateTypes([...generateTypes, at.type]);
                      } else {
                        setGenerateTypes(generateTypes.filter(t => t !== at.type));
                      }
                    }}
                    className="sr-only"
                  />
                  <span style={{ color: at.colour }}>{at.icon}</span>
                  <span className="text-sm text-white">{at.label}</span>
                  {generateTypes.includes(at.type) && <Check size={14} className="text-amber ml-auto" />}
                </label>
              ))}
            </div>
          </div>

          {/* Generate all button */}
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber to-amber/80 text-navy font-bold text-sm disabled:opacity-50"
              onClick={handleGenerate}
              disabled={!generateTopicId || generateTypes.length === 0 || generating}
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Wand2 size={16} /> Generate Selected Content
                </>
              )}
            </button>
            <button
              className="px-6 py-3 rounded-xl bg-white/5 text-white font-bold text-sm hover:bg-white/10"
              onClick={() => {
                setGenerateTypes(ASSET_TYPES.map(at => at.type));
              }}
            >
              Select All
            </button>
          </div>

          {generating && (
            <div className="mt-6 p-4 rounded-xl bg-amber/10 border border-amber/20">
              <div className="flex items-center gap-3">
                <Loader2 size={20} className="text-amber animate-spin" />
                <div>
                  <p className="text-sm text-white font-bold">Generating content...</p>
                  <p className="text-xs text-slate-light/60">Claude is creating age-appropriate content for this topic. This may take 30-60 seconds.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Tab */}
      {activeTab === 'review' && (
        <div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Review & Edit Content
          </h2>
          <p className="text-sm text-slate-light/60 mb-6">
            Review generated content, make edits, and approve for publishing.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {/* Asset list */}
            <div className="col-span-1 space-y-2">
              {(generatedContent.length > 0 ? generatedContent : MOCK_TOPIC_ASSETS).map((asset) => {
                const at = ASSET_TYPES.find(a => a.type === asset.asset_type);
                return (
                  <button
                    key={asset.id}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      reviewAsset?.id === asset.id
                        ? 'border-amber bg-amber/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                    onClick={() => handleReview(asset)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: at?.colour }}>{at?.icon}</span>
                      <span className="text-xs font-bold" style={{ color: at?.colour }}>{at?.label}</span>
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${
                        asset.status === 'published' ? 'bg-emerald/20 text-emerald' : 'bg-amber/20 text-amber'
                      }`}>
                        {asset.status}
                      </span>
                    </div>
                    <p className="text-sm text-white font-semibold truncate">{asset.title}</p>
                  </button>
                );
              })}
            </div>

            {/* Editor */}
            <div className="col-span-2">
              {reviewAsset ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{reviewAsset.title}</h3>
                      <p className="text-xs text-slate-light/60">
                        {reviewAsset.asset_type} {reviewAsset.asset_subtype ? `(${reviewAsset.asset_subtype})` : ''} — {reviewAsset.age_group}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-emerald/20 text-emerald text-xs font-bold hover:bg-emerald/30">
                        <Check size={12} className="inline mr-1" /> Approve
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30">
                        <Trash2 size={12} className="inline mr-1" /> Reject
                      </button>
                    </div>
                  </div>

                  <label className="block text-xs font-bold text-slate-light/60 mb-2">Content JSON</label>
                  <textarea
                    className="w-full h-96 bg-navy border border-white/10 rounded-xl p-4 text-sm text-white font-mono resize-none"
                    value={editJson}
                    onChange={(e) => setEditJson(e.target.value)}
                  />

                  <div className="flex gap-2 mt-4">
                    <button className="px-4 py-2 rounded-lg bg-amber/20 text-amber text-sm font-bold hover:bg-amber/30">
                      <Edit size={14} className="inline mr-1" /> Save Changes
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-white/5 text-white text-sm font-bold hover:bg-white/10"
                      onClick={() => setEditJson(JSON.stringify(reviewAsset.content_json, null, 2))}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
                  <Eye size={32} className="text-slate-light/30 mx-auto mb-3" />
                  <p className="text-slate-light/50 text-sm">Select an asset to review and edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
