import { Brain } from 'lucide-react';
import ModuleCard from './ModuleCard';
import LineChart from '../charts/LineChart';

const CognitiveReport = ({ data }) => {
  const scoreHistory = data.scoreHistory.map((score, index) => ({
    week: `Week ${index + 1}`,
    score: score
  }));

  const getScoreColor = (score) => {
    if (score >= 24) return 'text-green-600';
    if (score >= 18) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score) => {
    if (score >= 24) return 'Normal';
    if (score >= 18) return 'Mild Impairment';
    return 'Moderate Impairment';
  };

  return (
    <ModuleCard title="Cognitive Assessment (MMSE)" icon={Brain}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Score */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-secondary mb-1">Latest Score</p>
            <div className="flex items-baseline space-x-2">
              <p className={`text-4xl font-bold ${getScoreColor(data.latestScore)}`}>
                {data.latestScore}
              </p>
              <p className="text-2xl text-secondary">/ 30</p>
            </div>
            <p className="text-sm font-medium text-secondary mt-1">
              {getScoreStatus(data.latestScore)}
            </p>
          </div>

          <div>
            <p className="text-sm text-secondary mb-1">Change from Last Week</p>
            <p className={`text-2xl font-bold ${data.weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.weekChange >= 0 ? '+' : ''}{data.weekChange}
            </p>
          </div>

          <div>
            <p className="text-sm text-secondary mb-1">Test Frequency</p>
            <p className="text-lg font-semibold text-gray-900">{data.testFrequency}</p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">Score Breakdown</p>
          <div className="space-y-3">
            {data.breakdown.map((category, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-secondary">{category.name}</span>
                  <span className="font-semibold text-gray-900">
                    {category.score}/{category.max}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(category.score / category.max) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score Trend */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-900 mb-3">Score Trend (Last 4 Weeks)</p>
        <LineChart
          data={scoreHistory}
          dataKey="score"
          xAxisKey="week"
          height={250}
        />
      </div>

      {/* Recommendations */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-900 mb-3">Recommendations</p>
        <ul className="space-y-2">
          {data.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-primary mt-1">•</span>
              <span className="text-sm text-secondary">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </ModuleCard>
  );
};

export default CognitiveReport;
