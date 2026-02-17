import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Save } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { elderlyUsers, generateWeeklyReport } from '../data/mockData';

const FinalReport = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [caregiverNotes, setCaregiverNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

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

  const handleSaveNotes = () => {
    setIsEditingNotes(false);
    // In production, this would save to backend
  };

  const getOverallRating = (score) => {
    if (score >= 85) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 55) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Needs Attention', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const rating = getOverallRating(weeklyReport.overallScore);

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between print:hidden">
          <Button
            variant="ghost"
            onClick={() => navigate(`/users/${userId}/reports`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reports</span>
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" className="flex items-center space-x-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </Button>
            <Button className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </Button>
          </div>
        </div>

        {/* Report Header */}
        <Card className="print:shadow-none">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-deepBlue mb-2">Comprehensive Weekly Report</h1>
            <p className="text-secondary">Week Ending: {weeklyReport.weekEnding}</p>
          </div>

          <div className="flex items-center justify-between border-t border-b border-border py-6">
            <div className="flex items-center space-x-4">
              <Avatar name={user.name} size="xl" />
              <div>
                <h2 className="text-2xl font-bold text-deepBlue">{user.name}</h2>
                <p className="text-secondary">Age: {user.age} years</p>
                <p className="text-sm text-secondary">ID: {user.id} | Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-xl ${rating.bg} mb-2`}>
                <p className="text-sm text-secondary">Overall Rating</p>
                <p className={`text-2xl font-bold ${rating.color}`}>{rating.label}</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">{weeklyReport.overallScore}/100</p>
            </div>
          </div>
        </Card>

        {/* Executive Summary */}
        <Card>
          <h2 className="text-2xl font-bold text-deepBlue mb-4">Executive Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-secondary mb-1">Chat Sessions</p>
              <p className="text-3xl font-bold text-primary">{weeklyReport.chat.totalConversations}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-sm text-secondary mb-1">Cognitive Score</p>
              <p className="text-3xl font-bold text-purple-600">{weeklyReport.cognitive.latestScore}/30</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-secondary mb-1">Games Played</p>
              <p className="text-3xl font-bold text-green-600">{weeklyReport.games.totalGamesPlayed}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-sm text-secondary mb-1">Medication Adherence</p>
              <p className="text-3xl font-bold text-orange-600">{weeklyReport.reminders.complianceRate}%</p>
            </div>
          </div>
          <p className="text-secondary leading-relaxed">
            This week, {user.name.split(' ')[0]} showed {rating.label.toLowerCase()} overall engagement and performance across all care modules.
            The cognitive assessment indicates {weeklyReport.cognitive.latestScore >= 24 ? 'normal cognitive function' : 'some cognitive challenges'} with a score of {weeklyReport.cognitive.latestScore}/30.
            Medication adherence was at {weeklyReport.reminders.complianceRate}%, which requires {weeklyReport.reminders.complianceRate >= 80 ? 'continued monitoring' : 'immediate attention'}.
          </p>
        </Card>

        {/* Module Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat & Conversation */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary p-3 rounded-xl">
                <span className="text-white text-xl">💬</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Chat & Conversation</h3>
                <p className="text-sm text-secondary">Social Engagement Analysis</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary">Total Conversations</span>
                <span className="font-bold text-gray-900">{weeklyReport.chat.totalConversations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Avg. Length</span>
                <span className="font-bold text-gray-900">{weeklyReport.chat.avgLength} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Primary Topics</span>
                <span className="font-bold text-gray-900">{weeklyReport.chat.commonTopics.slice(0,2).join(', ')}</span>
              </div>
            </div>
          </Card>

          {/* Cognitive Assessment */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary p-3 rounded-xl">
                <span className="text-white text-xl">🧠</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cognitive Assessment</h3>
                <p className="text-sm text-secondary">MMSE Evaluation</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary">Latest Score</span>
                <span className="font-bold text-gray-900">{weeklyReport.cognitive.latestScore}/30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Week Change</span>
                <span className={`font-bold ${weeklyReport.cognitive.weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {weeklyReport.cognitive.weekChange >= 0 ? '+' : ''}{weeklyReport.cognitive.weekChange}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Test Frequency</span>
                <span className="font-bold text-gray-900">{weeklyReport.cognitive.testFrequency}</span>
              </div>
            </div>
          </Card>

          {/* Game Activity */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary p-3 rounded-xl">
                <span className="text-white text-xl">🎮</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cognitive Games</h3>
                <p className="text-sm text-secondary">Game Activity & Performance</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary">Games Played</span>
                <span className="font-bold text-gray-900">{weeklyReport.games.totalGamesPlayed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Total Time</span>
                <span className="font-bold text-gray-900">{weeklyReport.games.totalTime} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Avg. Performance</span>
                <span className="font-bold text-green-600">{weeklyReport.games.avgPerformance}%</span>
              </div>
            </div>
          </Card>

          {/* Reminders & Medication */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary p-3 rounded-xl">
                <span className="text-white text-xl">💊</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Medication & Reminders</h3>
                <p className="text-sm text-secondary">Adherence Tracking</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary">Compliance Rate</span>
                <span className={`font-bold ${weeklyReport.reminders.complianceRate >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                  {weeklyReport.reminders.complianceRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Completed</span>
                <span className="font-bold text-green-600">{weeklyReport.reminders.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Missed</span>
                <span className="font-bold text-red-600">{weeklyReport.reminders.missed}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <h2 className="text-2xl font-bold text-deepBlue mb-4">Recommendations & Action Items</h2>
          <div className="space-y-2">
            {weeklyReport.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-secondaryBg rounded-lg">
                <Badge variant="primary" size="sm">{index + 1}</Badge>
                <p className="text-secondary flex-1">{rec}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Caregiver Notes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-deepBlue">Caregiver Notes</h2>
            {!isEditingNotes ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(true)}>
                Edit Notes
              </Button>
            ) : (
              <Button size="sm" onClick={handleSaveNotes} className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save</span>
              </Button>
            )}
          </div>
          {isEditingNotes ? (
            <textarea
              value={caregiverNotes}
              onChange={(e) => setCaregiverNotes(e.target.value)}
              placeholder="Add your observations, concerns, or notes about this week..."
              className="w-full h-32 p-4 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            />
          ) : (
            <div className="p-4 bg-secondaryBg rounded-xl min-h-[100px]">
              {caregiverNotes || (
                <p className="text-secondary italic">No notes added yet. Click "Edit Notes" to add your observations.</p>
              )}
            </div>
          )}
        </Card>

        {/* Footer */}
        <Card className="print:hidden">
          <div className="flex justify-between items-center">
            <p className="text-sm text-secondary">
              Report generated on {new Date().toLocaleDateString()} for week ending {weeklyReport.weekEnding}
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => navigate(`/users/${userId}`)}>
                Back to Profile
              </Button>
              <Button onClick={() => navigate(`/users/${userId}/reports`)}>
                View Detailed Reports
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default FinalReport;
