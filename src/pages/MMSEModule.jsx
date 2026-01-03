import { Download, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { elderlyUsers, generateWeeklyReport } from '../data/mockData';

const MMSEModule = () => {
  const user = elderlyUsers[0];
  const weeklyReport = generateWeeklyReport(user.id);
  const cognitiveData = weeklyReport.cognitive;

  // MMSE Test sessions
  const mmseTests = [
    {
      id: 1,
      date: '2024-01-15',
      totalScore: 24,
      change: 2,
      categories: [
        { name: 'Orientation', score: 8, max: 10, change: 1 },
        { name: 'Registration', score: 3, max: 3, change: 0 },
        { name: 'Attention & Calculation', score: 4, max: 5, change: 0 },
        { name: 'Recall', score: 2, max: 3, change: 1 },
        { name: 'Language', score: 7, max: 9, change: 0 }
      ]
    },
    {
      id: 2,
      date: '2024-01-18',
      totalScore: 25,
      change: 1,
      categories: [
        { name: 'Orientation', score: 9, max: 10, change: 1 },
        { name: 'Registration', score: 3, max: 3, change: 0 },
        { name: 'Attention & Calculation', score: 4, max: 5, change: 0 },
        { name: 'Recall', score: 2, max: 3, change: 0 },
        { name: 'Language', score: 7, max: 9, change: 0 }
      ]
    }
  ];

  const handleDownloadReport = () => {
    alert('Downloading MMSE Module Weekly Report...');
  };

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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deepBlue mb-2">MMSE Cognitive Assessment</h1>
            <p className="text-secondary">Weekly cognitive test results and analysis</p>
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
              <p className="text-secondary">Age: {user.age} years | Status: {user.status}</p>
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
            <p className="text-sm text-secondary mb-1">Latest Score</p>
            <p className={`text-3xl font-bold ${getScoreColor(cognitiveData.latestScore)}`}>
              {cognitiveData.latestScore}/30
            </p>
            <p className="text-xs text-secondary mt-1">{getScoreStatus(cognitiveData.latestScore)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Week Change</p>
            <p className={`text-3xl font-bold ${cognitiveData.weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {cognitiveData.weekChange >= 0 ? '+' : ''}{cognitiveData.weekChange}
            </p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Tests Completed</p>
            <p className="text-3xl font-bold text-deepBlue">{mmseTests.length}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Test Frequency</p>
            <p className="text-3xl font-bold text-deepBlue">{cognitiveData.testFrequency}</p>
          </Card>
        </div>

        {/* MMSE Test Sessions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-deepBlue">Test Sessions This Week</h2>
          {mmseTests.map((test) => (
            <Card key={test.id} className="border-l-4 border-primary">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-deepBlue">Test #{test.id}</h3>
                  <p className="text-sm text-secondary">Date: {test.date}</p>
                </div>
                <div className="text-right">
                  <p className={`text-4xl font-bold ${getScoreColor(test.totalScore)}`}>{test.totalScore}/30</p>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    {getChangeIcon(test.change)}
                    <span className={`text-sm font-semibold ${getChangeColor(test.change)}`}>
                      {test.change > 0 ? '+' : ''}{test.change} vs last
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <h4 className="text-lg font-semibold text-deepBlue mb-4">Category Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {test.categories.map((category) => (
                  <div key={category.name} className="p-4 bg-secondaryBg rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-deepBlue">{category.name}</p>
                      <div className="flex items-center space-x-1">
                        {getChangeIcon(category.change)}
                        <span className={`text-xs font-semibold ${getChangeColor(category.change)}`}>
                          {category.change > 0 ? '+' : ''}{category.change !== 0 ? category.change : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-2xl font-bold text-deepBlue">{category.score}</p>
                      <p className="text-sm text-secondary">/ {category.max}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(category.score / category.max) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Performance Analysis */}
        <Card>
          <h3 className="text-xl font-bold text-deepBlue mb-4">Performance Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Strong orientation skills</li>
                <li>• Good language comprehension</li>
                <li>• Consistent registration ability</li>
              </ul>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">Areas for Improvement</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Memory recall exercises needed</li>
                <li>• Attention training recommended</li>
                <li>• Regular cognitive stimulation</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default MMSEModule;
