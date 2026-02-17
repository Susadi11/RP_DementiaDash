import { useState, useEffect } from 'react';
import { Download, MessageSquare, Brain, Gamepad2, Bell, Calendar, TrendingUp } from 'lucide-react';
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

  // Fetch linked patients from API
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

  // Use first linked patient or fallback
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
      color: 'bg-blue-500',
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
      color: 'bg-purple-500',
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
      color: 'bg-green-500',
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
      color: 'bg-red-500',
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deepBlue mb-2">Dashboard</h1>
            <p className="text-secondary">Weekly summary and module overview</p>
          </div>
          <Button onClick={handleDownloadFinalReport} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download Final Report</span>
          </Button>
        </div>

        {/* Patient Details */}
        <Card className="bg-primary/5 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar
                name={user.name}
                size="xl"
                src={user.hasProfilePhoto && user.id ? getPatientProfilePhotoUrl(user.id) : null}
              />
              <div>
                <h2 className="text-2xl font-bold text-deepBlue mb-1">{user.name}</h2>
                <p className="text-gray-700 mb-2">Age: {user.age} years | Gender: {user.gender}</p>
                <p className="text-sm text-gray-700">Condition: {user.condition} | Status: {user.status}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-secondary mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Week Ending: Jan 20, 2024</span>
              </div>
              <p className="text-sm text-secondary">Last Activity: {user.lastActivity}</p>
              <p className="text-sm text-secondary">Care Level: {user.careLevel}</p>
            </div>
          </div>
        </Card>

        {/* Overall Week Score */}
        <Card className="bg-primary text-white text-center">
          <p className="text-white/80 mb-2">Overall Weekly Score</p>
          <p className="text-6xl font-bold mb-2">{weeklyReport.overallScore}</p>
          <p className="text-white/80">out of 100</p>
          <div className="flex items-center justify-center space-x-2 mt-3">
            <TrendingUp className="w-5 h-5 text-white" />
            <span className="text-lg font-semibold">Improved from last week</span>
          </div>
        </Card>

        {/* Module Summary Grid */}
        <div>
          <h2 className="text-2xl font-bold text-deepBlue mb-4">Module Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card
                  key={module.name}
                  className="border-l-4 border-primary hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(module.path)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{module.name}</h3>
                    </div>
                    <Button variant="ghost" size="sm">View Details →</Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(module.stats).map(([key, value]) => (
                      <div key={key} className="p-3 bg-secondaryBg rounded-lg">
                        <p className="text-xs text-secondary mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
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
          <h2 className="text-2xl font-bold text-deepBlue mb-6">Final Week Report Summary</h2>

          <div className="space-y-6">
            {/* Performance Overview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 mb-1">Chat Engagement</p>
                  <p className="text-2xl font-bold text-blue-900">Excellent</p>
                  <p className="text-xs text-blue-700 mt-1">+12% improvement</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 mb-1">Cognitive Health</p>
                  <p className="text-2xl font-bold text-green-900">Normal</p>
                  <p className="text-xs text-green-700 mt-1">Score: {weeklyReport.cognitive.latestScore}/30</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800 mb-1">Game Performance</p>
                  <p className="text-2xl font-bold text-purple-900">Good</p>
                  <p className="text-xs text-purple-700 mt-1">{weeklyReport.games.avgPerformance}% avg score</p>
                </div>
                <div className={`p-4 rounded-lg border ${weeklyReport.reminders.complianceRate >= 80
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                  }`}>
                  <p className={`text-sm mb-1 ${weeklyReport.reminders.complianceRate >= 80 ? 'text-green-800' : 'text-yellow-800'
                    }`}>Medication Adherence</p>
                  <p className={`text-2xl font-bold ${weeklyReport.reminders.complianceRate >= 80 ? 'text-green-900' : 'text-yellow-900'
                    }`}>{weeklyReport.reminders.complianceRate}%</p>
                  <p className={`text-xs mt-1 ${weeklyReport.reminders.complianceRate >= 80 ? 'text-green-700' : 'text-yellow-700'
                    }`}>{weeklyReport.reminders.completed}/{weeklyReport.reminders.completed + weeklyReport.reminders.missed} taken</p>
                </div>
              </div>
            </div>

            {/* Key Highlights */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Highlights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">✓ Strengths This Week</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• High engagement in chat sessions ({weeklyReport.chat.totalConversations} sessions)</li>
                    <li>• Cognitive scores remain stable</li>
                    <li>• Consistent game participation ({weeklyReport.games.totalGamesPlayed} games)</li>
                    <li>• Good medication adherence trend</li>
                  </ul>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">⚠ Recommendations</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
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
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Weekly Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-secondaryBg rounded-lg">
                  <p className="text-sm text-secondary mb-1">Total Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {weeklyReport.chat.totalConversations + weeklyReport.games.totalGamesPlayed}
                  </p>
                </div>
                <div className="text-center p-4 bg-secondaryBg rounded-lg">
                  <p className="text-sm text-secondary mb-1">Active Days</p>
                  <p className="text-3xl font-bold text-gray-900">7/7</p>
                </div>
                <div className="text-center p-4 bg-secondaryBg rounded-lg">
                  <p className="text-sm text-secondary mb-1">Avg Daily Time</p>
                  <p className="text-3xl font-bold text-gray-900">2.5 hrs</p>
                </div>
                <div className="text-center p-4 bg-secondaryBg rounded-lg">
                  <p className="text-sm text-secondary mb-1">Week Improvement</p>
                  <p className="text-3xl font-bold text-green-600">+15%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" fullWidth onClick={() => navigate('/chat')}>
            View Chat Reports
          </Button>
          <Button variant="outline" fullWidth onClick={() => navigate('/mmse')}>
            View MMSE Reports
          </Button>
          <Button variant="outline" fullWidth onClick={() => navigate('/game')}>
            View Game Reports
          </Button>
          <Button variant="outline" fullWidth onClick={() => navigate('/reminder')}>
            View Reminders
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
