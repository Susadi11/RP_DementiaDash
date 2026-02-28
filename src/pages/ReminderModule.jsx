import { useState, useEffect } from 'react';
import { Download, Calendar, CheckCircle, XCircle, Clock, RefreshCw, TrendingUp, Brain, Lightbulb, UserPlus } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
  getLinkedPatientsDetails,
  getPatientDashboard,
  getMissedReminders,
  getActivityCompletion,
  getMedicationSchedule,
  getBehaviorAnalysis,
  getWeeklyReport
} from '../services/api';

const ReminderModule = () => {
  const [patients, setPatients] = useState([]);
  const [patient, setPatient] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [missedReminders, setMissedReminders] = useState([]);
  const [activityCompletion, setActivityCompletion] = useState([]);
  const [medicationSchedule, setMedicationSchedule] = useState([]);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noPatients, setNoPatients] = useState(false);
  const [error, setError] = useState(null);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      setNoPatients(false);

      const patientsData = await getLinkedPatientsDetails();
      if (!patientsData.success || !patientsData.patients?.length) {
        setNoPatients(true);
        return;
      }

      const firstPatient = patientsData.patients[0];
      setPatient(firstPatient);
      const patientId = firstPatient.user_id;

      const [dashboardData, missedData, activityData, medData, behaviorData] = await Promise.all([
        getPatientDashboard(patientId),
        getMissedReminders(patientId, 7),
        getActivityCompletion(patientId, 7),
        getMedicationSchedule(patientId, 7),
        getBehaviorAnalysis(patientId, 30)
      ]);

      if (dashboardData.success) setDashboard(dashboardData);
      if (missedData.success) setMissedReminders(missedData.missed_reminders || []);
      if (activityData.success) setActivityCompletion(activityData.activities || []);
      if (medData.success) setMedicationSchedule(medData.medications || []);
      if (behaviorData.success) setBehaviorAnalysis(behaviorData);

    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!patient) return;
    try {
      const reportData = await getWeeklyReport(patient.user_id);
      if (reportData.success) {
        const blob = new Blob([JSON.stringify(reportData.report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `weekly-report-${patient.user_id}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Failed to download report: ' + err.message);
    }
  };

  const getComplianceColor = (rate) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (noPatients) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 text-center px-4">
          <div className="bg-blue-50 rounded-full p-6 mb-6">
            <UserPlus className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Patient Linked Yet</h2>
          <p className="text-gray-500 max-w-md mb-6">
            Your caregiver account doesn&apos;t have any patients linked. Ask your patient to share their Patient ID, then link them from your profile or dashboard.
          </p>
          <Button onClick={fetchAllData} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Check Again</span>
          </Button>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600 text-lg mb-2">Failed to load data</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Button onClick={fetchAllData} className="flex items-center space-x-2 mx-auto">
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </Button>
        </div>
      </Layout>
    );
  }

  const overview = dashboard?.reminder_overview;
  const cogRisk = dashboard?.cognitive_risk;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deepBlue mb-2">Reminders & Medication Adherence</h1>
            <p className="text-secondary">Weekly medication and reminder tracking</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={fetchAllData} className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            <Button onClick={handleDownloadReport} className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </Button>
          </div>
        </div>

        {/* Patient Details */}
        {patient && (
          <Card className="bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-deepBlue mb-1">
                  {patient.full_name || 'Patient'}
                </h2>
                <p className="text-gray-700">
                  Age: {patient.age || 'N/A'} years | Status: {patient.account_status || 'active'}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-secondary mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Week Ending: {dashboard?.week_ending || 'N/A'}</span>
                </div>
                <p className="text-sm text-secondary">Last Activity: {dashboard?.last_activity || 'N/A'}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Weekly Summary */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <p className="text-sm text-secondary mb-1">Compliance Rate</p>
              <p className={`text-3xl font-bold ${getComplianceColor(overview.compliance_rate)}`}>
                {overview.compliance_rate}%
              </p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-secondary mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{overview.completed}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-secondary mb-1">Missed</p>
              <p className="text-3xl font-bold text-red-600">{overview.missed}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-secondary mb-1">Week Change</p>
              <p className={`text-3xl font-bold ${overview.week_change?.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {overview.week_change || '0%'}
              </p>
            </Card>
          </div>
        )}

        {/* Medication Schedule */}
        {medicationSchedule.length > 0 && (
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Medication Schedule</h2>
            <div className="space-y-4">
              {medicationSchedule.map((med, index) => (
                <div key={index} className="p-4 bg-secondaryBg rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{med.name}</h3>
                      <p className="text-sm text-secondary">{med.dosage}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      med.adherence >= 80 ? 'bg-green-100 text-green-700' :
                      med.adherence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {med.adherence}% adherence
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span className="text-sm text-secondary">Times: {med.times?.join(', ')}</span>
                  </div>

                  {/* Daily Tracking from real API data */}
                  <div className="grid grid-cols-7 gap-2 mt-4">
                    {weekDays.map((day) => {
                      const doses = med.schedule?.[day] || [];
                      const allTaken = doses.length > 0 && doses.every(d => d.taken);
                      const hasDoses = doses.length > 0;
                      return (
                        <div key={day} className="text-center">
                          <p className="text-xs text-secondary mb-1">{day}</p>
                          <div className={`w-full h-8 rounded flex items-center justify-center ${
                            !hasDoses ? 'bg-gray-100' : allTaken ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {!hasDoses ? (
                              <span className="text-gray-400 text-xs">—</span>
                            ) : allTaken ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Missed Reminders */}
        {missedReminders.length > 0 && (
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Missed Reminders This Week</h2>
            <div className="space-y-3">
              {missedReminders.map((reminder, index) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{reminder.title}</p>
                      <p className="text-sm text-secondary">{reminder.scheduled_time}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    {reminder.tag_color || reminder.category}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Activity Completion */}
        {activityCompletion.length > 0 && (
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Activity Completion</h2>
            <div className="space-y-4">
              {activityCompletion.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondaryBg rounded-lg">
                  <span className="text-gray-900 font-medium">{activity.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-48 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          activity.completion_rate >= 80 ? 'bg-green-500' :
                          activity.completion_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${activity.completion_rate}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                      {activity.completion_rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Cognitive Risk & AI Recommendations */}
        {(cogRisk || behaviorAnalysis) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cogRisk && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900">Cognitive Risk</h3>
                </div>
                <div className="text-4xl font-bold text-purple-700 mb-2">
                  {(cogRisk.avg_cognitive_risk * 100).toFixed(0)}%
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${
                  cogRisk.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                  cogRisk.risk_level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  cogRisk.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {cogRisk.risk_level?.toUpperCase()} RISK
                </div>
                <p className="text-sm text-secondary">
                  Trend: <span className="font-medium">{cogRisk.confusion_trend}</span>
                </p>
              </Card>
            )}

            {(dashboard?.recommendations?.length > 0 || behaviorAnalysis?.insights?.length > 0) && (
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="flex items-center space-x-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-xl font-bold text-gray-900">AI Recommendations</h3>
                </div>
                <div className="space-y-2">
                  {(dashboard?.recommendations || behaviorAnalysis?.insights || []).map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-white rounded-lg">
                      <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReminderModule;
