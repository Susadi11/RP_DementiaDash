import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Download } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import ChatReport from '../components/reports/ChatReport';
import CognitiveReport from '../components/reports/CognitiveReport';
import GameReport from '../components/reports/GameReport';
import ReminderReport from '../components/reports/ReminderReport';
import { elderlyUsers, generateWeeklyReport } from '../data/mockData';

const WeeklyReports = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const user = elderlyUsers.find(u => u.id === parseInt(userId));
  const weeklyReport = generateWeeklyReport(parseInt(userId));

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
          <Button className="mt-4" onClick={() => navigate('/users')}>
            Back to Users
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(`/users/${userId}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </Button>
        </div>

        {/* User Info Card */}
        <Card className="bg-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar name={user.name} size="lg" />
              <div>
                <h1 className="text-2xl font-bold text-deepBlue">{user.name}</h1>
                <p className="text-secondary">Age: {user.age} | Weekly Report</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-secondary">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Week Ending: {weeklyReport.weekEnding}</span>
              </div>
              <p className="text-sm text-secondary mt-1">Generated: Today</p>
            </div>
          </div>
        </Card>

        {/* Overall Score */}
        <Card className="bg-primary text-white">
          <div className="text-center">
            <p className="text-white/80 mb-2">Overall Weekly Score</p>
            <p className="text-6xl font-bold mb-2">{weeklyReport.overallScore}</p>
            <p className="text-white/80">out of 100</p>
          </div>
        </Card>

        {/* Module Reports Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Module 1: Chat & Conversation */}
          <ChatReport data={weeklyReport.chat} />

          {/* Module 2: Cognitive Assessment */}
          <CognitiveReport data={weeklyReport.cognitive} />

          {/* Module 3: Game Activity */}
          <GameReport data={weeklyReport.games} />

          {/* Module 4: Reminders & Medication */}
          <ReminderReport data={weeklyReport.reminders} />
        </div>

        {/* Week Comparison */}
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Week-over-Week Comparison</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-secondaryBg rounded-lg">
              <p className="text-sm text-secondary mb-1">Chat Activity</p>
              <p className="text-2xl font-bold text-green-600">{weeklyReport.weekComparison.chatActivity}</p>
            </div>
            <div className="p-4 bg-secondaryBg rounded-lg">
              <p className="text-sm text-secondary mb-1">Cognitive Score</p>
              <p className="text-2xl font-bold text-green-600">{weeklyReport.weekComparison.cognitiveScore}</p>
            </div>
            <div className="p-4 bg-secondaryBg rounded-lg">
              <p className="text-sm text-secondary mb-1">Game Engagement</p>
              <p className="text-2xl font-bold text-green-600">{weeklyReport.weekComparison.gameEngagement}</p>
            </div>
            <div className="p-4 bg-secondaryBg rounded-lg">
              <p className="text-sm text-secondary mb-1">Medication Adherence</p>
              <p className="text-2xl font-bold text-red-600">{weeklyReport.weekComparison.medicationAdherence}</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate(`/users/${userId}`)}>
            Back to Profile
          </Button>
          <Button onClick={() => navigate(`/users/${userId}/final-report`)}>
            View Final Report
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default WeeklyReports;
