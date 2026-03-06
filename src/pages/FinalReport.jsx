import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Printer, Save, RefreshCw,
  MessageSquare, Brain, Gamepad2, Bell,
  CheckCircle, AlertTriangle
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { getLinkedPatientsDetails, getPatientProfilePhotoUrl } from '../services/api';
import {
  fetchWeeklyReportData, getOverallRating, getComponentRating,
  friendlyRisk, friendlyMmseStatus, friendlyTrend, FRIENDLY_PARAM_NAMES
} from '../services/weeklyReportService';
import jsPDF from 'jspdf';

const FinalReport = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [caregiverNotes, setCaregiverNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
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
    const patientId = userId || patients[0]?.user_id;
    if (!patientId) return;
    const fetchReport = async () => {
      setReportLoading(true);
      try { setReportData(await fetchWeeklyReportData(patientId)); }
      catch (err) { console.error(err); }
      finally { setReportLoading(false); }
    };
    fetchReport();
  }, [patients, userId]);

  const user = patients.length > 0
    ? {
      name: patients[0].full_name || 'Patient',
      age: patients[0].age || 'N/A',
      gender: patients[0].gender || 'N/A',
      condition: patients[0].medical_conditions?.join(', ') || 'Not specified',
      id: patients[0].user_id,
      hasProfilePhoto: patients[0].has_profile_photo,
    }
    : null;

  // ── PDF ───────────────────────────────────────────────────────────────
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
      const heading = (t) => { checkPage(16); y += 4; doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30); doc.text(t, m, y); y += 4; hr(); };
      const label = (l, v) => {
        checkPage(7); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(80);
        doc.text(l, m + 2, y); doc.setFont('helvetica', 'normal'); doc.setTextColor(30);
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

      // Title
      y = m;
      doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(30);
      doc.text('Weekly Health Report', m, y);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(130);
      doc.text('Hale — Dementia Care App', pw - m, y, { align: 'right' });
      y += 6; hr();

      // Patient info
      label('Name', user.name);
      label('Age', `${user.age} years`);
      label('Gender', user.gender);
      if (user.condition && user.condition !== 'Not specified') label('Conditions', user.condition);
      label('Report Week', `${reportData.weekStart} to ${reportData.weekEnding}`);
      label('Date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      y += 2;

      // Overall
      heading('How is your loved one doing?');
      const sc = reportData.overallScore;
      const scoreColor = sc >= 70 ? [16, 185, 129] : sc >= 50 ? [245, 158, 11] : [239, 68, 68];

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

      // Area scores
      [
        { name: 'Conversations', score: reportData.chat.score, detail: reportData.chat.hasData ? `${reportData.chat.totalSessions} chats — ${friendlyRisk(reportData.chat.riskLevel)}` : 'No chats' },
        { name: 'Memory Test', score: reportData.mmse.score, detail: reportData.mmse.hasData ? `${reportData.mmse.latestScore}/30 — ${friendlyMmseStatus(reportData.mmse.latestScore)}` : 'No test' },
        { name: 'Brain Games', score: reportData.game.score, detail: reportData.game.hasData ? `${reportData.game.totalSessions} games — ${friendlyRisk(reportData.game.currentRiskLevel)}` : 'No games' },
        { name: 'Medications', score: reportData.reminder.score, detail: reportData.reminder.hasData ? `Taken ${reportData.reminder.complianceRate}%` : 'No data' },
      ].forEach(a => {
        checkPage(8); doc.setFontSize(10);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(50);
        doc.text(`${a.name}:`, m + 4, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(80);
        doc.text(`${a.score !== null ? a.score + '/100' : '—'}  —  ${a.detail}`, m + 50, y);
        y += 8;
      });
      y += 4;

      // Conversations
      heading('Conversations');
      if (reportData.chat.hasData) {
        label('Score', `${reportData.chat.score} out of 100`);
        label('Chats', `${reportData.chat.totalSessions}`);
        label('Days Active', `${reportData.chat.activeDays} out of 7`);
        label('Status', friendlyRisk(reportData.chat.riskLevel));
        const concerns = Object.entries(reportData.chat.parameterConcerns);
        if (concerns.length > 0) {
          y += 2; doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 80, 80);
          doc.text('Things we noticed:', m + 2, y); y += 7;
          concerns.forEach(([key]) => bullet(FRIENDLY_PARAM_NAMES[key] || key.replace(/^p\d+_/, '').replace(/_/g, ' '), [180, 60, 60]));
        } else {
          para('Conversations looked healthy — no concerns.', [40, 140, 40]);
        }
      } else { para('No conversations this week.', [130, 130, 130]); }

      // Memory Test
      heading('Memory Test (MMSE)');
      if (reportData.mmse.hasData) {
        label('Score', `${reportData.mmse.score} out of 100`);
        label('Test Result', `${reportData.mmse.latestScore} out of 30`);
        label('What This Means', friendlyMmseStatus(reportData.mmse.latestScore));
        label('Compared to Before', friendlyTrend(reportData.mmse.trend));
        if (reportData.mmse.weekChange !== 0) label('Change', `${reportData.mmse.weekChange >= 0 ? '+' : ''}${reportData.mmse.weekChange} points`);
        label('Tests Taken', `${reportData.mmse.totalTests}`);
        if (reportData.mmse.breakdown.length > 0) {
          y += 2; doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(50);
          doc.text('Test areas:', m + 2, y); y += 7;
          reportData.mmse.breakdown.forEach(b => bullet(`${b.name}: ${b.score}/${b.max}`));
        }
        if (reportData.mmse.scoreHistory.length > 1) label('Past Scores', reportData.mmse.scoreHistory.join(' → '));
      } else { para('No memory test this week.', [130, 130, 130]); }

      // Brain Games
      heading('Brain Games');
      if (reportData.game.hasData) {
        label('Score', `${reportData.game.score} out of 100`);
        label('Games Played', `${reportData.game.totalSessions}`);
        label('Status', friendlyRisk(reportData.game.currentRiskLevel));
      } else { para('No brain games this week.', [130, 130, 130]); }

      // Medications
      heading('Medications');
      if (reportData.reminder.hasData) {
        label('Score', `${reportData.reminder.score} out of 100`);
        label('Taken on Time', `${reportData.reminder.complianceRate}%`);
        label('Completed', `${reportData.reminder.completed} out of ${reportData.reminder.total}`);
        if (reportData.reminder.missed > 0) label('Missed', `${reportData.reminder.missed}`);
        label('Trend', friendlyTrend(reportData.reminder.trend));
      } else { para('No medication data this week.', [130, 130, 130]); }

      // Going Well / Needs Attention
      heading("What's Going Well");
      let s = false;
      if (reportData.chat.hasData && reportData.chat.score >= 60) { bullet(`Conversations look healthy`, [30, 130, 80]); s = true; }
      if (reportData.mmse.hasData && reportData.mmse.latestScore >= 24) { bullet(`Memory test in normal range`, [30, 130, 80]); s = true; }
      if (reportData.game.hasData && reportData.game.score >= 60) { bullet(`Brain games going well`, [30, 130, 80]); s = true; }
      if (reportData.reminder.hasData && reportData.reminder.complianceRate >= 75) { bullet(`Medications taken on time`, [30, 130, 80]); s = true; }
      if (!s) para('Not enough activity to identify strengths this week.', [130, 130, 130]);

      heading('What Needs Attention');
      let c = false;
      if (!reportData.chat.hasData) { bullet('No chats — encourage conversations', [200, 120, 20]); c = true; }
      if (!reportData.mmse.hasData) { bullet('No memory test — try to do one', [200, 120, 20]); c = true; }
      if (!reportData.game.hasData) { bullet('No brain games — keep the mind active', [200, 120, 20]); c = true; }
      if (reportData.mmse.hasData && reportData.mmse.latestScore < 24) { bullet(`Memory test: ${friendlyMmseStatus(reportData.mmse.latestScore).toLowerCase()}`, [200, 80, 40]); c = true; }
      if (reportData.reminder.hasData && reportData.reminder.complianceRate < 75) { bullet(`Only ${reportData.reminder.complianceRate}% medications taken`, [200, 80, 40]); c = true; }
      if (!c) para('No major concerns — keep it up!', [30, 130, 80]);

      // Summary
      heading('Weekly Summary');
      para(reportData.summary);

      // Notes
      if (caregiverNotes.trim()) {
        heading('Your Notes');
        para(caregiverNotes);
      }

      // Disclaimer
      y += 6; checkPage(14); hr();
      para('This report is created by an AI health assistant. It helps you keep track — it does not replace a doctor.', [140, 140, 140]);

      footers();
      doc.save(`Report_${user.name.replace(/\s+/g, '_')}_${reportData.weekEnding}.pdf`);
    } catch (err) {
      console.error('PDF failed:', err);
      alert('Could not create the report. Please try again.');
    } finally { setPdfGenerating(false); }
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading || reportLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-secondary ml-3">Loading report...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !reportData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Report not available</h2>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  const rating = reportData.rating;

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" /><span>Back to Dashboard</span>
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" className="flex items-center space-x-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /><span>Print</span>
            </Button>
            <Button className="flex items-center space-x-2" onClick={generatePDF} disabled={pdfGenerating}>
              {pdfGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{pdfGenerating ? 'Creating...' : 'Download PDF'}</span>
            </Button>
          </div>
        </div>

        {/* Title */}
        <Card className="print:shadow-none">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-deepBlue mb-2">Weekly Health Report</h1>
            <p className="text-secondary">{reportData.weekStart} to {reportData.weekEnding}</p>
          </div>
          <div className="flex items-center justify-between border-t border-b border-border py-6">
            <div className="flex items-center space-x-4">
              <Avatar name={user.name} size="xl" src={user.hasProfilePhoto && user.id ? getPatientProfilePhotoUrl(user.id) : null} />
              <div>
                <h2 className="text-2xl font-bold text-deepBlue">{user.name}</h2>
                <p className="text-secondary">Age: {user.age} | Gender: {user.gender}</p>
                {user.condition !== 'Not specified' && <p className="text-sm text-secondary">Conditions: {user.condition}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-xl ${rating.bg} border ${rating.border} mb-2`}>
                <p className="text-sm text-secondary">Overall</p>
                <p className={`text-2xl font-bold ${rating.color}`}>{rating.label}</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">{reportData.overallScore}/100</p>
              <p className="text-xs text-secondary mt-1">{reportData.componentsUsed} of 4 areas active</p>
            </div>
          </div>
        </Card>

        {/* Quick Summary */}
        <Card>
          <h2 className="text-2xl font-bold text-deepBlue mb-4">This Week at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <MessageSquare className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-sm text-secondary mb-1">Conversations</p>
              <p className="text-3xl font-bold text-primary">{reportData.chat.totalSessions}</p>
              <p className="text-xs text-secondary mt-1">{reportData.chat.hasData ? friendlyRisk(reportData.chat.riskLevel) : 'No chats'}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Brain className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-sm text-secondary mb-1">Memory Test</p>
              <p className="text-3xl font-bold text-purple-600">{reportData.mmse.hasData ? `${reportData.mmse.latestScore}/30` : '—'}</p>
              <p className="text-xs text-secondary mt-1">{reportData.mmse.hasData ? friendlyMmseStatus(reportData.mmse.latestScore) : 'No test'}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Gamepad2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm text-secondary mb-1">Brain Games</p>
              <p className="text-3xl font-bold text-green-600">{reportData.game.totalSessions}</p>
              <p className="text-xs text-secondary mt-1">{reportData.game.hasData ? friendlyRisk(reportData.game.currentRiskLevel) : 'No games'}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <Bell className="w-5 h-5 text-orange-600 mx-auto mb-1" />
              <p className="text-sm text-secondary mb-1">Medications</p>
              <p className="text-3xl font-bold text-orange-600">{reportData.reminder.hasData ? `${reportData.reminder.complianceRate}%` : '—'}</p>
              <p className="text-xs text-secondary mt-1">{reportData.reminder.hasData ? 'taken on time' : 'No data'}</p>
            </div>
          </div>
          <p className="text-secondary leading-relaxed">{reportData.summary}</p>
        </Card>

        {/* Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Conversations */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-500 p-3 rounded-xl"><MessageSquare className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Conversations</h3>
                <p className="text-sm text-secondary">How are their daily chats?</p>
              </div>
              {reportData.chat.score !== null && (
                <Badge variant={reportData.chat.score >= 70 ? 'success' : reportData.chat.score >= 50 ? 'warning' : 'danger'} className="ml-auto">{reportData.chat.score}/100</Badge>
              )}
            </div>
            {reportData.chat.hasData ? (
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-secondary">Chats</span><span className="font-bold">{reportData.chat.totalSessions}</span></div>
                <div className="flex justify-between"><span className="text-secondary">Days Active</span><span className="font-bold">{reportData.chat.activeDays}/7</span></div>
                <div className="flex justify-between"><span className="text-secondary">Status</span><span className="font-bold">{friendlyRisk(reportData.chat.riskLevel)}</span></div>
                <div className="flex justify-between"><span className="text-secondary">Messages</span><span className="font-bold">{reportData.chat.totalMessages}</span></div>
                {Object.keys(reportData.chat.parameterConcerns).length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100 mt-2">
                    <p className="text-xs font-semibold text-red-700 mb-2">Things we noticed</p>
                    {Object.entries(reportData.chat.parameterConcerns).slice(0, 4).map(([key]) => (
                      <p key={key} className="text-xs text-red-600">• {FRIENDLY_PARAM_NAMES[key] || key.replace(/^p\d+_/, '').replace(/_/g, ' ')}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : <p className="text-sm text-secondary italic">No conversations this week</p>}
          </Card>

          {/* Memory Test */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-500 p-3 rounded-xl"><Brain className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Memory Test</h3>
                <p className="text-sm text-secondary">How is their memory?</p>
              </div>
              {reportData.mmse.score !== null && (
                <Badge variant={reportData.mmse.score >= 70 ? 'success' : reportData.mmse.score >= 50 ? 'warning' : 'danger'} className="ml-auto">{reportData.mmse.score}/100</Badge>
              )}
            </div>
            {reportData.mmse.hasData ? (
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-secondary">Test Score</span><span className="font-bold">{reportData.mmse.latestScore}/30</span></div>
                <div className="flex justify-between"><span className="text-secondary">What This Means</span><span className="font-bold">{friendlyMmseStatus(reportData.mmse.latestScore)}</span></div>
                <div className="flex justify-between"><span className="text-secondary">Compared to Before</span><span className="font-bold">{friendlyTrend(reportData.mmse.trend)}</span></div>
                {reportData.mmse.weekChange !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-secondary">Change</span>
                    <span className={`font-bold ${reportData.mmse.weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.mmse.weekChange >= 0 ? '+' : ''}{reportData.mmse.weekChange} points
                    </span>
                  </div>
                )}
                <div className="flex justify-between"><span className="text-secondary">Tests Done</span><span className="font-bold">{reportData.mmse.totalTests}</span></div>
                {reportData.mmse.breakdown.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {reportData.mmse.breakdown.map((b, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-secondary">{b.name}</span>
                          <span className="font-semibold">{b.score}/{b.max}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(b.score / b.max) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <p className="text-sm text-secondary italic">No memory test this week</p>}
          </Card>

          {/* Brain Games */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-emerald-500 p-3 rounded-xl"><Gamepad2 className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Brain Games</h3>
                <p className="text-sm text-secondary">How did they do in games?</p>
              </div>
              {reportData.game.score !== null && (
                <Badge variant={reportData.game.score >= 70 ? 'success' : reportData.game.score >= 50 ? 'warning' : 'danger'} className="ml-auto">{reportData.game.score}/100</Badge>
              )}
            </div>
            {reportData.game.hasData ? (
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-secondary">Games Played</span><span className="font-bold">{reportData.game.totalSessions}</span></div>
                <div className="flex justify-between"><span className="text-secondary">Status</span><span className="font-bold">{friendlyRisk(reportData.game.currentRiskLevel)}</span></div>
                <div className="flex justify-between"><span className="text-secondary">Score</span><span className="font-bold">{reportData.game.score}/100</span></div>
              </div>
            ) : <p className="text-sm text-secondary italic">No brain games this week</p>}
          </Card>

          {/* Medications */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-orange-500 p-3 rounded-xl"><Bell className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Medications</h3>
                <p className="text-sm text-secondary">Are they taking medicines?</p>
              </div>
              {reportData.reminder.score !== null && (
                <Badge variant={reportData.reminder.score >= 70 ? 'success' : reportData.reminder.score >= 50 ? 'warning' : 'danger'} className="ml-auto">{reportData.reminder.score}/100</Badge>
              )}
            </div>
            {reportData.reminder.hasData ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-secondary">Taken on Time</span>
                  <span className={`font-bold ${reportData.reminder.complianceRate >= 80 ? 'text-green-600' : 'text-red-600'}`}>{reportData.reminder.complianceRate}%</span>
                </div>
                <div className="flex justify-between"><span className="text-secondary">Completed</span><span className="font-bold text-green-600">{reportData.reminder.completed}</span></div>
                {reportData.reminder.missed > 0 && (
                  <div className="flex justify-between"><span className="text-secondary">Missed</span><span className="font-bold text-red-600">{reportData.reminder.missed}</span></div>
                )}
                <div className="flex justify-between"><span className="text-secondary">Total</span><span className="font-bold">{reportData.reminder.total}</span></div>
                <div className="flex justify-between"><span className="text-secondary">Trend</span><span className="font-bold">{friendlyTrend(reportData.reminder.trend)}</span></div>
              </div>
            ) : <p className="text-sm text-secondary italic">No medication data this week</p>}
          </Card>
        </div>

        {/* Going Well / Needs Attention */}
        <Card>
          <h2 className="text-lg font-bold text-deepBlue mb-4">Quick Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/50">
              <h4 className="text-xs font-semibold text-emerald-700 mb-2.5 uppercase flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5" /><span>Going Well</span>
              </h4>
              <ul className="text-sm text-emerald-700/80 space-y-1.5">
                {reportData.chat.hasData && reportData.chat.score >= 60 && <li>• Conversations look healthy</li>}
                {reportData.mmse.hasData && reportData.mmse.latestScore >= 24 && <li>• Memory test in normal range</li>}
                {reportData.game.hasData && reportData.game.score >= 60 && <li>• Brain games going well</li>}
                {reportData.reminder.hasData && reportData.reminder.complianceRate >= 75 && <li>• Taking medications on time</li>}
                {reportData.overallScore >= 70 && <li>• Overall a good week!</li>}
              </ul>
            </div>
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100/50">
              <h4 className="text-xs font-semibold text-amber-700 mb-2.5 uppercase flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /><span>Needs Attention</span>
              </h4>
              <ul className="text-sm text-amber-700/80 space-y-1.5">
                {!reportData.chat.hasData && <li>• No conversations this week</li>}
                {!reportData.mmse.hasData && <li>• No memory test taken</li>}
                {!reportData.game.hasData && <li>• No brain games played</li>}
                {reportData.chat.hasData && reportData.chat.score < 60 && <li>• Conversations showed some concerns</li>}
                {reportData.mmse.hasData && reportData.mmse.latestScore < 24 && <li>• Memory: {friendlyMmseStatus(reportData.mmse.latestScore).toLowerCase()}</li>}
                {reportData.reminder.hasData && reportData.reminder.complianceRate < 75 && <li>• Only {reportData.reminder.complianceRate}% medications taken</li>}
              </ul>
            </div>
          </div>
        </Card>

        {/* Caregiver Notes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-deepBlue">Your Notes</h2>
            {!isEditingNotes ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(true)}>Edit Notes</Button>
            ) : (
              <Button size="sm" onClick={() => setIsEditingNotes(false)} className="flex items-center space-x-2">
                <Save className="w-4 h-4" /><span>Save</span>
              </Button>
            )}
          </div>
          {isEditingNotes ? (
            <textarea
              value={caregiverNotes}
              onChange={(e) => setCaregiverNotes(e.target.value)}
              placeholder="Write any notes about this week — things you noticed, concerns, questions for the doctor..."
              className="w-full h-32 p-4 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          ) : (
            <div className="p-4 bg-secondaryBg rounded-xl min-h-[80px]">
              {caregiverNotes || <p className="text-secondary italic">No notes yet. Tap "Edit Notes" to add your thoughts.</p>}
            </div>
          )}
        </Card>

        {/* Footer */}
        <Card className="print:hidden">
          <div className="flex justify-between items-center">
            <p className="text-sm text-secondary">
              Report for {reportData.weekStart} – {reportData.weekEnding}
            </p>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default FinalReport;
