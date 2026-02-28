import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Brain, TrendingUp, Clock, AlertTriangle, Lightbulb } from 'lucide-react';
import Card from '../common/Card';
import { getBehaviorAnalysis } from '../../services/api';

/**
 * Behavior Analysis Component
 * Displays ML-powered behavior insights and cognitive risk assessment
 */
const BehaviorAnalysis = ({ patientId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days] = useState(30);

  useEffect(() => {
    fetchBehaviorAnalysis();
  }, [patientId, days]);

  const fetchBehaviorAnalysis = async () => {
    try {
      setLoading(true);
      const data = await getBehaviorAnalysis(patientId, days);
      if (data.success) {
        setAnalysis(data);
      }
    } catch (err) {
      console.error('Failed to fetch behavior analysis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get risk level color
  const getRiskLevelColor = (level) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-300',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      critical: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[level] || colors.moderate;
  };

  // Get risk icon color
  const getRiskIconColor = (level) => {
    const colors = {
      low: 'text-green-600',
      moderate: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[level] || colors.moderate;
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-600">Error loading behavior analysis: {error}</p>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <div className="text-center py-8">
          <Brain className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No behavior data available</p>
        </div>
      </Card>
    );
  }

  const { behavior_summary, cognitive_assessment, timing_analysis, insights } = analysis;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-purple-600" />
          ML-Powered Behavior Analysis
        </h2>
        <span className="text-sm text-gray-600">{analysis.analysis_period_days} days</span>
      </div>

      {/* Cognitive Risk Assessment */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cognitive Risk Assessment</h3>
            <div className="flex items-center space-x-3">
              <div className="text-3xl font-bold text-purple-700">
                {(cognitive_assessment.avg_risk_score * 100).toFixed(1)}%
              </div>
              <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${getRiskLevelColor(cognitive_assessment.risk_level)}`}>
                {cognitive_assessment.risk_level.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Trend: <span className="font-medium">{cognitive_assessment.confusion_trend}</span>
            </p>
          </div>
          <AlertTriangle className={`w-12 h-12 ${getRiskIconColor(cognitive_assessment.risk_level)}`} />
        </div>
        
        {cognitive_assessment.escalation_recommended && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Escalation recommended - Consider immediate caregiver intervention
            </p>
          </div>
        )}
      </Card>

      {/* Behavior Summary */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interaction Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{behavior_summary.total_reminders}</div>
            <div className="text-xs text-gray-600">Total Reminders</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{behavior_summary.confirmed_count}</div>
            <div className="text-xs text-gray-600">Confirmed</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{behavior_summary.ignored_count}</div>
            <div className="text-xs text-gray-600">Ignored</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{behavior_summary.confused_count}</div>
            <div className="text-xs text-gray-600">Confused</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">{behavior_summary.delayed_count}</div>
            <div className="text-xs text-gray-600">Delayed</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {behavior_summary.avg_response_time_seconds?.toFixed(0) || 0}s
            </div>
            <div className="text-xs text-gray-600">Avg Response</div>
          </div>
        </div>
      </Card>

      {/* Timing Analysis */}
      {timing_analysis && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Optimal Timing
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Best Response Hour</span>
              <span className="text-lg font-bold text-green-700">
                {timing_analysis.optimal_hour}:00
              </span>
            </div>
            {timing_analysis.worst_hours && timing_analysis.worst_hours.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Worst Response Hours</span>
                <span className="text-lg font-bold text-red-700">
                  {timing_analysis.worst_hours.join(':00, ')}:00
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ML Insights */}
      {insights && insights.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
            AI-Generated Insights
          </h3>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-white rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

BehaviorAnalysis.propTypes = {
  patientId: PropTypes.string.isRequired
};

export default BehaviorAnalysis;
