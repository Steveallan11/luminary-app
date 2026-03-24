'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  Wand2,
  Check,
  X,
  Lightbulb,
  Video,
  Gamepad2,
  FileText,
  Image,
  BookOpen,
  Loader2,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { MOCK_SUBJECTS, MOCK_TOPICS } from '@/lib/mock-data';
import { MOCK_TOPIC_ASSETS, MOCK_FRACTION_BAR_DIAGRAM } from '@/lib/mock-content';
import AdminAssetPreview from '@/components/admin/AdminAssetPreview';
import { TopicAsset, AssetType, Topic } from '@/types';

const ALL_TOPICS: Topic[] = Object.values(MOCK_TOPICS).flat();

const ASSET_TYPES: { type: AssetType; label: string; icon: React.ReactNode; colour: string }[] = [
  { type: 'concept_card', label: 'Concept Card', icon: <Lightbulb size={14} />, colour: '#F59E0B' },
  { type: 'video', label: 'Video', icon: <Video size={14} />, colour: '#3B82F6' },
  { type: 'realworld_card', label: 'Real-World Card', icon: <Gamepad2 size={14} />, colour: '#10B981' },
  { type: 'diagram', label: 'Diagram', icon: <Image size={14} />, colour: '#8B5CF6' },
  { type: 'game_questions', label: 'Game', icon: <Gamepad2 size={14} />, colour: '#EC4899' },
  { type: 'worksheet', label: 'Worksheet', icon: <FileText size={14} />, colour: '#6366F1' },
];

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'generate'>('library');
  const [selectedAsset, setSelectedAsset] = useState<TopicAsset | null>(null);
  const [generateTopicId, setGenerateTopicId] = useState('');
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<AssetType[]>([]);
  const [ageGroup, setAgeGroup] = useState('8-11');
  const [generating, setGenerating] = useState(false);
  const [customTopicName, setCustomTopicName] = useState('');
  const [customSubjectId, setCustomSubjectId] = useState('');
  const [useCustomTopic, setUseCustomTopic] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleGenerate = async () => {
    if (!useCustomTopic && !generateTopicId) return;
    if (useCustomTopic && (!customTopicName || !customSubjectId)) return;
    if (selectedAssetTypes.length === 0) return;

    setGenerating(true);
    try {
      let topicId = '';
      let topicTitle = '';
      let subjectName = '';
      let keyStage = '';

      const keyStageMap: Record<string, string> = {
        "5-7": "KS1",
        "8-11": "KS2",
        "12-14": "KS3",
        "15-16": "KS4",
      };
      keyStage = keyStageMap[ageGroup] || "KS2";

      if (useCustomTopic) {
        // Create custom topic in Supabase
        const subject = MOCK_SUBJECTS.find(s => s.id === customSubjectId);
        const slug = customTopicName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const topicData: any = {
          title: customTopicName,
          subject_id: customSubjectId === 'other' ? '00000000-0000-0000-0000-000000000000' : customSubjectId,
          slug: slug || `custom-${Date.now()}`,
        };

        const { data: newTopic, error: topicError } = await supabase
          .from('topics')
          .insert(topicData)
          .select()
          .single();

        if (topicError || !newTopic) {
          console.error('Supabase topic creation error:', topicError);
          throw new Error(`Failed to create custom topic: ${topicError?.message || 'Unknown error'}`);
        }
        topicId = newTopic.id;
        topicTitle = customTopicName;
        subjectName = subject?.name || "Custom Subject";
      } else {
        const topic = ALL_TOPICS.find((t) => t.id === generateTopicId);
        if (!topic) throw new Error("Topic not found");
        topicId = topic.id;
        topicTitle = topic.title;
        const subject = MOCK_SUBJECTS.find((s) => s.id === topic.subject_id);
        subjectName = subject?.name || "General";
      }

      const res = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: topicId,
          asset_types: selectedAssetTypes,
          age_group: ageGroup,
        }),
      });

      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();
      alert(`Successfully generated ${data.assets.length} assets for ${topicTitle}!`);
      setActiveTab('library');
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleAssetType = (type: AssetType) => {
    setSelectedAssetTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Content Management</h1>
          <p className="text-slate-light/60">Generate and manage curriculum-aligned learning assets.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'library' ? 'bg-amber text-navy' : 'text-slate-light/60 hover:text-white'
            }`}
          >
            Library
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'generate' ? 'bg-amber text-navy' : 'text-slate-light/60 hover:text-white'
            }`}
          >
            Generate
          </button>
        </div>
      </div>

      {activeTab === 'library' ? (
        <div className="grid grid-cols-12 gap-8">
          {/* Asset List */}
          <div className="col-span-4 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search assets..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-light/30 focus:outline-none focus:border-amber/50"
              />
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {MOCK_TOPIC_ASSETS.map((asset) => {
                const typeInfo = ASSET_TYPES.find((t) => t.type === asset.asset_type);
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedAsset?.id === asset.id
                        ? 'border-amber bg-amber/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: `${typeInfo?.colour}20`, color: typeInfo?.colour }}
                      >
                        {typeInfo?.icon}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-light/40">
                        {typeInfo?.label}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1">{asset.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-light/60">
                        Age {asset.age_group}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald/10 text-emerald">
                        {asset.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Area */}
          <div className="col-span-8">
            {selectedAsset ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber/20 text-amber">
                      {ASSET_TYPES.find((t) => t.type === selectedAsset.asset_type)?.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedAsset.title}</h2>
                      <p className="text-sm text-slate-light/60">
                        {selectedAsset.asset_type.replace('_', ' ')} • Age {selectedAsset.age_group}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-white/5 text-slate-light/60 hover:text-white hover:bg-white/10 transition-all">
                      <Edit size={18} />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 text-slate-light/60 hover:text-white hover:bg-white/10 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-8">
                  <AdminAssetPreview 
                    asset={selectedAsset} 
                    subjectColour={MOCK_SUBJECTS.find(s => s.id === (ALL_TOPICS.find(t => t.id === selectedAsset.topic_id)?.subject_id))?.colour_hex || '#F59E0B'} 
                  />
                </div>
              </div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl text-slate-light/20">
                <LayoutDashboard size={48} className="mb-4" />
                <p className="text-lg font-medium">Select an asset to preview</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8">
            {/* Topic Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white uppercase tracking-wider">
                  1. Select Topic
                </label>
                <button 
                  onClick={() => setUseCustomTopic(!useCustomTopic)}
                  className="text-xs text-amber hover:underline"
                >
                  {useCustomTopic ? "Use curriculum topic" : "Add custom topic"}
                </button>
              </div>
              
              {useCustomTopic ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-light/40">Topic Name</label>
                    <input
                      type="text"
                      value={customTopicName}
                      onChange={(e) => setCustomTopicName(e.target.value)}
                      placeholder="e.g. The Water Cycle"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-light/40">Subject</label>
                    <select
                      value={customSubjectId}
                      onChange={(e) => setCustomSubjectId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber/50"
                    >
                      <option value="">Select Subject</option>
                      {MOCK_SUBJECTS.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      <option value="other">Other / General</option>
                    </select>
                  </div>
                </div>
              ) : (
                <select
                  value={generateTopicId}
                  onChange={(e) => setGenerateTopicId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber/50"
                >
                  <option value="">Choose a topic...</option>
                  {ALL_TOPICS.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Age Group */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-white uppercase tracking-wider">
                2. Target Age Group
              </label>
              <div className="grid grid-cols-4 gap-3">
                {['5-7', '8-11', '12-14', '15-16'].map((age) => (
                  <button
                    key={age}
                    onClick={() => setAgeGroup(age)}
                    className={`py-3 rounded-xl border font-bold transition-all ${
                      ageGroup === age
                        ? 'border-amber bg-amber text-navy'
                        : 'border-white/10 bg-white/5 text-slate-light/60 hover:border-white/20'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Types */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-white uppercase tracking-wider">
                3. Content to Generate
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ASSET_TYPES.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => toggleAssetType(type.type)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      selectedAssetTypes.includes(type.type)
                        ? 'border-amber bg-amber/10 text-white'
                        : 'border-white/10 bg-white/5 text-slate-light/60 hover:border-white/20'
                    }`}
                  >
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: selectedAssetTypes.includes(type.type)
                          ? type.colour
                          : `${type.colour}20`,
                        color: selectedAssetTypes.includes(type.type) ? '#0a0e1a' : type.colour,
                      }}
                    >
                      {type.icon}
                    </div>
                    <span className="font-semibold">{type.label}</span>
                    {selectedAssetTypes.includes(type.type) && (
                      <Check size={16} className="ml-auto text-amber" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || (!useCustomTopic && !generateTopicId) || (useCustomTopic && !customTopicName) || selectedAssetTypes.length === 0}
              className="w-full py-4 rounded-2xl bg-amber text-navy font-bold text-lg flex items-center justify-center gap-3 hover:bg-amber/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber/20"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" />
                  Generating Assets...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Generate Selected Content
                </>
              )}
            </button>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-white font-bold mb-1">AI-Powered Generation</h4>
              <p className="text-sm text-slate-light/60 leading-relaxed">
                Our AI will generate curriculum-aligned content tailored to the selected age group. 
                This includes teaching explanations, interactive questions, and real-world applications.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
