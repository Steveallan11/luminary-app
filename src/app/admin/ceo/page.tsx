import { BarChart3, Bot, Clock3, ShieldAlert } from 'lucide-react';
import { getCeoDashboard } from '@/lib/agents/run-ceo';
import { CeoActionBar } from '@/components/admin/CeoActionBar';

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-light/40">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default async function AdminCeoPage() {
  const dashboard = await getCeoDashboard();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">CEO Dashboard</h1>
          <p className="mt-1 text-sm text-slate-light/60">
            Founder operating view for priorities, logs, metrics, and next actions.
          </p>
        </div>
        <CeoActionBar />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Last CEO Run" value={dashboard.overview.last_ceo_run_at ? new Date(dashboard.overview.last_ceo_run_at).toLocaleString() : 'Not run yet'} />
        <MetricCard label="Open High Priority" value={String(dashboard.overview.open_high_priority_tasks)} />
        <MetricCard label="Blockers" value={String(dashboard.overview.blockers)} />
        <MetricCard label="Recent Logs" value={String(dashboard.logs.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center gap-2 text-white">
            <Bot size={18} className="text-amber" />
            <h2 className="text-lg font-bold">CEO Brief</h2>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-sm text-slate-light/70">{dashboard.ceo_brief.summary}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-light/40">Priorities</p>
                <ul className="space-y-2 text-sm text-slate-light/80">
                  {dashboard.ceo_brief.priorities.length > 0 ? dashboard.ceo_brief.priorities.map((item) => (
                    <li key={item}>• {item}</li>
                  )) : <li className="text-slate-light/40">No priorities yet</li>}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-light/40">Blockers</p>
                <ul className="space-y-2 text-sm text-slate-light/80">
                  {dashboard.ceo_brief.blockers.length > 0 ? dashboard.ceo_brief.blockers.map((item) => (
                    <li key={item}>• {item}</li>
                  )) : <li className="text-slate-light/40">No blockers</li>}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-light/40">Next Actions</p>
                <ul className="space-y-2 text-sm text-slate-light/80">
                  {dashboard.ceo_brief.next_actions.length > 0 ? dashboard.ceo_brief.next_actions.map((item) => (
                    <li key={item}>• {item}</li>
                  )) : <li className="text-slate-light/40">No actions yet</li>}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center gap-2 text-white">
            <BarChart3 size={18} className="text-electric" />
            <h2 className="text-lg font-bold">Metrics Snapshot</h2>
          </div>

          {dashboard.metrics ? (
            <div className="space-y-3 text-sm text-slate-light/80">
              <div className="flex justify-between"><span>MRR</span><span className="font-semibold text-white">£{dashboard.metrics.mrr}</span></div>
              <div className="flex justify-between"><span>Subscribers</span><span className="font-semibold text-white">{dashboard.metrics.subscriber_count}</span></div>
              <div className="flex justify-between"><span>Trials</span><span className="font-semibold text-white">{dashboard.metrics.trial_count}</span></div>
              <div className="flex justify-between"><span>Active Sessions</span><span className="font-semibold text-white">{dashboard.metrics.active_sessions}</span></div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber/20 bg-amber/10 p-4 text-sm text-amber-light">
              No business metrics found yet. Seed <code>business_metrics</code> to make this dashboard useful.
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center gap-2 text-white">
            <ShieldAlert size={18} className="text-orange-400" />
            <h2 className="text-lg font-bold">Open Tasks</h2>
          </div>
          <div className="space-y-3">
            {dashboard.tasks.length > 0 ? dashboard.tasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-white/10 bg-navy/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{task.title}</p>
                    {task.description && <p className="mt-1 text-sm text-slate-light/60">{task.description}</p>}
                  </div>
                  <div className="text-right text-xs text-slate-light/50">
                    <p>{task.priority}</p>
                    <p>{task.status}</p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-light/40">No open tasks yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center gap-2 text-white">
            <Clock3 size={18} className="text-sky-400" />
            <h2 className="text-lg font-bold">Recent Logs</h2>
          </div>
          <div className="space-y-3">
            {dashboard.logs.length > 0 ? dashboard.logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-white/10 bg-navy/40 p-4">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-light/50">{log.agent_name}</p>
                  <p className="text-xs text-slate-light/40">{new Date(log.run_at).toLocaleString()}</p>
                </div>
                <p className="text-sm text-slate-light/80">{log.summary}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-light/40">No logs yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
