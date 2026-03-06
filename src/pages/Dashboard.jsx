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
  fetchWeeklyReportData, getOverallRating, getComponentRating,
  friendlyRisk, friendlyMmseStatus, friendlyTrend, FRIENDLY_PARAM_NAMES
} from '../services/weeklyReportService';
import jsPDF from 'jspdf';

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getLinkedPatientsDetails();
        if (data.success && data.patients) setPatients(data.patients);
      } catch (err) { console.error(err); setError(err.message); }
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

  // ══════════════════════════════════════════════════════════════════════
  //  PDF — Simple, plain-language report anyone can understand
  // ══════════════════════════════════════════════════════════════════════
  const generatePDF = () => {
    if (!reportData || !user) return;
    setPdfGenerating(true);

    try {
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const m = 20;
      const cw = pw - m * 2;
      let y = 0;

      const checkPage = (n = 14) => { if (y + n > ph - 20) { doc.addPage(); y = m; } };
      const hr = () => { doc.setDrawColor(200); doc.setLineWidth(0.3); doc.line(m, y, pw - m, y); y += 5; };
      const heading = (t) => { checkPage(16); y += 4; doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30); doc.text(t, m, y); y += 4; hr(); };
      const label = (l, v) => {
        checkPage(7); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80);
        doc.text(l, m + 2, y); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
        const lines = doc.splitTextToSize(String(v ?? '—'), cw - 65);
        doc.text(lines, m + 62, y); y += lines.length * 5.5 + 2;
      };
      const bullet = (t, color = [70, 70, 70]) => {
        checkPage(7); doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...color);
        const lines = doc.splitTextToSize(`•  ${t}`, cw - 8);
        doc.text(lines, m + 4, y); y += lines.length * 5 + 2;
      };
      const para = (t, color = [50, 50, 50]) => {
        doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...color);
        doc.splitTextToSize(t, cw - 4).forEach(l => { checkPage(6); doc.text(l, m + 2, y); y += 5; });
        y += 2;
      };
      const footers = () => {
        const tot = doc.internal.getNumberOfPages();
        for (let i = 1; i <= tot; i++) {
          doc.setPage(i); doc.setDrawColor(200); doc.setLineWidth(0.2);
          doc.line(m, ph - 14, pw - m, ph - 14);
          doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150);
          doc.text('Hale — Dementia Care App  |  Confidential', m, ph - 9);
          doc.text(`Page ${i} of ${tot}`, pw - m, ph - 9, { align: 'right' });
        }
      };

      // ── Title ──
      y = m;
      doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
      doc.text('Weekly Health Report', m, y);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(130);
      doc.text('Hale — Dementia Care App', pw - m, y, { align: 'right' });
      y += 6; hr();

      // ── Patient info ──
      label('Name', user.name);
      label('Age', `${user.age} years`);
      label('Gender', user.gender);
      if (user.condition && user.condition !== 'Not specified') label('Conditions', user.condition);
      if (user.allergies.length) label('Allergies', user.allergies.join(', '));
      if (user.medicines.length) label('Medicines', user.medicines.join(', '));
      label('Report Week', `${reportData.weekStart} to ${reportData.weekEnding}`);
      label('Date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      y += 2;

      // ── Overall Score ──
      heading('How is your loved one doing?');
      const sc = reportData.overallScore;
      const scoreColor = sc >= 70 ? [16, 185, 129] : sc >= 50 ? [245, 158, 11] : [239, 68, 68];

      // Score line: "55 / 100  —  Fair" all at same readable size
      doc.setFontSize(28); doc.setFont('helvetica', 'bold'); doc.setTextColor(...scoreColor);
      const scoreText = `${sc}`;
      doc.text(scoreText, m, y);
      const scoreW = doc.getTextWidth(scoreText);

      doc.setFontSize(16); doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130);
      doc.text(' / 100', m + scoreW + 2, y);
      const slashW = doc.getTextWidth(' / 100');

      doc.setFontSize(14); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
      doc.text(`  —  ${reportData.rating.label}`, m + scoreW + slashW + 4, y);
      y += 12;

      doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
      doc.text(`Based on ${reportData.componentsUsed} out of 4 areas with activity this week.`, m + 2, y);
      y += 8;

      // Score breakdown — plain language
      const areas = [
        { name: 'Conversations', score: reportData.chat.score, detail: reportData.chat.hasData ? `${reportData.chat.totalSessions} chat${reportData.chat.totalSessions !== 1 ? 's' : ''} — ${friendlyRisk(reportData.chat.riskLevel)}` : 'No chats this week' },
        { name: 'Memory Test', score: reportData.mmse.score, detail: reportData.mmse.hasData ? `Scored ${reportData.mmse.latestScore}/30 — ${friendlyMmseStatus(reportData.mmse.latestScore)}` : 'No test taken' },
        { name: 'Brain Games', score: reportData.game.score, detail: reportData.game.hasData ? `${reportData.game.totalSessions} session${reportData.game.totalSessions !== 1 ? 's' : ''} — ${friendlyRisk(reportData.game.currentRiskLevel)}` : 'No games played' },
        { name: 'Medications', score: reportData.reminder.score, detail: reportData.reminder.hasData ? `Taken ${reportData.reminder.complianceRate}% of the time` : 'No data' },
      ];
      areas.forEach(a => {
        checkPage(8); doc.setFontSize(10);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50);
        doc.text(`${a.name}:`, m + 4, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
        doc.text(`${a.score !== null ? a.score + '/100' : 'No data'}  —  ${a.detail}`, m + 50, y);
        y += 8;
      });
      y += 4;

      // ── 1. Conversations ──
      heading('Conversations');
      if (reportData.chat.hasData) {
        label('Score', `${reportData.chat.score} out of 100`);
        label('Chats This Week', `${reportData.chat.totalSessions}`);
        label('Days Active', `${reportData.chat.activeDays} out of 7 days`);
        label('How It Looks', friendlyRisk(reportData.chat.riskLevel));

        const concerns = Object.entries(reportData.chat.parameterConcerns);
        if (concerns.length > 0) {
          y += 2; doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 80, 80);
          doc.text('Things we noticed:', m + 2, y); y += 7;
          concerns.forEach(([key]) => {
            const friendlyName = FRIENDLY_PARAM_NAMES[key] || key.replace(/^p\d+_/, '').replace(/_/g, ' ');
            bullet(friendlyName, [180, 60, 60]);
          });
        } else {
          y += 2; para('No concerns — conversations looked healthy this week.', [40, 140, 40]);
        }

        if (reportData.chat.interpretation?.description) {
          y += 2; label('What this means', reportData.chat.interpretation.description);
        }
      } else {
        para('No conversations happened this week. Encourage your loved one to use the chat feature.', [130, 130, 130]);
      }

      // ── 2. Memory Test ──
      heading('Memory Test (MMSE)');
      if (reportData.mmse.hasData) {
        label('Score', `${reportData.mmse.score} out of 100`);
        label('Test Result', `${reportData.mmse.latestScore} out of 30`);
        label('What This Means', friendlyMmseStatus(reportData.mmse.latestScore));
        label('Compared to Before', friendlyTrend(reportData.mmse.trend));
        if (reportData.mmse.weekChange !== 0) {
          label('Change This Week', `${reportData.mmse.weekChange >= 0 ? '+' : ''}${reportData.mmse.weekChange} points`);
        }
        label('Total Tests Taken', `${reportData.mmse.totalTests}`);

        if (reportData.mmse.breakdown.length > 0) {
          y += 2; doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50);
          doc.text('Test areas:', m + 2, y); y += 7;
          reportData.mmse.breakdown.forEach(b => {
            const pct = Math.round((b.score / b.max) * 100);
            bullet(`${b.name}: ${b.score}/${b.max} (${pct}%)`);
          });
        }
        if (reportData.mmse.scoreHistory.length > 1) {
          y += 2; label('Past Scores', reportData.mmse.scoreHistory.join(' → '));
        }
      } else {
        para('No memory test was taken this week. Try to complete one each week.', [130, 130, 130]);
      }

      // ── 3. Brain Games ──
      heading('Brain Games');
      if (reportData.game.hasData) {
        label('Score', `${reportData.game.score} out of 100`);
        label('Games Played', `${reportData.game.totalSessions}`);
        label('How It Looks', friendlyRisk(reportData.game.currentRiskLevel));

        if (reportData.game.sessions.length > 0) {
          y += 2; doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(50);
          doc.text('Recent games:', m + 2, y); y += 7;
          reportData.game.sessions.slice(0, 5).forEach((s, i) => {
            const dateStr = s.date ? new Date(s.date).toLocaleDateString() : `Game ${i + 1}`;
            bullet(`${dateStr}: ${s.accuracy}% correct — ${friendlyRisk(s.riskLevel)}`);
          });
        }
      } else {
        para('No brain games were played this week. Games help keep the mind active!', [130, 130, 130]);
      }

      // ── 4. Medications ──
      heading('Medications & Reminders');
      if (reportData.reminder.hasData) {
        label('Score', `${reportData.reminder.score} out of 100`);
        label('Taken on Time', `${reportData.reminder.complianceRate}%`);
        label('Completed', `${reportData.reminder.completed} out of ${reportData.reminder.total}`);
        if (reportData.reminder.missed > 0) label('Missed', `${reportData.reminder.missed}`);
        label('Compared to Last Week', reportData.reminder.weekChange);
        label('Trend', friendlyTrend(reportData.reminder.trend));
      } else {
        para('No medication reminders were tracked this week.', [130, 130, 130]);
      }

      // ── What's Going Well ──
      heading("What's Going Well");
      let hasStrengths = false;
      if (reportData.chat.hasData && reportData.chat.score >= 60) { bullet(`Conversations look healthy (${reportData.chat.totalSessions} chats)`, [30, 130, 80]); hasStrengths = true; }
      if (reportData.mmse.hasData && reportData.mmse.latestScore >= 24) { bullet(`Memory test in normal range (${reportData.mmse.latestScore}/30)`, [30, 130, 80]); hasStrengths = true; }
      if (reportData.game.hasData && reportData.game.score >= 60) { bullet(`Brain games going well (${reportData.game.totalSessions} sessions)`, [30, 130, 80]); hasStrengths = true; }
      if (reportData.reminder.hasData && reportData.reminder.complianceRate >= 75) { bullet(`Medications taken ${reportData.reminder.complianceRate}% of the time`, [30, 130, 80]); hasStrengths = true; }
      if (sc >= 70) { bullet('Overall doing well this week!', [30, 130, 80]); hasStrengths = true; }
      if (!hasStrengths) { para('Not enough activity this week to see what went well.', [130, 130, 130]); }

      heading('What Needs Attention');
      let hasConcerns = false;
      if (!reportData.chat.hasData) { bullet('No chats this week — try to have a few conversations', [200, 120, 20]); hasConcerns = true; }
      if (!reportData.mmse.hasData) { bullet('No memory test taken — try to do one this week', [200, 120, 20]); hasConcerns = true; }
      if (!reportData.game.hasData) { bullet('No brain games played — games help keep the mind sharp', [200, 120, 20]); hasConcerns = true; }
      if (reportData.chat.hasData && reportData.chat.score < 60) { bullet(`Conversations showed some concerns`, [200, 80, 40]); hasConcerns = true; }
      if (reportData.mmse.hasData && reportData.mmse.latestScore < 24) { bullet(`Memory test scored ${reportData.mmse.latestScore}/30 — ${friendlyMmseStatus(reportData.mmse.latestScore).toLowerCase()}`, [200, 80, 40]); hasConcerns = true; }
      if (reportData.reminder.hasData && reportData.reminder.complianceRate < 75) { bullet(`Medications taken only ${reportData.reminder.complianceRate}% — ${reportData.reminder.missed} missed`, [200, 80, 40]); hasConcerns = true; }
      if (!hasConcerns) { para('No major concerns this week — keep it up!', [30, 130, 80]); }

      // ── Summary ──
      heading('Weekly Summary');
      para(reportData.summary);

      // ── Disclaimer ──
      y += 6; checkPage(14); hr();
      doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(140);
      para('This report is created by an AI health assistant. It is meant to help you keep track of your loved one — it does not replace a doctor. Always talk to a healthcare professional about medical decisions.', [140, 140, 140]);

      footers();
      doc.save(`Weekly_Report_${user.name.replace(/\s+/g, '_')}_${reportData.weekEnding}.pdf`);
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
