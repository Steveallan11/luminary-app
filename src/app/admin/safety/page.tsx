'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, Check, Eye, Clock, User } from 'lucide-react';

interface SafetyFlag {
  id: string;
  child_name: string;
  flag_type: 'content' | 'behaviour' | 'wellbeing' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message_content: string;
  ai_response: string;
  is_reviewed: boolean;
  created_at: string;
}

const MOCK_FLAGS: SafetyFlag[] = [
  {
    id: '1',
    child_name: 'Lyla Rae',
    flag_type: 'content',
    severity: 'low',
    message_content: 'Can you tell me about how people died in ancient Egypt?',
    ai_response: 'Lumi redirected to age-appropriate discussion of mummification as a cultural practice.',
    is_reviewed: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: '2',
    child_name: 'Lyla Rae',
    flag_type: 'technical',
    severity: 'low',
    message_content: 'asdfghjkl',
    ai_response: 'Lumi gently asked if the child was having trouble typing and offered help.',
    is_reviewed: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const SEVERITY_COLOURS: Record<string, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626',
};

const FLAG_TYPE_LABELS: Record<string, string> = {
  content: 'Content',
  behaviour: 'Behaviour',
  wellbeing: 'Wellbeing',
  technical: 'Technical',
};

export default function AdminSafetyPage() {
  const [flags, setFlags] = useState<SafetyFlag[]>(MOCK_FLAGS);
  const [selectedFlag, setSelectedFlag] = useState<SafetyFlag | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredFlags = flags.filter(
    (f) => filterSeverity === 'all' || f.severity === filterSeverity
  );

  const handleReview = (flagId: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, is_reviewed: true } : f))
    );
    if (selectedFlag?.id === flagId) {
      setSelectedFlag({ ...selectedFlag, is_reviewed: true });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-amber" />
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Safety Dashboard
          </h1>
          <p className="text-sm text-slate-light/60">
            Review AI safeguarding flags and monitor child interactions.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(['low', 'medium', 'high', 'critical'] as const).map((sev) => {
          const count = flags.filter((f) => f.severity === sev).length;
          const unreviewed = flags.filter((f) => f.severity === sev && !f.is_reviewed).length;
          return (
            <div key={sev} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLOURS[sev] }}
                />
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-light/60">
                  {sev}
                </p>
              </div>
              <p className="text-2xl font-bold text-white">{count}</p>
              {unreviewed > 0 && (
                <p className="text-xs text-amber mt-1">{unreviewed} unreviewed</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'low', 'medium', 'high', 'critical'].map((sev) => (
          <button
            key={sev}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterSeverity === sev ? 'bg-white/10 text-white' : 'text-slate-light/60 hover:text-white'
            }`}
            onClick={() => setFilterSeverity(sev)}
          >
            {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}
      </div>

      {/* Flag list */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 space-y-2">
          {filteredFlags.map((flag) => (
            <button
              key={flag.id}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                selectedFlag?.id === flag.id
                  ? 'border-amber bg-amber/5'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
              onClick={() => setSelectedFlag(flag)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLOURS[flag.severity] }}
                />
                <span className="text-xs font-bold" style={{ color: SEVERITY_COLOURS[flag.severity] }}>
                  {flag.severity.toUpperCase()}
                </span>
                <span className="text-xs text-slate-light/40 px-2 py-0.5 rounded-full bg-white/5">
                  {FLAG_TYPE_LABELS[flag.flag_type]}
                </span>
                {flag.is_reviewed && (
                  <span className="text-xs text-emerald flex items-center gap-1 ml-auto">
                    <Check size={10} /> Reviewed
                  </span>
                )}
                {!flag.is_reviewed && (
                  <span className="text-xs text-amber flex items-center gap-1 ml-auto">
                    <Clock size={10} /> Pending
                  </span>
                )}
              </div>
              <p className="text-sm text-white line-clamp-2">{flag.message_content}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-light/40">
                <User size={10} /> {flag.child_name}
                <span>&middot;</span>
                {new Date(flag.created_at).toLocaleString()}
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="col-span-5">
          {selectedFlag ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4 sticky top-24">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLOURS[selectedFlag.severity] }}
                />
                <span className="text-sm font-bold" style={{ color: SEVERITY_COLOURS[selectedFlag.severity] }}>
                  {selectedFlag.severity.toUpperCase()} — {FLAG_TYPE_LABELS[selectedFlag.flag_type]}
                </span>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-light/40 mb-1">Child Message</p>
                <div className="rounded-lg bg-navy/50 p-3">
                  <p className="text-sm text-white">{selectedFlag.message_content}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-light/40 mb-1">Lumi Response</p>
                <div className="rounded-lg bg-sky/5 border border-sky/10 p-3">
                  <p className="text-sm text-sky/80">{selectedFlag.ai_response}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-light/40">
                <User size={12} /> {selectedFlag.child_name}
                <span>&middot;</span>
                <Clock size={12} /> {new Date(selectedFlag.created_at).toLocaleString()}
              </div>

              {!selectedFlag.is_reviewed && (
                <button
                  className="w-full px-4 py-2.5 rounded-lg bg-emerald/20 text-emerald text-sm font-bold hover:bg-emerald/30"
                  onClick={() => handleReview(selectedFlag.id)}
                >
                  <Check size={14} className="inline mr-1" /> Mark as Reviewed
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
              <Eye size={24} className="text-slate-light/30 mx-auto mb-2" />
              <p className="text-sm text-slate-light/50">Select a flag to review details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
