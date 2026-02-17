import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Activity } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import StatCard from '../components/common/StatCard';
import { elderlyUsers, generateWeeklyReport } from '../data/mockData';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: 'Weekly Reports' },
    { id: 'health', label: 'Health Data' }
  ];

  const getCognitiveScoreColor = (score) => {
    if (score >= 24) return 'text-green-600';
    if (score >= 18) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/users')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users</span>
        </Button>

        {/* Header Section */}
        <Card className="bg-primary/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <Avatar name={user.name} size="xl" />
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-deepBlue">{user.name}</h1>
                  <Badge variant={user.status === 'active' ? 'active' : 'inactive'}>
                    {user.status}
                  </Badge>
                </div>
                <p className="text-secondary text-lg mb-3">Age: {user.age} years</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-secondary">
                    <Mail className="w-4 h-4" />
                    <span>{user.contact.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-secondary">
                    <Phone className="w-4 h-4" />
                    <span>{user.contact.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-secondary">
                    <MapPin className="w-4 h-4" />
                    <span>{user.contact.address.split(',')[0]}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => navigate(`/users/${userId}/reports`)}>
                View Weekly Reports
              </Button>
              <Button variant="outline" onClick={() => navigate(`/users/${userId}/final-report`)}>
                Final Report
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Cognitive Score"
            value={`${user.cognitiveScore}/30`}
            icon={Activity}
          />
          <StatCard
            title="Total Sessions"
            value={user.totalSessions}
            icon={Calendar}
          />
          <StatCard
            title="Last Login"
            value={user.lastLogin}
          />
          <StatCard
            title="Engagement"
            value="92%"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondaryBg rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Completed MMSE Assessment</p>
                      <p className="text-sm text-secondary">Score: {weeklyReport.cognitive.latestScore}/30</p>
                    </div>
                    <span className="text-xs text-secondary">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondaryBg rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Played Memory Match</p>
                      <p className="text-sm text-secondary">Score: 85%</p>
                    </div>
                    <span className="text-xs text-secondary">5 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondaryBg rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Conversation Session</p>
                      <p className="text-sm text-secondary">Duration: 15 minutes</p>
                    </div>
                    <span className="text-xs text-secondary">1 day ago</span>
                  </div>
                </div>
              </Card>

              {/* Weekly Summary */}
              <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-4">This Week Summary</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-secondary">Chat Sessions</span>
                      <span className="font-semibold text-gray-900">{weeklyReport.chat.totalConversations}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-secondary">Games Played</span>
                      <span className="font-semibold text-gray-900">{weeklyReport.games.totalGamesPlayed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-secondary">Medication Adherence</span>
                      <span className="font-semibold text-green-600">{weeklyReport.reminders.complianceRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: `${weeklyReport.reminders.complianceRate}%`}}></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'reports' && (
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Weekly Reports</h3>
              <p className="text-secondary mb-4">View detailed weekly reports for this user</p>
              <Button onClick={() => navigate(`/users/${userId}/reports`)}>
                Go to Weekly Reports
              </Button>
            </Card>
          )}

          {activeTab === 'health' && (
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Health Data</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Current Medications</h4>
                  <div className="space-y-2">
                    {weeklyReport.reminders.medications.map((med, index) => (
                      <div key={index} className="p-3 bg-secondaryBg rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{med.name}</p>
                            <p className="text-sm text-secondary">{med.dosage} - {med.frequency}</p>
                            <p className="text-xs text-secondary mt-1">Times: {med.times.join(', ')}</p>
                          </div>
                          <Badge variant={med.adherence >= 80 ? 'success' : 'warning'}>
                            {med.adherence}% adherence
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
