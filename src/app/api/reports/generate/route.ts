import { NextRequest, NextResponse } from 'next/server';
import { MOCK_CHILD, MOCK_CHILDREN, MOCK_SUBJECTS, MOCK_SESSIONS, MOCK_TOPIC_PROGRESS, MOCK_TOPICS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/generate?child_id=xxx
 *
 * Generates a PDF progress report for Local Authority submissions.
 * Uses jsPDF to create the PDF on the server side.
 * In production, would call Claude API for the narrative section.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id') || 'child-1';

  const child = MOCK_CHILDREN.find((c) => c.id === childId) || MOCK_CHILD;

  // Gather data
  const childSessions = MOCK_SESSIONS.filter((s) => s.child_id === child.id);
  const last30Days = Date.now() - 30 * 86400000;
  const recentSessions = childSessions.filter(
    (s) => new Date(s.started_at).getTime() > last30Days
  );
  const totalMinutes = recentSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

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
    const lastActive = subjectSessions.length > 0
      ? new Date(subjectSessions[0].started_at).toLocaleDateString('en-GB')
      : 'N/A';
    return { name: subject.name, completed, total, percent, lastActive, hasActivity };
  }).filter((s) => s.hasActivity);

  // Sort by percent for strongest/weakest
  const sorted = [...subjectData].sort((a, b) => b.percent - a.percent);
  const strongest = sorted.slice(0, 3).map((s) => s.name);
  const developing = sorted.slice(-3).map((s) => s.name);

  // Session summaries
  const sessionSummaries = recentSessions
    .slice(0, 5)
    .map((s) => s.summary_text || 'Lesson completed')
    .join('; ');

  // Generate AI narrative (mock for now, would use Claude in production)
  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const periodStart = new Date(Date.now() - 30 * 86400000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const narrative = generateNarrative(child, subjectData, totalHours, strongest, developing, sessionSummaries);

  // Build PDF using a simple text-based approach (returns as downloadable)
  // We'll generate HTML and return it as a downloadable page
  const html = buildReportHTML(child, reportDate, periodStart, narrative, subjectData, totalHours);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="Luminary-Progress-Report-${child.name}-${new Date().toISOString().split('T')[0]}.html"`,
    },
  });
}

function generateNarrative(
  child: typeof MOCK_CHILD,
  subjectData: { name: string; completed: number; total: number; percent: number }[],
  totalHours: string,
  strongest: string[],
  developing: string[],
  sessionSummaries: string
): string {
  const subjectList = subjectData.map((s) => `${s.name} (${s.percent}%)`).join(', ');
  const completedTopics = subjectData.reduce((sum, s) => sum + s.completed, 0);

  return `<p>${child.name}, aged ${child.age}, is receiving a comprehensive home education through the Luminary Educational Platform. The educational provision follows the UK National Curriculum framework, covering core and foundation subjects appropriate for ${child.year_group}. Over the reporting period, ${child.name} has engaged in ${totalHours} hours of structured learning across ${subjectData.length} subjects, demonstrating consistent engagement with a current learning streak of ${child.streak_days} consecutive days.</p>

<p>${child.name} has shown particular strength in ${strongest.join(', ')}, where topic completion rates indicate solid understanding and progression. Across all subjects studied (${subjectList}), ${child.name} has completed ${completedTopics} topics with varying degrees of mastery. Recent learning activities include: ${sessionSummaries}. The AI-assisted tutoring approach encourages active learning through the Socratic method, ensuring ${child.name} develops genuine understanding rather than rote memorisation.</p>

<p>In conclusion, ${child.name} is receiving a full-time, efficient and suitable education as required under Section 7 of the Education Act 1996. The breadth of curriculum coverage, consistent engagement, and measurable progress across multiple subjects demonstrate that the educational provision is appropriate for ${child.name}'s age, ability and aptitude. Areas currently being developed include ${developing.join(', ')}, with structured learning pathways in place to support continued progression.</p>`;
}

function buildReportHTML(
  child: typeof MOCK_CHILD,
  reportDate: string,
  periodStart: string,
  narrative: string,
  subjectData: { name: string; completed: number; total: number; percent: number; lastActive: string }[],
  totalHours: string
): string {
  const subjectRows = subjectData
    .map(
      (s) =>
        `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${s.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${s.completed}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${s.total}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${s.percent}%</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${s.lastActive}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Progress Report - ${child.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1f2937; line-height: 1.6; background: #f9fafb; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; background: white; min-height: 100vh; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #0f172a; }
    .logo { font-size: 24px; font-weight: 700; color: #0f172a; }
    .logo span { color: #f59e0b; }
    .meta { text-align: right; font-size: 13px; color: #6b7280; }
    .meta strong { color: #1f2937; display: block; font-size: 15px; }
    h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 24px 0 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .info-item { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
    .info-item label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; display: block; margin-bottom: 2px; }
    .info-item span { font-size: 15px; font-weight: 600; color: #1f2937; }
    .narrative p { margin-bottom: 16px; font-size: 14px; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th { background: #0f172a; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
    th:not(:first-child) { text-align: center; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
    @media print {
      body { background: white; }
      .container { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
      <button onclick="window.print()" style="background: #0f172a; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
        Print / Save as PDF
      </button>
    </div>

    <div class="header">
      <div>
        <div class="logo"><span>&#10024;</span> Luminary</div>
        <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">Educational Progress Report</div>
      </div>
      <div class="meta">
        <strong>${child.name}</strong>
        Report Date: ${reportDate}<br>
        Period: ${periodStart} &ndash; ${reportDate}
      </div>
    </div>

    <h2>Learner Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>Full Name</label>
        <span>${child.name}</span>
      </div>
      <div class="info-item">
        <label>Age</label>
        <span>${child.age} years old</span>
      </div>
      <div class="info-item">
        <label>Year Group</label>
        <span>${child.year_group}</span>
      </div>
      <div class="info-item">
        <label>Learning Mode</label>
        <span>${child.learning_mode === 'full_homeschool' ? 'Full Home Education' : 'School Supplement'}</span>
      </div>
      <div class="info-item">
        <label>Total Learning Hours (30 days)</label>
        <span>${totalHours} hours</span>
      </div>
      <div class="info-item">
        <label>Current Streak</label>
        <span>${child.streak_days} days</span>
      </div>
    </div>

    <h2>Educational Progress Report</h2>
    <div class="narrative">
      ${narrative}
    </div>

    <h2>Subject Progress Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Subject</th>
          <th>Topics Completed</th>
          <th>Total Topics</th>
          <th>Progress</th>
          <th>Last Active</th>
        </tr>
      </thead>
      <tbody>
        ${subjectRows}
      </tbody>
    </table>

    <div class="footer">
      <p>Generated by Luminary Educational Platform | www.luminary.education</p>
      <p style="margin-top: 4px;">This report has been generated using learning data collected through the Luminary platform.</p>
    </div>
  </div>
</body>
</html>`;
}
