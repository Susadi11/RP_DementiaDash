import { Download, TrendingUp, TrendingDown, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { elderlyUsers, generateWeeklyReport } from '../data/mockData';

const ReminderModule = () => {
  const user = elderlyUsers[0];
  const weeklyReport = generateWeeklyReport(user.id);
  const reminderData = weeklyReport.reminders;

  const handleDownloadReport = () => {
    alert('Downloading Reminder Module Weekly Report...');
  };

  const getComplianceColor = (rate) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deepBlue mb-2">Reminders & Medication Adherence</h1>
            <p className="text-secondary">Weekly medication and reminder tracking</p>
          </div>
          <Button onClick={handleDownloadReport} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </Button>
        </div>

        {/* Patient Details */}
        <Card className="bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-deepBlue mb-1">{user.name}</h2>
              <p className="text-gray-700">Age: {user.age} years | Status: {user.status}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-secondary mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Week Ending: Jan 20, 2024</span>
              </div>
              <p className="text-sm text-secondary">Last Activity: {user.lastActivity}</p>
            </div>
          </div>
        </Card>

        {/* Weekly Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Compliance Rate</p>
            <p className={`text-3xl font-bold ${getComplianceColor(reminderData.complianceRate)}`}>
              {reminderData.complianceRate}%
            </p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">{reminderData.completed}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Missed</p>
            <p className="text-3xl font-bold text-red-600">{reminderData.missed}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Week Change</p>
            <p className="text-3xl font-bold text-green-600">+5%</p>
          </Card>
        </div>

        {/* Medication Schedule */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Medication Schedule</h2>
          <div className="space-y-4">
            {reminderData.medications.map((med, index) => (
              <div key={index} className="p-4 bg-secondaryBg rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{med.name}</h3>
                    <p className="text-sm text-secondary">{med.dosage} - {med.frequency}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    med.adherence >= 80 ? 'bg-green-100 text-green-700' :
                    med.adherence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {med.adherence}% adherence
                  </div>
                </div>

                {/* Times */}
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-secondary">Times: {med.times.join(', ')}</span>
                </div>

                {/* Daily Tracking */}
                <div className="grid grid-cols-7 gap-2 mt-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                    const taken = Math.random() > 0.2; // Random for demo
                    return (
                      <div key={day} className="text-center">
                        <p className="text-xs text-secondary mb-1">{day}</p>
                        <div className={`w-full h-8 rounded flex items-center justify-center ${
                          taken ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {taken ? (
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

        {/* Missed Reminders */}
        {reminderData.missedReminders.length > 0 && (
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Missed Reminders This Week</h2>
            <div className="space-y-3">
              {reminderData.missedReminders.map((reminder, index) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{reminder.title}</p>
                      <p className="text-sm text-secondary">{reminder.date} at {reminder.time}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    {reminder.category}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Activity Completion */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Activity Completion</h2>
          <div className="space-y-4">
            {reminderData.activities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondaryBg rounded-lg">
                <span className="text-gray-900 font-medium">{activity.name}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-48 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full"
                      style={{ width: `${activity.completion}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                    {activity.completion}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Weekly Performance */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Daily Performance</h2>
          <div className="grid grid-cols-7 gap-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const rate = Math.floor(Math.random() * 40) + 60; // Random 60-100
              return (
                <div key={day} className="text-center p-4 bg-secondaryBg rounded-lg">
                  <p className="text-sm font-semibold text-secondary mb-2">{day}</p>
                  <p className={`text-2xl font-bold ${getComplianceColor(rate)}`}>{rate}%</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Insights */}
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Weekly Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Achievements</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 5-day medication streak</li>
                <li>• All morning medications taken</li>
                <li>• Improved from last week (+5%)</li>
              </ul>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">Recommendations</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Set earlier evening reminders</li>
                <li>• Add caregiver check-in for missed doses</li>
                <li>• Consider medication organizer</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ReminderModule;
