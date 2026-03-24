'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BookOpen, Layers, ArrowRight, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLibraryPage() {
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [lessonCount, setLessonCount] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      const [{ count: total }, { count: live }, { count: pending }, { count: content }] = await Promise.all([
        supabase.from('topic_lesson_structures').select('*', { count: 'exact', head: true }),
        supabase.from('topic_lesson_structures').select('*', { count: 'exact', head: true }).eq('status', 'live'),
        supabase.from('topic_lesson_structures').select('*', { count: 'exact', head: true }).eq('status', 'generating'),
        supabase.from('topic_assets').select('*', { count: 'exact', head: true }),
      ]);
      setLessonCount(total || 0);
      setLiveCount(live || 0);
      setPendingCount(pending || 0);
      setContentCount(content || 0);
      setLoading(false);
    };
    fetchCounts();
  }, []);

  return (
    <div className="min-h-screen bg-navy text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-2">Content Hub</h1>
          <p className="text-slate-light/60">Manage all your lessons and supporting content in one place.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lesson Library Card */}
          <button
            onClick={() => router.push('/admin/library/lessons')}
            className="group p-8 rounded-2xl border border-white/10 bg-white/5 hover:border-amber/50 hover:bg-amber/5 transition-all text-left"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-2xl bg-amber/20 border border-amber/30">
                <BookOpen size={28} className="text-amber" />
              </div>
              <ArrowRight size={20} className="text-slate-light/30 group-hover:text-amber group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Lesson Library</h2>
            <p className="text-sm text-slate-light/60 mb-6">
              View, edit, test, and approve all generated lessons. Each lesson contains 7 structured phases ready for Lumi to deliver.
            </p>
            {loading ? (
              <div className="flex gap-4">
                {[1,2,3].map(i => <div key={i} className="h-12 w-20 rounded-xl bg-white/5 animate-pulse" />)}
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center min-w-[60px]">
                  <p className="text-2xl font-black text-white">{lessonCount}</p>
                  <p className="text-[10px] text-slate-light/40 uppercase">Total</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[60px]">
                  <p className="text-2xl font-black text-emerald-400">{liveCount}</p>
                  <p className="text-[10px] text-emerald-400/60 uppercase">Live</p>
                </div>
                <div className="p-3 rounded-xl bg-amber/10 border border-amber/20 text-center min-w-[60px]">
                  <p className="text-2xl font-black text-amber">{pendingCount}</p>
                  <p className="text-[10px] text-amber/60 uppercase">Pending</p>
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {['View all phases', 'Edit content', 'Test with Lumi', 'Approve & publish'].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-light/60">{tag}</span>
              ))}
            </div>
          </button>

          {/* Content Library Card */}
          <button
            onClick={() => router.push('/admin/library/content')}
            className="group p-8 rounded-2xl border border-white/10 bg-white/5 hover:border-sky-400/50 hover:bg-sky-400/5 transition-all text-left"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-2xl bg-sky-400/20 border border-sky-400/30">
                <Layers size={28} className="text-sky-400" />
              </div>
              <ArrowRight size={20} className="text-slate-light/30 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Content Library</h2>
            <p className="text-sm text-slate-light/60 mb-6">
              Browse and manage all supporting assets — concept cards, game questions, real-world cards, worksheets, and diagrams.
            </p>
            {loading ? (
              <div className="flex gap-4">
                <div className="h-12 w-20 rounded-xl bg-white/5 animate-pulse" />
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center min-w-[60px]">
                  <p className="text-2xl font-black text-white">{contentCount}</p>
                  <p className="text-[10px] text-slate-light/40 uppercase">Assets</p>
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {['Concept cards', 'Game questions', 'Real world cards', 'Worksheets', 'Diagrams'].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-light/60">{tag}</span>
              ))}
            </div>
          </button>
        </div>

        {/* Quick tip */}
        <div className="mt-8 p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-white mb-1">Pro tip: Use the Knowledge Base</p>
              <p className="text-sm text-slate-light/60">
                Open any lesson in the Lesson Library, scroll to the Knowledge Base section, and attach documents, images, or videos. Lumi will automatically use this material to give richer, more contextual explanations to pupils.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
