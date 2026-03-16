import { NextRequest, NextResponse } from 'next/server';
import { MOCK_WORKSHEET } from '@/lib/mock-content';
import { WorksheetData } from '@/types';

// Generate a printable HTML worksheet
export async function GET(req: NextRequest) {
  const assetId = req.nextUrl.searchParams.get('asset_id');

  // In production, fetch from Supabase. For demo, use mock data.
  const asset = assetId === MOCK_WORKSHEET.id ? MOCK_WORKSHEET : MOCK_WORKSHEET;
  const data = asset.content_json as unknown as WorksheetData;

  const html = generateWorksheetHTML(data);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
  });
}

function generateWorksheetHTML(data: WorksheetData): string {
  const ageStyles = getAgeStyles(data.age_group);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.topic} Worksheet — Luminary</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Nunito', sans-serif;
      background: white;
      color: #1a1a2e;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      font-size: ${ageStyles.baseFontSize};
      line-height: ${ageStyles.lineHeight};
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid ${ageStyles.accentColour};
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .header h1 {
      font-size: ${ageStyles.titleSize};
      color: ${ageStyles.accentColour};
      font-weight: 800;
    }

    .header .meta {
      text-align: right;
      font-size: 12px;
      color: #666;
    }

    .name-line {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      font-weight: 600;
    }

    .name-line .line {
      flex: 1;
      border-bottom: 1px solid #ccc;
      height: 1px;
    }

    .section {
      margin-bottom: 28px;
    }

    .section-title {
      font-size: ${ageStyles.sectionTitleSize};
      font-weight: 800;
      color: ${ageStyles.accentColour};
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title .emoji {
      font-size: 1.2em;
    }

    .question {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    .question-text {
      font-weight: 600;
      margin-bottom: 8px;
    }

    .question-number {
      display: inline-block;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${ageStyles.accentColour};
      color: white;
      text-align: center;
      line-height: 28px;
      font-size: 14px;
      font-weight: 700;
      margin-right: 8px;
    }

    .answer-lines {
      margin-left: 36px;
    }

    .answer-line {
      border-bottom: 1px solid #ddd;
      height: ${ageStyles.lineSpacing};
      margin-bottom: 4px;
    }

    .working-space {
      border: 1px dashed #ccc;
      border-radius: 8px;
      padding: 12px;
      margin-left: 36px;
      min-height: 80px;
      margin-bottom: 8px;
    }

    .working-label {
      font-size: 11px;
      color: #999;
      margin-bottom: 4px;
    }

    .create-box {
      border: 2px solid ${ageStyles.accentColour};
      border-radius: 12px;
      padding: 20px;
      min-height: 200px;
    }

    .create-title {
      font-weight: 800;
      color: ${ageStyles.accentColour};
      margin-bottom: 8px;
    }

    .create-description {
      font-size: 14px;
      color: #555;
      margin-bottom: 16px;
    }

    .reflect-section {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
    }

    .reflect-prompt {
      margin-bottom: 12px;
    }

    .reflect-prompt p {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 11px;
      color: #999;
    }

    .print-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${ageStyles.accentColour};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-family: 'Nunito', sans-serif;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    @media print {
      .print-btn { display: none; }
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <div>
      <h1>${data.topic}</h1>
      <p style="color: #666; font-size: 14px;">${data.subject} — Luminary Learning</p>
    </div>
    <div class="meta">
      <p>Age group: ${data.age_group}</p>
      <p>Date: _______________</p>
    </div>
  </div>

  <div class="name-line">
    Name: <span class="line"></span>
  </div>

  <!-- RECALL SECTION -->
  <div class="section">
    <div class="section-title"><span class="emoji">🧠</span> Recall — What do you remember?</div>
    ${data.recall_questions.map((q, i) => `
      <div class="question">
        <div class="question-text"><span class="question-number">${i + 1}</span>${q.q}</div>
        <div class="answer-lines">
          ${Array.from({ length: q.lines }, () => '<div class="answer-line"></div>').join('')}
        </div>
      </div>
    `).join('')}
  </div>

  <!-- APPLY SECTION -->
  <div class="section">
    <div class="section-title"><span class="emoji">🔧</span> Apply — Use what you know</div>
    ${data.apply_questions.map((q, i) => `
      <div class="question">
        <div class="question-text"><span class="question-number">${data.recall_questions.length + i + 1}</span>${q.q}</div>
        ${q.show_working_space ? `
          <div class="working-space">
            <div class="working-label">Working space:</div>
          </div>
        ` : ''}
        <div class="answer-lines">
          ${Array.from({ length: q.lines }, () => '<div class="answer-line"></div>').join('')}
        </div>
      </div>
    `).join('')}
  </div>

  <!-- CREATE SECTION -->
  <div class="section">
    <div class="section-title"><span class="emoji">🎨</span> Create — Show your understanding</div>
    <div class="create-box">
      <div class="create-title">${data.create_task.title}</div>
      <div class="create-description">${data.create_task.description}</div>
      ${Array.from({ length: data.create_task.lines }, () => '<div class="answer-line"></div>').join('')}
    </div>
  </div>

  <!-- REFLECT SECTION -->
  <div class="section">
    <div class="section-title"><span class="emoji">💭</span> Reflect — Think about your learning</div>
    <div class="reflect-section">
      ${data.reflect_prompts.map((prompt) => `
        <div class="reflect-prompt">
          <p>${prompt}</p>
          <div class="answer-line"></div>
          <div class="answer-line"></div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="footer">
    Generated by Luminary — UK Homeschool Learning Platform
  </div>
</body>
</html>`;
}

function getAgeStyles(ageGroup: string) {
  switch (ageGroup) {
    case '5-7':
      return {
        baseFontSize: '18px',
        lineHeight: '1.8',
        titleSize: '28px',
        sectionTitleSize: '20px',
        lineSpacing: '36px',
        accentColour: '#3B82F6',
      };
    case '8-11':
      return {
        baseFontSize: '16px',
        lineHeight: '1.6',
        titleSize: '24px',
        sectionTitleSize: '18px',
        lineSpacing: '28px',
        accentColour: '#3B82F6',
      };
    case '12-14':
      return {
        baseFontSize: '14px',
        lineHeight: '1.5',
        titleSize: '22px',
        sectionTitleSize: '16px',
        lineSpacing: '24px',
        accentColour: '#6366F1',
      };
    case '15-16':
      return {
        baseFontSize: '13px',
        lineHeight: '1.5',
        titleSize: '20px',
        sectionTitleSize: '15px',
        lineSpacing: '22px',
        accentColour: '#6366F1',
      };
    default:
      return {
        baseFontSize: '15px',
        lineHeight: '1.6',
        titleSize: '22px',
        sectionTitleSize: '17px',
        lineSpacing: '26px',
        accentColour: '#3B82F6',
      };
  }
}
