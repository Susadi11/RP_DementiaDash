import { useNavigate } from 'react-router-dom';
import { Calendar, User, TrendingUp, AlertCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import { elderlyUsers, generateWeeklyReport } from '../data/mockData';

const Reports = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-deepBlue mb-2">All Reports</h1>
          <p className="text-secondary">View and manage weekly reports for all elderly users</p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 gap-6">
          {elderlyUsers.map((user) => {
            const report = generateWeeklyReport(user.id);

            return (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-4">
                    <Avatar name={user.name} size="lg" />
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-bold text-deepBlue">{user.name}</h3>
                        <Badge variant={user.status === 'active' ? 'active' : 'inactive'}>
                          {user.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-secondary">Age: {user.age} years</p>
                      <p className="text-xs text-secondary">Last Activity: {user.lastActivity}</p>
                    </div>
                  </div>

                  {/* Report Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                    <div className="text-center p-3 bg-secondaryBg rounded-lg">
                      <p className="text-xs text-secondary mb-1">Overall Score</p>
                      <p className="text-2xl font-bold text-deepBlue">{report.overallScore}</p>
                    </div>
                    <div className="text-center p-3 bg-secondaryBg rounded-lg">
                      <p className="text-xs text-secondary mb-1">Cognitive</p>
                      <p className="text-2xl font-bold text-secondary">{report.cognitive.latestScore}/30</p>
                    </div>
                    <div className="text-center p-3 bg-secondaryBg rounded-lg">
                      <p className="text-xs text-secondary mb-1">Games Played</p>
                      <p className="text-2xl font-bold text-secondary">{report.games.totalGamesPlayed}</p>
                    </div>
                    <div className="text-center p-3 bg-secondaryBg rounded-lg">
                      <p className="text-xs text-secondary mb-1">Adherence</p>
                      <p className={`text-2xl font-bold ${report.reminders.complianceRate >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                        {report.reminders.complianceRate}%
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/users/${user.id}/reports`)}
                    >
                      View Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/users/${user.id}/final-report`)}
                    >
                      Final Report
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card className="text-center">
            <User className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-secondary mb-1">Total Users</p>
            <p className="text-3xl font-bold text-deepBlue">{elderlyUsers.length}</p>
          </Card>
          <Card className="text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-secondary mb-1">Active Users</p>
            <p className="text-3xl font-bold text-deepBlue">
              {elderlyUsers.filter(u => u.status === 'active').length}
            </p>
          </Card>
          <Card className="text-center">
            <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-secondary mb-1">Reports Generated</p>
            <p className="text-3xl font-bold text-deepBlue">{elderlyUsers.length}</p>
          </Card>
          <Card className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-secondary mb-1">Needs Attention</p>
            <p className="text-3xl font-bold text-deepBlue">
              {elderlyUsers.filter(u => {
                const r = generateWeeklyReport(u.id);
                return r.reminders.complianceRate < 80;
              }).length}
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
