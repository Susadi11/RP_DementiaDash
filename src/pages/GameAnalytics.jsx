import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertCircle, Activity, Target, Clock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import LineChart from '../components/charts/LineChart';
import { getSessionHistory, getRiskHistory, formatRiskLevel, formatDate } from '../services/api';

const GameAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [riskHistory, setRiskHistory] = useState([]);
  
  // Hardcoded user ID for now
  const userId = 'user123';

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [sessionsData, riskData] = await Promise.all([
        getSessionHistory(userId, 50),
        getRiskHistory(userId)
      ]);
      
      setSessions(sessionsData.sessions || []);
      setRiskHistory(riskData.history || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.detail || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!sessions || sessions.length === 0) return null;

    // Sort by timestamp
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    return {
      sacData: {
        labels: sortedSessions.map((s, i) => `Session ${i + 1}`),
        datasets: [{
          label: 'SAC Score',
          data: sortedSessions.map(s => s.sac),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
        }]
      },
      iesData: {
        labels: sortedSessions.map((s, i) => `Session ${i + 1}`),
        datasets: [{
          label: 'IES Score',
          data: sortedSessions.map(s => s.ies),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.3,
        }]
      },
      riskData: {
        labels: sortedSessions.map((s, i) => `Session ${i + 1}`),
        datasets: [{
          label: 'Risk Score (%)',
          data: sortedSessions.map(s => s.riskScore),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
        }]
      }
    };
  };

  const chartData = prepareChartData();

  // Calculate statistics
  const calculateStats = () => {
    if (!sessions || sessions.length === 0) return null;

    const sacValues = sessions.map(s => s.sac);
    const iesValues = sessions.map(s => s.ies);
    const riskScores = sessions.map(s => s.riskScore);

    const calculateTrend = (values) => {
      if (values.length < 2) return 0;
      const half = Math.floor(values.length / 2);
      const firstHalf = values.slice(0, half);
      const secondHalf = values.slice(half);
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      return ((avgSecond - avgFirst) / avgFirst * 100).toFixed(1);
    };

    return {
      avgSac: (sacValues.reduce((a, b) => a + b, 0) / sacValues.length).toFixed(4),
      avgIes: (iesValues.reduce((a, b) => a + b, 0) / iesValues.length).toFixed(4),
      avgRisk: (riskScores.reduce((a, b) => a + b, 0) / riskScores.length).toFixed(1),
      sacTrend: calculateTrend(sacValues),
      iesTrend: calculateTrend(iesValues),
      riskTrend: calculateTrend(riskScores),
    };
  };

  const stats = calculateStats();

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <Card className="max-w-md mx-auto mt-20">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-deepBlue mb-2">Error Loading Analytics</h2>
            <p className="text-secondary">{error}</p>
          </div>
        </Card>
      </Layout>
    );
  }

  // No data state
  if (!sessions || sessions.length === 0) {
    return (
      <Layout>
        <Card className="max-w-md mx-auto mt-20">
          <div className="text-center">
            <Brain className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-deepBlue mb-2">No Analytics Data</h2>
            <p className="text-secondary">Start playing games to see detailed analytics.</p>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-deepBlue mb-2">Game Performance Analytics</h1>
          <p className="text-secondary">Detailed cognitive performance trends and insights</p>
        </div>

        {/* Summary Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-t-4 border-blue-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Brain className="w-6 h-6 text-blue-600" />
                  <h3 className="font-bold text-deepBlue">SAC Score</h3>
                </div>
                <span className={`text-xs font-semibold ${parseFloat(stats.sacTrend) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(stats.sacTrend) >= 0 ? '↑' : '↓'} {Math.abs(stats.sacTrend)}%
                </span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{stats.avgSac}</p>
              <p className="text-sm text-secondary mt-1">Average Speed-Accuracy</p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-t-4 border-purple-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-purple-600" />
                  <h3 className="font-bold text-deepBlue">IES Score</h3>
                </div>
                <span className={`text-xs font-semibold ${parseFloat(stats.iesTrend) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(stats.iesTrend) <= 0 ? '↓' : '↑'} {Math.abs(stats.iesTrend)}%
                </span>
              </div>
              <p className="text-3xl font-bold text-purple-600">{stats.avgIes}</p>
              <p className="text-sm text-secondary mt-1">Average Inverse Efficiency</p>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-t-4 border-orange-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  <h3 className="font-bold text-deepBlue">Risk Score</h3>
                </div>
                <span className={`text-xs font-semibold ${parseFloat(stats.riskTrend) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(stats.riskTrend) <= 0 ? '↓' : '↑'} {Math.abs(stats.riskTrend)}%
                </span>
              </div>
              <p className="text-3xl font-bold text-orange-600">{stats.avgRisk}%</p>
              <p className="text-sm text-secondary mt-1">Average Risk Percentage</p>
            </Card>
          </div>
        )}

        {/* Charts */}
        {chartData && (
          <>
            <Card>
              <h3 className="text-xl font-bold text-deepBlue mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                SAC Score Trend
              </h3>
              <p className="text-sm text-secondary mb-4">
                Speed-Accuracy Composite measures the balance between response speed and accuracy. 
                Higher values indicate better cognitive performance.
              </p>
              <LineChart data={chartData.sacData} />
            </Card>

            <Card>
              <h3 className="text-xl font-bold text-deepBlue mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                IES Score Trend
              </h3>
              <p className="text-sm text-secondary mb-4">
                Inverse Efficiency Score evaluates task efficiency. Lower values indicate better performance 
                (faster responses with fewer errors).
              </p>
              <LineChart data={chartData.iesData} />
            </Card>

            <Card>
              <h3 className="text-xl font-bold text-deepBlue mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Risk Score Trend
              </h3>
              <p className="text-sm text-secondary mb-4">
                Risk assessment based on multiple cognitive indicators. Lower scores are better.
              </p>
              <LineChart data={chartData.riskData} />
            </Card>
          </>
        )}

        {/* Recent Risk Predictions */}
        {riskHistory && riskHistory.length > 0 && (
          <Card>
            <h3 className="text-xl font-bold text-deepBlue mb-4">Risk Prediction History</h3>
            <div className="space-y-3">
              {riskHistory.slice(0, 5).map((prediction, idx) => {
                const riskInfo = formatRiskLevel(prediction.prediction.label);
                return (
                  <div key={idx} className={`p-4 rounded-lg border-l-4 ${riskInfo.bgColor} border-${riskInfo.color}-500`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${riskInfo.bgColor} ${riskInfo.textColor}`}>
                          {riskInfo.label}
                        </span>
                        <p className="text-sm text-secondary mt-1">
                          {formatDate(prediction.created_at)} | Window: {prediction.window_size} sessions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-deepBlue">{prediction.prediction.risk_score_0_100.toFixed(1)}%</p>
                        <p className="text-xs text-secondary">Risk Score</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-secondary">LOW:</span>
                        <span className="ml-1 font-semibold">{(prediction.prediction.prob_low * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-secondary">MEDIUM:</span>
                        <span className="ml-1 font-semibold">{(prediction.prediction.prob_medium * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-secondary">HIGH:</span>
                        <span className="ml-1 font-semibold">{(prediction.prediction.prob_high * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Session Details Table */}
        <Card>
          <h3 className="text-xl font-bold text-deepBlue mb-4">Session Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondaryBg">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-deepBlue">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-deepBlue">Game Type</th>
                  <th className="px-4 py-3 text-center font-semibold text-deepBlue">Level</th>
                  <th className="px-4 py-3 text-center font-semibold text-deepBlue">SAC</th>
                  <th className="px-4 py-3 text-center font-semibold text-deepBlue">IES</th>
                  <th className="px-4 py-3 text-center font-semibold text-deepBlue">Risk</th>
                  <th className="px-4 py-3 text-center font-semibold text-deepBlue">Risk %</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 20).map((session, idx) => {
                  const riskInfo = formatRiskLevel(session.riskLevel);
                  return (
                    <tr key={session.sessionId} className={idx % 2 === 0 ? 'bg-white' : 'bg-secondaryBg'}>
                      <td className="px-4 py-3 text-secondary">{formatDate(session.timestamp)}</td>
                      <td className="px-4 py-3 text-deepBlue">{session.gameType.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-center text-deepBlue">{session.level}</td>
                      <td className="px-4 py-3 text-center text-deepBlue font-mono">{session.sac.toFixed(4)}</td>
                      <td className="px-4 py-3 text-center text-deepBlue font-mono">{session.ies.toFixed(4)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${riskInfo.bgColor} ${riskInfo.textColor}`}>
                          {session.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-deepBlue font-mono">{session.riskScore.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default GameAnalytics;
