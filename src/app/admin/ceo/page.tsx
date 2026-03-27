import { BarChart3, Bot, Clock3, ShieldAlert, Wrench } from 'lucide-react';
import { getCeoDashboard } from '@/lib/agents/run-ceo';
import { CeoActionBar } from '@/components/admin/CeoActionBar';
import { TaskActionButtons } from '@/components/admin/TaskActionButtons';

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-light/40">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function statusBadgeClasses(status: string) {
  if (status === 'done') return 'bg-emerald-500/15 text-emerald-300';
  if (status === 'in_progress') return 'bg-sky-500/15 text-sky-300';
  if (status === 'blocked') return 'bg-rose-500/15 text-rose-300';
  return 'bg-white/10 text-slate-light/70';
}

function priorityBadgeClasses(priority: string) {
  if (priority === 'critical') return 'bg-rose-500/15 text-rose-300';
  if (priority === 'high') return 'bg-amber/15 text-amber-light';
  if (priority === 'medium') return 'bg-sky-500/15 text-sky-300';
  return 'bg-white/10 text-slate-light/70';
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

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center gap-2 text-white">
          <Wrench size={18} className="text-electric" />
          <h2 className="text-lg font-bold">Agent Status</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.agents.map((agent) => (
            <div key={agent.agent_name} className="rounded-xl border border-white/10 bg-navy/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-light/50">{agent.agent_name.replace('_', ' ')}</p>
                  <p className="mt-2 text-sm text-slate-light/80">{agent.summary}</p>
                </div>
                <span
                  className={[
                    'rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em]',
                    agent.status === 'blocked'
                      ? 'bg-rose-500/15 text-rose-300'
                      : agent.status === 'attention'
                        ? 'bg-amber/15 text-amber-light'
                        : 'bg-emerald-500/15 text-emerald-300',
                  ].join(' ')}
                >
                  {agent.status}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-light/50">
                <span>{agent.open_tasks_count} open task{agent.open_tasks_count === 1 ? '' : 's'}</span>
                <span>{agent.latest_run_at ? new Date(agent.latest_run_at).toLocaleString() : 'Not run yet'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center gap-2 text-white">
            <ShieldAlert size={18} className="text-orange-400" />
            <h2 className="text-lg font-bold">Tasks</h2>
          </div>

          {(() => {
            const executableTypes = new Set([
              'teaching_lane_audit',
              'homepage_messaging_audit',
              'parent_onboarding_audit',
              'lesson_media_enrichment',
              'lesson_game_or_worksheet',
              'lesson_diagram_or_concept_card',
              'homepage_copy_revision',
              'generate_explanation_assets',
              'generate_supporting_content_assets',
              'lesson_media_pack',
            ]);

            const now = Date.now();
            const isStuck = (task: any) => task.status === 'in_progress' && (now - new Date(task.updated_at).getTime()) > 30 * 60 * 1000;

            const groups = {
              pending: dashboard.tasks.filter((t) => t.status === 'pending'),
              in_progress: dashboard.tasks.filter((t) => t.status === 'in_progress'),
              blocked: dashboard.tasks.filter((t) => t.status === 'blocked'),
              done: dashboard.tasks.filter((t) => t.status === 'done'),
            };

            const renderTask = (task: any) => (
              <div key={task.id} className="rounded-xl border border-white/10 bg-navy/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{task.title}</p>
                      <span className={['rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em]', priorityBadgeClasses(task.priority)].join(' ')}>
                        {task.priority}
                      </span>
                      <span className={['rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em]', statusBadgeClasses(task.status)].join(' ')}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {executableTypes.has(task.task_type) ? (
                        <span className="rounded-full bg-electric/15 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-electric">
                          executable
                        </span>
                      ) : null}
                      {isStuck(task) ? (
                        <span className="rounded-full bg-rose-500/15 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-300">
                          stuck
                        </span>
                      ) : null}
                    </div>
                    {task.description && <p className="mt-1 text-sm text-slate-light/60">{task.description}</p>}
                    {executableTypes.has(task.task_type) ? (
                      <TaskActionButtons taskId={task.id} currentStatus={task.status} />
                    ) : (
                      <p className="mt-3 text-xs text-slate-light/50">Manual task (no executor yet).</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-light/50">
                    <p>{task.agent_name}</p>
                    <p>{new Date(task.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );

            const renderGroup = (label: string, tasks: any[]) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-light/40">{label}</p>
                  <p className="text-xs text-slate-light/50">{tasks.length}</p>
                </div>
                {tasks.length > 0 ? tasks.map(renderTask) : (
                  <p className="text-sm text-slate-light/40">None.</p>
                )}
              </div>
            );

            return (
              <div className="space-y-6">
                {renderGroup('To do', groups.pending)}
                {renderGroup('Doing', groups.in_progress)}
                {renderGroup('Blocked', groups.blocked)}
                {renderGroup('Done (latest)', groups.done.slice(0, 10))}
              </div>
            );
          })()}
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
