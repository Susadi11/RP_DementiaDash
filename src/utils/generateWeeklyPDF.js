import { jsPDF } from 'jspdf';

/**
 * Generate a formatted PDF from the weekly report JSON data.
 * @param {Object} report - The report object from the API
 * @param {string} patientName - The patient's display name
 */
export default function generateWeeklyPDF(report, patientName = 'Patient') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Helpers ────────────────────────────────────────────────
  const ensureSpace = (needed) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionTitle = (text) => {
    ensureSpace(14);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 58, 138); // deep blue
    doc.text(text, margin, y);
    y += 2;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;
  };

  const label = (key, value, xOffset = 0) => {
    ensureSpace(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text(`${key}:`, margin + xOffset, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(` ${value ?? '—'}`, margin + xOffset + doc.getTextWidth(`${key}: `), y);
    y += 6;
  };

  const fmt = (v, suffix = '') => (v != null ? `${v}${suffix}` : '—');
  const pct = (v) => fmt(v != null ? Math.round(v) : null, '%');

  // ── Title / Header ────────────────────────────────────────
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 36, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('Weekly Reminder Report', margin, 16);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(patientName, margin, 26);

  const periodStart = report.report_period_start?.split('T')[0] ?? '';
  const periodEnd = report.report_period_end?.split('T')[0] ?? '';
  if (periodStart || periodEnd) {
    doc.setFontSize(10);
    doc.text(`${periodStart}  —  ${periodEnd}`, pageWidth - margin, 26, { align: 'right' });
  }
  if (report.generated_at) {
    doc.setFontSize(8);
    doc.text(`Generated: ${report.generated_at.split('T')[0]}`, pageWidth - margin, 32, { align: 'right' });
  }
  y = 44;

  // ── 1. Reminder Summary ───────────────────────────────────
  sectionTitle('Reminder Summary');
  const col1 = 0, col2 = contentWidth / 2;
  label('Total Reminders', fmt(report.total_reminders), col1);
  y -= 6;
  label('Completed', fmt(report.completed_reminders), col2);
  label('Missed', fmt(report.missed_reminders), col1);
  y -= 6;
  label('Completion Rate', pct(report.completion_rate), col2);

  // ── 2. Cognitive Risk ─────────────────────────────────────
  sectionTitle('Cognitive Risk Assessment');
  label('Average Risk Score', pct(report.avg_cognitive_risk_score), col1);
  y -= 6;
  label('Peak Risk Score', pct(report.peak_cognitive_risk_score), col2);
  label('Lowest Risk Score', pct(report.lowest_cognitive_risk_score), col1);
  y -= 6;
  label('Risk Trend', fmt(report.risk_trend), col2);

  if (report.risk_level) {
    const riskColors = {
      low: [22, 163, 74], moderate: [202, 138, 4], high: [234, 88, 12], critical: [220, 38, 38],
    };
    const c = riskColors[report.risk_level] || [107, 114, 128];
    ensureSpace(12);
    doc.setFillColor(...c);
    doc.roundedRect(margin, y, 50, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(report.risk_level.toUpperCase(), margin + 25, y + 5.5, { align: 'center' });
    if (report.intervention_needed) {
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(9);
      doc.text('⚠ Intervention Needed', margin + 55, y + 5.5);
    }
    y += 12;
  }

  // ── 3. Behaviour Patterns ─────────────────────────────────
  sectionTitle('Behaviour Patterns');
  label('Confusion Events', fmt(report.confusion_count), col1);
  y -= 6;
  label('Memory Issues', fmt(report.memory_issue_count), col2);
  label('Confirmed', fmt(report.confirmed_count), col1);
  y -= 6;
  label('Ignored', fmt(report.ignored_count), col2);
  label('Delayed', fmt(report.delayed_count), col1);

  // ── 4. Caregiver Alerts ───────────────────────────────────
  sectionTitle('Caregiver Alerts');
  label('Total Alerts', fmt(report.total_alerts), col1);
  y -= 6;
  label('Critical', fmt(report.critical_alerts), col2);
  label('High Priority', fmt(report.high_priority_alerts), col1);
  y -= 6;
  label('Unresolved', fmt(report.unresolved_alerts), col2);

  // ── 5. Time Analysis ──────────────────────────────────────
  if (report.best_response_hours || report.avg_response_time_seconds != null) {
    sectionTitle('Time Analysis');
    if (report.avg_response_time_seconds != null) {
      const mins = Math.round(report.avg_response_time_seconds / 60);
      label('Avg Response Time', `${mins} min`, col1);
    }
    if (report.best_response_hours?.length) {
      label('Best Response Hours', report.best_response_hours.join(', '), col1);
    }
    if (report.worst_response_hours?.length) {
      label('Worst Response Hours', report.worst_response_hours.join(', '), col1);
    }
  }

  // ── 6. Daily Breakdown (table) ────────────────────────────
  if (report.daily_breakdown?.length) {
    sectionTitle('7-Day Breakdown');
    ensureSpace(10 + report.daily_breakdown.length * 7);

    const headers = ['Date', 'Risk', 'Confusion', 'Completion', 'Alerts'];
    const colWidths = [35, 30, 30, 35, 30];
    let tx = margin;

    // Header row
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - 4, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    headers.forEach((h, i) => { doc.text(h, tx + 2, y); tx += colWidths[i]; });
    y += 6;

    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    report.daily_breakdown.forEach((day) => {
      ensureSpace(7);
      tx = margin;
      doc.setTextColor(75, 85, 99);
      const row = [
        day.date?.split('T')[0] ?? '—',
        pct(day.avg_cognitive_risk),
        fmt(day.confusion_count),
        pct(day.completion_rate),
        fmt(day.alert_count),
      ];
      row.forEach((cell, i) => { doc.text(String(cell), tx + 2, y); tx += colWidths[i]; });
      y += 6;
    });
  }

  // ── 7. Category Breakdown ─────────────────────────────────
  if (report.category_breakdown && Object.keys(report.category_breakdown).length) {
    sectionTitle('Category Breakdown');
    Object.entries(report.category_breakdown).forEach(([cat, data]) => {
      ensureSpace(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text(cat.charAt(0).toUpperCase() + cat.slice(1), margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Total: ${fmt(data.total)}  |  Completed: ${fmt(data.completed)}  |  Confused: ${fmt(data.confused)}  |  Rate: ${pct(data.completion_rate)}  |  Avg Risk: ${pct(data.avg_risk)}`,
        margin + 2, y,
      );
      y += 7;
    });
  }

  // ── 8. Week-over-Week ─────────────────────────────────────
  if (report.previous_week_avg_risk != null || report.risk_change_percentage != null) {
    sectionTitle('Week-over-Week Comparison');
    label('Previous Week Avg Risk', pct(report.previous_week_avg_risk));
    label('Risk Change', fmt(report.risk_change_percentage, '%'));
  }

  // ── 9. Recommendations ────────────────────────────────────
  if (report.recommendations?.length) {
    sectionTitle('Recommendations');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    report.recommendations.forEach((rec, i) => {
      ensureSpace(10);
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, contentWidth - 4);
      lines.forEach((line) => {
        ensureSpace(6);
        doc.text(line, margin + 2, y);
        y += 5;
      });
      y += 2;
    });
  }

  // ── Footer on each page ───────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `DementiaDash — Weekly Report — Page ${p} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  // ── Trigger download ──────────────────────────────────────
  const dateStr = (report.report_period_end ?? new Date().toISOString()).split('T')[0];
  doc.save(`weekly-report-${patientName.replace(/\s+/g, '_')}-${dateStr}.pdf`);
}
