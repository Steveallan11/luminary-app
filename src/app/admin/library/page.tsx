'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Link2,
  Trash2,
  Eye,
  Filter,
  Search,
} from 'lucide-react';

const KEY_STAGES = [
  { value: 'KS1', label: 'Key Stage 1 (Ages 5-7)' },
  { value: 'KS2', label: 'Key Stage 2 (Ages 8-11)' },
  { value: 'KS3', label: 'Key Stage 3 (Ages 12-14)' },
  { value: 'KS4', label: 'Key Stage 4 (Ages 15-16)' },
];

interface LibraryItem {
  id: string;
  type: 'lesson' | 'content';
  title: string;
  subject: string;
  topic: string;
  key_stage: string;
  age_group: string;
  status: 'pending_review' | 'live' | 'archived' | 'failed';
  created_at: string;
  quality_score?: number;
  linked_items?: string[];
}

export default function AdminLibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeyStage, setSelectedKeyStage] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'lesson' | 'content'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending_review' | 'live' | 'archived' | 'failed'>('all');

  // Fetch items from Supabase
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        // In production, this would fetch from Supabase
        // For now, we'll use mock data
        const mockItems: LibraryItem[] = [
          {
            id: '1',
            type: 'lesson',
            title: 'Fractions Basics',
            subject: 'Maths',
            topic: 'Fractions',
            key_stage: 'KS2',
            age_group: '8-11',
            status: 'live',
            created_at: new Date().toISOString(),
            quality_score: 85,
            linked_items: ['content-1', 'content-2'],
          },
          {
            id: '2',
            type: 'content',
            title: 'Fraction Bars Diagram',
            subject: 'Maths',
            topic: 'Fractions',
            key_stage: 'KS2',
            age_group: '8-11',
            status: 'live',
            created_at: new Date().toISOString(),
            linked_items: ['1'],
          },
        ];
        setItems(mockItems);
      } catch (err) {
        console.error('Failed to fetch library items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.topic.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesKeyStage = !selectedKeyStage || item.key_stage === selectedKeyStage;
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchesSearch && matchesKeyStage && matchesType && matchesStatus;
    });
  }, [items, searchQuery, selectedKeyStage, selectedType, selectedStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <CheckCircle size={16} className="text-emerald" />;
      case 'pending_review':
        return <Clock size={16} className="text-amber" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <FileText size={16} className="text-slate-light/40" />;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'lesson' ? (
      <BookOpen size={16} className="text-sky" />
    ) : (
      <FileText size={16} className="text-purple" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy/95 to-navy/90 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Content & Lesson Library</h1>
          <p className="text-slate-light/60">Manage all your created content and lessons in one place</p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-light/40" />
            <input
              type="text"
              placeholder="Search by title, subject, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-light/40 focus:outline-none focus:ring-2 focus:ring-amber"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Key Stage Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-light/60 mb-2">Key Stage</label>
              <select
                value={selectedKeyStage || ''}
                onChange={(e) => setSelectedKeyStage(e.target.value || null)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber"
              >
                <option value="">All Key Stages</option>
                {KEY_STAGES.map((ks) => (
                  <option key={ks.value} value={ks.value}>
                    {ks.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-light/60 mb-2">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'all' | 'lesson' | 'content')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber"
              >
                <option value="all">All Types</option>
                <option value="lesson">Lessons Only</option>
                <option value="content">Content Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-light/60 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber"
              >
                <option value="all">All Statuses</option>
                <option value="live">Live</option>
                <option value="pending_review">Pending Review</option>
                <option value="archived">Archived</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-slate-light/60">{filteredItems.length} results</p>
              </div>
            </div>
          </div>
        </div>

        {/* Library Items */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-amber animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-slate-light/60">No items found. Start creating content and lessons!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Type Icon */}
                    <div className="mt-1">{getTypeIcon(item.type)}</div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-white">{item.title}</h3>
                        {getStatusIcon(item.status)}
                        <span className="text-xs text-slate-light/60 capitalize">{item.status.replace('_', ' ')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-light/60">
                        <span>{item.subject}</span>
                        <span>•</span>
                        <span>{item.topic}</span>
                        <span>•</span>
                        <span>{item.key_stage}</span>
                        {item.quality_score && (
                          <>
                            <span>•</span>
                            <span>Quality: {item.quality_score}%</span>
                          </>
                        )}
                      </div>
                      {item.linked_items && item.linked_items.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-sky">
                          <Link2 size={12} />
                          <span>Linked to {item.linked_items.length} item(s)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-light/60 hover:text-white transition-colors">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-light/60 hover:text-white transition-colors">
                      <Link2 size={16} />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-light/60 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
