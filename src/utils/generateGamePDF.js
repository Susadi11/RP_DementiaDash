import { jsPDF } from 'jspdf';

/**
 * Generate a medical-format Cognitive Game Performance PDF report.
 *
 * @param {Object} patient        - Patient object { full_name, age, user_id, account_status }
 * @param {Object} stats          - Game stats { totalSessions, avgSAC, avgIES, currentRiskLevel, recentRiskScore, lastSessionDate }
 * @param {Array}  sessions       - Array of session objects (chronological, most-recent first)
 * @param {Object} riskHistory    - { total_predictions, history: [...] }
 * @param {Object} riskAssessment - Latest standalone risk prediction or null
 */
export default function generateGamePDF(patient, stats, sessions, riskHistory, riskAssessment) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M  = 18;
  const CW = PW - M * 2;
  let y = M;

  // Colour palette
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
    sky:     [14, 165, 233],
    lsky:    [224, 242, 254],
  };

  // Helpers
  const newPage   = () => { doc.addPage(); y = M; };
  const ensure    = (h) => { if (y + h > PH - 22) newPage(); };
  const fill      = (rgb) => doc.setFillColor(...rgb);
  const textColor = (rgb) => doc.setTextColor(...rgb);
  const draw      = (rgb) => doc.setDrawColor(...rgb);

  const hRule = (py = y, color = C.lblue) => {
    draw(color); doc.setLineWidth(0.3);
    doc.line(M, py, M + CW, py);
  };

  const sectionHead = (title) => {
    ensure(18);
    y += 9;
    fill(C.blue); doc.rect(M, y - 6, 3, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    textColor(C.navy);
    doc.text(title, M + 6, y);
    y += 3; hRule(y); y += 6;
  };

  const kv = (key, val, x = M, w = CW) => {
    ensure(8);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); textColor(C.muted);
    doc.text(key, x, y);
    doc.setFont('helvetica', 'normal'); textColor(C.text);
    doc.text(String(val ?? '--'), x + w * 0.48, y);
    y += 6;
  };

  const fmt    = (v, d = 0) => (v != null ? Number(v).toFixed(d) : '--');
  const fmtPct = (v)        => v != null ? `${Number(v).toFixed(1)}%` : '--';
  const fmtDate = (ts) => {
    try { return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '--'; }
  };

  const riskStyle = (level) => {
    const s = (level || '').toUpperCase();
    if (s === 'LOW')    return { fg: C.green,  bg: C.lgreen,  label: 'LOW RISK'    };
    if (s === 'MEDIUM') return { fg: C.yellow, bg: C.lyellow, label: 'MEDIUM RISK' };
    if (s === 'HIGH')   return { fg: C.red,    bg: C.lred,    label: 'HIGH RISK'   };
    return                     { fg: C.gray,   bg: C.lgray,   label: 'UNKNOWN'     };
  };

  const badge = (text, bg, fg, x, bw = 40) => {
    fill(bg); doc.roundedRect(x, y, bw, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); textColor(fg);
    doc.text(text, x + bw / 2, y + 5.5, { align: 'center' });
  };

  const name = patient?.full_name || 'Patient';
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // ════════════════════════════════════════════════════════════
  // HEADER BANNER
  // ════════════════════════════════════════════════════════════
  fill(C.navy); doc.rect(0, 0, PW, 46, 'F');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  textColor(C.lblue);
  doc.text('DEMENTIA CARE MANAGEMENT SYSTEM', M, 11);

  doc.setFontSize(20); textColor(C.white);
  doc.text('Cognitive Game Performance Report', M, 25);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  textColor([180, 210, 255]);
  doc.text('Brain Training & Risk Analysis Summary', M, 35);

  doc.setFontSize(8); textColor([180, 210, 255]);
  doc.text(`Generated: ${today}`, PW - M, 20, { align: 'right' });
  doc.text('CONFIDENTIAL -- FOR MEDICAL USE ONLY', PW - M, 30, { align: 'right' });

  y = 54;

  // ── Patient info card ─────────────────────────────────────
  fill(C.lgray); doc.roundedRect(M, y, CW, 24, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); textColor(C.navy);
  doc.text(name, M + 5, y + 10);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); textColor(C.muted);
  const patientMeta = [
    patient?.age      ? `Age: ${patient.age}`           : null,
    patient?.user_id  ? `ID: ${patient.user_id}`        : null,
    patient?.account_status ? `Status: ${patient.account_status}` : null,
    stats?.lastSessionDate  ? `Last Session: ${fmtDate(stats.lastSessionDate)}` : null,
  ].filter(Boolean).join('   |   ');
  doc.text(patientMeta, M + 5, y + 19);

  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); textColor(C.orange);
  doc.text('Clinician Review Required', PW - M - 5, y + 10, { align: 'right' });

  y += 32;

  // ── Executive Summary Scorecards ─────────────────────────
  sectionHead('Executive Summary');

  const totalSessions   = stats?.totalSessions   ?? sessions.length;
  const recentRiskScore = stats?.recentRiskScore ?? sessions[0]?.prediction?.riskScore0_100 ?? null;
  const currentRisk     = stats?.currentRiskLevel ?? sessions[0]?.prediction?.riskLevel ?? null;
  const avgSAC          = stats?.avgSAC ?? null;
  const wellnessScore   = recentRiskScore != null ? Math.max(0, Math.round(100 - recentRiskScore)) : null;

  const scoreCards = [
    {
      score: String(totalSessions),
      label: 'Total Sessions',
      fg: C.sky, bg: C.lsky,
    },
    {
      score: wellnessScore != null ? `${wellnessScore}/100` : '--',
      label: 'Wellness Score',
      fg: wellnessScore == null ? C.gray : wellnessScore >= 70 ? C.green : wellnessScore >= 50 ? C.yellow : C.red,
      bg: wellnessScore == null ? C.lgray : wellnessScore >= 70 ? C.lgreen : wellnessScore >= 50 ? C.lyellow : C.lred,
    },
    {
      score: fmt(avgSAC, 4),
      label: 'Avg SAC Score',
      fg: C.blue, bg: C.lblue,
    },
    {
      score: currentRisk ?? '--',
      label: 'Current Risk',
      fg: currentRisk ? riskStyle(currentRisk).fg : C.gray,
      bg: currentRisk ? riskStyle(currentRisk).bg : C.lgray,
    },
  ];

  const cW = (CW - 12) / 4;
  const cY = y;
  scoreCards.forEach((card, i) => {
    const cx = M + i * (cW + 4);
    fill(card.bg); doc.roundedRect(cx, cY, cW, 26, 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); textColor(card.fg);
    doc.text(card.score, cx + cW / 2, cY + 13, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); textColor(C.muted);
    doc.text(card.label, cx + cW / 2, cY + 22, { align: 'center' });
  });
  y = cY + 34;

  // Risk badge
  if (currentRisk) {
    const rs = riskStyle(currentRisk);
    const labelText = `${rs.label}${recentRiskScore != null ? ' -- Score: ' + fmt(recentRiskScore, 1) + '/100' : ''}`;
    fill(rs.bg); doc.roundedRect(M, y, 90, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); textColor(rs.fg);
    doc.text(labelText, M + 45, y + 6, { align: 'center' });
    y += 14;
  }

  // ════════════════════════════════════════════════════════════
  // SECTION 1: GAME PERFORMANCE STATISTICS
  // ════════════════════════════════════════════════════════════
  sectionHead('Game Performance Statistics');

  const latest = sessions[0] ?? null;
  const statRows = [
    ['Total Sessions Played',   String(totalSessions)],
    ['Latest Game Type',         latest?.gameType ?? '--'],
    ['Latest Game Level',        latest?.level != null ? `Level ${latest.level}` : '--'],
    ['Last Session Date',        fmtDate(stats?.lastSessionDate ?? latest?.timestamp)],
    ['Avg SAC Score',            fmt(avgSAC, 4)],
    ['Avg IES Score',            fmt(stats?.avgIES, 2)],
    ['Latest Accuracy',          latest?.features?.accuracy != null ? fmtPct(latest.features.accuracy * 100) : '--'],
    ['Latest SAC',               fmt(latest?.features?.sac, 4)],
    ['Latest IES',               fmt(latest?.features?.ies, 2)],
    ['Latest RT Adj. Median',    fmt(latest?.features?.rtAdjMedian, 3) + (latest?.features?.rtAdjMedian != null ? 's' : '')],
    ['Response Variability',     fmt(latest?.features?.variability, 4)],
    ['Error Rate (latest)',       latest?.rawSummary?.errors != null && latest?.rawSummary?.totalAttempts != null
                                  ? fmtPct((latest.rawSummary.errors / latest.rawSummary.totalAttempts) * 100)
                                  : (latest?.features?.errorRate != null ? fmtPct(latest.features.errorRate * 100) : '--')],
  ];

  const half = Math.ceil(statRows.length / 2);
  const colW = CW / 2 - 4;
  statRows.forEach((row, i) => {
    const col = Math.floor(i / half);
    const rx  = M + col * (colW + 8);
    if (i % half === 0 && col > 0) y -= half * 6;
    kv(row[0], row[1], rx, colW);
  });

  y += 4;
  hRule(y, C.lgray); y += 8;

  // ════════════════════════════════════════════════════════════
  // SECTION 2: RISK ASSESSMENT RESULT
  // ════════════════════════════════════════════════════════════
  sectionHead('Cognitive Risk Assessment');

  const ra = riskAssessment ?? (riskHistory?.history?.[0] ?? null);
  const pred = ra?.prediction ?? null;

  if (pred) {
    ensure(44);
    const rs2 = riskStyle(pred.label ?? pred.riskLevel);

    // Big risk banner
    fill(rs2.bg); doc.roundedRect(M, y, CW, 22, 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); textColor(rs2.fg);
    doc.text(rs2.label, M + 8, y + 14);

    const rScore = pred.risk_score_0_100 ?? pred.riskScore0_100 ?? null;
    if (rScore != null) {
      doc.setFontSize(10); textColor(C.muted);
      doc.text(`Score: ${fmt(rScore, 1)} / 100`, PW - M - 8, y + 14, { align: 'right' });
    }

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); textColor(C.muted);
    doc.text(fmtDate(ra.created_at), PW - M - 8, y + 20, { align: 'right' });
    y += 30;

    // Probability breakdown bar
    const probLow  = (pred.prob_low    ?? pred.riskProbability?.low    ?? 0) * 100;
    const probMed  = (pred.prob_medium ?? pred.riskProbability?.medium ?? 0) * 100;
    const probHigh = (pred.prob_high   ?? pred.riskProbability?.high   ?? 0) * 100;

    ensure(28);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); textColor(C.navy);
    doc.text('Risk Probability Breakdown', M, y); y += 5;

    const barH = 7;
    const segments = [
      { pct: probLow / 100,  color: C.green,  label: `LOW ${fmt(probLow, 1)}%`   },
      { pct: probMed / 100,  color: C.yellow, label: `MED ${fmt(probMed, 1)}%`   },
      { pct: probHigh / 100, color: C.red,    label: `HIGH ${fmt(probHigh, 1)}%` },
    ];
    let bx = M;
    segments.forEach(seg => {
      const sw = CW * seg.pct;
      if (sw > 0) {
        fill(seg.color); doc.rect(bx, y, sw, barH, 'F');
        if (sw > 20) {
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7); textColor(C.white);
          doc.text(seg.label, bx + sw / 2, y + 5, { align: 'center' });
        }
        bx += sw;
      }
    });
    y += barH + 5;

    kv('Window Size (sessions used)', String(ra.window_size ?? '--'));
    if (ra.features_used?.length) {
      kv('Features Used', ra.features_used.join(', '));
    }

    // LSTM decline score if present
    const linkedPred = sessions[0]?.prediction;
    if (linkedPred?.lstmDeclineScore != null) {
      kv('LSTM Decline Score', fmt(linkedPred.lstmDeclineScore, 4));
    }
  } else {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); textColor(C.gray);
    doc.text('No standalone risk assessment available. Click "Run Risk Assessment" on the dashboard.', M, y);
    y += 10;
  }

  // ════════════════════════════════════════════════════════════
  // SECTION 3: SESSION-BY-SESSION TABLE
  // ════════════════════════════════════════════════════════════
  newPage();
  sectionHead('Session History (All Sessions)');

  // Table header
  const colDefs = [
    { label: '#',          w: 8  },
    { label: 'Date',       w: 24 },
    { label: 'Game Type',  w: 32 },
    { label: 'Level',      w: 12 },
    { label: 'Accuracy',   w: 20 },
    { label: 'SAC',        w: 24 },
    { label: 'IES',        w: 22 },
    { label: 'Risk Level', w: 28 },
  ];

  const drawTableRow = (rowData, isHeader = false, rowY = y, rowBg = null) => {
    ensure(8);
    if (rowBg) { fill(rowBg); doc.rect(M, rowY - 5, CW, 7.5, 'F'); }
    let rx = M;
    rowData.forEach((cell, ci) => {
      const cdef = colDefs[ci];
      if (isHeader) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); textColor(C.navy);
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); textColor(C.text);
      }
      doc.text(String(cell ?? '--'), rx, rowY, { maxWidth: cdef.w - 1 });
      rx += cdef.w;
    });
  };

  // Header row
  fill(C.lblue); doc.rect(M, y - 5.5, CW, 8, 'F');
  drawTableRow(colDefs.map(c => c.label), true); y += 5;
  hRule(y, C.blue); y += 4;

  const chronoSessions = [...sessions].reverse(); // oldest first
  chronoSessions.forEach((s, idx) => {
    ensure(9);
    const rowBg = idx % 2 === 0 ? null : C.lgray;
    const rLvl  = s.prediction?.riskLevel ?? '--';
    const cells = [
      String(idx + 1),
      fmtDate(s.timestamp),
      s.gameType ?? '--',
      s.level != null ? String(s.level) : '--',
      s.features?.accuracy != null ? fmtPct(s.features.accuracy * 100) : '--',
      fmt(s.features?.sac, 4),
      fmt(s.features?.ies, 2),
      rLvl,
    ];
    if (rowBg) { fill(rowBg); doc.rect(M, y - 5, CW, 7, 'F'); }

    // Colour risk cell
    let rx = M;
    cells.forEach((cell, ci) => {
      const isRisk = ci === 7;
      if (isRisk && rLvl !== '--') {
        const rs = riskStyle(rLvl);
        textColor(rs.fg);
        doc.setFont('helvetica', 'bold');
      } else {
        textColor(C.text);
        doc.setFont('helvetica', 'normal');
      }
      doc.setFontSize(8);
      doc.text(cell, rx, y, { maxWidth: colDefs[ci].w - 1 });
      rx += colDefs[ci].w;
    });
    y += 7;
  });

  if (sessions.length === 0) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); textColor(C.gray);
    doc.text('No sessions recorded.', M, y); y += 10;
  }

  // ════════════════════════════════════════════════════════════
  // SECTION 4: RISK ASSESSMENT RUN HISTORY
  // ════════════════════════════════════════════════════════════
  if (riskHistory?.history?.length) {
    ensure(20);
    sectionHead('Risk Assessment Run History');

    const rHead = ['#', 'Date', 'Risk Level', 'Score / 100', 'HIGH %', 'MED %', 'LOW %', 'Window'];
    const rColW = [8, 28, 28, 26, 20, 20, 20, 24];

    // Header
    fill(C.lblue); doc.rect(M, y - 5.5, CW, 8, 'F');
    let hx = M;
    rHead.forEach((h, i) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); textColor(C.navy);
      doc.text(h, hx, y, { maxWidth: rColW[i] - 1 });
      hx += rColW[i];
    });
    y += 5; hRule(y, C.blue); y += 4;

    riskHistory.history.forEach((entry, idx) => {
      ensure(9);
      const p2  = entry.prediction ?? {};
      const lbl = p2.label ?? '--';
      const rs3 = riskStyle(lbl);
      const rowBg = idx % 2 === 0 ? null : C.lgray;
      if (rowBg) { fill(rowBg); doc.rect(M, y - 5, CW, 7, 'F'); }

      const row = [
        String(idx + 1),
        fmtDate(entry.created_at),
        lbl,
        fmt(p2.risk_score_0_100, 1),
        fmt((p2.prob_high   ?? 0) * 100, 1),
        fmt((p2.prob_medium ?? 0) * 100, 1),
        fmt((p2.prob_low    ?? 0) * 100, 1),
        String(entry.window_size ?? '--'),
      ];

      let rx2 = M;
      row.forEach((cell, ci) => {
        const isLbl = ci === 2;
        if (isLbl && lbl !== '--') {
          textColor(rs3.fg); doc.setFont('helvetica', 'bold');
        } else {
          textColor(C.text); doc.setFont('helvetica', 'normal');
        }
        doc.setFontSize(8);
        doc.text(cell, rx2, y, { maxWidth: rColW[ci] - 1 });
        rx2 += rColW[ci];
      });
      y += 7;
    });
    y += 4;
  }

  // ════════════════════════════════════════════════════════════
  // SECTION 5: SCORE INTERPRETATION GUIDE
  // ════════════════════════════════════════════════════════════
  ensure(60);
  sectionHead('How to Interpret These Results');

  const guides = [
    {
      title: 'SAC (Speed-Accuracy Composite)',
      body: 'Higher is better. SAC combines how accurately and how quickly the patient responds. A low SAC means the patient is either slow, inaccurate, or both.',
    },
    {
      title: 'IES (Inverse Efficiency Score)',
      body: 'Lower is better. IES penalises both slow responses and errors. Ideal performance is fast AND accurate. A high IES is a warning sign.',
    },
    {
      title: 'Risk Score (0-100)',
      body: 'Lower is healthier. Computed by an LSTM deep learning model using the last N game sessions. Below 40 = LOW, 40-70 = MEDIUM, above 70 = HIGH cognitive decline risk.',
    },
    {
      title: 'Risk Probability',
      body: 'The LSTM model outputs the probability of LOW, MEDIUM, and HIGH risk. The highest probability determines the Risk Level label.',
    },
  ];

  guides.forEach(g => {
    ensure(20);
    fill(C.lgray); doc.roundedRect(M, y, CW, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); textColor(C.navy);
    doc.text(g.title, M + 4, y + 6);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); textColor(C.muted);
    const lines = doc.splitTextToSize(g.body, CW - 8);
    doc.text(lines, M + 4, y + 12);
    y += 20;
  });

  // ════════════════════════════════════════════════════════════
  // FOOTER on every page
  // ════════════════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    const fy = PH - 10;
    doc.setDrawColor(...C.lblue); doc.setLineWidth(0.3);
    doc.line(M, fy - 3, M + CW, fy - 3);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7); textColor(C.gray);
    doc.text('Generated by DementiaDash -- Cognitive Care Management System', M, fy);
    doc.text(`Page ${pg} of ${totalPages}`, M + CW, fy, { align: 'right' });
    doc.text('CONFIDENTIAL -- FOR MEDICAL USE ONLY', PW / 2, fy, { align: 'center' });
  }

  // Save
  const safeName = (name || 'patient').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`game_report_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
}
