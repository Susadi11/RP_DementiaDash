import { useState, useEffect } from 'react';
import { Download, MessageSquare, Brain, Gamepad2, Bell, Calendar, Heart, Pill, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import { generateWeeklyReport } from '../data/mockData';
import { getLinkedPatientsDetails, getPatientProfilePhotoUrl } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getLinkedPatientsDetails();
        if (data.success && data.patients) {
          setPatients(data.patients);
        }
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const user = patients.length > 0
    ? {
      name: patients[0].full_name || 'Patient',
      age: patients[0].age || 'N/A',
      gender: patients[0].gender || 'N/A',
      condition: patients[0].medical_conditions?.join(', ') || 'Not specified',
      status: patients[0].account_status || 'active',
      lastActivity: 'Recently',
      careLevel: 'Standard',
      id: patients[0].user_id,
      hasProfilePhoto: patients[0].has_profile_photo,
      allergies: patients[0].allergies || [],
      medicines: patients[0].medicines || [],
      medicalHistory: patients[0].medical_history || ''
    }
    : { name: 'No Patient Linked', age: '-', gender: '-', condition: '-', status: '-', lastActivity: '-', careLevel: '-', id: null };

  const weeklyReport = generateWeeklyReport(user.id || '1');

  const handleDownloadFinalReport = () => {
    alert('Downloading Final Weekly Report...');
  };

  const modules = [
    {
      name: 'Chat & Conversation',
      icon: MessageSquare,
      path: '/chat',
      gradient: 'from-blue-500 to-cyan-400',
      lightBg: 'bg-blue-50/80',
      stats: {
        sessions: weeklyReport.chat.totalConversations,
        avgDuration: `${weeklyReport.chat.avgLength} min`,
        engagement: '88%',
        change: '+12%'
      }
    },
    {
      name: 'MMSE Assessment',
      icon: Brain,
      path: '/mmse',
      gradient: 'from-purple-500 to-violet-400',
      lightBg: 'bg-purple-50/80',
      stats: {
        latestScore: `${weeklyReport.cognitive.latestScore}/30`,
        status: weeklyReport.cognitive.latestScore >= 24 ? 'Normal' : 'Mild Impairment',
        change: `${weeklyReport.cognitive.weekChange >= 0 ? '+' : ''}${weeklyReport.cognitive.weekChange}`,
        frequency: weeklyReport.cognitive.testFrequency
      }
    },
    {
      name: 'Cognitive Games',
      icon: Gamepad2,
      path: '/game',
      gradient: 'from-emerald-500 to-teal-400',
      lightBg: 'bg-emerald-50/80',
      stats: {
        gamesPlayed: weeklyReport.games.totalGamesPlayed,
        totalTime: `${weeklyReport.games.totalTime} hrs`,
        avgPerformance: `${weeklyReport.games.avgPerformance}%`,
        change: '+8%'
      }
    },
    {
      name: 'Medication & Reminders',
      icon: Bell,
      path: '/reminder',
      gradient: 'from-orange-500 to-amber-400',
      lightBg: 'bg-orange-50/80',
      stats: {
        compliance: `${weeklyReport.reminders.complianceRate}%`,
        completed: weeklyReport.reminders.completed,
        missed: weeklyReport.reminders.missed,
        change: '+5%'
      }
    }
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-secondary mt-0.5">Weekly summary and module overview</p>
          </div>
          <Button onClick={handleDownloadFinalReport} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </Button>
        </div>

        {/* Patient Details */}
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
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>{user.status}</span>
                </div>
                <p className="text-sm text-secondary/80 mt-1">Condition: {user.condition}</p>
              </div>
            </div>
            <div className="text-right space-y-1.5">
              <div className="flex items-center space-x-2 text-secondary">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs">Week Ending: Jan 20, 2024</span>
              </div>
              <p className="text-xs text-secondary/70">Last Activity: {user.lastActivity}</p>
              <p className="text-xs text-secondary/70">Care Level: {user.careLevel}</p>
            </div>
          </div>
        </Card>

        {/* Medical Health Record */}
        <Card>
          <div className="flex items-center space-x-2 mb-5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Medical Health Record</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Medical Conditions */}
            <div className="p-4 bg-red-50/60 rounded-xl border border-red-100/60 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-3">
                <Heart className="w-4 h-4 text-red-500" />
                <h3 className="font-medium text-sm text-red-800">Medical Conditions</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.condition && user.condition !== 'Not specified' ? (
                  user.condition.split(',').map((condition, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2.5 py-1 text-xs bg-red-100/80 text-red-700 rounded-lg font-medium"
                    >
                      {condition.trim()}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No conditions specified</p>
                )}
              </div>
            </div>

            {/* Allergies */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100/60 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-medium text-sm text-amber-800">Allergies</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.allergies && user.allergies.length > 0 ? (
                  user.allergies.map((allergy, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2.5 py-1 text-xs bg-amber-100/80 text-amber-700 rounded-lg font-medium"
                    >
                      {allergy}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No known allergies</p>
                )}
              </div>
            </div>

            {/* Current Medicines */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/60 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-3">
                <Pill className="w-4 h-4 text-emerald-600" />
                <h3 className="font-medium text-sm text-emerald-800">Current Medicines</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.medicines && user.medicines.length > 0 ? (
                  user.medicines.map((medicine, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2.5 py-1 text-xs bg-emerald-100/80 text-emerald-700 rounded-lg font-medium"
                    >
                      {medicine}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No medicines listed</p>
                )}
              </div>
            </div>
          </div>

          {/* Medical History */}
          {user.medicalHistory && (
            <div className="mt-4 p-4 bg-gray-50/60 rounded-xl border border-gray-100/60">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Medical History</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{user.medicalHistory}</p>
            </div>
          )}
        </Card>

        {/* Module Summary Grid */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card
                  key={module.name}
                  className="hover:shadow-glass-lg hover:-translate-y-0.5 transition-all duration-300 group"
                  onClick={() => navigate(module.path)}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${module.gradient} rounded-xl flex items-center justify-center shadow-sm`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">{module.name}</h3>
                    </div>
                    <span className="text-primary text-sm font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      View <ChevronRight className="w-4 h-4 ml-0.5" />
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(module.stats).map(([key, value]) => (
                      <div key={key} className={`p-3 ${module.lightBg} rounded-xl`}>
                        <p className="text-[11px] text-secondary mb-0.5 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-lg font-bold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Final Week Report Summary */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Weekly Report Summary</h2>

          <div className="space-y-6">
            {/* Performance Overview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Performance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100/50">
                  <p className="text-xs text-blue-600 font-medium mb-1">Chat Engagement</p>
                  <p className="text-xl font-bold text-blue-900">Excellent</p>
                  <p className="text-[11px] text-blue-500 mt-1">+12% improvement</p>
                </div>
                <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-100/50">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Cognitive Health</p>
                  <p className="text-xl font-bold text-emerald-900">Normal</p>
                  <p className="text-[11px] text-emerald-500 mt-1">Score: {weeklyReport.cognitive.latestScore}/30</p>
                </div>
                <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-100/50">
                  <p className="text-xs text-purple-600 font-medium mb-1">Game Performance</p>
                  <p className="text-xl font-bold text-purple-900">Good</p>
                  <p className="text-[11px] text-purple-500 mt-1">{weeklyReport.games.avgPerformance}% avg score</p>
                </div>
                <div className={`p-4 rounded-xl border ${weeklyReport.reminders.complianceRate >= 80
                  ? 'bg-emerald-50/70 border-emerald-100/50'
                  : 'bg-amber-50/70 border-amber-100/50'
                  }`}>
                  <p className={`text-xs font-medium mb-1 ${weeklyReport.reminders.complianceRate >= 80 ? 'text-emerald-600' : 'text-amber-600'
                    }`}>Medication Adherence</p>
                  <p className={`text-xl font-bold ${weeklyReport.reminders.complianceRate >= 80 ? 'text-emerald-900' : 'text-amber-900'
                    }`}>{weeklyReport.reminders.complianceRate}%</p>
                  <p className={`text-[11px] mt-1 ${weeklyReport.reminders.complianceRate >= 80 ? 'text-emerald-500' : 'text-amber-500'
                    }`}>{weeklyReport.reminders.completed}/{weeklyReport.reminders.completed + weeklyReport.reminders.missed} taken</p>
                </div>
              </div>
            </div>

            {/* Key Highlights */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Key Highlights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/50">
                  <h4 className="text-xs font-semibold text-emerald-700 mb-2.5 uppercase tracking-wide">✓ Strengths This Week</h4>
                  <ul className="text-sm text-emerald-700/80 space-y-1.5">
                    <li>• High engagement in chat sessions ({weeklyReport.chat.totalConversations} sessions)</li>
                    <li>• Cognitive scores remain stable</li>
                    <li>• Consistent game participation ({weeklyReport.games.totalGamesPlayed} games)</li>
                    <li>• Good medication adherence trend</li>
                  </ul>
                </div>
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100/50">
                  <h4 className="text-xs font-semibold text-amber-700 mb-2.5 uppercase tracking-wide">⚠ Recommendations</h4>
                  <ul className="text-sm text-amber-700/80 space-y-1.5">
                    <li>• Continue cognitive exercises regularly</li>
                    <li>• Monitor medication adherence closely</li>
                    <li>• Increase social interaction activities</li>
                    <li>• Schedule follow-up MMSE assessment</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Weekly Metrics */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Weekly Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-4 bg-white/50 rounded-xl border border-white/60">
                  <p className="text-[11px] text-secondary font-medium mb-1">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {weeklyReport.chat.totalConversations + weeklyReport.games.totalGamesPlayed}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl border border-white/60">
                  <p className="text-[11px] text-secondary font-medium mb-1">Active Days</p>
                  <p className="text-2xl font-bold text-gray-900">7/7</p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl border border-white/60">
                  <p className="text-[11px] text-secondary font-medium mb-1">Avg Daily Time</p>
                  <p className="text-2xl font-bold text-gray-900">2.5 hrs</p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl border border-white/60">
                  <p className="text-[11px] text-secondary font-medium mb-1">Week Improvement</p>
                  <p className="text-2xl font-bold text-emerald-600">+15%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" fullWidth onClick={() => navigate('/chat')}>
            Chat Reports
          </Button>
          <Button variant="outline" fullWidth onClick={() => navigate('/mmse')}>
            MMSE Reports
          </Button>
          <Button variant="outline" fullWidth onClick={() => navigate('/game')}>
            Game Reports
          </Button>
          <Button variant="outline" fullWidth onClick={() => navigate('/reminder')}>
            Reminders
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
