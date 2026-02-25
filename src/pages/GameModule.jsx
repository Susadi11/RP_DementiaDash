import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, TrendingUp, TrendingDown, Calendar, AlertCircle, Activity, Brain, Target, BarChart3 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { getUserStats, getSessionHistory, formatRiskLevel, formatDate } from '../services/api';

const GameModule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  
  // Hardcoded user ID for now - you can make this dynamic later
  const userId = 'user123';

  useEffect(() => {
    fetchGameData();
  }, []);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user stats and session history in parallel
      const [statsData, historyData] = await Promise.all([
        getUserStats(userId),
        getSessionHistory(userId, 10)
      ]);
      
      setStats(statsData);
      setSessions(historyData.sessions || []);
    } catch (err) {
      console.error('Error fetching game data:', err);
      setError(err.response?.data?.detail || 'Failed to load game data. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!stats || sessions.length === 0) {
      alert('No data available to download');
      return;
    }
    
    // Create report data
    const report = {
      userId: stats.userId,
      generatedAt: new Date().toISOString(),
      stats: stats,
      sessions: sessions,
    };
    
    // Create and download JSON file
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-report-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-secondary';
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary">Loading game data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-deepBlue mb-2">Error Loading Data</h2>
              <p className="text-secondary mb-4">{error}</p>
              <Button onClick={fetchGameData}>Retry</Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  // No data state
  if (!stats || sessions.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <div className="text-center">
              <Brain className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-deepBlue mb-2">No Game Data</h2>
              <p className="text-secondary mb-4">No game sessions found for this user. Start playing games to see analytics here.</p>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  const riskInfo = formatRiskLevel(stats.currentRiskLevel);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deepBlue mb-2">Cognitive Games Activity</h1>
            <p className="text-secondary">User ID: {stats.userId}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => navigate('/game/analytics')} 
              variant="outline"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Analytics</span>
            </Button>
            <Button onClick={handleDownloadReport} className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </Button>
          </div>
        </div>

        {/* User Overview */}
        <Card className={`bg-gradient-to-r ${riskInfo.bgColor} border-l-4 border-${riskInfo.color}-500`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Activity className="w-6 h-6 text-deepBlue" />
                <h2 className="text-xl font-bold text-deepBlue">Current Status</h2>
              </div>
              <p className="text-secondary">Last session: {formatDate(stats.lastSessionDate)}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${riskInfo.bgColor} ${riskInfo.textColor}`}>
                {riskInfo.label}
              </span>
              <p className="text-sm text-secondary mt-2">Risk Score: {stats.recentRiskScore.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="text-center bg-blue-50 border-t-4 border-blue-500">
            <div className="flex justify-center mb-2">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-secondary mb-1">Total Sessions</p>
            <p className="text-3xl font-bold text-deepBlue">{stats.totalSessions}</p>
          </Card>
          
          <Card className="text-center bg-green-50 border-t-4 border-green-500">
            <div className="flex justify-center mb-2">
              <Brain className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-secondary mb-1">Avg SAC Score</p>
            <p className="text-3xl font-bold text-green-600">{stats.avgSAC.toFixed(4)}</p>
            <p className="text-xs text-secondary mt-1">Speed-Accuracy</p>
          </Card>
          
          <Card className="text-center bg-purple-50 border-t-4 border-purple-500">
            <div className="flex justify-center mb-2">
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-secondary mb-1">Avg IES Score</p>
            <p className="text-3xl font-bold text-purple-600">{stats.avgIES.toFixed(4)}</p>
            <p className="text-xs text-secondary mt-1">Inverse Efficiency</p>
          </Card>
          
          <Card className="text-center bg-orange-50 border-t-4 border-orange-500">
            <div className="flex justify-center mb-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-sm text-secondary mb-1">Current Risk</p>
            <p className={`text-3xl font-bold ${riskInfo.textColor}`}>{stats.currentRiskLevel}</p>
            <p className="text-xs text-secondary mt-1">{stats.recentRiskScore.toFixed(1)}%</p>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card>
          <h3 className="text-xl font-bold text-deepBlue mb-4">Recent Game Sessions</h3>
          <div className="space-y-4">
            {sessions.map((session, idx) => {
              const sessionRisk = formatRiskLevel(session.riskLevel);
              return (
                <div key={session.sessionId} className={`p-4 rounded-lg border-l-4 ${sessionRisk.bgColor} border-${sessionRisk.color}-500`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-deepBlue">{session.gameType.replace('_', ' ').toUpperCase()}</h4>
                      <p className="text-sm text-secondary">{formatDate(session.timestamp)} | Level {session.level}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${sessionRisk.bgColor} ${sessionRisk.textColor}`}>
                        {sessionRisk.label}
                      </span>
                      <p className="text-xs text-secondary mt-1">Score: {session.riskScore.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-secondary mb-1">SAC Score</p>
                      <p className="text-lg font-bold text-deepBlue">{session.sac.toFixed(4)}</p>
                      <p className="text-xs text-secondary">Speed-Accuracy</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-secondary mb-1">IES Score</p>
                      <p className="text-lg font-bold text-deepBlue">{session.ies.toFixed(4)}</p>
                      <p className="text-xs text-secondary">Inverse Efficiency</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-secondary mb-1">Risk Level</p>
                      <p className={`text-lg font-bold ${sessionRisk.textColor}`}>{session.riskLevel}</p>
                      <p className="text-xs text-secondary">{session.riskScore.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Performance Insights */}
        <Card>
          <h3 className="text-xl font-bold text-deepBlue mb-4">Cognitive Metrics Explanation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                SAC (Speed-Accuracy Composite)
              </h4>
              <p className="text-sm text-blue-700 mb-2">
                Measures the balance between response speed and accuracy. Higher values indicate better cognitive performance.
              </p>
              <p className="text-xs text-blue-600">
                Your average: <strong>{stats.avgSAC.toFixed(4)}</strong>
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                IES (Inverse Efficiency Score)
              </h4>
              <p className="text-sm text-purple-700 mb-2">
                Evaluates task efficiency considering both speed and errors. Lower values indicate better performance.
              </p>
              <p className="text-xs text-purple-600">
                Your average: <strong>{stats.avgIES.toFixed(4)}</strong>
              </p>
            </div>
          </div>
        </Card>

        {/* Risk Assessment Info */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-orange-800 mb-2">About Risk Assessment</h4>
              <p className="text-sm text-orange-700 mb-2">
                The risk score is calculated using machine learning models that analyze your game performance patterns, 
                including speed-accuracy trade-offs, reaction times, and performance trends over time.
              </p>
              <ul className="text-sm text-orange-700 space-y-1">
                <li><strong>LOW:</strong> Performance indicators are within normal ranges</li>
                <li><strong>MEDIUM:</strong> Some indicators suggest monitoring is recommended</li>
                <li><strong>HIGH:</strong> Multiple indicators suggest consultation with healthcare provider</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default GameModule;
