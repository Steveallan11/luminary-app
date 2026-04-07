'use client';

import { useEffect, useState } from 'react';
import { Users, Loader, AlertCircle } from 'lucide-react';

interface ChildProgress {
  topic_id: string;
  status: string;
  best_mastery_score: number;
  attempts_count: number;
  mastery_band: string;
  completed_at: string | null;
}

interface Child {
  id: string;
  name: string;
  age: number;
  year_group: string;
  avatar: string;
  xp: number;
  streak_days: number;
  created_at: string;
  topics_in_progress: number;
  topics_completed: number;
  avg_mastery_score: number;
  progress: ChildProgress[];
}

interface Family {
  id: string;
  parent_user_id: string;
  subscription_status: string;
  created_at: string;
  children_count: number;
  children: Child[];
}

interface ApiResponse {
  families: Family[];
  topics: any[];
  total_families: number;
  total_children: number;
}

export default function AdminUsersPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const result: ApiResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleFamilyExpand = (familyId: string) => {
    const newExpanded = new Set(expandedFamilies);
    if (newExpanded.has(familyId)) {
      newExpanded.delete(familyId);
    } else {
      newExpanded.add(familyId);
    }
    setExpandedFamilies(newExpanded);
  };

  const getMasteryBandColor = (band: string): string => {
    switch (band) {
      case 'not_grasped':
        return 'bg-red-500/20 text-red-300';
      case 'developing':
        return 'bg-orange-500/20 text-orange-300';
      case 'secure':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'strong':
        return 'bg-green-500/20 text-green-300';
      case 'mastered':
        return 'bg-emerald-500/20 text-emerald-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-amber animate-spin mx-auto mb-4" />
          <p className="text-slate-light/60">Loading user accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-6 flex items-gap gap-4">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-300 mb-1">Error Loading Users</h3>
          <p className="text-red-200/70 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-amber" />
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            User Accounts
          </h1>
        </div>
        <p className="text-slate-light/60">Manage all parents and children in the system</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/5 border border-white/10 p-4">
          <p className="text-slate-light/60 text-sm mb-1">Total Families</p>
          <p className="text-2xl font-bold text-white">{data?.total_families || 0}</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-4">
          <p className="text-slate-light/60 text-sm mb-1">Total Children</p>
          <p className="text-2xl font-bold text-white">{data?.total_children || 0}</p>
        </div>
      </div>

      {/* Families list */}
      <div className="space-y-4">
        {(data?.families || []).map((family) => (
          <div key={family.id} className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
            {/* Family header */}
            <button
              onClick={() => toggleFamilyExpand(family.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg">👨‍👩‍👧‍👦</span>
                  <p className="font-semibold text-white">{family.parent_user_id}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    family.subscription_status === 'premium'
                      ? 'bg-amber/20 text-amber'
                      : 'bg-slate-500/20 text-slate-300'
                  }`}>
                    {family.subscription_status.charAt(0).toUpperCase() + family.subscription_status.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-slate-light/50">
                  {family.children_count} {family.children_count === 1 ? 'child' : 'children'} • Created {formatDate(family.created_at)}
                </p>
              </div>
              <svg
                className={`w-5 h-5 text-slate-light/40 transition-transform ${
                  expandedFamilies.has(family.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* Children details (expandable) */}
            {expandedFamilies.has(family.id) && (
              <div className="border-t border-white/10 bg-white/2 px-6 py-4">
                {family.children.length === 0 ? (
                  <p className="text-slate-light/50 text-sm">No children yet</p>
                ) : (
                  <div className="space-y-4">
                    {family.children.map((child) => (
                      <div key={child.id} className="rounded-lg bg-navy-light/40 border border-white/5 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{child.avatar === 'fox' ? '🦊' : '🐱'}</span>
                            <div>
                              <p className="font-semibold text-white">{child.name}</p>
                              <p className="text-xs text-slate-light/50">
                                Age {child.age} • {child.year_group}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-amber">{child.xp} XP</p>
                            <p className="text-xs text-slate-light/50">🔥 {child.streak_days} day streak</p>
                          </div>
                        </div>

                        {/* Learning progress */}
                        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                          <div className="rounded-lg bg-white/5 p-2">
                            <p className="text-slate-light/60 text-xs">In Progress</p>
                            <p className="font-bold text-amber">{child.topics_in_progress}</p>
                          </div>
                          <div className="rounded-lg bg-white/5 p-2">
                            <p className="text-slate-light/60 text-xs">Completed</p>
                            <p className="font-bold text-emerald">{child.topics_completed}</p>
                          </div>
                          <div className="rounded-lg bg-white/5 p-2">
                            <p className="text-slate-light/60 text-xs">Avg Mastery</p>
                            <p className="font-bold text-white">{child.avg_mastery_score}%</p>
                          </div>
                        </div>

                        {/* Topic progress detail */}
                        {child.progress.length > 0 && (
                          <div className="border-t border-white/5 pt-3">
                            <p className="text-xs text-slate-light/60 mb-2">Topic Progress ({child.progress.length})</p>
                            <div className="space-y-1">
                              {child.progress.slice(0, 5).map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span className="text-slate-light/70 flex-1">Topic {idx + 1}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getMasteryBandColor(p.mastery_band)}`}>
                                      {p.mastery_band.replace('_', ' ')}
                                    </span>
                                    <span className="text-slate-light/50">{p.best_mastery_score}% ({p.attempts_count}x)</span>
                                  </div>
                                </div>
                              ))}
                              {child.progress.length > 5 && (
                                <p className="text-xs text-slate-light/50 pt-1">+ {child.progress.length - 5} more topics</p>
                              )}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-slate-light/40 mt-3">Created {formatDate(child.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {(data?.families || []).length === 0 && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-12 text-center">
          <Users className="w-12 h-12 text-slate-light/30 mx-auto mb-4" />
          <p className="text-slate-light/60">No user accounts yet</p>
          <p className="text-slate-light/40 text-sm mt-2">Families and children will appear here once they sign up</p>
        </div>
      )}
    </div>
  );
}
