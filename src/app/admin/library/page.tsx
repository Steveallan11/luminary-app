'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
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
  Search,
  RefreshCw,
  X,
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
  status: string;
  created_at: string;
  quality_score?: number;
  linked_lesson_id?: string | null;
}

export default function AdminLibraryPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeyStage, setSelectedKeyStage] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'lesson' | 'content'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [linkingAsset, setLinkingAsset] = useState<LibraryItem | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!error && data) {
      setJobs(data);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // Fetch lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from('topic_lesson_structures')
        .select(`
          id,
          status,
          age_group,
          key_stage,
          quality_score,
          created_at,
          topics (
            title,
            subjects (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (lessonsError) throw lessonsError;

      // Fetch content assets
      const { data: assets, error: assetsError } = await supabase
        .from('topic_assets')
        .select(`
          id,
          title,
          asset_type,
          status,
          age_group,
          key_stage,
          linked_lesson_id,
          created_at,
          topics (
            title,
            subjects (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;

      const formattedLessons: LibraryItem[] = (lessons || []).map((l: any) => ({
        id: l.id,
        type: 'lesson',
        title: l.topics?.title || 'Untitled Lesson',
        subject: l.topics?.subjects?.name || 'Unknown',
        topic: l.topics?.title || 'Unknown',
        key_stage: l.key_stage || 'KS2',
        age_group: l.age_group,
        status: l.status,
        created_at: l.created_at,
        quality_score: l.quality_score,
      }));

      const formattedAssets: LibraryItem[] = (assets || []).map((a: any) => ({
        id: a.id,
        type: 'content',
        title: a.title || `${a.asset_type.replace('_', ' ')}`,
        subject: a.topics?.subjects?.name || 'Unknown',
        topic: a.topics?.title || 'Unknown',
        key_stage: a.key_stage || 'KS2',
        age_group: a.age_group,
        status: a.status,
        created_at: a.created_at,
        linked_lesson_id: a.linked_lesson_id,
      }));

      setItems([...formattedLessons, ...formattedAssets].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err) {
      console.error('Failed to fetch library items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchJobs();

    // Polling as a fallback for real-time updates
    const interval = setInterval(() => {
      fetchJobs();
    }, 5000);

    // Subscribe to generation jobs
    const channel = supabase
      .channel('generation_jobs_changes')
      .on('postgres_changes', { event: '*', table: 'generation_jobs', schema: 'public' }, (payload) => {
        console.log('Job change received!', payload);
        fetchJobs();
        if (payload.new && (payload.new as any).status === 'completed') {
          fetchItems();
        }
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleDelete = async (id: string, type: 'lesson' | 'content') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      const table = type === 'lesson' ? 'topic_lesson_structures' : 'topic_assets';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      alert('Failed to delete item');
      console.error(err);
    }
  };

  const handleLinkToLesson = async (lessonId: string) => {
    if (!linkingAsset) return;
    setIsLinking(true);
    try {
      const { error } = await supabase
        .from('topic_assets')
        .update({ linked_lesson_id: lessonId })
        .eq('id', linkingAsset.id);
      
      if (error) throw error;
      alert('Asset linked successfully!');
      setLinkingAsset(null);
      fetchItems();
    } catch (err) {
      alert('Failed to link asset');
      console.error(err);
    } finally {
      setIsLinking(false);
    }
  };

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
      case 'published':
        return <CheckCircle size={16} className="text-emerald" />;
      case 'pending_review':
      case 'generating':
      case 'draft':
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
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Content & Lesson Library</h1>
            <p className="text-slate-light/60">Manage all your created content and lessons in one place</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Background Jobs */}
        {jobs.some(j => j.status === 'processing' || j.status === 'queued') && (
          <div className="mb-8 space-y-3">
            <h2 className="text-sm font-bold text-amber flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Active Generation Jobs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.filter(j => j.status === 'processing' || j.status === 'queued').map(job => (
                <div key={job.id} className="p-4 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{job.title}</p>
                    <p className="text-xs text-slate-light/60 capitalize">{job.type} • {job.status}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber transition-all duration-500" 
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-amber mt-1 font-bold">{job.progress}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-light/60 mb-2">Key Stage</label>
              <select
                value={selectedKeyStage || ''}
                onChange={(e) => setSelectedKeyStage(e.target.value || null)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber"
              >
                <option value="">All Key Stages</option>
                {KEY_STAGES.map((ks) => (
                  <option key={ks.value} value={ks.value}>{ks.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-light/60 mb-2">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber"
              >
                <option value="all">All Types</option>
                <option value="lesson">Lessons Only</option>
                <option value="content">Content Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-light/60 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber"
              >
                <option value="all">All Statuses</option>
                <option value="live">Live / Published</option>
                <option value="pending_review">Pending Review</option>
                <option value="draft">Draft</option>
                <option value="failed">Failed</option>
              </select>
            </div>

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
                key={`${item.type}-${item.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">{getTypeIcon(item.type)}</div>
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
                      {item.linked_lesson_id && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-sky">
                          <Link2 size={12} />
                          <span>Linked to Lesson</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-light/60 hover:text-white transition-colors">
                      <Eye size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                      {item.type === 'content' && (
                        <button 
                          onClick={() => setLinkingAsset(item)}
                          className="p-2 rounded-lg bg-sky/10 text-sky hover:bg-sky/20 transition-colors"
                          title="Link to Lesson"
                        >
                          <Link2 size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(item.id, item.type)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linking Modal */}
      {linkingAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-navy-dark border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Link Asset to Lesson</h3>
                <p className="text-sm text-slate-light/60">Select a lesson to connect "{linkingAsset.title}" to.</p>
              </div>
              <button onClick={() => setLinkingAsset(null)} className="p-2 text-slate-light/40 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-3 custom-scrollbar">
              {items.filter(i => i.type === 'lesson').map(lesson => (
                <button
                  key={lesson.id}
                  onClick={() => handleLinkToLesson(lesson.id)}
                  disabled={isLinking}
                  className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:border-amber/50 hover:bg-amber/5 transition-all flex items-center justify-between group"
                >
                  <div>
                    <h4 className="text-white font-bold">{lesson.title}</h4>
                    <p className="text-xs text-slate-light/40">{lesson.subject} • {lesson.key_stage}</p>
                  </div>
                  <Link2 size={18} className="text-slate-light/20 group-hover:text-amber transition-colors" />
                </button>
              ))}
              {items.filter(i => i.type === 'lesson').length === 0 && (
                <p className="text-center py-8 text-slate-light/40">No lessons found to link to.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
