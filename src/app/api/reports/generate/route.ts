import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import * as Sentry from '@sentry/nextjs';
import LAReportPDF from '@/components/reports/LAReportPDF';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

type ReportPeriod = 'month' | 'term' | 'year';

function toPeriod(input: string | null): ReportPeriod {
  if (input === 'month' || input === 'year') return input;
  return 'term';
}

function getPeriodWindow(period: ReportPeriod): { days: number; label: string } {
  if (period === 'month') return { days: 30, label: 'Monthly' };
  if (period === 'year') return { days: 365, label: 'Annual' };
  return { days: 90, label: 'Termly' };
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

async function capturePostHogExport(properties: Record<string, unknown>) {
  const apiKey = process.env.POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  const host = (process.env.POSTHOG_HOST ?? process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com').replace(/\/$/, '');

  try {
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event: 'la_report_export_requested',
        distinct_id: String(properties.child_id ?? 'unknown_child'),
        properties,
      }),
    });
  } catch {
    // Analytics failure must not block report generation.
  }
}

async function buildReportData(childId: string, period: ReportPeriod) {
  const supabase = getSupabaseServiceClient();
  const periodWindow = getPeriodWindow(period);
  const cutoffIso = new Date(Date.now() - periodWindow.days * 24 * 60 * 60 * 1000).toISOString();

  const { data: child, error: childError } = await supabase
    .from('children')
    .select('id, name, age, year_group, streak_days')
    .eq('id', childId)
    .maybeSingle();

  if (childError) throw new Error(childError.message);
  if (!child) throw new Error('Learner not found');

  const { data: sessions, error: sessionsError } = await supabase
    .from('lesson_sessions')
    .select('id, child_id, topic_id, started_at, duration_minutes, mastery_score')
    .eq('child_id', childId)
    .gte('started_at', cutoffIso)
    .order('started_at', { ascending: false });

  if (sessionsError) throw new Error(sessionsError.message);
  const safeSessions = sessions ?? [];

  const topicIds = Array.from(new Set(safeSessions.map((session) => session.topic_id).filter(Boolean)));
  const { data: topics, error: topicsError } = topicIds.length
    ? await supabase
        .from('topics')
        .select('id, title, subject_id, subjects(name)')
        .in('id', topicIds)
    : { data: [], error: null };

  if (topicsError) throw new Error(topicsError.message);

  const { data: progressRows, error: progressError } = await supabase
    .from('child_topic_progress')
    .select('topic_id, status, mastery_score, topics(subject_id, subjects(name))')
    .eq('child_id', childId);

  if (progressError) throw new Error(progressError.message);

  const topicById = new Map((topics ?? []).map((topic: any) => [topic.id, topic]));
  const progressBySubject = new Map<string, { completed: number; total: number; totalMastery: number }>();

  for (const row of progressRows ?? []) {
    const topic = Array.isArray(row.topics) ? row.topics[0] : row.topics;
    const subject = Array.isArray(topic?.subjects) ? topic.subjects[0] : topic?.subjects;
    const subjectName = subject?.name ?? 'Unknown Subject';
    const bucket = progressBySubject.get(subjectName) ?? { completed: 0, total: 0, totalMastery: 0 };

    bucket.total += 1;
    bucket.totalMastery += Number(row.mastery_score ?? 0);
    if (row.status === 'completed') {
      bucket.completed += 1;
    }

    progressBySubject.set(subjectName, bucket);
  }

  const sessionsBySubject = new Map<string, { sessions: number; minutes: number; masteryTotal: number }>();
  for (const session of safeSessions) {
    const topic = topicById.get(session.topic_id);
    const subjectRecord = Array.isArray(topic?.subjects) ? topic.subjects[0] : topic?.subjects;
    const subjectName = subjectRecord?.name ?? 'Unknown Subject';
    const bucket = sessionsBySubject.get(subjectName) ?? { sessions: 0, minutes: 0, masteryTotal: 0 };
    bucket.sessions += 1;
    bucket.minutes += Number(session.duration_minutes ?? 0);
    bucket.masteryTotal += Number(session.mastery_score ?? 0);
    sessionsBySubject.set(subjectName, bucket);
  }

  const subjectNames = Array.from(
    new Set([
      ...Array.from(progressBySubject.keys()),
      ...Array.from(sessionsBySubject.keys()),
    ])
  );
  const subjects = subjectNames.map((subjectName) => {
    const progress = progressBySubject.get(subjectName) ?? { completed: 0, total: 0, totalMastery: 0 };
    const sessionsForSubject = sessionsBySubject.get(subjectName) ?? { sessions: 0, minutes: 0, masteryTotal: 0 };

    const masteryFromSessions =
      sessionsForSubject.sessions > 0
        ? Math.round(sessionsForSubject.masteryTotal / sessionsForSubject.sessions)
        : progress.total > 0
          ? Math.round(progress.totalMastery / progress.total)
          : 0;

    const narrative =
      masteryFromSessions >= 70
        ? `${child.name} is showing strong understanding in ${subjectName} with consistent performance this period.`
        : `${child.name} is building secure foundations in ${subjectName}; continued guided practice is recommended.`;

    return {
      name: subjectName,
      sessions: sessionsForSubject.sessions,
      time: formatMinutes(sessionsForSubject.minutes),
      mastery: masteryFromSessions,
      narrative,
    };
  });

  const totalMinutes = safeSessions.reduce((sum, session) => sum + Number(session.duration_minutes ?? 0), 0);
  const lessonsCompleted =
    progressRows?.filter((row) => row.status === 'completed').length ??
    safeSessions.filter((session) => Number(session.mastery_score ?? 0) >= 70).length;

  return {
    childId: child.id,
    filenameStem: child.name.replace(/\s+/g, '-'),
    pdfData: {
      childName: child.name,
      period: `${periodWindow.label} Learning Summary`,
      generatedDate: new Date().toLocaleDateString('en-GB'),
      totalSessions: safeSessions.length,
      totalTime: formatMinutes(totalMinutes),
      lessonsCompleted,
      subjects,
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id');
  const period = toPeriod(searchParams.get('period'));

  if (!childId) {
    return NextResponse.json({ error: 'child_id is required' }, { status: 400 });
  }

  try {
    const report = await buildReportData(childId, period);
    await capturePostHogExport({
      child_id: report.childId,
      period,
      source: 'parent_dashboard',
      generated_at: new Date().toISOString(),
    });

    const pdfBuffer = await renderToBuffer(
      React.createElement(LAReportPDF, {
        data: report.pdfData,
      }) as unknown as React.ReactElement
    );
    const pdfBytes = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=\"Luminary-LA-Report-${report.filenameStem}-${new Date().toISOString().slice(0, 10)}.pdf\"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Failed to generate report';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { child_id?: string; period?: string } | null;
  const childId = body?.child_id;

  if (!childId) {
    return NextResponse.json({ error: 'child_id is required' }, { status: 400 });
  }

  const period = toPeriod(body?.period ?? null);
  const url = `/api/reports/generate?child_id=${encodeURIComponent(childId)}&period=${period}`;
  return NextResponse.json({ url });
}
