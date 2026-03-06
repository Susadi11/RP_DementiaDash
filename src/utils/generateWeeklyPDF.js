import { jsPDF } from 'jspdf';

/**
 * Generate a medical-format weekly health report PDF.
 * @param {Object} report  - Weekly reminder/cognitive report from the API
 * @param {string} name    - Patient display name
 * @param {Object} gameStats - Game stats from /game/stats/{userId} (optional)
 */
export default function generateWeeklyPDF(report, name = 'Patient', gameStats = null) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();   // 210
  const PH = doc.internal.pageSize.getHeight();  // 297
  const M  = 18;   // margin
  const CW = PW - M * 2;  // content width
  let y = M;

  // ── Colour palette ──────────────────────────────────────────
  const C = {
    navy:    [15,  40, 100],
    blue:    [37,  99, 235],
    lblue:   [219, 234, 254],
    green:   [22, 163,  74],
    lgreen:  [220, 252, 231],
    yellow:  [202, 138,   4],
    lyellow: [254, 249, 195],
    orange:  [234,  88,  12],
    lorange: [255, 237, 213],
    red:     [220,  38,  38],
    lred:    [254, 226, 226],
    gray:    [107, 114, 128],
    lgray:   [243, 244, 246],
    white:   [255, 255, 255],
    text:    [ 17,  24,  39],
    muted:   [ 75,  85,  99],
  };

  // ── Utilities ───────────────────────────────────────────────
  const newPage = () => { doc.addPage(); y = M; };
  const ensureSpace = (h) => { if (y + h > PH - 20) newPage(); };

  const setColor = (rgb, type = 'fill') => {
    if (type === 'fill') doc.setFillColor(...rgb);
    else doc.setTextColor(...rgb);
  };

  // Horizontal divider line
  const hRule = (py, color = C.lblue) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(M, py, M + CW, py);
  };

  // Section heading with coloured left bar
  const sectionHead = (title, icon = '') => {
    ensureSpace(16);
    y += 8;
    doc.setFillColor(...C.blue);
    doc.rect(M, y - 6, 3, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    setColor(C.navy, 'text');
    doc.text(`${icon}${icon ? '  ' : ''}${title}`, M + 6, y);
    y += 3;
    hRule(y, C.lblue);
    y += 6;
  };

  // Two-column key-value row
  const kv = (key, val, x = M, colW = CW, muted = false) => {
    ensureSpace(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(C.muted, 'text');
    doc.text(key, x, y);
    doc.setFont('helvetica', 'normal');
    setColor(muted ? C.gray : C.text, 'text');
    doc.text(String(val ?? '—'), x + colW * 0.45, y);
    y += 6;
  };

  const pct = (v) => v != null ? `${Math.round(v)}%` : '—';
  const fmt = (v, suf = '') => v != null ? `${v}${suf}` : '—';

  // Risk level → colours + label
  const riskStyle = (level) => {
    const s = (level || '').toLowerCase();
    if (s === 'low')      return { fg: C.green,  bg: C.lgreen,  label: 'LOW RISK' };
    if (s === 'moderate') return { fg: C.yellow, bg: C.lyellow, label: 'MODERATE RISK' };
    if (s === 'medium')   return { fg: C.yellow, bg: C.lyellow, label: 'MEDIUM RISK' };
    if (s === 'high')     return { fg: C.orange, bg: C.lorange, label: 'HIGH RISK' };
    if (s === 'critical') return { fg: C.red,    bg: C.lred,    label: 'CRITICAL RISK' };
    return { fg: C.gray, bg: C.lgray, label: (level || 'UNKNOWN').toUpperCase() };
  };

  // ── PAGE 1 ───────────────────────────────────────────────────
  // Header banner
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PW, 44, 'F');

  // Clinic / app name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(C.lblue, 'text');
  doc.text('DEMENTIA CARE MANAGEMENT SYSTEM', M, 11);

  doc.setFontSize(20);
  setColor(C.white, 'text');
  doc.text('Weekly Health Report', M, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setColor([180, 210, 255], 'text');
  doc.text('Cognitive & Reminder Adherence Summary', M, 33);

  // Period + generated date (top-right)
  const periodStart = report.report_period_start?.split('T')[0] ?? '';
  const periodEnd   = report.report_period_end?.split('T')[0]   ?? '';
  const genDate     = report.generated_at?.split('T')[0] ?? new Date().toISOString().split('T')[0];
  doc.setFontSize(8);
  setColor([180, 210, 255], 'text');
  if (periodStart && periodEnd) {
    doc.text(`Period: ${periodStart}  —  ${periodEnd}`, PW - M, 18, { align: 'right' });
  }
  doc.text(`Generated: ${genDate}`, PW - M, 26, { align: 'right' });
  doc.text(`CONFIDENTIAL — FOR MEDICAL USE ONLY`, PW - M, 34, { align: 'right' });

  y = 52;

  // ── Patient Info Card ─────────────────────────────────────
  setColor(C.lgray, 'fill');
  doc.roundedRect(M, y, CW, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setColor(C.navy, 'text');
  doc.text(name, M + 5, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(C.muted, 'text');
  doc.text(`Report Period: ${periodStart || 'N/A'}  to  ${periodEnd || 'N/A'}`, M + 5, y + 17);

  // Disclaimer badge on right
  const disc = 'Clinician Review Required';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  setColor(C.orange, 'text');
  doc.text(disc, PW - M - 5, y + 9, { align: 'right' });

  y += 30;

  // ── Executive Summary Scorecard ───────────────────────────
  sectionHead('Executive Summary');

  // Compute overall score from available data
  const complianceRate = report.completion_rate != null ? Math.round(report.completion_rate * 100) : 0;
  const cogRiskRaw     = report.avg_cognitive_risk_score ?? 0;
  const cogHealthPct   = Math.round((1 - cogRiskRaw) * 100);

  // Game health score: riskScore0_100 is a risk metric (higher = worse)
  // convert to health score: 100 - riskScore
  let gameHealthScore = null;
  let gameRiskLevel   = null;
  let gameSessions    = 0;
  if (gameStats) {
    const rawRisk = gameStats.recentRiskScore ?? 0;
    gameHealthScore = Math.max(0, Math.round(100 - rawRisk));
    gameRiskLevel   = gameStats.currentRiskLevel;
    gameSessions    = gameStats.totalSessions ?? 0;
  }

  // Overall weighted health score
  let overallScore;
  if (gameHealthScore != null) {
    overallScore = Math.round(0.4 * complianceRate + 0.35 * cogHealthPct + 0.25 * gameHealthScore);
  } else {
    overallScore = Math.round(0.55 * complianceRate + 0.45 * cogHealthPct);
  }

  const overallStyle = overallScore >= 75 ? { fg: C.green,  bg: C.lgreen,  grade: 'GOOD' }
                     : overallScore >= 50 ? { fg: C.yellow, bg: C.lyellow, grade: 'FAIR' }
                     :                      { fg: C.red,    bg: C.lred,    grade: 'POOR' };

  // Score cards row
  const cardY = y;
  const cards = [
    { score: `${overallScore}/100`, label: 'Overall Score', grade: overallStyle.grade, fg: overallStyle.fg, bg: overallStyle.bg },
    { score: `${complianceRate}%`,  label: 'Adherence',      fg: complianceRate >= 75 ? C.green : complianceRate >= 50 ? C.yellow : C.red, bg: complianceRate >= 75 ? C.lgreen : complianceRate >= 50 ? C.lyellow : C.lred },
    { score: `${cogHealthPct}%`,    label: 'Cog. Health',    fg: cogHealthPct >= 60 ? C.green : cogHealthPct >= 40 ? C.yellow : C.red, bg: cogHealthPct >= 60 ? C.lgreen : cogHealthPct >= 40 ? C.lyellow : C.lred },
  ];
  if (gameHealthScore != null) {
    cards.push({ score: `${gameHealthScore}/100`, label: 'Brain Games', fg: gameHealthScore >= 60 ? C.green : gameHealthScore >= 40 ? C.yellow : C.red, bg: gameHealthScore >= 60 ? C.lgreen : gameHealthScore >= 40 ? C.lyellow : C.lred });
  }

  const cardW = CW / cards.length - 4;
  cards.forEach((card, i) => {
    const cx = M + i * (cardW + 4);
    setColor(card.bg, 'fill');
    doc.roundedRect(cx, cardY, cardW, 28, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    setColor(card.fg, 'text');
    doc.text(card.score, cx + cardW / 2, cardY + 13, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, cx + cardW / 2, cardY + 20, { align: 'center' });
    if (card.grade) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(card.grade, cx + cardW / 2, cardY + 26, { align: 'center' });
    }
  });

  y = cardY + 36;

  // Overall risk badge
  const riskLvl = report.risk_level || (cogRiskRaw >= 0.6 ? 'high' : cogRiskRaw >= 0.4 ? 'moderate' : 'low');
  const rs = riskStyle(riskLvl);
  setColor(rs.bg, 'fill');
  doc.roundedRect(M, y, 55, 9, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(rs.fg, 'text');
  doc.text(rs.label, M + 27.5, y + 6, { align: 'center' });

  if (report.intervention_needed) {
    setColor(C.red, 'fill');
    doc.roundedRect(M + 60, y, 60, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(C.white, 'text');
    doc.text('INTERVENTION REQUIRED', M + 90, y + 6, { align: 'center' });
  }

  y += 16;

  // ── Section 1: Reminder & Medication Adherence ────────────
  sectionHead('Reminder & Medication Adherence');

  const col1end = CW * 0.5;
  doc.setFont('helvetica', 'normal');

  const reminderRows = [
    ['Total Reminders (week)', fmt(report.total_reminders)],
    ['Completed',              fmt(report.completed_reminders)],
    ['Missed',                 fmt(report.missed_reminders)],
    ['Delayed',                fmt(report.delayed_count)],
    ['Snoozed / Postponed',    fmt(report.ignored_count)],
    ['Compliance Rate',        pct(report.completion_rate != null ? report.completion_rate * 100 : null)],
  ];

  const half = Math.ceil(reminderRows.length / 2);
  for (let i = 0; i < half; i++) {
    ensureSpace(8);
    const left  = reminderRows[i];
    const right = reminderRows[i + half];
    kv(left[0],  left[1],  M,        col1end);
    y -= 6;
    if (right) kv(right[0], right[1], M + col1end + 4, CW - col1end - 4);
  }

  // Confusion / behaviour row
  if (report.confusion_count != null || report.memory_issue_count != null) {
    ensureSpace(8);
    kv('Confusion Events',  fmt(report.confusion_count),       M,          col1end);
    y -= 6;
    kv('Memory Issue Events', fmt(report.memory_issue_count),  M + col1end + 4, CW - col1end - 4);
  }

  // ── Category Breakdown table ──
  if (report.category_breakdown && Object.keys(report.category_breakdown).length) {
    ensureSpace(12);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(C.navy, 'text');
    doc.text('Category Breakdown', M, y);
    y += 4;
    hRule(y, C.lgray);
    y += 5;

    // Table header
    const tCols = [48, 28, 28, 34, 34];
    const tHdrs = ['Category', 'Total', 'Done', 'Rate', 'Avg Risk'];
    let tx = M;
    setColor(C.lgray, 'fill');
    doc.rect(M, y - 4, CW, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setColor(C.navy, 'text');
    tHdrs.forEach((h, i) => { doc.text(h, tx + 2, y); tx += tCols[i]; });
    y += 6;

    doc.setFont('helvetica', 'normal');
    setColor(C.text, 'text');
    Object.entries(report.category_breakdown).forEach(([cat, d], idx) => {
      ensureSpace(7);
      if (idx % 2 === 0) {
        setColor(C.lgray, 'fill');
        doc.rect(M, y - 4, CW, 6.5, 'F');
      }
      tx = M;
      const row = [
        cat.charAt(0).toUpperCase() + cat.slice(1),
        fmt(d.total),
        fmt(d.completed),
        pct(d.completion_rate != null ? d.completion_rate * 100 : null),
        pct(d.avg_risk != null ? d.avg_risk * 100 : null),
      ];
      doc.setFontSize(8.5);
      setColor(C.text, 'text');
      row.forEach((cell, i) => { doc.text(String(cell), tx + 2, y); tx += tCols[i]; });
      y += 7;
    });
    y += 2;
  }

  // ── Section 2: Cognitive Risk Assessment ──────────────────
  sectionHead('Cognitive Risk Assessment');

  const cogRows = [
    ['Average Cognitive Risk',  pct(cogRiskRaw * 100)],
    ['Peak Risk Score',         pct(report.peak_cognitive_risk_score != null ? report.peak_cognitive_risk_score * 100 : null)],
    ['Lowest Risk Score',       pct(report.lowest_cognitive_risk_score != null ? report.lowest_cognitive_risk_score * 100 : null)],
    ['Risk Trend (7 days)',     fmt(report.risk_trend)],
    ['Overall Risk Level',      rs.label],
  ];

  cogRows.forEach(([k, v]) => kv(k, v));

  if (report.previous_week_avg_risk != null) {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(C.navy, 'text');
    doc.text('Week-over-Week Comparison', M, y);
    y += 5;
    kv('Previous Week Avg Risk',    pct(report.previous_week_avg_risk * 100));
    if (report.risk_change_percentage != null) {
      const chg = report.risk_change_percentage;
      kv('Risk Change', `${chg > 0 ? '+' : ''}${Math.round(chg)}%`);
    }
  }

  // ── Section 3: Brain Game Performance ─────────────────────
  if (gameStats) {
    sectionHead('Brain Game Performance (Motor & Cognitive)');

    // Game health score explanation note
    ensureSpace(10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    setColor(C.gray, 'text');
    doc.text('Note: Brain Game Health Score = 100 minus the dementia risk score. Higher score = healthier performance.', M, y);
    y += 7;

    const gRiskStyle = riskStyle(gameRiskLevel);
    const gameRows = [
      ['Brain Game Health Score', `${gameHealthScore}/100`],
      ['Dementia Risk Score',     `${gameStats.recentRiskScore?.toFixed(1) ?? '—'}/100`],
      ['Risk Classification',     gRiskStyle.label],
      ['Total Sessions (all time)', fmt(gameSessions)],
      ['Avg Motor Speed (SAC)',   fmt(gameStats.avgSAC?.toFixed(4))],
      ['Avg Error Ratio (IES)',   fmt(gameStats.avgIES?.toFixed(4))],
      ['Last Session',           (gameStats.lastSessionDate ?? '—').split('T')[0]],
    ];

    const gHalf = Math.ceil(gameRows.length / 2);
    for (let i = 0; i < gHalf; i++) {
      ensureSpace(8);
      const left  = gameRows[i];
      const right = gameRows[i + gHalf];
      kv(left[0],  left[1],  M,           col1end);
      y -= 6;
      if (right) kv(right[0], right[1],   M + col1end + 4, CW - col1end - 4);
    }

    // Coloured risk badge
    ensureSpace(14);
    y += 2;
    setColor(gRiskStyle.bg, 'fill');
    doc.roundedRect(M, y, 60, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(gRiskStyle.fg, 'text');
    doc.text(gRiskStyle.label, M + 30, y + 6, { align: 'center' });
    y += 14;
  }

  // ── Section 4: Caregiver Alerts ───────────────────────────
  if (report.total_alerts > 0) {
    sectionHead('Caregiver Alerts');
    const alertRows = [
      ['Total Alerts',       fmt(report.total_alerts)],
      ['Critical',           fmt(report.critical_alerts)],
      ['High Priority',      fmt(report.high_priority_alerts)],
      ['Unresolved',         fmt(report.unresolved_alerts)],
    ];
    const aHalf = Math.ceil(alertRows.length / 2);
    for (let i = 0; i < aHalf; i++) {
      ensureSpace(8);
      const left  = alertRows[i];
      const right = alertRows[i + aHalf];
      kv(left[0],  left[1],  M,           col1end);
      y -= 6;
      if (right) kv(right[0], right[1],   M + col1end + 4, CW - col1end - 4);
    }
    y += 2;
  }

  // ── Section 5: Time Analysis ───────────────────────────────
  if (report.avg_response_time_seconds != null && report.avg_response_time_seconds > 0) {
    sectionHead('Response Time Analysis');
    const mins = Math.round(report.avg_response_time_seconds / 60);
    kv('Average Response Time', `${mins} min`);
    if (report.best_response_hours?.length) {
      kv('Optimal Hours',  report.best_response_hours.map(h => `${h}:00`).join(', '));
    }
    if (report.worst_response_hours?.length) {
      kv('Difficult Hours', report.worst_response_hours.map(h => `${h}:00`).join(', '));
    }
  }

  // ── Section 6: 7-Day Daily Breakdown ──────────────────────
  const breakdown = report.daily_breakdown ?? report.daily_summaries ?? [];
  if (breakdown.length) {
    sectionHead('7-Day Daily Breakdown');
    ensureSpace(12 + breakdown.length * 7);

    const dbCols = [38, 30, 28, 30, 28, 26];
    const dbHdrs = ['Date', 'Cog. Risk', 'Confusion', 'Completion', 'Alerts', 'Sessions'];
    let tx = M;

    setColor(C.navy, 'fill');
    doc.rect(M, y - 4, CW, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setColor(C.white, 'text');
    dbHdrs.forEach((h, i) => { doc.text(h, tx + 2, y); tx += dbCols[i]; });
    y += 7;

    doc.setFont('helvetica', 'normal');
    breakdown.forEach((day, idx) => {
      ensureSpace(7);
      if (idx % 2 === 0) {
        setColor(C.lgray, 'fill');
        doc.rect(M, y - 4, CW, 6.5, 'F');
      }
      tx = M;
      const riskVal = day.avg_cognitive_risk ?? 0;
      const riskPct = Math.round(riskVal * 100);
      const row = [
        (day.date ?? '—').split('T')[0],
        `${riskPct}%`,
        fmt(day.confusion_count),
        pct(day.completion_rate != null ? day.completion_rate * 100 : null),
        fmt(day.alert_count),
        fmt(day.total_interactions),
      ];
      // Colour risk column
      setColor(C.text, 'text');
      doc.setFontSize(8.5);
      row.forEach((cell, i) => {
        if (i === 1) {
          setColor(riskPct >= 60 ? C.red : riskPct >= 40 ? C.orange : C.green, 'text');
        } else {
          setColor(C.text, 'text');
        }
        doc.text(String(cell), tx + 2, y);
        tx += dbCols[i];
      });
      y += 7;
    });
    y += 3;
  }

  // ── Section 7: Clinical Recommendations ───────────────────
  if (report.recommendations?.length) {
    sectionHead('Clinical Recommendations');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    report.recommendations.forEach((rec, i) => {
      ensureSpace(14);
      // Bullet box
      const lines = doc.splitTextToSize(`${i + 1}.  ${rec}`, CW - 8);
      const boxH = lines.length * 5.5 + 6;
      ensureSpace(boxH);
      setColor(C.lgray, 'fill');
      doc.roundedRect(M, y - 2, CW, boxH, 2, 2, 'F');
      // Accent bar
      setColor(C.blue, 'fill');
      doc.rect(M, y - 2, 3, boxH, 'F');
      setColor(C.text, 'text');
      lines.forEach((line, li) => {
        doc.text(line, M + 6, y + li * 5.5 + 2);
      });
      y += boxH + 4;
    });
  }

  // ── Footer on every page ───────────────────────────────────
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    // Footer bar
    doc.setFillColor(...C.navy);
    doc.rect(0, PH - 14, PW, 14, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    setColor([180, 210, 255], 'text');
    doc.text(
      `DementiaDash — Weekly Health Report  |  Patient: ${name}  |  Generated: ${genDate}  |  Page ${p} of ${total}`,
      PW / 2, PH - 6,
      { align: 'center' },
    );
    // Disclaimer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    setColor([140, 160, 200], 'text');
    doc.text(
      'This report is auto-generated by an AI-assisted system and must be reviewed by a qualified healthcare professional.',
      PW / 2, PH - 10.5,
      { align: 'center' },
    );
  }

  // ── Save ───────────────────────────────────────────────────
  const dateStr = (report.report_period_end ?? new Date().toISOString()).split('T')[0];
  doc.save(`Weekly_Report_${name.replace(/\s+/g, '_')}_${dateStr}.pdf`);
}
