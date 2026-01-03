import { Download, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { elderlyUsers, generateWeeklyReport } from '../data/mockData';

const GameModule = () => {
  const user = elderlyUsers[0];
  const weeklyReport = generateWeeklyReport(user.id);
  const gamesData = weeklyReport.games;

  const handleDownloadReport = () => {
    alert('Downloading Game Module Weekly Report...');
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deepBlue mb-2">Cognitive Games Activity</h1>
            <p className="text-secondary">Weekly game performance and analytics</p>
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
            <p className="text-sm text-secondary mb-1">Games Played</p>
            <p className="text-3xl font-bold text-deepBlue">{gamesData.totalGamesPlayed}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Total Time</p>
            <p className="text-3xl font-bold text-deepBlue">{gamesData.totalTime} hrs</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Avg Performance</p>
            <p className={`text-3xl font-bold ${getPerformanceColor(gamesData.avgPerformance)}`}>
              {gamesData.avgPerformance}%
            </p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Improvement</p>
            <p className="text-3xl font-bold text-green-600">+8%</p>
          </Card>
        </div>

        {/* Game Session 1 */}
        <Card className="border-l-4 border-primary">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-deepBlue">Memory Match</h3>
              <p className="text-sm text-secondary">Date: 2024-01-15 | Duration: 15 minutes</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-secondary mb-1">Score</p>
              <p className="text-3xl font-bold text-green-600">85%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-secondaryBg rounded-lg">
              <p className="text-xs text-secondary mb-1">Accuracy</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-deepBlue">88%</p>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(5)}
                  <span className="text-sm font-semibold text-green-600">+5</span>
                </div>
              </div>
              <p className="text-xs text-secondary mt-1">vs last week</p>
            </div>
            <div className="p-4 bg-secondaryBg rounded-lg">
              <p className="text-xs text-secondary mb-1">Speed</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-deepBlue">75 sec</p>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(3)}
                  <span className="text-sm font-semibold text-green-600">+3</span>
                </div>
              </div>
              <p className="text-xs text-secondary mt-1">vs last week</p>
            </div>
            <div className="p-4 bg-secondaryBg rounded-lg">
              <p className="text-xs text-secondary mb-1">Focus</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-deepBlue">82%</p>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(4)}
                  <span className="text-sm font-semibold text-green-600">+4</span>
                </div>
              </div>
              <p className="text-xs text-secondary mt-1">vs last week</p>
            </div>
          </div>
        </Card>

        {/* Game Session 2 */}
        <Card className="border-l-4 border-primary">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-deepBlue">Word Puzzle</h3>
              <p className="text-sm text-secondary">Date: 2024-01-16 | Duration: 20 minutes</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-secondary mb-1">Score</p>
              <p className="text-3xl font-bold text-green-600">92%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-secondaryBg rounded-lg">
              <p className="text-xs text-secondary mb-1">Accuracy</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-deepBlue">94%</p>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(6)}
                  <span className="text-sm font-semibold text-green-600">+6</span>
                </div>
              </div>
              <p className="text-xs text-secondary mt-1">vs last week</p>
            </div>
            <div className="p-4 bg-secondaryBg rounded-lg">
              <p className="text-xs text-secondary mb-1">Vocabulary</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-deepBlue">95%</p>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(8)}
                  <span className="text-sm font-semibold text-green-600">+8</span>
                </div>
              </div>
              <p className="text-xs text-secondary mt-1">vs last week</p>
            </div>
            <div className="p-4 bg-secondaryBg rounded-lg">
              <p className="text-xs text-secondary mb-1">Focus</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-deepBlue">88%</p>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(6)}
                  <span className="text-sm font-semibold text-green-600">+6</span>
                </div>
              </div>
              <p className="text-xs text-secondary mt-1">vs last week</p>
            </div>
          </div>
        </Card>

        {/* Popular Games */}
        <Card>
          <h3 className="text-xl font-bold text-deepBlue mb-4">Popular Games This Week</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gamesData.games.map((game, idx) => (
              <div key={idx} className="p-4 bg-secondaryBg rounded-lg flex items-center justify-between">
                <span className="text-deepBlue font-medium">{game.name}</span>
                <span className="px-3 py-1 bg-primary text-white rounded-full text-sm">
                  {game.sessionsPlayed} plays
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance Insights */}
        <Card>
          <h3 className="text-xl font-bold text-deepBlue mb-4">Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strong Areas</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Excellent pattern recognition</li>
                <li>• High vocabulary scores</li>
                <li>• Consistent completion rates</li>
              </ul>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">Recommendations</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• More number sequence games</li>
                <li>• Increase game difficulty gradually</li>
                <li>• Focus on speed improvement</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default GameModule;
