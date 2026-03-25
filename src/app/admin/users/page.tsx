'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  User, 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  Calendar,
  Clock,
  Loader2,
  Search,
  Filter,
  Zap,
  Target,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { AVATAR_EMOJI_MAP, Avatar } from '@/types';
import { formatTimeAgo } from '@/lib/utils';

interface Child {
  id: string;
  name: string;
  avatar: Avatar;
  year_group: string;
  date_of_birth: string | null;
  learning_mode: string;
  created_at: string;
  xp: number;
  last_active_date: string | null;
  session_count: number;
  assignments: {
    total: number;
    pending: number;
    completed: number;
  };
}

interface ParentProfile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

interface Family {
  id: string;
  family_name: string;
  created_at: string;
  parent_user_id: string | null;
  parent_profiles: ParentProfile | null;
  children: Child[];
}

interface Stats {
  totalFamilies: number;
  totalChildren: number;
  totalSessions: number;
  totalAssignments: number;
}

export default function AdminUsersPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('[v0] Fetching admin users data...');
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      console.log('[v0] Admin users API response:', { ok: res.ok, familiesCount: data.families?.length, stats: data.stats });
      if (res.ok) {
        setFamilies(data.families || []);
        setStats(data.stats || null);
      } else {
        console.error('[v0] API error:', data.error);
      }
    } catch (err) {
      console.error('[v0] Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredFamilies = families.filter((family) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      family.family_name?.toLowerCase().includes(query) ||
      family.parent_profiles?.email?.toLowerCase().includes(query) ||
      family.children?.some((c) => c.name.toLowerCase().includes(query))
    );
  });

  const getAvatarEmoji = (avatar: Avatar) => {
    return AVATAR_EMOJI_MAP[avatar] || '👤';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Users & Families</h1>
          <p className="text-slate-light/60">
            View all registered families, their children, and assign lessons.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-purple-500/20">
                <Users size={18} className="text-purple-400" />
              </div>
              <span className="text-xs font-bold text-slate-light/40 uppercase">Families</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalFamilies}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-sky-500/20">
                <User size={18} className="text-sky-400" />
              </div>
              <span className="text-xs font-bold text-slate-light/40 uppercase">Children</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalChildren}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-amber/20">
                <BookOpen size={18} className="text-amber" />
              </div>
              <span className="text-xs font-bold text-slate-light/40 uppercase">Sessions</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/20">
                <Target size={18} className="text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-slate-light/40 uppercase">Assignments</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalAssignments}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-light/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by family name, email, or child name..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-light/30 focus:outline-none focus:border-amber/50"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-amber animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && families.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <Users size={28} className="text-slate-light/40" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No families yet</h3>
          <p className="text-slate-light/60">
            Families will appear here when parents sign up and add their children.
          </p>
        </div>
      )}

      {/* Families List */}
      {!loading && filteredFamilies.length > 0 && (
        <div className="space-y-4">
          {filteredFamilies.map((family) => (
            <div
              key={family.id}
              className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
            >
              {/* Family Header */}
              <button
                onClick={() => setExpandedFamily(expandedFamily === family.id ? null : family.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  {expandedFamily === family.id ? (
                    <ChevronDown size={20} className="text-slate-light/60" />
                  ) : (
                    <ChevronRight size={20} className="text-slate-light/60" />
                  )}
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-white">
                      {family.family_name || 'Unnamed Family'}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-light/60">
                      {family.parent_profiles?.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} />
                          {family.parent_profiles.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Joined {formatTimeAgo(family.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {family.children?.slice(0, 4).map((child) => (
                      <div
                        key={child.id}
                        className="w-8 h-8 rounded-full bg-white/10 border-2 border-navy flex items-center justify-center text-sm"
                        title={child.name}
                      >
                        {getAvatarEmoji(child.avatar)}
                      </div>
                    ))}
                    {family.children?.length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-navy flex items-center justify-center text-xs text-slate-light/60">
                        +{family.children.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-slate-light/40">
                    {family.children?.length || 0} child{family.children?.length !== 1 ? 'ren' : ''}
                  </span>
                </div>
              </button>

              {/* Expanded Children */}
              {expandedFamily === family.id && family.children?.length > 0 && (
                <div className="border-t border-white/10 p-6">
                  <div className="grid gap-4">
                    {family.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-amber/20 flex items-center justify-center text-2xl">
                            {getAvatarEmoji(child.avatar)}
                          </div>
                          <div>
                            <h4 className="text-white font-bold">{child.name}</h4>
                            <p className="text-sm text-slate-light/60">
                              {child.year_group} | {child.learning_mode?.replace('_', ' ')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-white font-bold">{child.xp || 0}</p>
                              <p className="text-[10px] text-slate-light/40 uppercase">XP</p>
                            </div>
                            <div className="text-center">
                              <p className="text-white font-bold">{child.session_count}</p>
                              <p className="text-[10px] text-slate-light/40 uppercase">Sessions</p>
                            </div>
                            <div className="text-center">
                              <p className="text-emerald-400 font-bold">{child.assignments.completed}</p>
                              <p className="text-[10px] text-slate-light/40 uppercase">Completed</p>
                            </div>
                            <div className="text-center">
                              <p className="text-amber font-bold">{child.assignments.pending}</p>
                              <p className="text-[10px] text-slate-light/40 uppercase">Pending</p>
                            </div>
                          </div>

                          {/* Last Active */}
                          {child.last_active_date && (
                            <div className="text-right text-sm">
                              <p className="text-slate-light/60">Last active</p>
                              <p className="text-white">{formatTimeAgo(child.last_active_date)}</p>
                            </div>
                          )}

                          {/* Assign Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChild(child);
                            }}
                            className="px-4 py-2 rounded-xl bg-amber text-navy font-bold text-sm hover:bg-amber/90 transition-all flex items-center gap-2"
                          >
                            <Target size={14} />
                            Assign Lesson
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No children */}
              {expandedFamily === family.id && (!family.children || family.children.length === 0) && (
                <div className="border-t border-white/10 p-6 text-center">
                  <p className="text-slate-light/60">No children added to this family yet.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assign Lesson Modal */}
      {selectedChild && (
        <AssignLessonModal
          child={selectedChild}
          onClose={() => setSelectedChild(null)}
          onAssigned={() => {
            setSelectedChild(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// Assign Lesson Modal Component
function AssignLessonModal({
  child,
  onClose,
  onAssigned,
}: {
  child: Child;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await fetch('/api/admin/lessons');
        const data = await res.json();
        if (res.ok) {
          setLessons(data.lessons || []);
        }
      } catch (err) {
        console.error('Failed to fetch lessons:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  const filteredLessons = lessons.filter((lesson) => {
    if (!searchQuery) return true;
    return (
      lesson.topics?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.topics?.subjects?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleAssign = async () => {
    if (selectedLessons.length === 0) return;
    setAssigning(true);

    try {
      const res = await fetch('/api/admin/assign-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: child.id,
          lesson_ids: selectedLessons,
        }),
      });

      if (res.ok) {
        onAssigned();
      } else {
        const data = await res.json();
        alert(`Failed to assign: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to assign lessons');
    } finally {
      setAssigning(false);
    }
  };

  const toggleLesson = (id: string) => {
    setSelectedLessons((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-dark rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber/20 flex items-center justify-center text-xl">
                {AVATAR_EMOJI_MAP[child.avatar] || '👤'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Assign Lessons to {child.name}</h2>
                <p className="text-sm text-slate-light/60">{child.year_group}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-all text-slate-light/60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lessons..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-light/30 focus:outline-none focus:border-amber/50"
            />
          </div>
        </div>

        {/* Lesson List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="text-amber animate-spin" />
            </div>
          ) : filteredLessons.length === 0 ? (
            <p className="text-center text-slate-light/60 py-10">
              No lessons found. Generate lessons in the Lessons tab first.
            </p>
          ) : (
            filteredLessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => toggleLesson(lesson.id)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedLessons.includes(lesson.id)
                    ? 'bg-amber/20 border-amber'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-semibold">
                      {lesson.topics?.title || 'Untitled Lesson'}
                    </h4>
                    <p className="text-sm text-slate-light/60">
                      {lesson.topics?.subjects?.name} | {lesson.age_group} | {lesson.key_stage}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      lesson.status === 'live' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber/20 text-amber'
                    }`}>
                      {lesson.status}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedLessons.includes(lesson.id)
                        ? 'bg-amber border-amber'
                        : 'border-white/30'
                    }`}>
                      {selectedLessons.includes(lesson.id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <p className="text-sm text-slate-light/60">
            {selectedLessons.length} lesson{selectedLessons.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={assigning || selectedLessons.length === 0}
              className="px-6 py-2 rounded-xl bg-amber text-navy font-bold hover:bg-amber/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {assigning ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
              Assign {selectedLessons.length > 0 ? `(${selectedLessons.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
