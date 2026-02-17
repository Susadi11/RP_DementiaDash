import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { elderlyUsers } from '../data/mockData';

const ElderlyUsersList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = elderlyUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCognitiveScoreColor = (score) => {
    if (score >= 24) return 'text-green-600';
    if (score >= 18) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deepBlue mb-2">Elderly Users</h1>
            <p className="text-secondary">Manage and monitor all elderly users in your care</p>
          </div>
          <Button variant="primary">Add New User</Button>
        </div>

        {/* Search and Filter Bar */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-secondary" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-secondary">
              Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{elderlyUsers.length}</span> users
            </p>
          </div>
        </Card>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card
              key={user.id}
              className="hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
              onClick={() => navigate(`/users/${user.id}`)}
            >
              <div className="flex items-start space-x-4">
                <Avatar name={user.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg truncate">{user.name}</h3>
                      <p className="text-sm text-secondary">Age: {user.age}</p>
                    </div>
                    <Badge variant={user.status === 'active' ? 'active' : 'inactive'} size="sm">
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary">Last Activity</span>
                  <span className="text-sm font-medium text-gray-900">{user.lastActivity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary">Cognitive Score</span>
                  <span className={`text-sm font-bold ${getCognitiveScoreColor(user.cognitiveScore)}`}>
                    {user.cognitiveScore}/30
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary">Total Sessions</span>
                  <span className="text-sm font-medium text-gray-900">{user.totalSessions}</span>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/users/${user.id}/reports`);
                  }}
                >
                  View Reports
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No users found</h3>
            <p className="text-secondary">Try adjusting your search or filter criteria</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ElderlyUsersList;
