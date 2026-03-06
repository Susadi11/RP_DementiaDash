import { useState, useEffect } from 'react';
import {
  Download, MessageSquare, Brain, Gamepad2, Bell, Calendar,
  Heart, Pill, AlertTriangle, FileText, ChevronRight,
  RefreshCw, Shield, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import { getLinkedPatientsDetails, getPatientProfilePhotoUrl } from '../services/api';
import {
  fetchWeeklyReportData, getComponentRating,
  friendlyRisk, friendlyMmseStatus, friendlyTrend, FRIENDLY_PARAM_NAMES
} from '../services/weeklyReportService';
import jsPDF from 'jspdf';

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getLinkedPatientsDetails();
        if (data.success && data.patients) setPatients(data.patients);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    if (patients.length === 0) return;
    const patientId = patients[0].user_id;
    if (!patientId) return;
    const fetchReport = async () => {
      setReportLoading(true);
      try { setReportData(await fetchWeeklyReportData(patientId)); }
      catch (err) { console.error(err); }
      finally { setReportLoading(false); }
    };
    fetchReport();
  }, [patients]);

  const user = patients.length > 0
    ? {
      name: patients[0].full_name || 'Patient',
      age: patients[0].age || 'N/A',
      gender: patients[0].gender || 'N/A',
      condition: patients[0].medical_conditions?.join(', ') || 'Not specified',
      status: patients[0].account_status || 'active',
      id: patients[0].user_id,
      hasProfilePhoto: patients[0].has_profile_photo,
      allergies: patients[0].allergies || [],
      medicines: patients[0].medicines || [],
      medicalHistory: patients[0].medical_history || ''
    }
    : null;

  // ── Simple Score Circle ───────────────────────────────────────────────
  const ScoreCircle = ({ score, label }) => {
    const r = score !== null ? getComponentRating(score) : { label: 'No Data', color: 'text-gray-400', bg: 'bg-gray-100' };
    const border = score >= 70 ? 'border-emerald-200' : score >= 50 ? 'border-amber-200' : score !== null ? 'border-red-200' : 'border-gray-200';
    return (
      <div className="flex flex-col items-center">
        <div className={`w-16 h-16 rounded-full ${r.bg} border-2 ${border} flex items-center justify-center font-bold text-lg ${r.color}`}>
          {score !== null ? score : '—'}
        </div>
        <p className="text-xs text-secondary mt-1.5 font-medium">{label}</p>
        <p className={`text-xs font-semibold ${r.color}`}>{r.label}</p>
      </div>
    );
  };

  // ── PDF generation ────────────────────────────────────────────────────
  const generatePDF = () => {
    if (!reportData || !user) return;
    setPdfGenerating(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const M = 20, CW = pw - M * 2;
      let y = M;

      const G = { navy:[15,40,100], blue:[37,99,235], green:[22,163,74], lgreen:[220,252,231],
                  yellow:[202,138,4], lyellow:[254,249,195], red:[220,38,38], lred:[254,226,226],
                  orange:[234,88,12], lgray:[243,244,246], gray:[156,163,175], dark:[30,30,30], white:[255,255,255] };

      const np  = ()    => { doc.addPage(); y = M; };
      const sp  = (h)   => { if (y + h > ph - 16) np(); };
      const fc  = (c)   => doc.setFillColor(...c);
      const tc  = (c)   => doc.setTextColor(...c);
      const row = (k,v) => {
        sp(7); doc.setFont('helvetica','bold'); doc.setFontSize(9); tc(G.gray);
        doc.text(k, M, y); doc.setFont('helvetica','normal'); tc(G.dark);
        doc.text(String(v ?? '—'), M + CW * 0.45, y); y += 6;
      };
      const bullet = (t, col = G.dark) => {
        sp(7); doc.setFont('helvetica','normal'); doc.setFontSize(9); tc(col);
        doc.splitTextToSize(`• ${t}`, CW - 6).forEach(l => { sp(6); doc.text(l, M + 3, y); y += 5.5; });
      };
      const sec = (title) => {
        sp(16); y += 8;
        doc.setDrawColor(...G.blue); doc.setLineWidth(0.4);
        doc.line(M, y, M + CW, y); y += 5;
        doc.setFont('helvetica','bold'); doc.setFontSize(11); tc(G.navy);
        doc.text(title, M, y); y += 7;
        doc.setDrawColor(220,220,220); doc.setLineWidth(0.2);
        doc.line(M, y, M + CW, y); y += 5;
      };
      const badge = (label, bg, fg, x, bw = 42) => {
        fc(bg); doc.roundedRect(x, y - 5, bw, 7, 1.5, 1.5, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(7.5); tc(fg);
        doc.text(label, x + bw / 2, y, { align: 'center' });
      };
      const scoreBox = (score, label, sub, x, bw, bh = 22) => {
        const isNull = score === null;
        const bg = isNull ? G.lgray : score >= 75 ? G.lgreen : score >= 50 ? G.lyellow : G.lred;
        const fg = isNull ? G.gray  : score >= 75 ? G.green  : score >= 50 ? G.yellow  : G.red;
        fc(bg); doc.roundedRect(x, y, bw, bh, 2, 2, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(15); tc(fg);
        doc.text(isNull ? '—' : `${score}`, x + bw/2, y + 10, { align:'center' });
        doc.setFontSize(6.5); doc.setFont('helvetica','normal'); tc(fg);
        doc.text(label, x + bw/2, y + 16, { align:'center' });
        if (sub) { doc.setFontSize(6); tc(G.gray); doc.text(sub, x + bw/2, y + 20.5, { align:'center' }); }
      };
      const footers = () => {
        const tot = doc.internal.getNumberOfPages();
        for (let i = 1; i <= tot; i++) {
          doc.setPage(i);
          doc.setDrawColor(200,200,200); doc.setLineWidth(0.2); doc.line(M, ph-12, pw-M, ph-12);
          doc.setFont('helvetica','italic'); doc.setFontSize(7); tc(G.gray);
          doc.text('Hale Dementia Care  |  Confidential  |  Not a substitute for medical advice', M, ph-7);
          doc.text(`Page ${i} / ${tot}`, pw-M, ph-7, { align:'right' });
        }
      };

      // ── HEADER ──
      fc(G.navy); doc.rect(0, 0, pw, 32, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(16); tc(G.white);
      doc.text('Weekly Health Report', M, 14);
      doc.setFont('helvetica','normal'); doc.setFontSize(9); tc([180,210,255]);
      doc.text('Hale Dementia Care', M, 22);
      doc.setFontSize(8);
      doc.text(`${reportData.weekStart}  –  ${reportData.weekEnding}`, pw-M, 14, { align:'right' });
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}`, pw-M, 22, { align:'right' });
      y = 40;

      // ── Patient info ──
      doc.setFont('helvetica','bold'); doc.setFontSize(12); tc(G.navy);
      doc.text(user.name, M, y); y += 6;
      doc.setFont('helvetica','normal'); doc.setFontSize(9); tc(G.gray);
      const meta = [user.age !== 'N/A' && `Age ${user.age}`, user.gender !== 'N/A' && user.gender,
                    user.condition !== 'Not specified' && user.condition].filter(Boolean).join('  ·  ');
      doc.text(meta || '—', M, y); y += 5;
      if (user.allergies.length) { tc(G.red); doc.text(`Allergies: ${user.allergies.join(', ')}`, M, y); y += 5; }
      if (user.medicines.length) { tc(G.gray); doc.text(`Medicines: ${user.medicines.join(', ')}`, M, y); y += 5; }
      y += 3;

      // ── Score cards ──
      sec('Overall Health Score');
      const sc = reportData.overallScore;
      const overallLabel = sc >= 85 ? 'Excellent' : sc >= 75 ? 'Good' : sc >= 55 ? 'Fair' : sc >= 40 ? 'Needs Attention' : 'Critical';
      // Big overall
      scoreBox(sc, '/100  ' + overallLabel, `${reportData.componentsUsed} of 4 areas`, M, 44, 26);
      // 4 component cards
      const comps = [
        { name:'Conversations', score:reportData.chat.score,     sub: reportData.chat.hasData     ? `${reportData.chat.totalSessions} session${reportData.chat.totalSessions!==1?'s':''}` : 'No data' },
        { name:'Memory Test',   score:reportData.mmse.score,     sub: reportData.mmse.hasData     ? `${reportData.mmse.latestScore}/30` : 'No data' },
        { name:'Brain Games',   score:reportData.game.score,     sub: reportData.game.hasData     ? friendlyRisk(reportData.game.currentRiskLevel) : 'No data' },
        { name:'Medications',   score:reportData.reminder.score, sub: reportData.reminder.hasData ? `${reportData.reminder.complianceRate}% taken` : 'No data' },
      ];
      const cw = (CW - 48) / 4 - 2;
      comps.forEach((c, i) => scoreBox(c.score, c.name, c.sub, M + 48 + i*(cw+2), cw, 26));
      y += 32;
      doc.setFont('helvetica','italic'); doc.setFontSize(7.5); tc(G.gray);
      doc.text('Only areas with activity this week are counted in the overall score.', M, y); y += 8;

      // ── 1. Conversations ──
      sec('1.  Conversations (AI Chat Analysis)');
      if (reportData.chat.hasData) {
        row('Score',           `${reportData.chat.score}/100`);
        row('Sessions',        `${reportData.chat.totalSessions}`);
        row('Active Days',     `${reportData.chat.activeDays} / 7`);
        row('Messages',        `${reportData.chat.totalMessages || '—'}`);
        row('Risk Level',      friendlyRisk(reportData.chat.riskLevel));
        if (reportData.chat.weeklyRiskScore !== null)
          row('Weekly Risk Score', `${reportData.chat.weeklyRiskScore}%`);
        y += 2;
        const rl = (reportData.chat.riskLevel || '').toLowerCase();
        badge(
          (reportData.chat.riskLevel || 'UNKNOWN').toUpperCase(),
          rl === 'low' ? G.lgreen : rl === 'moderate' || rl === 'medium' ? G.lyellow : G.lred,
          rl === 'low' ? G.green  : rl === 'moderate' || rl === 'medium' ? G.yellow  : G.red,
          M
        );
        y += 8;
        const concerns = Object.entries(reportData.chat.parameterConcerns || {});
        if (concerns.length) {
          doc.setFont('helvetica','bold'); doc.setFontSize(9); tc(G.red);
          doc.text('Detected speech concerns:', M, y); y += 6;
          concerns.forEach(([key]) => bullet(
            FRIENDLY_PARAM_NAMES[key] || key.replace(/^p\d+_/,'').replace(/_/g,' '), G.red
          ));
        } else {
          doc.setFont('helvetica','normal'); doc.setFontSize(9); tc(G.green);
          doc.text('No significant speech or language concerns detected this week.', M, y); y += 6;
        }
        if (reportData.chat.interpretation?.description) {
          y += 2; doc.setFont('helvetica','italic'); doc.setFontSize(8.5); tc(G.gray);
          doc.splitTextToSize(reportData.chat.interpretation.description, CW-4)
            .forEach(l => { sp(6); doc.text(l, M, y); y += 5.5; });
        }
      } else {
        doc.setFont('helvetica','normal'); doc.setFontSize(9); tc(G.gray);
        doc.text('No conversations recorded this week.', M, y); y += 6;
      }

      // ── 2. Memory Test ──
      sec('2.  Memory Test (MMSE)');
      if (reportData.mmse.hasData) {
        row('Score',         `${reportData.mmse.score}/100`);
        row('MMSE Result',   `${reportData.mmse.latestScore} / 30`);
        row('Status',        friendlyMmseStatus(reportData.mmse.latestScore));
        row('Trend',         friendlyTrend(reportData.mmse.trend));
        if (reportData.mmse.weekChange !== 0)
          row('Change', `${reportData.mmse.weekChange > 0 ? '+' : ''}${reportData.mmse.weekChange} pts`);
        row('Total Tests',   `${reportData.mmse.totalTests}`);
        if (reportData.mmse.scoreHistory.length > 1)
          row('History', reportData.mmse.scoreHistory.join(' → '));
        if (reportData.mmse.breakdown.length) {
          y += 3; doc.setFont('helvetica','bold'); doc.setFontSize(9); tc(G.navy);
          doc.text('Domain breakdown:', M, y); y += 5;
          reportData.mmse.breakdown.forEach(b => {
            const p = b.max > 0 ? Math.round((b.score/b.max)*100) : 0;
            bullet(`${b.name}:  ${b.score}/${b.max}  (${p}%)`);
          });
        }
      } else {
        doc.setFont('helvetica','normal'); doc.setFontSize(9); tc(G.gray);
        doc.text('No memory test taken this week.', M, y); y += 6;
      }

      // ── 3. Brain Games ──
      sec('3.  Brain Games');
      doc.setFont('helvetica','italic'); doc.setFontSize(7.5); tc(G.gray);
      doc.text('Health Score = 100 − risk score  (higher is better)', M, y); y += 6;
      if (reportData.game.hasData) {
        row('Health Score',   `${reportData.game.score}/100`);
        row('Risk Level',     friendlyRisk(reportData.game.currentRiskLevel));
        row('Sessions',       `${reportData.game.totalSessions}`);
        row('Avg SAC',        `${reportData.game.avgSAC}`);
        row('Avg IES',        `${reportData.game.avgIES}`);
        y += 2;
        const gl = (reportData.game.currentRiskLevel || '').toLowerCase();
        badge(
          (reportData.game.currentRiskLevel || 'UNKNOWN').toUpperCase(),
          gl === 'low' ? G.lgreen : gl === 'high' ? G.lred : G.lyellow,
          gl === 'low' ? G.green  : gl === 'high' ? G.red  : G.yellow,
          M
        );
        y += 8;
        if (reportData.game.sessions.length) {
          doc.setFont('helvetica','bold'); doc.setFontSize(9); tc(G.navy);
          doc.text('Recent sessions:', M, y); y += 5;
          reportData.game.sessions.slice(0,5).forEach((s,i) => {
            bullet(`${s.date ? new Date(s.date).toLocaleDateString() : `Session ${i+1}`}  —  accuracy ${s.accuracy}%  —  ${friendlyRisk(s.riskLevel)}`);
          });
        }
      } else {
        doc.setFont('helvetica','normal'); doc.setFontSize(9); tc(G.gray);
        doc.text('No brain game sessions recorded this week.', M, y); y += 6;
      }

      // ── 4. Medications ──
      sec('4.  Medications & Reminders');
      if (reportData.reminder.hasData) {
        row('Score',          `${reportData.reminder.score}/100`);
        row('Compliance',     `${reportData.reminder.complianceRate}%`);
        row('Completed',      `${reportData.reminder.completed}`);
        row('Missed',         `${reportData.reminder.missed}`);
        row('Total',          `${reportData.reminder.total}`);
        row('Week Change',    reportData.reminder.weekChange);
        row('Trend',          friendlyTrend(reportData.reminder.trend));
        y += 3; sp(10);
        const bw = CW * 0.55, fill = Math.max(bw*(reportData.reminder.complianceRate/100), 2);
        const barCol = reportData.reminder.complianceRate >= 75 ? G.green : reportData.reminder.complianceRate >= 50 ? G.yellow : G.red;
        fc(G.lgray); doc.roundedRect(M, y, bw, 5, 1.5, 1.5, 'F');
        fc(barCol);  doc.roundedRect(M, y, fill, 5, 1.5, 1.5, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(8); tc(barCol);
        doc.text(`${reportData.reminder.complianceRate}%`, M + bw + 3, y + 4); y += 10;
      } else {
        doc.setFont('helvetica','normal'); doc.setFontSize(9); tc(G.gray);
        doc.text('No medication reminder data this week.', M, y); y += 6;
      }

      // ── 5. Summary & Highlights ──
      sec('5.  Summary & Highlights');
      doc.setFont('helvetica','normal'); doc.setFontSize(9); tc(G.dark);
      doc.splitTextToSize(reportData.summary, CW-4).forEach(l => { sp(6); doc.text(l, M, y); y += 5.5; });
      y += 4;

      // What's going well
      doc.setFont('helvetica','bold'); doc.setFontSize(9); tc(G.green);
      doc.text('Going well:', M, y); y += 5;
      let gs = false;
      if (reportData.chat.hasData     && reportData.chat.score     >= 60) { bullet(`Conversations healthy (${reportData.chat.totalSessions} sessions)`, G.green); gs = true; }
      if (reportData.mmse.hasData     && reportData.mmse.latestScore >= 24) { bullet(`Memory test normal range (${reportData.mmse.latestScore}/30)`, G.green); gs = true; }
      if (reportData.game.hasData     && reportData.game.score      >= 60) { bullet(`Brain games performing well`, G.green); gs = true; }
      if (reportData.reminder.hasData && reportData.reminder.complianceRate >= 75) { bullet(`Medications ${reportData.reminder.complianceRate}% compliance`, G.green); gs = true; }
      if (!gs) { doc.setFont('helvetica','normal'); doc.setFontSize(9); tc(G.gray); doc.text('Not enough activity this week.', M+3, y); y += 6; }

      y += 3;
      doc.setFont('helvetica','bold'); doc.setFontSize(9); tc(G.orange);
      doc.text('Needs attention:', M, y); y += 5;
      let gc = false;
      if (!reportData.chat.hasData)    { bullet('No conversations this week', G.orange); gc = true; }
      if (!reportData.mmse.hasData)    { bullet('No memory test taken', G.orange); gc = true; }
      if (!reportData.game.hasData)    { bullet('No brain game sessions', G.orange); gc = true; }
      if (reportData.chat.hasData     && reportData.chat.score     < 60) { bullet(`Conversation concerns — ${friendlyRisk(reportData.chat.riskLevel)}`, G.red); gc = true; }
      if (reportData.mmse.hasData     && reportData.mmse.latestScore < 24) { bullet(`Memory test ${reportData.mmse.latestScore}/30 — ${friendlyMmseStatus(reportData.mmse.latestScore)}`, G.red); gc = true; }
      if (reportData.game.hasData     && reportData.game.score      < 50) { bullet(`Brain game performance low — ${friendlyRisk(reportData.game.currentRiskLevel)}`, G.red); gc = true; }
      if (reportData.reminder.hasData && reportData.reminder.complianceRate < 75) { bullet(`Only ${reportData.reminder.complianceRate}% medication compliance — ${reportData.reminder.missed} missed`, G.red); gc = true; }
      if (!gc) { doc.setFont('helvetica','normal'); doc.setFontSize(9); tc(G.green); doc.text('No major concerns this week.', M+3, y); y += 6; }

      // Disclaimer
      sp(16); y += 6;
      doc.setDrawColor(220,220,220); doc.setLineWidth(0.2); doc.line(M, y, pw-M, y); y += 5;
      doc.setFont('helvetica','italic'); doc.setFontSize(7.5); tc(G.gray);
      doc.splitTextToSize(
        'This report is auto-generated by Hale Dementia Care and is intended as a monitoring aid only. It does not constitute a medical diagnosis or replace professional clinical judgement.',
        CW
      ).forEach(l => { sp(5); doc.text(l, M, y); y += 4.5; });

      footers();
      doc.save(`Weekly_Report_${user.name.replace(/\s+/g,'_')}_${reportData.weekEnding}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not create the report. Please try again.');
    } finally {
      setPdfGenerating(false);
    }
  };

  // ── Module cards ──────────────────────────────────────────────────────
  const getModules = () => {
    if (!reportData) return [];
    return [
      {
        name: 'Conversations',
        description: 'How are their daily chats going?',
        icon: MessageSquare,
        path: '/chat',
        gradient: 'from-blue-500 to-cyan-400',
        lightBg: 'bg-blue-50/80',
        score: reportData.chat.score,
        hasData: reportData.chat.hasData,
        stats: reportData.chat.hasData ? [
          { label: 'Chats', value: reportData.chat.totalSessions },
          { label: 'Status', value: friendlyRisk(reportData.chat.riskLevel) },
          { label: 'Days Active', value: `${reportData.chat.activeDays}/7` },
          { label: 'Messages', value: reportData.chat.totalMessages },
        ] : [],
      },
      {
        name: 'Memory Test',
        description: 'How is their memory & thinking?',
        icon: Brain,
        path: '/mmse',
        gradient: 'from-purple-500 to-violet-400',
        lightBg: 'bg-purple-50/80',
        score: reportData.mmse.score,
        hasData: reportData.mmse.hasData,
        stats: reportData.mmse.hasData ? [
          { label: 'Score', value: `${reportData.mmse.latestScore}/30` },
          { label: 'Status', value: friendlyMmseStatus(reportData.mmse.latestScore) },
          { label: 'Trend', value: friendlyTrend(reportData.mmse.trend) },
          { label: 'Tests Done', value: reportData.mmse.totalTests },
        ] : [],
      },
      {
        name: 'Brain Games',
        description: 'How are they doing in games?',
        icon: Gamepad2,
        path: '/game',
        gradient: 'from-emerald-500 to-teal-400',
        lightBg: 'bg-emerald-50/80',
        score: reportData.game.score,
        hasData: reportData.game.hasData,
        stats: reportData.game.hasData ? [
          { label: 'Games Played', value: reportData.game.totalSessions },
          { label: 'Status', value: friendlyRisk(reportData.game.currentRiskLevel) },
          { label: 'Score', value: `${reportData.game.score}/100` },
        ] : [],
      },
      {
        name: 'Medications',
        description: 'Are they taking medicines on time?',
        icon: Bell,
        path: '/reminder-dashboard',
        gradient: 'from-orange-500 to-amber-400',
        lightBg: 'bg-orange-50/80',
        score: reportData.reminder.score,
        hasData: reportData.reminder.hasData,
        stats: reportData.reminder.hasData ? [
          { label: 'Taken on Time', value: `${reportData.reminder.complianceRate}%` },
          { label: 'Completed', value: reportData.reminder.completed },
          { label: 'Missed', value: reportData.reminder.missed },
          { label: 'Trend', value: friendlyTrend(reportData.reminder.trend) },
        ] : [],
      },
    ];
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-secondary">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Patient Linked</h2>
          <p className="text-secondary mb-4">Please link a patient to view the dashboard.</p>
          <Button onClick={() => navigate('/settings')}>Go to Settings</Button>
        </div>
      </Layout>
    );
  }

  const modules = getModules();

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Care Dashboard</h1>
            <p className="text-sm text-secondary mt-0.5">Weekly overview for {user.name}</p>
          </div>
          <Button
            onClick={generatePDF}
            disabled={!reportData || pdfGenerating}
            className="flex items-center space-x-2"
          >
            {pdfGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{pdfGenerating ? 'Creating...' : 'Download Report'}</span>
          </Button>
        </div>

        {/* Patient Info */}
        <Card className="!bg-gradient-to-br !from-deepBlue/5 !to-primary/5 !border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <div className="ring-[3px] ring-primary/20 ring-offset-2 rounded-full">
                <Avatar
                  name={user.name}
                  size="xl"
                  src={user.hasProfilePhoto && user.id ? getPatientProfilePhotoUrl(user.id) : null}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h2>
                <div className="flex items-center space-x-3 text-sm text-secondary">
                  <span>Age: {user.age}</span>
                  <span className="w-1 h-1 bg-secondary/40 rounded-full"></span>
                  <span>Gender: {user.gender}</span>
                  <span className="w-1 h-1 bg-secondary/40 rounded-full"></span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.status}
                  </span>
                </div>
                <p className="text-sm text-secondary/80 mt-1">Condition: {user.condition}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-secondary">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs">
                  {reportData ? `${reportData.weekStart} – ${reportData.weekEnding}` : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Medical Info */}
        <Card>
          <div className="flex items-center space-x-2 mb-5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Health Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50/60 rounded-xl border border-red-100/60">
              <div className="flex items-center space-x-2 mb-3">
                <Heart className="w-4 h-4 text-red-500" />
                <h3 className="font-medium text-sm text-red-800">Conditions</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.condition && user.condition !== 'Not specified' ? (
                  user.condition.split(',').map((c, i) => (
                    <span key={i} className="inline-block px-2.5 py-1 text-xs bg-red-100/80 text-red-700 rounded-lg font-medium">{c.trim()}</span>
                  ))
                ) : <p className="text-xs text-gray-400">None listed</p>}
              </div>
            </div>
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100/60">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-medium text-sm text-amber-800">Allergies</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.allergies.length > 0 ? (
                  user.allergies.map((a, i) => (
                    <span key={i} className="inline-block px-2.5 py-1 text-xs bg-amber-100/80 text-amber-700 rounded-lg font-medium">{a}</span>
                  ))
                ) : <p className="text-xs text-gray-400">No known allergies</p>}
              </div>
            </div>
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/60">
              <div className="flex items-center space-x-2 mb-3">
                <Pill className="w-4 h-4 text-emerald-600" />
                <h3 className="font-medium text-sm text-emerald-800">Current Medicines</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.medicines.length > 0 ? (
                  user.medicines.map((m, i) => (
                    <span key={i} className="inline-block px-2.5 py-1 text-xs bg-emerald-100/80 text-emerald-700 rounded-lg font-medium">{m}</span>
                  ))
                ) : <p className="text-xs text-gray-400">None listed</p>}
              </div>
            </div>
          </div>
          {user.medicalHistory && (
            <div className="mt-4 p-4 bg-gray-50/60 rounded-xl border border-gray-100/60">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Medical History</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{user.medicalHistory}</p>
            </div>
          )}
        </Card>

        {/* Overall Wellness */}
        {reportLoading ? (
          <Card className="text-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
            <p className="text-secondary text-sm">Looking at this week's activity...</p>
          </Card>
        ) : reportData ? (
          <>
            <Card>
              <div className="flex items-center space-x-2 mb-5">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">How is your loved one doing?</h2>
                <span className="text-xs text-secondary ml-auto">
                  {reportData.componentsUsed} of 4 areas active
                </span>
              </div>

              <div className="flex items-center justify-center space-x-12 mb-6">
                <div className="text-center">
                  <div className={`w-32 h-32 rounded-full ${reportData.rating.bg} border-4 ${reportData.rating.border} flex flex-col items-center justify-center`}>
                    <span className={`text-4xl font-bold ${reportData.rating.color}`}>{reportData.overallScore}</span>
                    <span className="text-xs text-secondary">/100</span>
                  </div>
                  <p className={`text-sm font-bold mt-2 ${reportData.rating.color}`}>{reportData.rating.label}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <ScoreCircle score={reportData.chat.score} label="Conversations" />
                  <ScoreCircle score={reportData.mmse.score} label="Memory Test" />
                  <ScoreCircle score={reportData.game.score} label="Brain Games" />
                  <ScoreCircle score={reportData.reminder.score} label="Medications" />
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50/60 rounded-xl text-center">
                <p className="text-xs text-secondary">
                  This score combines how your loved one did across conversations, memory tests, brain games, and medication tracking this week.
                  Only areas with activity are counted.
                </p>
              </div>
            </Card>

            {/* Module Cards */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week's Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {modules.map((mod) => {
                  const Icon = mod.icon;
                  const cr = getComponentRating(mod.score);
                  return (
                    <Card key={mod.name} className="hover:shadow-glass-lg hover:-translate-y-0.5 transition-all duration-300 group" onClick={() => navigate(mod.path)}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${mod.gradient} rounded-xl flex items-center justify-center shadow-sm`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{mod.name}</h3>
                            <p className="text-xs text-secondary">{mod.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {mod.score !== null && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cr.bg} ${cr.color}`}>
                              {mod.score}/100
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      {mod.hasData ? (
                        <div className="grid grid-cols-2 gap-3">
                          {mod.stats.map((stat, i) => (
                            <div key={i} className={`p-3 ${mod.lightBg} rounded-xl`}>
                              <p className="text-[11px] text-secondary mb-0.5 font-medium">{stat.label}</p>
                              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                          <p className="text-sm text-secondary">No activity this week</p>
                          <p className="text-xs text-secondary/60 mt-1">Tap to see more</p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Highlights */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week at a Glance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/50">
                  <h4 className="text-xs font-semibold text-emerald-700 mb-2.5 uppercase tracking-wide flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /><span>Going Well</span>
                  </h4>
                  <ul className="text-sm text-emerald-700/80 space-y-1.5">
                    {reportData.chat.hasData && reportData.chat.score >= 60 && <li>• Conversations look healthy ({reportData.chat.totalSessions} chats)</li>}
                    {reportData.mmse.hasData && reportData.mmse.latestScore >= 24 && <li>• Memory test in normal range ({reportData.mmse.latestScore}/30)</li>}
                    {reportData.game.hasData && reportData.game.score >= 60 && <li>• Brain games going well ({reportData.game.totalSessions} played)</li>}
                    {reportData.reminder.hasData && reportData.reminder.complianceRate >= 75 && <li>• Medications taken {reportData.reminder.complianceRate}% of the time</li>}
                    {reportData.overallScore >= 70 && <li>• Overall doing well this week!</li>}
                  </ul>
                </div>
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100/50">
                  <h4 className="text-xs font-semibold text-amber-700 mb-2.5 uppercase tracking-wide flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /><span>Needs Attention</span>
                  </h4>
                  <ul className="text-sm text-amber-700/80 space-y-1.5">
                    {!reportData.chat.hasData && <li>• No conversations this week</li>}
                    {!reportData.mmse.hasData && <li>• No memory test taken</li>}
                    {!reportData.game.hasData && <li>• No brain games played</li>}
                    {reportData.chat.hasData && reportData.chat.score < 60 && <li>• Conversations showed some concerns</li>}
                    {reportData.mmse.hasData && reportData.mmse.latestScore < 24 && <li>• Memory test: {friendlyMmseStatus(reportData.mmse.latestScore).toLowerCase()}</li>}
                    {reportData.reminder.hasData && reportData.reminder.complianceRate < 75 && <li>• Only {reportData.reminder.complianceRate}% medications taken — {reportData.reminder.missed} missed</li>}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Summary */}
            <Card className="!bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Weekly Summary</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{reportData.summary}</p>
            </Card>
          </>
        ) : (
          <Card className="text-center py-8">
            <p className="text-secondary">Could not load this week's data. Try refreshing the page.</p>
          </Card>
        )}

        {/* Quick Nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" fullWidth onClick={() => navigate('/chat')}>
            <MessageSquare className="w-3.5 h-3.5 mr-1.5 inline" /> Conversations
          </Button>
          <Button variant="outline" fullWidth onClick={() => navigate('/mmse')}>
            <Brain className="w-3.5 h-3.5 mr-1.5 inline" /> Memory Test
          </Button>
          <Button variant="outline" fullWidth onClick={() => navigate('/game')}>
            <Gamepad2 className="w-3.5 h-3.5 mr-1.5 inline" /> Brain Games
          </Button>
          <Button variant="outline" fullWidth onClick={() => navigate('/reminder-dashboard')}>
            <Bell className="w-3.5 h-3.5 mr-1.5 inline" /> Medications
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
