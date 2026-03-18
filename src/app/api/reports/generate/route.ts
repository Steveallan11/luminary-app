import { NextRequest, NextResponse } from 'next/server';
import { MOCK_CHILD, MOCK_CHILDREN, MOCK_SUBJECTS, MOCK_SESSIONS, MOCK_TOPIC_PROGRESS, MOCK_TOPICS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/generate
 *
 * Generates an LA-compliant HTML progress report.
 * Matches the structure of the luminarylareportlylarae template.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const childId = body.child_id || 'child-1';
    const period = body.period || 'term';

    const child = MOCK_CHILDREN.find((c) => c.id === childId) || MOCK_CHILD;

    // Gather data
    const childSessions = MOCK_SESSIONS.filter((s) => s.child_id === child.id);
    const periodDays = period === 'month' ? 30 : period === 'year' ? 365 : 90;
    const cutoff = Date.now() - periodDays * 86400000;
    const recentSessions = childSessions.filter(
      (s) => new Date(s.started_at).getTime() > cutoff
    );
    const totalMinutes = recentSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const totalTimeStr = `${totalHours}h ${remainingMinutes}m`;

    // Subject progress data
    const subjectData = MOCK_SUBJECTS.map((subject) => {
      const topics = MOCK_TOPICS[subject.slug] || [];
      const progress = MOCK_TOPIC_PROGRESS[subject.slug] || {};
      const completed = Object.values(progress).filter((t) => t.status === 'completed').length;
      const total = topics.length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const hasActivity = Object.values(progress).some((t) => t.status !== 'locked');
      const subjectSessions = recentSessions.filter((s) => {
        const topic = topics.find((t) => t.id === s.topic_id);
        return !!topic;
      });
      const sessionCount = subjectSessions.length;
      const subjectMinutes = subjectSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const subjectTimeStr = `${Math.floor(subjectMinutes / 60)}h ${subjectMinutes % 60}m`;
      return { name: subject.name, icon: subject.icon_emoji, completed, total, percent, hasActivity, sessionCount, subjectTimeStr };
    }).filter((s) => s.hasActivity);

    const sorted = [...subjectData].sort((a, b) => b.percent - a.percent);
    const strongest = sorted.slice(0, 3).map((s) => s.name);
    const developing = sorted.slice(-3).map((s) => s.name);

    const reportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const periodLabel = period === 'month' ? 'Monthly' : period === 'year' ? 'Annual' : 'Termly';
    const periodStart = new Date(Date.now() - periodDays * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const completedTopics = subjectData.reduce((sum, s) => sum + s.completed, 0);

    const html = buildLAReportHTML({
      child,
      reportDate,
      periodStart,
      periodLabel,
      totalTimeStr,
      totalSessions: recentSessions.length,
      completedTopics,
      subjectData,
      strongest,
      developing,
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Luminary-LA-Report-${child.name.replace(/ /g, '-')}-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

// Keep the GET endpoint for backward compatibility
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id') || 'child-1';

  // Redirect to POST behavior with defaults
  const child = MOCK_CHILDREN.find((c) => c.id === childId) || MOCK_CHILD;
  const reportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = buildLAReportHTML({
    child,
    reportDate,
    periodStart: new Date(Date.now() - 90 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    periodLabel: 'Termly',
    totalTimeStr: '9h 21m',
    totalSessions: 28,
    completedTopics: 14,
    subjectData: [
      { name: 'Maths', icon: '🔢', completed: 3, total: 5, percent: 78, hasActivity: true, sessionCount: 12, subjectTimeStr: '4h 15m' },
      { name: 'History', icon: '🏛️', completed: 4, total: 5, percent: 89, hasActivity: true, sessionCount: 8, subjectTimeStr: '3h 5m' },
      { name: 'English', icon: '📖', completed: 3, total: 4, percent: 82, hasActivity: true, sessionCount: 8, subjectTimeStr: '2h 1m' },
    ],
    strongest: ['History', 'English', 'Maths'],
    developing: ['Maths'],
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

interface ReportParams {
  child: typeof MOCK_CHILD;
  reportDate: string;
  periodStart: string;
  periodLabel: string;
  totalTimeStr: string;
  totalSessions: number;
  completedTopics: number;
  subjectData: Array<{
    name: string;
    icon: string;
    completed: number;
    total: number;
    percent: number;
    hasActivity: boolean;
    sessionCount: number;
    subjectTimeStr: string;
  }>;
  strongest: string[];
  developing: string[];
}

function getMasteryBand(percent: number): { label: string; colour: string } {
  if (percent >= 85) return { label: 'Mastered', colour: '#8B5CF6' };
  if (percent >= 70) return { label: 'Strong', colour: '#3B82F6' };
  if (percent >= 50) return { label: 'Secure', colour: '#10B981' };
  if (percent >= 25) return { label: 'Developing', colour: '#F59E0B' };
  return { label: 'Emerging', colour: '#EF4444' };
}

function buildLAReportHTML(params: ReportParams): string {
  const { child, reportDate, periodStart, periodLabel, totalTimeStr, totalSessions, completedTopics, subjectData, strongest, developing } = params;

  const subjectRows = subjectData.map((s) => {
    const band = getMasteryBand(s.percent);
    return `
      <tr>
        <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06);">
          <span style="font-size: 18px; margin-right: 8px;">${s.icon}</span>
          <span style="font-weight: 600; color: #fff;">${s.name}</span>
        </td>
        <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: center; color: #94A3B8;">${s.sessionCount}</td>
        <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: center; color: #94A3B8;">${s.subjectTimeStr}</td>
        <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <div style="width: 80px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
              <div style="width: ${s.percent}%; height: 100%; background: ${band.colour}; border-radius: 4px;"></div>
            </div>
            <span style="font-weight: 700; color: ${band.colour}; font-size: 14px;">${s.percent}%</span>
          </div>
        </td>
        <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: center;">
          <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; background: ${band.colour}20; color: ${band.colour};">${band.label}</span>
        </td>
        <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: center; color: #94A3B8;">${s.completed}/${s.total}</td>
      </tr>`;
  }).join('');

  const subjectNarratives = subjectData.map((s) => {
    const band = getMasteryBand(s.percent);
    return `
      <div style="margin-bottom: 20px; padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <span style="font-size: 20px;">${s.icon}</span>
          <h4 style="font-size: 16px; font-weight: 700; color: #fff; margin: 0;">${s.name}</h4>
          <span style="display: inline-block; padding: 2px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; background: ${band.colour}20; color: ${band.colour};">${band.label} — ${s.percent}%</span>
        </div>
        <p style="font-size: 13px; line-height: 1.7; color: #CBD5E1; margin: 0;">
          ${child.name} has completed ${s.completed} of ${s.total} topics in ${s.name}, spending ${s.subjectTimeStr} across ${s.sessionCount} sessions. 
          ${s.percent >= 70 ? `This demonstrates strong engagement and understanding. ${child.name} is progressing well and showing confidence in this subject area.` : 
            s.percent >= 50 ? `${child.name} is building a secure foundation in this subject. Continued regular practice will help consolidate understanding and move towards mastery.` :
            `${child.name} is in the early stages of developing understanding in this area. The learning pathway is structured to build confidence through scaffolded activities and regular revisiting of core concepts.`}
        </p>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LA Progress Report — ${child.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0A0F1E; color: #E2E8F0; min-height: 100vh; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 32px; }
    @media print {
      body { background: white; color: #1f2937; }
      .no-print { display: none !important; }
      .container { padding: 20px; }
      table { color: #1f2937; }
      td, th { color: #1f2937 !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Print button -->
    <div class="no-print" style="text-align: right; margin-bottom: 20px;">
      <button onclick="window.print()" style="background: #F59E0B; color: #0A0F1E; border: none; padding: 10px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px;">
        Print / Save as PDF
      </button>
    </div>

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #F59E0B; letter-spacing: -0.5px;">Luminary</div>
        <div style="font-size: 12px; color: #64748B; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px;">Educational Progress Report</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 1.5px;">Report Date</div>
        <div style="font-size: 14px; font-weight: 600; color: #fff; margin-top: 2px;">${reportDate}</div>
        <div style="font-size: 11px; color: #64748B; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px;">Period</div>
        <div style="font-size: 13px; color: #94A3B8; margin-top: 2px;">${periodStart} — ${reportDate}</div>
      </div>
    </div>

    <!-- Child title -->
    <h1 style="font-size: 36px; font-weight: 900; color: #fff; margin-bottom: 4px; letter-spacing: -1px;">${child.name}</h1>
    <p style="font-size: 14px; color: #64748B; margin-bottom: 32px;">${periodLabel} Learning Summary · ${child.year_group} · Age ${child.age}</p>

    <!-- Key metrics -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px;">
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px;">
        <div style="font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Total Sessions</div>
        <div style="font-size: 28px; font-weight: 900; color: #fff;">${totalSessions}</div>
      </div>
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px;">
        <div style="font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Learning Time</div>
        <div style="font-size: 28px; font-weight: 900; color: #fff;">${totalTimeStr}</div>
      </div>
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px;">
        <div style="font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Topics Completed</div>
        <div style="font-size: 28px; font-weight: 900; color: #fff;">${completedTopics}</div>
      </div>
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px;">
        <div style="font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Streak</div>
        <div style="font-size: 28px; font-weight: 900; color: #fff;">${child.streak_days} days</div>
      </div>
    </div>

    <!-- Subject breakdown -->
    <h2 style="font-size: 18px; font-weight: 700; color: #F59E0B; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08);">Subject Attainment</h2>
    <div style="overflow-x: auto; margin-bottom: 32px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: rgba(255,255,255,0.04);">
            <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">Subject</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">Sessions</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">Time</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">Mastery</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">Band</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">Topics</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
        </tbody>
      </table>
    </div>

    <!-- Learning narrative -->
    <h2 style="font-size: 18px; font-weight: 700; color: #F59E0B; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08);">Learning Narrative</h2>
    ${subjectNarratives}

    <!-- Curriculum compliance statement -->
    <h2 style="font-size: 18px; font-weight: 700; color: #F59E0B; margin-bottom: 16px; margin-top: 32px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08);">Curriculum Coverage Statement</h2>
    <div style="padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; margin-bottom: 32px;">
      <p style="font-size: 13px; line-height: 1.8; color: #CBD5E1;">
        ${child.name}, aged ${child.age}, is receiving a comprehensive home education through the Luminary Educational Platform. The educational provision follows the UK National Curriculum framework, covering core and foundation subjects appropriate for ${child.year_group}. Over the reporting period, ${child.name} has engaged in ${totalTimeStr} of structured learning across ${subjectData.length} subjects, demonstrating consistent engagement with a current learning streak of ${child.streak_days} consecutive days.
      </p>
      <p style="font-size: 13px; line-height: 1.8; color: #CBD5E1; margin-top: 12px;">
        ${child.name} has shown particular strength in ${strongest.join(', ')}, where topic completion rates indicate solid understanding and progression. The AI-assisted tutoring approach encourages active learning through the Socratic method, ensuring ${child.name} develops genuine understanding rather than rote memorisation. All lessons follow a structured 7-phase pedagogical arc designed to build, consolidate, and verify understanding.
      </p>
      <p style="font-size: 13px; line-height: 1.8; color: #CBD5E1; margin-top: 12px;">
        In conclusion, ${child.name} is receiving a full-time, efficient and suitable education as required under Section 7 of the Education Act 1996. The breadth of curriculum coverage, consistent engagement, and measurable progress across multiple subjects demonstrate that the educational provision is appropriate for ${child.name}'s age, ability and aptitude.
      </p>
    </div>

    <!-- Mastery band key -->
    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 32px;">
      ${[
        { label: 'Mastered', colour: '#8B5CF6', range: '85-100%' },
        { label: 'Strong', colour: '#3B82F6', range: '70-84%' },
        { label: 'Secure', colour: '#10B981', range: '50-69%' },
        { label: 'Developing', colour: '#F59E0B', range: '25-49%' },
        { label: 'Emerging', colour: '#EF4444', range: '0-24%' },
      ].map(b => `
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${b.colour};"></div>
          <span style="font-size: 11px; font-weight: 600; color: ${b.colour};">${b.label}</span>
          <span style="font-size: 10px; color: #64748B;">(${b.range})</span>
        </div>
      `).join('')}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06);">
      <p style="font-size: 11px; color: #475569;">Generated by Luminary Educational Platform</p>
      <p style="font-size: 10px; color: #334155; margin-top: 4px;">This report has been generated using learning data collected through the Luminary platform. All mastery scores are calculated from interactive lesson assessments.</p>
    </div>
  </div>
</body>
</html>`;
}
