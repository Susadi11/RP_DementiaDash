import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  Download,
  RefreshCw,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlarmClock,
  Filter
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Button from '../components/common/Button';
import ActivityProgressBar from '../components/caregiver/ActivityProgressBar';
import MissedReminderCard from '../components/caregiver/MissedReminderCard';
import AlertCard from '../components/caregiver/AlertCard';
import MedicationSchedule from '../components/caregiver/MedicationSchedule';
import BehaviorAnalysis from '../components/caregiver/BehaviorAnalysis';
import {
  getPatientDashboard,
  getMissedReminders,
  getActivityCompletion,
  getCaregiverAlerts,
  resolveAlert,
  getLinkedPatientsDetails,
  getWeeklyReport,
  getReminderWeeklyReport,
  getAllRemindersGrouped,
  getSnoozedReminders,
  getAdherenceRiskScore,
  getPatientReminders,
  getUserRemindersAll,
  getCaregiverDashboardReminders
} from '../services/api';
import generateWeeklyPDF from '../utils/generateWeeklyPDF';

/**
 * Caregiver Dashboard Page
 * Comprehensive view of patient reminders, medication adherence, and ML-powered insights
 */
const ReminderDashboard = () => {
  const navigate = useNavigate();
  
  // State
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [missedReminders, setMissedReminders] = useState([]);
  const [activityCompletion, setActivityCompletion] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, reminders, medication, behavior, alerts
  // Reminders tab state
  const [groupedReminders, setGroupedReminders] = useState(null);
  const [snoozedReminders, setSnoozedReminders] = useState([]);
  const [adherenceRisk, setAdherenceRisk] = useState(null);
  const [allReminders, setAllReminders] = useState([]);
  const [reminderFilter, setReminderFilter] = useState('all'); // all, active, completed, missed, snoozed

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Fetch dashboard data when patient selected
  useEffect(() => {
    if (selectedPatient) {
      fetchDashboardData();
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      const data = await getLinkedPatientsDetails();
      if (data.success && data.patients && data.patients.length > 0) {
        setPatients(data.patients);
        setSelectedPatient(data.patients[0].user_id); // Select first patient
      } else {
        setError('No linked patients found');
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError(err.message);
    }
  };

  const fetchDashboardData = async () => {
    if (!selectedPatient) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [dashboardData, missedData, activityData, alertsData, groupedData, snoozedData, adherenceData, allData, dashboardRemindersData] = await Promise.all([
        getPatientDashboard(selectedPatient),
        getMissedReminders(selectedPatient, 7).catch(() => ({ success: false })),
        getActivityCompletion(selectedPatient, 7).catch(() => ({ success: false })),
        getCaregiverAlerts(selectedPatient, { resolved: false, days: 7 }).catch(() => ({ success: false })),
        getAllRemindersGrouped(selectedPatient, 7).catch(() => null),
        getSnoozedReminders(selectedPatient, 7).catch(() => null),
        getAdherenceRiskScore(selectedPatient, 30).catch(() => null),
        getUserRemindersAll(selectedPatient).catch(() => null),   // real reminders endpoint
        getCaregiverDashboardReminders(7).catch(() => null)       // NEW — all patients grouped
      ]);

      if (dashboardData.success) setDashboard(dashboardData);
      if (missedData.success) setMissedReminders(missedData.missed_reminders || []);
      if (activityData.success) setActivityCompletion(activityData.activities || []);
      if (alertsData.success) setAlerts(alertsData.alerts || []);

      // ── Grouped reminders ───────────────────────────────────────────────
      // Primary source: /grouped endpoint (one call, all statuses)
      if (groupedData?.success) {
        const rem = groupedData.reminders || groupedData;
        setGroupedReminders({
          success: true,
          active:    rem.active    || [],
          completed: rem.completed || [],
          missed:    rem.missed    || [],
          snoozed:   rem.snoozed   || [],
          summary:   groupedData.summary || {
            total:           (rem.active?.length || 0) + (rem.completed?.length || 0) + (rem.missed?.length || 0) + (rem.snoozed?.length || 0),
            active:          rem.active?.length    || 0,
            completed:       rem.completed?.length || 0,
            missed:          rem.missed?.length    || 0,
            snoozed:         rem.snoozed?.length   || 0,
            compliance_rate: groupedData.summary?.compliance_rate ?? 0,
          },
        });
        // Back-fill missed reminders for Overview tab
        if (rem.missed?.length && (missedData?.missed_reminders?.length ?? 0) === 0) {
          setMissedReminders(rem.missed);
        }
      } else {
        // Fallback: build grouped structure client-side from flat list
        const rawList = Array.isArray(allData)
          ? allData
          : (allData?.reminders || allData?.data || allData?.items || allData?.results || []);
        if (allData && rawList.length === 0) {
          console.debug('[ReminderDashboard] getUserRemindersAll response:', allData);
        }
        if (rawList.length > 0) setAllReminders(rawList);
        const flat = rawList;

        if (flat.length > 0) {
          const now = new Date();
          const groups = { active: [], completed: [], missed: [], snoozed: [] };
          flat.forEach(r => {
            const s = (r.status || '').toLowerCase();
            if (s === 'completed') {
              groups.completed.push(r);
            } else if (s === 'snoozed') {
              groups.snoozed.push(r);
            } else if (s === 'missed') {
              groups.missed.push(r);
            } else {
              const scheduledAt = r.scheduled_time ? new Date(r.scheduled_time) : null;
              if (scheduledAt && !isNaN(scheduledAt) && scheduledAt < now) {
                groups.missed.push({ ...r, _overdue: true });
              } else {
                groups.active.push(r);
              }
            }
          });
          const total = flat.length;
          const completed = groups.completed.length;
          setGroupedReminders({
            success: true,
            ...groups,
            summary: {
              total,
              active:    groups.active.length,
              completed,
              missed:    groups.missed.length,
              snoozed:   groups.snoozed.length,
              compliance_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
            },
          });
          if (groups.missed.length > 0 && (missedData?.missed_reminders?.length ?? 0) === 0) {
            setMissedReminders(groups.missed);
          }
        }
      }

      // ── Dashboard-level reminders (all patients, overrides per-patient) ──
      if (dashboardRemindersData?.success && dashboardRemindersData.reminders) {
        const dr = dashboardRemindersData.reminders;
        const ds = dashboardRemindersData.summary || {};
        setGroupedReminders({
          success: true,
          active:    dr.active    || [],
          completed: dr.completed || [],
          missed:    dr.missed    || [],
          snoozed:   dr.snoozed   || [],
          summary: {
            total:           ds.total           ?? 0,
            active:          ds.active          ?? (dr.active?.length    || 0),
            completed:       ds.completed       ?? (dr.completed?.length || 0),
            missed:          ds.missed          ?? (dr.missed?.length    || 0),
            snoozed:         dr.snoozed?.length || 0,
            compliance_rate: ds.compliance_rate  ?? 0,
          },
        });
        if (dr.missed?.length && (missedData?.missed_reminders?.length ?? 0) === 0) {
          setMissedReminders(dr.missed);
        }
        setAllReminders([
          ...(dr.active    || []),
          ...(dr.completed || []),
          ...(dr.missed    || []),
        ]);
      }

      if (snoozedData?.success) setSnoozedReminders(snoozedData.snoozed_reminders || []);
      if (adherenceData?.success) setAdherenceRisk(adherenceData);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await resolveAlert(alertId);
      // Refresh alerts
      const alertsData = await getCaregiverAlerts(selectedPatient, { resolved: false, days: 7 });
      if (alertsData.success) setAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const name = currentPatient?.full_name || `Patient-${selectedPatient}`;
      // Try the reminders endpoint first (has full data), fall back to caregiver endpoint
      try {
        const data = await getReminderWeeklyReport(selectedPatient);
        // Response may be the report directly or nested under .report
        const report = data.report || data;
        generateWeeklyPDF(report, name);
        return;
      } catch {
        // fall through to caregiver endpoint
      }
      const reportData = await getWeeklyReport(selectedPatient);
      const report = reportData.report || reportData;
      generateWeeklyPDF(report, name);
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  // Format ISO datetime or plain time string into a human-readable form
  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    try {
      const d = new Date(timeStr);
      if (isNaN(d)) return timeStr; // not a valid date → return as-is (already formatted)
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return time;
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
    } catch {
      return timeStr;
    }
  };

  // Get current patient details
  const currentPatient = patients.find(p => p.user_id === selectedPatient);

  if (loading && !dashboard) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error && !dashboard) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">{error}</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Retry
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reminders & Medication Adherence
            </h1>
            <p className="text-gray-600 mt-1">
              {currentPatient?.full_name} • Week Ending: {dashboard?.week_ending} • Last Activity: {dashboard?.last_activity}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={fetchDashboardData}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={handleDownloadReport}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Weekly Report</span>
            </Button>
          </div>
        </div>

        {/* Patient Selector (if multiple patients) */}
        {patients.length > 1 && (
          <Card className="p-4">
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {patients.map(patient => (
                <option key={patient.user_id} value={patient.user_id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
          </Card>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {['overview', 'reminders', 'medication', 'behavior', 'alerts'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid — prefer dashboard.reminder_overview; fall back to groupedReminders / allReminders */}
            {(() => {
              const ov = dashboard?.reminder_overview || {};
              const gs = groupedReminders?.summary || {};
              const rawCount = allReminders?.length || 0;

              const total     = ov.total     || gs.total     || rawCount;
              const completed = ov.completed || gs.completed || 0;
              const missed    = ov.missed    || gs.missed    || 0;
              const pending   = ov.pending   || gs.active    || 0;
              const rate      = total > 0
                ? (ov.compliance_rate || gs.compliance_rate || Math.round((completed / total) * 100))
                : 0;
              const weekChange = ov.week_change || null;

              if (total === 0 && rawCount === 0) return null;   // truly no data

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Compliance Rate"
                    value={`${rate}%`}
                    icon={TrendingUp}
                    trend={weekChange?.startsWith('+') ? 'up' : 'down'}
                    trendValue={weekChange}
                    gradient={true}
                  />
                  <Card className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-600 text-sm font-medium mb-2">Completed</p>
                        <p className="text-4xl font-bold text-gray-900 mb-2">{completed}</p>
                        <p className="text-sm text-gray-500">of {total} total</p>
                      </div>
                      <div className="bg-blue-500 p-3 rounded-xl">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-600 text-sm font-medium mb-2">Missed</p>
                        <p className="text-4xl font-bold text-gray-900 mb-2">{missed}</p>
                        <p className="text-sm text-gray-500">this week</p>
                      </div>
                      <div className="bg-red-500 p-3 rounded-xl">
                        <Bell className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-600 text-sm font-medium mb-2">Pending</p>
                        <p className="text-4xl font-bold text-gray-900 mb-2">{pending}</p>
                        <p className="text-sm text-gray-500">upcoming</p>
                      </div>
                      <div className="bg-yellow-500 p-3 rounded-xl">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })()}

            {/* Cognitive Risk & Recommendations */}
            {dashboard?.cognitive_risk && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cognitive Risk */}
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cognitive Risk Assessment
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-bold text-purple-700">
                        {(dashboard.cognitive_risk.avg_cognitive_risk * 100).toFixed(0)}%
                      </div>
                      <div className={`mt-2 px-3 py-1 inline-block rounded-full text-sm font-semibold ${
                        dashboard.cognitive_risk.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                        dashboard.cognitive_risk.risk_level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        dashboard.cognitive_risk.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dashboard.cognitive_risk.risk_level.toUpperCase()} RISK
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Trend: <span className="font-medium">{dashboard.cognitive_risk.confusion_trend}</span>
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Recommendations */}
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    AI Recommendations
                  </h3>
                  <div className="space-y-2">
                    {dashboard.recommendations?.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-white rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Missed Reminders & Activity Completion */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Missed Reminders */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Missed Reminders This Week
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {missedReminders.length > 0 ? (
                    missedReminders.map(reminder => (
                      <MissedReminderCard key={reminder.id} reminder={reminder} />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      🎉 No missed reminders this week!
                    </p>
                  )}
                </div>
              </Card>

              {/* Activity Completion */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Activity Completion
                </h3>
                <div className="space-y-4">
                  {activityCompletion.length > 0 ? (
                    activityCompletion.map((activity, index) => (
                      <ActivityProgressBar
                        key={index}
                        name={activity.name}
                        completionRate={activity.completion_rate}
                        completed={activity.completed}
                        total={activity.total}
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No activity data available
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* ─── Reminders Tab ─── */}
        {activeTab === 'reminders' && (
          <div className="space-y-6">

            {/* Summary Stats */}
            {(() => {
              const summary = groupedReminders?.summary || {};
              const total     = summary.total     ?? (missedReminders.length + snoozedReminders.length);
              const completed = summary.completed  ?? 0;
              const missed    = summary.missed     ?? missedReminders.length;
              const snoozed   = summary.snoozed    ?? snoozedReminders.length;
              const active    = summary.active     ?? 0;
              const rate      = summary.compliance_rate ?? (total > 0 ? Math.round((completed / total) * 100) : 0);

              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Compliance Rate */}
                  <div className="col-span-2 md:col-span-3 lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white flex flex-col justify-between">
                    <p className="text-blue-100 text-sm font-medium">Compliance Rate</p>
                    <p className="text-5xl font-extrabold mt-1">{rate}%</p>
                    <div className="mt-3 bg-white/20 rounded-full h-2">
                      <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${rate}%` }} />
                    </div>
                    <p className="text-blue-100 text-xs mt-2">{completed} of {total} completed</p>
                  </div>

                  {/* Completed */}
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex flex-col space-y-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-2xl font-bold text-green-700">{completed}</p>
                    <p className="text-xs text-green-600 font-medium">Completed</p>
                  </div>

                  {/* Missed */}
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col space-y-1">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-2xl font-bold text-red-700">{missed}</p>
                    <p className="text-xs text-red-600 font-medium">Missed</p>
                  </div>

                  {/* Snoozed */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex flex-col space-y-1">
                    <AlarmClock className="w-5 h-5 text-yellow-600" />
                    <p className="text-2xl font-bold text-yellow-700">{snoozed}</p>
                    <p className="text-xs text-yellow-600 font-medium">Snoozed</p>
                  </div>

                  {/* Active / Pending */}
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col space-y-1">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <p className="text-2xl font-bold text-purple-700">{active}</p>
                    <p className="text-xs text-purple-600 font-medium">Active</p>
                  </div>
                </div>
              );
            })()}

            {/* Adherence / Risk Strip */}
            {adherenceRisk && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">Adherence Score</p>
                  <p className="text-3xl font-bold text-blue-600">{adherenceRisk.adherence_score ?? '—'}</p>
                  <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 rounded-full h-1.5" style={{ width: `${adherenceRisk.adherence_score ?? 0}%` }} />
                  </div>
                </div>
                <div className="bg-white border rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">Cognitive Risk</p>
                  <p className="text-3xl font-bold text-purple-600">{adherenceRisk.cognitive_risk_score ?? '—'}</p>
                  <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-purple-500 rounded-full h-1.5" style={{ width: `${adherenceRisk.cognitive_risk_score ?? 0}%` }} />
                  </div>
                </div>
                <div className="bg-white border rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">Wellness Score</p>
                  <p className="text-3xl font-bold text-green-600">{adherenceRisk.wellness_score ?? '—'}</p>
                  <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-green-500 rounded-full h-1.5" style={{ width: `${adherenceRisk.wellness_score ?? 0}%` }} />
                  </div>
                </div>
                <div className={`rounded-xl p-4 flex flex-col justify-between ${
                  adherenceRisk.risk_level === 'low'      ? 'bg-green-50 border border-green-200' :
                  adherenceRisk.risk_level === 'moderate' ? 'bg-yellow-50 border border-yellow-200' :
                  adherenceRisk.risk_level === 'high'     ? 'bg-orange-50 border border-orange-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-xs text-gray-500 font-medium">Risk Level</p>
                  <p className={`text-2xl font-bold capitalize ${
                    adherenceRisk.risk_level === 'low'      ? 'text-green-700' :
                    adherenceRisk.risk_level === 'moderate' ? 'text-yellow-700' :
                    adherenceRisk.risk_level === 'high'     ? 'text-orange-700' :
                    'text-red-700'
                  }`}>{adherenceRisk.risk_level ?? '—'}</p>
                  <p className="text-xs text-gray-500 mt-1">Trend: <span className="font-medium">{adherenceRisk.behavior_trend}</span></p>
                  {adherenceRisk.urgency && adherenceRisk.urgency !== 'normal' && (
                    <span className={`mt-2 text-xs font-semibold px-2 py-0.5 rounded-full self-start ${
                      adherenceRisk.urgency === 'urgent'  ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>{adherenceRisk.urgency.toUpperCase()}</span>
                  )}
                </div>
              </div>
            )}

            {/* Filter Buttons */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <Filter className="w-4 h-4 text-gray-400" />
              {['all', 'active', 'completed', 'missed', 'snoozed'].map(f => (
                <button
                  key={f}
                  onClick={() => setReminderFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    reminderFilter === f
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && groupedReminders?.[f] && (
                    <span className="ml-1.5 text-xs opacity-75">({groupedReminders[f].length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Reminder List */}
            {(() => {
              // Build the list to show based on the active filter
              let items = [];

              if (groupedReminders) {
                // Use backend grouped data
                if (reminderFilter === 'all') {
                  const addGroup = (arr, status) =>
                    (arr || []).map(r => ({ ...r, _display_status: status }));
                  items = [
                    ...addGroup(groupedReminders.active,    'active'),
                    ...addGroup(groupedReminders.completed, 'completed'),
                    ...addGroup(groupedReminders.missed,    'missed'),
                    ...addGroup(groupedReminders.snoozed,   'snoozed'),
                  ];
                } else {
                  items = (groupedReminders[reminderFilter] || []).map(r => ({ ...r, _display_status: reminderFilter }));
                }
              } else {
                // Fallback: use data already fetched
                if (reminderFilter === 'all' || reminderFilter === 'missed') {
                  items = [...items, ...missedReminders.map(r => ({ ...r, _display_status: 'missed' }))];
                }
                if (reminderFilter === 'all' || reminderFilter === 'snoozed') {
                  items = [...items, ...snoozedReminders.map(r => ({ ...r, _display_status: 'snoozed' }))];
                }
              }

              if (items.length === 0) {
                const emptyMessages = {
                  all:       '📋 No reminders found for this period.',
                  active:    '✅ No active reminders right now.',
                  completed: '🎉 No completed reminders yet — check back later.',
                  missed:    '🎉 No missed reminders this week!',
                  snoozed:   '💤 No snoozed reminders — great focus!',
                };
                return (
                  <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                    <p className="text-gray-500">{emptyMessages[reminderFilter]}</p>
                  </div>
                );
              }

              const statusConfig = {
                active:    { label: 'Active',    pill: 'bg-purple-100 text-purple-700', icon: Clock },
                completed: { label: 'Completed', pill: 'bg-green-100 text-green-700',  icon: CheckCircle },
                missed:    { label: 'Missed',    pill: 'bg-red-100 text-red-700',     icon: XCircle },
                snoozed:   { label: 'Snoozed',   pill: 'bg-yellow-100 text-yellow-700', icon: AlarmClock },
              };

              const categoryColors = {
                medication:  'bg-red-100 text-red-800 border-red-200',
                appointment: 'bg-blue-100 text-blue-800 border-blue-200',
                meal:        'bg-green-100 text-green-800 border-green-200',
                exercise:    'bg-purple-100 text-purple-800 border-purple-200',
                social:      'bg-pink-100 text-pink-800 border-pink-200',
                hydration:   'bg-cyan-100 text-cyan-800 border-cyan-200',
              };

              return (
                <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50">
                  {items.map((reminder, idx) => {
                    // Determine effective display status (may have been overridden during grouping)
                    const st = reminder._display_status || reminder.status || 'active';
                    const isOverdue = reminder._overdue === true;
                    const cfg = statusConfig[st] || statusConfig.active;
                    const StatusIcon = cfg.icon;
                    const catColor = categoryColors[reminder.category] || 'bg-gray-100 text-gray-700 border-gray-200';

                    return (
                      <div key={reminder.id || reminder._id || idx} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                        {/* Status Icon */}
                        <div className={`mt-0.5 p-2 rounded-full ${
                          st === 'completed' ? 'bg-green-100' :
                          st === 'missed'    ? 'bg-red-100' :
                          st === 'snoozed'   ? 'bg-yellow-100' : 'bg-purple-100'
                        }`}>
                          <StatusIcon className={`w-4 h-4 ${
                            st === 'completed' ? 'text-green-600' :
                            st === 'missed'    ? 'text-red-600' :
                            st === 'snoozed'   ? 'text-yellow-600' : 'text-purple-600'
                          }`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{reminder.title}</h4>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${catColor}`}>
                              {reminder.category}
                            </span>
                            {isOverdue && (
                              <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full border border-red-200">
                                Overdue
                              </span>
                            )}
                            {reminder.priority && reminder.priority !== 'low' && (
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                reminder.priority === 'critical' ? 'bg-red-200 text-red-800' :
                                reminder.priority === 'high'     ? 'bg-orange-200 text-orange-800' :
                                'bg-yellow-200 text-yellow-800'
                              }`}>{reminder.priority}</span>
                            )}
                            {reminder.snooze_count > 0 && (
                              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                                💤 ×{reminder.snooze_count}
                              </span>
                            )}
                          </div>
                          {reminder.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{reminder.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center text-xs text-gray-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(reminder.scheduled_time || reminder.scheduled_datetime)}
                            </span>
                            {reminder.completed_at && (
                              <span className="text-xs text-gray-400">✓ {formatTime(reminder.completed_at)}</span>
                            )}
                            {reminder.patient_name && (
                              <span className="text-xs text-gray-400 font-medium">• {reminder.patient_name}</span>
                            )}
                          </div>
                        </div>

                        {/* Status Pill */}
                        <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${cfg.pill}`}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* AI Recommendations (from adherence-risk) */}
            {adherenceRisk?.recommendations?.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">AI Recommendations</h3>
                <div className="space-y-2">
                  {adherenceRisk.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2">
                      <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Medication Tab */}
        {activeTab === 'medication' && selectedPatient && (
          <MedicationSchedule patientId={selectedPatient} />
        )}

        {/* Behavior Tab */}
        {activeTab === 'behavior' && selectedPatient && (
          <BehaviorAnalysis patientId={selectedPatient} />
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Active Caregiver Alerts
            </h3>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map(alert => (
                  <AlertCard
                    key={alert._id}
                    alert={alert}
                    onResolve={handleResolveAlert}
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  ✨ No active alerts - everything looks good!
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ReminderDashboard;
