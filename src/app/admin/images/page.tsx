'use client';

import { useState } from 'react';
import {
  Image as ImageIcon,
  Search,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { MOCK_SUBJECTS, MOCK_TOPICS } from '@/lib/mock-data';
import { Topic } from '@/types';

const ALL_TOPICS: Topic[] = Object.values(MOCK_TOPICS).flat();

interface ImageResult {
  url: string;
  source_type: string;
  title: string;
  description?: string;
  score: number;
  is_approved: boolean;
  concerns: string;
  lumi_instruction: string;
}

export default function AdminImagesPage() {
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [searching, setSearching] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [customUrl, setCustomUrl] = useState('');

  const selectedTopic = ALL_TOPICS.find((t) => t.id === selectedTopicId);
  const selectedSubject = selectedTopic
    ? MOCK_SUBJECTS.find((s) => s.id === selectedTopic.subject_id)
    : null;

  const handleSearch = async () => {
    if (!selectedTopic || !selectedSubject) return;
    setSearching(true);
    setImages([]);

    try {
      const res = await fetch(
        `/api/lumi/visual-search?topic=${encodeURIComponent(selectedTopic.title)}&subject=${encodeURIComponent(selectedSubject.name)}`
      );
      const data = await res.json();

      if (data.found && data.image) {
        setImages([
          {
            url: data.image.url,
            source_type: data.image.source_type,
            title: data.image.title,
            description: data.image.description,
            score: data.verification?.score ?? 0,
            is_approved: data.verification?.is_approved ?? false,
            concerns: data.verification?.concerns ?? '',
            lumi_instruction: data.verification?.lumi_instruction ?? '',
          },
        ]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleVerifyCustom = async () => {
    if (!customUrl || !selectedTopic || !selectedSubject) return;
    setVerifying(true);

    try {
      const res = await fetch('/api/lumi/verify-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: customUrl,
          topic_title: selectedTopic.title,
          subject_name: selectedSubject.name,
        }),
      });
      const data = await res.json();

      const newImage: ImageResult = {
        url: customUrl,
        source_type: 'admin_upload',
        title: 'Custom image',
        score: data.score,
        is_approved: data.is_approved,
        concerns: data.concerns,
        lumi_instruction: data.lumi_instruction,
      };

      setImages((prev) => [newImage, ...prev]);
      setSelectedImage(newImage);
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        Visual Lumi — Image Manager
      </h1>
      <p className="text-sm text-slate-light/60 mb-6">
        Search, verify, and manage teaching images. Images scoring 8/10 or above are auto-approved. Others require manual review.
      </p>

      {/* Search controls */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5">
            <label className="block text-xs font-bold text-white mb-1.5">Topic</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
            >
              <option value="">Select a topic...</option>
              {MOCK_SUBJECTS.map((subject) => (
                <optgroup key={subject.id} label={`${subject.icon_emoji} ${subject.name}`}>
                  {ALL_TOPICS.filter((t) => t.subject_id === subject.id).map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="col-span-5">
            <label className="block text-xs font-bold text-white mb-1.5">Custom Image URL (optional)</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-light/30"
              placeholder="https://example.com/image.jpg"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
          </div>
          <div className="col-span-2 flex items-end gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky/20 text-sky text-sm font-bold hover:bg-sky/30 disabled:opacity-50"
              onClick={handleSearch}
              disabled={!selectedTopicId || searching}
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
            {customUrl && (
              <button
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber/20 text-amber text-sm font-bold hover:bg-amber/30 disabled:opacity-50"
                onClick={handleVerifyCustom}
                disabled={verifying || !selectedTopicId}
              >
                {verifying ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                Verify
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          {images.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <ImageIcon size={32} className="text-slate-light/30 mx-auto mb-3" />
              <p className="text-white font-semibold mb-2">No images yet</p>
              <p className="text-slate-light/50 text-sm">
                Select a topic and search to find teaching images.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`rounded-xl border overflow-hidden text-left transition-all ${
                    selectedImage?.url === img.url
                      ? 'border-amber ring-2 ring-amber/30'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedImage(img)}
                >
                  <div className="aspect-video bg-navy/50 relative">
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          img.is_approved ? 'bg-emerald/90 text-white' : 'bg-amber/90 text-navy'
                        }`}
                      >
                        {img.score}/10
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy/80 text-white font-bold">
                        {img.source_type}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5">
                    <p className="text-sm text-white font-semibold truncate">{img.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {img.is_approved ? (
                        <span className="text-xs text-emerald flex items-center gap-1">
                          <Check size={10} /> Approved
                        </span>
                      ) : (
                        <span className="text-xs text-amber flex items-center gap-1">
                          <AlertTriangle size={10} /> Needs Review
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="col-span-4">
          {selectedImage ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4 sticky top-24">
              <img src={selectedImage.url} alt={selectedImage.title} className="w-full rounded-lg" />

              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-light/40 mb-1">Accuracy Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-navy rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${selectedImage.score * 10}%`,
                        backgroundColor: selectedImage.score >= 8 ? '#10B981' : selectedImage.score >= 5 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">{selectedImage.score}/10</span>
                </div>
              </div>

              {selectedImage.concerns && selectedImage.concerns !== 'None' && (
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-light/40 mb-1">Concerns</p>
                  <p className="text-sm text-amber/80">{selectedImage.concerns}</p>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-light/40 mb-1">Lumi Teaching Instruction</p>
                <p className="text-sm text-sky/80 italic">{selectedImage.lumi_instruction}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 px-3 py-2 rounded-lg bg-emerald/20 text-emerald text-xs font-bold hover:bg-emerald/30">
                  <Check size={12} className="inline mr-1" /> Approve
                </button>
                <button className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30">
                  <X size={12} className="inline mr-1" /> Blacklist
                </button>
              </div>

              <a
                href={selectedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 text-white text-xs font-bold hover:bg-white/10"
              >
                <ExternalLink size={12} /> Open Full Size
              </a>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
              <Eye size={24} className="text-slate-light/30 mx-auto mb-2" />
              <p className="text-sm text-slate-light/50">Select an image to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
