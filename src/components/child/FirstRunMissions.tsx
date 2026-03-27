'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles, Target } from 'lucide-react';

type Props = {
  childId: string | null;
  childName: string;
  yearGroup?: string | null;
  sessionsCount: number;
};

type MissionKey = 'pick_subject' | 'start_first_lesson' | 'earn_first_xp';

export function markFirstRunMission(childId: string | null, key: MissionKey) {
  if (typeof window === 'undefined') return;
  const k = storageKey(childId);
  const raw = safeParse(localStorage.getItem(k));
  const current = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  localStorage.setItem(k, JSON.stringify({
    pick_subject: Boolean(current.pick_subject),
    start_first_lesson: Boolean(current.start_first_lesson),
    earn_first_xp: Boolean(current.earn_first_xp),
    dismissed: Boolean(current.dismissed),
    [key]: true,
  }));
}

export function resumeFirstRunMissions(childId: string | null) {
  if (typeof window === 'undefined') return;
  const k = storageKey(childId);
  const raw = safeParse(localStorage.getItem(k));
  const current = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  localStorage.setItem(k, JSON.stringify({
    pick_subject: Boolean(current.pick_subject),
    start_first_lesson: Boolean(current.start_first_lesson),
    earn_first_xp: Boolean(current.earn_first_xp),
    dismissed: false,
  }));
}

type MissionState = Record<MissionKey, boolean>;

function storageKey(childId: string | null) {
  return `luminary:first-run:${childId ?? 'unknown'}`;
}

function safeParse(input: string | null): unknown {
  if (!input) return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

export default function FirstRunMissions({ childId, childName, yearGroup, sessionsCount }: Props) {
  const [mission, setMission] = useState<MissionState>({
    pick_subject: false,
    start_first_lesson: false,
    earn_first_xp: false,
  });

  const [dismissed, setDismissed] = useState(false);

  const handleHide = () => {
    setDismissed(true);
    // Make the hide reversible: only hide for a short time.
    setTimeout(() => setDismissed(false), 60_000);
  };

  useEffect(() => {
    const raw = safeParse(localStorage.getItem(storageKey(childId)));
    if (raw && typeof raw === 'object') {
      const obj = raw as Partial<MissionState> & { dismissed?: boolean };
      setMission((prev) => ({
        ...prev,
        pick_subject: Boolean(obj.pick_subject),
        start_first_lesson: Boolean(obj.start_first_lesson),
        earn_first_xp: Boolean(obj.earn_first_xp),
      }));
      setDismissed(Boolean(obj.dismissed));
    }
  }, [childId]);

  useEffect(() => {
    // Auto-complete missions based on observed data.
    if (sessionsCount > 0) {
      setMission((prev) => ({
        ...prev,
        start_first_lesson: true,
        earn_first_xp: true,
      }));
    }
  }, [sessionsCount]);

  useEffect(() => {
    localStorage.setItem(
      storageKey(childId),
      JSON.stringify({ ...mission, dismissed }),
    );
  }, [childId, mission, dismissed]);

  const isFirstRun = sessionsCount === 0;

  const completedCount = useMemo(
    () => Object.values(mission).filter(Boolean).length,
    [mission],
  );

  const isComplete = completedCount === 3;

  if (!isFirstRun) return null;
  if (dismissed) return null;

  const steps: Array<{ key: MissionKey; title: string; hint: string; href?: string; onClick?: () => void }> = [
    {
      key: 'pick_subject',
      title: 'Pick a subject to explore',
      hint: 'Start with something fun — you can try more later.',
    },
    {
      key: 'start_first_lesson',
      title: 'Start your first lesson',
      hint: 'Click a subject card to choose a topic.',
    },
    {
      key: 'earn_first_xp',
      title: 'Earn your first XP',
      hint: 'Complete a few questions and watch your streak begin.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-8 rounded-3xl border border-amber/20 bg-amber/10 p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber">
            <Target size={16} />
            <p className="text-xs font-bold uppercase tracking-[0.16em]">First mission</p>
          </div>
          <h2 className="mt-2 text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Hey {childName}! Let’s get you started{yearGroup ? ` (${yearGroup})` : ''}.
          </h2>
          <p className="mt-1 text-sm text-slate-light/70">
            Complete these 3 steps to unlock your learning world.
          </p>
        </div>

        <button
          type="button"
          onClick={handleHide}
          className="text-xs font-semibold text-slate-light/60 hover:text-white"
        >
          Hide
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map((step, idx) => {
          const done = mission[step.key];
          return (
            <div key={step.key} className="rounded-2xl border border-white/10 bg-navy/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-light/40">Step {idx + 1}</p>
                  <p className="mt-1 text-sm font-bold text-white">{step.title}</p>
                  <p className="mt-1 text-xs text-slate-light/60">{step.hint}</p>
                </div>
                {done ? <CheckCircle2 className="text-emerald-300" size={18} /> : <Sparkles className="text-amber" size={18} />}
              </div>

              {!done && step.key === 'pick_subject' ? (
                <p className="mt-3 text-xs text-slate-light/50">
                  Tip: click any subject card below to complete this step.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-light/60">
          Progress: <span className="font-bold text-white">{completedCount}/3</span>
        </p>
        {isComplete ? (
          <Link
            href="/parent"
            className="text-xs font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Tell your parent you’re ready →
          </Link>
        ) : null}
      </div>
    </motion.div>
  );
}
