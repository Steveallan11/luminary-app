'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  taskId: string;
  currentStatus: string;
};

export function TaskActionButtons({ taskId, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const updateTask = (status: 'in_progress' | 'blocked' | 'done') => {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/agents/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to update task');
        }

        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to update task');
      }
    });
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => updateTask('in_progress')}
        disabled={isPending || currentStatus === 'in_progress'}
        className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-light/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Start
      </button>
      <button
        type="button"
        onClick={() => updateTask('blocked')}
        disabled={isPending || currentStatus === 'blocked'}
        className="rounded-lg border border-amber/20 px-2.5 py-1 text-xs font-semibold text-amber-light transition hover:bg-amber/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Block
      </button>
      <button
        type="button"
        onClick={() => updateTask('done')}
        disabled={isPending || currentStatus === 'done'}
        className="rounded-lg border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Done
      </button>
      {error ? <span className="text-xs text-rose-300">{error}</span> : null}
    </div>
  );
}
