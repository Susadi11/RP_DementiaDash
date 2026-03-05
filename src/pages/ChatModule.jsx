import { useState, useEffect } from 'react';
import {
  Download, Calendar, ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  Info, Clock, MessageCircle, Activity, FileText, MessageSquare, RefreshCw,
  Edit3, HelpCircle, Pause, Mic, Heart, Timer, Moon, TrendingDown, Brain, Target,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { getPatientSessions, getWeeklyRisk, getLinkedPatientsDetails } from '../services/api';
import jsPDF from 'jspdf';

// Parameter explanations in simple terms for caregivers with professional icons
const PARAMETER_EXPLANATIONS = {
  p1_semantic_incoherence: {
    name: "Speech Clarity",
    simple: "How clear and logical the sentences are",
    description: "Measures if words and sentences make sense together. Higher scores may indicate confusion in expressing thoughts.",
    IconComponent: MessageSquare,
    goodRange: "0-1",
    concernRange: "2-3"
  },
  p2_repeated_questions: {
    name: "Question Repetition",
    simple: "Asking the same questions multiple times",
    description: "Tracks if the same questions are asked repeatedly, which can indicate short-term memory concerns.",
    IconComponent: RefreshCw,
    goodRange: "0-1",
    concernRange: "2-3"
  },
  p3_self_correction: {
    name: "Self-Correction",
    simple: "How often they correct themselves mid-sentence",
    description: "Frequent self-corrections may indicate word-finding difficulties or uncertainty.",
    IconComponent: Edit3,
    goodRange: "0-1",
    concernRange: "2-3"
  },
  p4_low_confidence: {
    name: "Speaking Confidence",
    simple: "Use of uncertain words like 'maybe', 'I think'",
    description: "Frequent use of uncertain language may reflect declining confidence in memory.",
    IconComponent: HelpCircle,
    goodRange: "0-1",
    concernRange: "2-3"
  },
  p5_hesitation_pauses: {
    name: "Pauses in Speech",
    simple: "Long pauses while speaking",
    description: "Extended pauses during conversation may indicate difficulty retrieving words or thoughts.",
    IconComponent: Pause,
    goodRange: "0-1",
    concernRange: "2-3"
  },
  p6_vocal_tremors: {
    name: "Voice Steadiness",
    simple: "Shakiness or trembling in voice",
    description: "Voice tremors can indicate emotional distress or neurological changes.",
    IconComponent: Mic,
    goodRange: "0-1",
    concernRange: "2-3"
  },
  p7_emotion_slip: {
    name: "Emotional Control",
    simple: "Sudden changes in mood during conversation",
    description: "Unexpected emotional shifts may indicate difficulty regulating emotions.",
    IconComponent: Heart,
    goodRange: "0-1",
    concernRange: "2-3"
  },
  p8_slowed_speech: {
    name: "Speech Speed",
    simple: "Speaking slower than usual",
    description: "Noticeably slower speech can indicate cognitive processing difficulties.",
    IconComponent: Timer,
    goodRange: "0-1",
    concernRange: "2-3"
  },
  p9_evening_errors: {
    name: "Evening Confusion",
    simple: "More confusion in evening hours",
    description: "Known as 'sundowning', increased confusion in evening is common in dementia.",
    IconComponent: Moon,
    goodRange: "0-1",
    concernRange: "2-3"
  },
  p10_in_session_decline: {
    name: "Session Fatigue",
    simple: "Getting more confused as conversation continues",
    description: "Declining clarity during longer conversations may indicate cognitive fatigue.",
    IconComponent: TrendingDown,
    goodRange: "0-1",
    concernRange: "2-3"
  },
  p11_memory_recall_failure: {
    name: "Memory Recall",
    simple: "Difficulty remembering recent events",
    description: "Trouble recalling recent conversations or events from the same day.",
    IconComponent: Brain,
    goodRange: "0-1",
    concernRange: "2-3"
  },
  p12_topic_maintenance: {
    name: "Staying on Topic",
    simple: "Drifting away from the conversation topic",
    description: "Difficulty maintaining focus on the current discussion topic.",
    IconComponent: Target,
    goodRange: "0-1",
    concernRange: "2-3"
  }
};

const getDayName = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getTimeWindowName = (timeWindow) => {
  const names = {
    'morning': 'Morning (6AM – 12PM)',
    'afternoon': 'Afternoon (12PM – 6PM)',
    'evening': 'Evening (6PM – 12AM)',
    'night': 'Night (12AM – 6AM)'
  };
  return names[timeWindow] || timeWindow;
};

const getRiskLevel = (score) => {
  if (score <= 6) return { level: 'Low', color: 'green', description: 'Everything looks good!' };
  if (score <= 12) return { level: 'Mild', color: 'yellow', description: 'Some minor concerns noticed' };
  if (score <= 18) return { level: 'Moderate', color: 'orange', description: 'Please monitor closely' };
  if (score <= 24) return { level: 'High', color: 'red', description: 'Consult healthcare provider' };
  return { level: 'Critical', color: 'darkred', description: 'Immediate attention needed' };
};

const getRiskColorClass = (color) => {
  const colorMap = {
    green: 'bg-emerald-50/70 text-emerald-800 border-emerald-200/60',
    yellow: 'bg-amber-50/70 text-amber-800 border-amber-200/60',
    orange: 'bg-orange-50/70 text-orange-800 border-orange-200/60',
    red: 'bg-red-50/70 text-red-800 border-red-200/60',
    darkred: 'bg-red-100/70 text-red-900 border-red-300/60'
  };
  return colorMap[color] || colorMap.green;
};

const getRiskBadgeClass = (color) => {
  const colorMap = {
    green: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    darkred: 'bg-red-200 text-red-800'
  };
  return colorMap[color] || colorMap.green;
};

const getParameterScoreColor = (score) => {
  if (score === 0) return 'bg-emerald-50/80 text-emerald-700 border-emerald-100/60';
  if (score === 1) return 'bg-amber-50/80 text-amber-700 border-amber-100/60';
  if (score === 2) return 'bg-orange-50/80 text-orange-700 border-orange-100/60';
  return 'bg-red-50/80 text-red-700 border-red-100/60';
};

const getParameterScoreLabel = (score) => {
  if (score === 0) return 'Normal';
  if (score === 1) return 'Mild';
  if (score === 2) return 'Moderate';
  return 'Concerning';
};

const getParameterDotColor = (score) => {
  if (score === 0) return 'bg-emerald-400';
  if (score === 1) return 'bg-amber-400';
  if (score === 2) return 'bg-orange-400';
  return 'bg-red-400';
};

const ChatModule = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [expandedSessions, setExpandedSessions] = useState({});
  const [weeklyRisk, setWeeklyRisk] = useState(null);
  const [patient, setPatient] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const patientsData = await getLinkedPatientsDetails();
        if (patientsData.success && patientsData.patients?.length > 0) {
          setPatient(patientsData.patients[0]);

          const userId = patientsData.patients[0].user_id;

          const weekStart = new Date(selectedWeek);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);

          const sessionsData = await getPatientSessions(
            userId,
            selectedWeek,
            weekEnd.toISOString().split('T')[0]
          );

          if (sessionsData.success) {
            setSessions(sessionsData.sessions || []);
          }

          try {
            const riskData = await getWeeklyRisk(userId, selectedWeek);
            if (riskData.success) {
              setWeeklyRisk(riskData);
            }
          } catch (riskErr) {
            console.log('Weekly risk not available:', riskErr);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedWeek]);

  const sessionsByDay = sessions.reduce((acc, session) => {
    const date = session.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {});

  const sortedDays = Object.keys(sessionsByDay).sort((a, b) => new Date(b) - new Date(a));

  const toggleDay = (date) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const toggleSession = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  // Generate PDF Report (unchanged logic)
  const generateWeeklyPDFReport = () => {
    if (!patient || sessions.length === 0) {
      alert('No data available to generate report');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text('Weekly Behavior Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Patient: ${patient.full_name || 'Patient'}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
    doc.text(`Week Starting: ${formatDate(selectedWeek)}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('Weekly Summary', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Total Sessions: ${sessions.length}`, 20, yPos);
    yPos += 6;

    if (weeklyRisk) {
      doc.text(`Weekly Risk Level: ${weeklyRisk.risk_level || 'N/A'}`, 20, yPos);
      yPos += 6;
      doc.text(`Weekly Risk Score: ${weeklyRisk.final_weekly_risk?.toFixed(1) || 'N/A'}/100`, 20, yPos);
      yPos += 6;
    }
    yPos += 10;

    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('Daily Session Details', 20, yPos);
    yPos += 10;

    sortedDays.forEach((date) => {
      const daySessions = sessionsByDay[date].slice(0, 4);

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(0, 51, 102);
      doc.text(`${getDayName(date)} - ${formatDate(date)}`, 20, yPos);
      yPos += 8;

      daySessions.forEach((session, idx) => {
        const risk = getRiskLevel(session.session_raw_score || 0);

        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(`Session ${idx + 1} (${getTimeWindowName(session.time_window).replace(/[^\w\s()-]/g, '')})`, 25, yPos);
        yPos += 5;
        doc.text(`Risk: ${risk.level} - ${risk.description}`, 30, yPos);
        yPos += 5;
        doc.text(`Score: ${session.session_raw_score || 0}/36`, 30, yPos);
        yPos += 8;

        const concerningParams = Object.entries(session)
          .filter(([key, value]) => key.startsWith('p') && key.includes('_') && value >= 2)
          .slice(0, 3);

        if (concerningParams.length > 0) {
          doc.setTextColor(180, 0, 0);
          doc.text('Areas of Concern:', 30, yPos);
          yPos += 5;
          concerningParams.forEach(([key]) => {
            const param = PARAMETER_EXPLANATIONS[key];
            if (param) {
              doc.text(`- ${param.name}: ${param.simple}`, 35, yPos);
              yPos += 5;
            }
          });
          yPos += 3;
        }
      });
      yPos += 5;
    });

    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('Recommendations', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(60);

    const recommendations = weeklyRisk?.interpretation?.recommendations || [
      'Continue regular monitoring',
      'Maintain consistent daily routines',
      'Encourage social interaction',
      'Consult healthcare provider if concerns persist'
    ];

    recommendations.forEach(rec => {
      doc.text(`- ${rec}`, 25, yPos);
      yPos += 6;
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
      doc.text('Dementia Care Dashboard - Confidential', 20, doc.internal.pageSize.getHeight() - 10);
    }

    const fileName = `Weekly_Report_${patient.full_name?.replace(/\s+/g, '_') || 'Patient'}_${selectedWeek}.pdf`;
    doc.save(fileName);
  };

  const changeWeek = (direction) => {
    const current = new Date(selectedWeek);
    current.setDate(current.getDate() + (direction * 7));
    setSelectedWeek(current.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
            <p className="text-sm text-secondary">Loading sessions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chat & Conversation Analysis</h1>
            <p className="text-sm text-secondary mt-0.5">Daily session reports with easy-to-understand insights</p>
          </div>
          <Button onClick={generateWeeklyPDFReport} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </Button>
        </div>

        {/* Patient Info */}
        {patient && (
          <Card className="!bg-gradient-to-br !from-deepBlue/5 !to-primary/5 !border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{patient.full_name || 'Patient'}</h2>
                <div className="flex items-center space-x-2 text-sm text-secondary mt-0.5">
                  <span>Age: {patient.age || 'N/A'}</span>
                  <span className="w-1 h-1 bg-secondary/40 rounded-full"></span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${patient.account_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>{patient.account_status || 'Active'}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-secondary">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs">Week of {formatDate(selectedWeek)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Week Navigation */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => changeWeek(-1)}
            className="p-2 glass rounded-xl hover:bg-white/80 transition-all duration-200 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-secondary" />
          </button>
          <div className="px-5 py-2 glass rounded-xl">
            <span className="text-sm font-semibold text-gray-800">
              {formatDate(selectedWeek)} — {formatDate(new Date(new Date(selectedWeek).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString())}
            </span>
          </div>
          <button
            onClick={() => changeWeek(1)}
            className="p-2 glass rounded-xl hover:bg-white/80 transition-all duration-200 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Weekly Risk Summary */}
        {weeklyRisk && (
          <Card className={`!border-l-[3px] ${getRiskColorClass(weeklyRisk.interpretation?.color || 'green')}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Weekly Overview</h3>
                <p className="text-sm text-secondary mt-0.5">
                  Risk Level: <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${getRiskBadgeClass(weeklyRisk.interpretation?.color || 'green')}`}>{weeklyRisk.risk_level}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1.5">{weeklyRisk.interpretation?.description}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{weeklyRisk.final_weekly_risk?.toFixed(0) || 'N/A'}</p>
                <p className="text-[11px] text-secondary font-medium">Risk Score (0-100)</p>
              </div>
            </div>
          </Card>
        )}

        {/* Weekly Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center !p-5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-2.5">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <p className="text-[11px] text-secondary font-medium mb-1">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
          </Card>
          <Card className="text-center !p-5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center mx-auto mb-2.5">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <p className="text-[11px] text-secondary font-medium mb-1">Active Days</p>
            <p className="text-2xl font-bold text-gray-900">{sortedDays.length}/7</p>
          </Card>
          <Card className="text-center !p-5">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-400 rounded-xl flex items-center justify-center mx-auto mb-2.5">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <p className="text-[11px] text-secondary font-medium mb-1">Avg Sessions/Day</p>
            <p className="text-2xl font-bold text-gray-900">
              {sortedDays.length > 0 ? (sessions.length / sortedDays.length).toFixed(1) : '0'}
            </p>
          </Card>
          <Card className="text-center !p-5">
            <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center mx-auto mb-2.5">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <p className="text-[11px] text-secondary font-medium mb-1">Total Messages</p>
            <p className="text-2xl font-bold text-gray-900">
              {sessions.reduce((sum, s) => sum + (s.message_count || 0), 0)}
            </p>
          </Card>
        </div>

        {/* Daily Sessions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Daily Sessions</h2>

          {sortedDays.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-14 h-14 bg-gray-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Info className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No sessions recorded for this week</p>
              <p className="text-sm text-gray-400 mt-1">Sessions will appear here when the patient uses the chat feature</p>
            </Card>
          ) : (
            sortedDays.map((date) => {
              const daySessions = sessionsByDay[date].slice(0, 4);
              const isExpanded = expandedDays[date];
              const dayRiskScores = daySessions.map(s => s.session_raw_score || 0);
              const avgDayScore = dayRiskScores.length > 0
                ? dayRiskScores.reduce((a, b) => a + b, 0) / dayRiskScores.length
                : 0;
              const dayRisk = getRiskLevel(avgDayScore);

              return (
                <Card key={date}>
                  {/* Day Header - Clickable */}
                  <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleDay(date)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{getDayName(date)}</h3>
                        <p className="text-xs text-secondary mt-0.5">{formatDate(date)} · {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeClass(dayRisk.color)}`}>
                        {dayRisk.level}
                      </span>
                      <div className="p-1 rounded-lg group-hover:bg-gray-100/60 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Day View - Sessions */}
                  {isExpanded && (
                    <div className="mt-5 space-y-3 pt-5 border-t border-gray-100/80">
                      {daySessions.map((session, idx) => {
                        const sessionRisk = getRiskLevel(session.session_raw_score || 0);
                        const isSessionExpanded = expandedSessions[session.session_id];

                        return (
                          <div key={session.session_id} className={`p-4 rounded-xl border ${getRiskColorClass(sessionRisk.color)} backdrop-blur-sm`}>
                            {/* Session Header */}
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => toggleSession(session.session_id)}
                            >
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900">
                                  Session {idx + 1}: {getTimeWindowName(session.time_window)}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {session.message_count || 0} messages · Score: {session.session_raw_score || 0}/36
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <p className="font-bold text-sm">{sessionRisk.level}</p>
                                  <p className="text-[10px] text-gray-500">{sessionRisk.description}</p>
                                </div>
                                {isSessionExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </div>
                            </div>

                            {/* Expanded Session - Parameter Details */}
                            {isSessionExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-200/50 animate-fade-in">
                                <h5 className="font-semibold text-xs text-gray-700 mb-3 flex items-center uppercase tracking-wider">
                                  <Info className="w-3.5 h-3.5 mr-1.5" />
                                  Detailed Analysis
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {Object.entries(PARAMETER_EXPLANATIONS).map(([key, param]) => {
                                    const score = session[key] ?? 0;
                                    const IconComponent = param.IconComponent;
                                    return (
                                      <div
                                        key={key}
                                        className={`p-3 rounded-xl border ${getParameterScoreColor(score)}`}
                                      >
                                        <div className="flex items-center justify-between mb-1.5">
                                          <div className="flex items-center space-x-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${getParameterDotColor(score)}`}></div>
                                            <span className="text-xs font-semibold">{param.name}</span>
                                          </div>
                                          <span className="text-[10px] font-medium opacity-70">
                                            {getParameterScoreLabel(score)}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 leading-relaxed">{param.simple}</p>
                                        {score >= 2 && (
                                          <div className="mt-2 flex items-start space-x-1.5">
                                            <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-[10px] text-orange-600 leading-relaxed">{param.description}</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Session Summary */}
                                <div className="mt-4 p-3.5 bg-white/50 rounded-xl border border-white/60">
                                  <div className="flex items-start space-x-2.5">
                                    {sessionRisk.level === 'Low' ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">{sessionRisk.description}</p>
                                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        {sessionRisk.level === 'Low'
                                          ? 'The conversation showed normal patterns. Continue encouraging regular communication.'
                                          : 'Some patterns were noticed that may need attention. Continue monitoring and note any changes.'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {sessionsByDay[date].length > 4 && (
                        <p className="text-xs text-secondary text-center pt-1">
                          Showing 4 of {sessionsByDay[date].length} sessions
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Help Section */}
        <Card className="!bg-gradient-to-br !from-blue-50/60 !to-indigo-50/40 !border-blue-100/50">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100/60 rounded-xl flex-shrink-0">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-blue-900 mb-2">Understanding the Report</h3>
              <div className="flex flex-wrap gap-3 mb-3">
                <span className="flex items-center space-x-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-gray-600">Low Risk</span>
                </span>
                <span className="flex items-center space-x-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-gray-600">Mild Risk</span>
                </span>
                <span className="flex items-center space-x-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  <span className="text-gray-600">Moderate Risk</span>
                </span>
                <span className="flex items-center space-x-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  <span className="text-gray-600">High/Critical</span>
                </span>
              </div>
              <p className="text-xs text-blue-600/80">
                Click on any day card to see individual sessions, then click on a session to see detailed analysis.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ChatModule;
