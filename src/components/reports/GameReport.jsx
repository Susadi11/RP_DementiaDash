import { Gamepad2 } from 'lucide-react';
import ModuleCard from './ModuleCard';
import BarChart from '../charts/BarChart';

const GameReport = ({ data }) => {
  const gameData = data.games.map(game => ({
    name: game.name,
    sessions: game.sessionsPlayed
  }));

  return (
    <ModuleCard title="Game Activity & Cognitive Games" icon={Gamepad2}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Key Metrics */}
        <div>
          <p className="text-sm text-secondary mb-1">Games Played</p>
          <p className="text-3xl font-bold text-deepBlue">{data.totalGamesPlayed}</p>
        </div>
        <div>
          <p className="text-sm text-secondary mb-1">Total Time</p>
          <p className="text-3xl font-bold text-deepBlue">{data.totalTime} hrs</p>
        </div>
        <div>
          <p className="text-sm text-secondary mb-1">Avg. Performance</p>
          <p className="text-3xl font-bold text-green-600">{data.avgPerformance}%</p>
        </div>
      </div>

      {/* Games Chart */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-deepBlue mb-3">Sessions by Game</p>
        <BarChart
          data={gameData}
          dataKey="sessions"
          xAxisKey="name"
          height={250}
        />
      </div>

      {/* Individual Game Performance */}
      <div>
        <p className="text-sm font-semibold text-deepBlue mb-3">Game Performance Details</p>
        <div className="space-y-3">
          {data.games.map((game, index) => (
            <div key={index} className="p-4 bg-secondaryBg rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-deepBlue">{game.name}</p>
                  <p className="text-sm text-secondary">{game.sessionsPlayed} sessions</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{game.avgScore}%</p>
                  <p className="text-xs text-secondary">Avg. Score</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-secondary">Best Time:</span>
                <span className="font-medium text-deepBlue">{game.bestTime}</span>
                <span className={`ml-auto ${game.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {game.improvement >= 0 ? '↑' : '↓'} {Math.abs(game.improvement)}% improvement
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-primary/20">
        <p className="text-sm font-semibold text-deepBlue mb-2">Engagement Insights</p>
        <p className="text-sm text-secondary">{data.engagementInsight}</p>
      </div>
    </ModuleCard>
  );
};

export default GameReport;
