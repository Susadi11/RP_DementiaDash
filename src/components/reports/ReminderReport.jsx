import { Bell, CheckCircle, XCircle } from 'lucide-react';
import ModuleCard from './ModuleCard';
import DonutChart from '../charts/DonutChart';

const ReminderReport = ({ data }) => {
  const complianceData = [
    { name: 'Completed', value: data.completed },
    { name: 'Missed', value: data.missed }
  ];

  return (
    <ModuleCard title="Reminders & Medication Adherence" icon={Bell}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Metrics */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-secondary mb-1">Compliance Rate</p>
            <div className="flex items-baseline space-x-2">
              <p className={`text-4xl font-bold ${
                data.complianceRate >= 80 ? 'text-green-600' :
                data.complianceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.complianceRate}%
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-secondary mb-1">Completed</p>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{data.completed}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-secondary mb-1">Missed</p>
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{data.missed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Chart */}
        <div>
          <p className="text-sm font-semibold text-deepBlue mb-3">Completion Status</p>
          <DonutChart
            data={complianceData}
            colors={['#10B981', '#EF4444']}
            height={200}
          />
        </div>
      </div>

      {/* Missed Reminders */}
      {data.missedReminders.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-deepBlue mb-3">Missed Reminders</p>
          <div className="space-y-2">
            {data.missedReminders.map((reminder, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-deepBlue">{reminder.title}</p>
                    <p className="text-xs text-secondary">{reminder.date} at {reminder.time}</p>
                  </div>
                </div>
                <span className="text-xs text-red-600 font-medium">{reminder.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medication Schedule */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-deepBlue mb-3">Medication Schedule</p>
        <div className="space-y-3">
          {data.medications.map((med, index) => (
            <div key={index} className="p-4 bg-secondaryBg rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-deepBlue">{med.name}</p>
                  <p className="text-sm text-secondary">{med.dosage} - {med.frequency}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  med.adherence >= 80 ? 'bg-green-100 text-green-700' :
                  med.adherence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {med.adherence}% adherence
                </div>
              </div>
              <p className="text-xs text-secondary">Times: {med.times.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Completion */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-deepBlue mb-3">Activity Completion</p>
        <div className="space-y-2">
          {data.activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-secondary">{activity.name}</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${activity.completion}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-deepBlue w-12 text-right">
                  {activity.completion}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModuleCard>
  );
};

export default ReminderReport;
