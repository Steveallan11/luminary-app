'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Loader2,
  Calendar,
  User,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { MOCK_CHILDREN } from '@/lib/mock-data';

export default function AdminReportsPage() {
  const [selectedChildId, setSelectedChildId] = useState(MOCK_CHILDREN[0]?.id ?? '');
  const [period, setPeriod] = useState<'month' | 'term' | 'year'>('term');
  const [generating, setGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const selectedChild = MOCK_CHILDREN.find((c) => c.id === selectedChildId);

  const handleGenerate = async () => {
    setGenerating(true);
    setReportUrl(null);

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: selectedChildId,
          period,
          format: 'la_compliant',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReportUrl(data.url);
      }
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FileText size={24} className="text-sky" />
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            LA Progress Reports
          </h1>
          <p className="text-sm text-slate-light/60">
            Generate Local Authority-compliant progress reports for each child.
          </p>
        </div>
      </div>

      {/* Report generator */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-8 max-w-2xl">
        <h2 className="text-lg font-bold text-white mb-4">Generate Report</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">Child</label>
            <div className="flex gap-2">
              {MOCK_CHILDREN.map((child) => (
                <button
                  key={child.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedChildId === child.id
                      ? 'bg-sky/20 text-sky border border-sky/40'
                      : 'bg-white/5 text-slate-light/60 border border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedChildId(child.id)}
                >
                  <User size={14} />
                  {child.name}
                  <span className="text-xs opacity-60">{child.year_group}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">Reporting Period</label>
            <div className="flex gap-2">
              {([
                { value: 'month' as const, label: 'Last Month' },
                { value: 'term' as const, label: 'This Term' },
                { value: 'year' as const, label: 'Academic Year' },
              ]).map((p) => (
                <button
                  key={p.value}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    period === p.value
                      ? 'bg-sky/20 text-sky border border-sky/40'
                      : 'bg-white/5 text-slate-light/60 border border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setPeriod(p.value)}
                >
                  <Calendar size={14} className="inline mr-1" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky to-sky/80 text-navy font-bold text-sm disabled:opacity-50"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <><Loader2 size={16} className="animate-spin" /> Generating Report...</>
              ) : (
                <><FileText size={16} /> Generate LA Report</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report preview */}
      {reportUrl && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Report Ready</h2>
              <p className="text-sm text-slate-light/60">
                {selectedChild?.name} — {period === 'month' ? 'Monthly' : period === 'term' ? 'Termly' : 'Annual'} Progress Report
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white text-sm font-bold hover:bg-white/10"
              >
                <Eye size={14} /> View Report
              </a>
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky/20 text-sky text-sm font-bold hover:bg-sky/30"
              >
                <Download size={14} /> Download PDF
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-navy/50 overflow-hidden" style={{ height: '600px' }}>
            <iframe
              src={reportUrl}
              className="w-full h-full border-0"
              title="LA Progress Report"
            />
          </div>
        </div>
      )}

      {/* Report history */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">Previous Reports</h2>
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <FileText size={32} className="text-slate-light/30 mx-auto mb-3" />
          <p className="text-white font-semibold mb-2">No previous reports</p>
          <p className="text-slate-light/50 text-sm">
            Generated reports will appear here for easy access.
          </p>
        </div>
      </div>
    </div>
  );
}
