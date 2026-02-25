import { useState, useEffect } from 'react';
import { Download, MessageSquare, Brain, Gamepad2, Bell, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import { getUserStats, formatRiskLevel } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameStats, setGameStats] = useState(null);
  
  // Hardcoded user ID for now
  const userId = 'user123';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch game stats
      const stats = await getUserStats(userId);
      setGameStats(stats);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFinalReport = () => {
    if (!gameStats) {
      alert('No data available to download');
      return;
    }
    
    const report = {
      userId: gameStats.userId,
      generatedAt: new Date().toISOString(),
      gameStats: gameStats,
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const riskInfo = gameStats ? formatRiskLevel(gameStats.currentRiskLevel) : null;

  const modules = [
    {
      name: 'Chat & Conversation',
      icon: MessageSquare,
      path: '/chat',
      color: 'bg-blue-500',
      stats: {
        status: 'Available',
        description: 'AI-powered conversations',
        feature: 'Real-time chat support',
        info: 'Chat module ready'
      }
    },
    {
      name: 'MMSE Assessment',
      icon: Brain,
      path: '/mmse',
      color: 'bg-purple-500',
      stats: {
        status: 'Available',
        description: 'Cognitive testing',
        feature: 'Mental state evaluation',
        info: 'MMSE testing available'
      }
    },
    {
      name: 'Cognitive Games',
      icon: Gamepad2,
      path: '/game',
      color: 'bg-green-500',
      stats: gameStats ? {
        gamesPlayed: gameStats.totalSessions,
        avgSAC: gameStats.avgSAC.toFixed(4),
        avgIES: gameStats.avgIES.toFixed(4),
        riskLevel: gameStats.currentRiskLevel
      } : {
        status: 'No data',
        description: 'Start playing games',
        feature: 'Cognitive training',
        info: 'No sessions yet'
      }
    },
    {
      name: 'Medication & Reminders',
      icon: Bell,
      path: '/reminder',
      color: 'bg-red-500',
      stats: {
        status: 'Available',
        description: 'Medication tracking',
        feature: 'Smart reminders',
        info: 'Reminder system active'
      }
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deepBlue mb-2">Caregiver Dashboard</h1>
            <p className="text-secondary">Dementia care monitoring and analytics</p>
          </div>
          <Button onClick={handleDownloadFinalReport} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="bg-red-50 border-l-4 border-red-500">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Connection Error</h3>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-1">Make sure the backend server is running on http://localhost:8000</p>
              </div>
            </div>
          </Card>
        )}

        {gameStats && riskInfo && (
          <Card className={`bg-gradient-to-r ${riskInfo.bgColor} border-l-4 border-${riskInfo.color}-500`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar name={gameStats.userId} size="xl" />
                <div>
                  <h2 className="text-2xl font-bold text-deepBlue mb-1">User: {gameStats.userId}</h2>
                  <p className="text-secondary mb-2">Last Session: {new Date(gameStats.lastSessionDate).toLocaleDateString()}</p>
                  <p className="text-sm text-secondary">Total Sessions: {gameStats.totalSessions}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${riskInfo.bgColor} ${riskInfo.textColor}`}>
                  {riskInfo.label}
                </span>
                <p className="text-sm text-secondary mt-2">Risk Score: {gameStats.recentRiskScore.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        )}

        {/* Cognitive Performance Summary */}
        {gameStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center bg-blue-50 border-t-4 border-blue-500">
              <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-secondary mb-1">Avg SAC Score</p>
              <p className="text-3xl font-bold text-blue-600">{gameStats.avgSAC.toFixed(4)}</p>
              <p className="text-xs text-secondary mt-1">Speed-Accuracy Composite</p>
            </Card>

            <Card className="text-center bg-purple-50 border-t-4 border-purple-500">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-secondary mb-1">Avg IES Score</p>
              <p className="text-3xl font-bold text-purple-600">{gameStats.avgIES.toFixed(4)}</p>
              <p className="text-xs text-secondary mt-1">Inverse Efficiency Score</p>
            </Card>

            <Card className="text-center bg-orange-50 border-t-4 border-orange-500">
              <Gamepad2 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-secondary mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-orange-600">{gameStats.totalSessions}</p>
              <p className="text-xs text-secondary mt-1">Games Completed</p>
            </Card>
          </div>
        )}

        {/* Module Summary Grid */}
        <div>
          <h2 className="text-2xl font-bold text-deepBlue mb-4">Care Modules</h2>
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
                      <div className={`w-12 h-12 ${module.color} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-deepBlue">{module.name}</h3>
                    </div>
                    <Button variant="ghost" size="sm">View Details →</Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(module.stats).map(([key, value]) => (
                      <div key={key} className="p-3 bg-secondaryBg rounded-lg">
                        <p className="text-xs text-secondary mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-lg font-bold text-deepBlue">{value}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Activity Summary */}
        {gameStats && (
          <Card>
            <h2 className="text-2xl font-bold text-deepBlue mb-6">Activity Summary</h2>

            <div className="space-y-6">
              {/* Performance Overview */}
              <div>
                <h3 className="text-lg font-semibold text-deepBlue mb-3">Cognitive Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 mb-1">SAC Score</p>
                    <p className="text-2xl font-bold text-blue-900">{gameStats.avgSAC.toFixed(4)}</p>
                    <p className="text-xs text-blue-700 mt-1">Speed-Accuracy</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800 mb-1">IES Score</p>
                    <p className="text-2xl font-bold text-purple-900">{gameStats.avgIES.toFixed(4)}</p>
                    <p className="text-xs text-purple-700 mt-1">Inverse Efficiency</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 mb-1">Total Sessions</p>
                    <p className="text-2xl font-bold text-green-900">{gameStats.totalSessions}</p>
                    <p className="text-xs text-green-700 mt-1">Games Completed</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${riskInfo.bgColor.replace('bg-', 'bg-').replace('-100', '-50')} border-${riskInfo.color}-200`}>
                    <p className={`text-sm mb-1 ${riskInfo.textColor}`}>Current Risk</p>
                    <p className={`text-2xl font-bold ${riskInfo.textColor}`}>{gameStats.currentRiskLevel}</p>
                    <p className={`text-xs mt-1 ${riskInfo.textColor}`}>{gameStats.recentRiskScore.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Key Highlights */}
              <div>
                <h3 className="text-lg font-semibold text-deepBlue mb-3">Care Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">✓ Activity Summary</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• {gameStats.totalSessions} cognitive game sessions completed</li>
                      <li>• Current risk level: {gameStats.currentRiskLevel}</li>
                      <li>• Last activity: {new Date(gameStats.lastSessionDate).toLocaleDateString()}</li>
                      <li>• Monitoring cognitive performance trends</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">📊 Care Recommendations</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Continue regular cognitive exercises</li>
                      <li>• Monitor performance patterns</li>
                      <li>• Maintain consistent activity schedule</li>
                      <li>• Review detailed analytics regularly</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quick Metrics */}
              {/* Quick Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-deepBlue mb-3">Quick Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-secondaryBg rounded-lg">
                    <p className="text-sm text-secondary mb-1">Total Sessions</p>
                    <p className="text-3xl font-bold text-deepBlue">{gameStats.totalSessions}</p>
                  </div>
                  <div className="text-center p-4 bg-secondaryBg rounded-lg">
                    <p className="text-sm text-secondary mb-1">Avg SAC</p>
                    <p className="text-3xl font-bold text-deepBlue">{gameStats.avgSAC.toFixed(3)}</p>
                  </div>
                  <div className="text-center p-4 bg-secondaryBg rounded-lg">
                    <p className="text-sm text-secondary mb-1">Avg IES</p>
                    <p className="text-3xl font-bold text-deepBlue">{gameStats.avgIES.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 bg-secondaryBg rounded-lg">
                    <p className="text-sm text-secondary mb-1">Risk Level</p>
                    <p className={`text-3xl font-bold ${riskInfo.textColor}`}>{gameStats.currentRiskLevel}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

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
