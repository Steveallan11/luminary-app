'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DatabaseZap, Loader2, PlayCircle } from 'lucide-react';

type ActionState = {
  tone: 'success' | 'error';
  message: string;
} | null;

async function postJson(url: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  });

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function CeoActionBar() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<'seed' | 'run' | 'product-tech' | 'growth' | 'support-success' | null>(null);
  const [state, setState] = useState<ActionState>(null);

  const handleAction = (action: 'seed' | 'run' | 'product-tech' | 'growth' | 'support-success') => {
    setActiveAction(action);
    setState(null);

    startTransition(async () => {
      try {
        const endpoint = action === 'seed'
          ? '/api/agents/tasks/seed'
          : action === 'product-tech'
            ? '/api/agents/product-tech/run'
            : action === 'growth'
              ? '/api/agents/growth/run'
              : action === 'support-success'
                ? '/api/agents/support-success/run'
                : '/api/agents/ceo/run';

        const result = await postJson(endpoint);

        if (action === 'seed') {
          const inserted = typeof result?.inserted === 'number' ? result.inserted : 0;
          const skipped = result?.skipped === true;
          const reason = typeof result?.reason === 'string' ? result.reason : null;

          setState({
            tone: 'success',
            message: skipped
              ? reason ?? 'Starter tasks already exist, so nothing new was inserted.'
              : inserted > 0
                ? `Seeded ${inserted} starter task${inserted === 1 ? '' : 's'}.`
                : 'Starter task seeding completed.',
          });
        } else if (action === 'product-tech' || action === 'growth' || action === 'support-success') {
          const createdTasks = Array.isArray(result?.createdTasks) ? result.createdTasks.length : 0;
          const label = action === 'product-tech'
            ? 'Product & Tech'
            : action === 'growth'
              ? 'Growth'
              : 'Support & Success';

          setState({
            tone: 'success',
            message: createdTasks > 0
              ? `${label} review completed and queued ${createdTasks} task${createdTasks === 1 ? '' : 's'}.`
              : `${label} review completed.`,
          });
        } else {
          const dashboard = result?.dashboard as { overview?: { open_high_priority_tasks?: number } } | undefined;
          const highPriorityCount = dashboard?.overview?.open_high_priority_tasks;

          setState({
            tone: 'success',
            message: typeof highPriorityCount === 'number'
              ? `CEO review completed. ${highPriorityCount} high-priority task${highPriorityCount === 1 ? '' : 's'} currently open.`
              : 'CEO review completed.',
          });
        }

        router.refresh();
      } catch (error: unknown) {
        setState({
          tone: 'error',
          message: error instanceof Error ? error.message : 'Something went wrong while running that action.',
        });
      } finally {
        setActiveAction(null);
      }
    });
  };

  const runBusy = isPending && activeAction === 'run';
  const seedBusy = isPending && activeAction === 'seed';
  const productTechBusy = isPending && activeAction === 'product-tech';
  const growthBusy = isPending && activeAction === 'growth';
  const supportBusy = isPending && activeAction === 'support-success';

  return (
    <div className="flex flex-col items-stretch gap-3 sm:items-end">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => handleAction('seed')}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {seedBusy ? <Loader2 size={16} className="animate-spin" /> : <DatabaseZap size={16} />}
          {seedBusy ? 'Seeding…' : 'Seed Starter Tasks'}
        </button>
        <button
          type="button"
          onClick={() => handleAction('product-tech')}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-electric/30 bg-electric/10 px-4 py-2 text-sm font-bold text-electric-light transition hover:bg-electric/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {productTechBusy ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
          {productTechBusy ? 'Running…' : 'Run Product & Tech'}
        </button>
        <button
          type="button"
          onClick={() => handleAction('growth')}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {growthBusy ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
          {growthBusy ? 'Running…' : 'Run Growth'}
        </button>
        <button
          type="button"
          onClick={() => handleAction('support-success')}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-bold text-sky-300 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {supportBusy ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
          {supportBusy ? 'Running…' : 'Run Support & Success'}
        </button>
        <button
          type="button"
          onClick={() => handleAction('run')}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-amber px-4 py-2 text-sm font-bold text-navy transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {runBusy ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
          {runBusy ? 'Running…' : 'Run CEO Review'}
        </button>
      </div>

      {state ? (
        <p
          className={[
            'max-w-xl text-sm',
            state.tone === 'success' ? 'text-emerald-300' : 'text-rose-300',
          ].join(' ')}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
