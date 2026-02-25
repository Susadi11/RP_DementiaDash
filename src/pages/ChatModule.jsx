import { Download, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { elderlyUsers, generateWeeklyReport } from '../data/mockData';

const ChatModule = () => {
  // Using first user for demo - in real app, this would be selected
  const user = elderlyUsers[0];
  const weeklyReport = generateWeeklyReport(user.id);
  const chatData = weeklyReport.chat;

  // Generate chat sessions data
  const chatSessions = [
    {
      id: 1,
      date: '2024-01-15',
      duration: 24,
      parameters: {
        'Response Time': { score: 85, change: 5, unit: '%' },
        'Coherence': { score: 78, change: -2, unit: '%' },
        'Engagement': { score: 92, change: 8, unit: '%' },
        'Vocabulary': { score: 88, change: 3, unit: 'words' },
        'Sentence Length': { score: 15, change: 2, unit: 'words' },
        'Topic Retention': { score: 82, change: 4, unit: '%' },
        'Emotional Tone': { score: 75, change: 0, unit: '%' },
        'Question Response': { score: 90, change: 5, unit: '%' },
        'Memory Recall': { score: 80, change: -3, unit: '%' },
        'Attention Span': { score: 85, change: 6, unit: 'min' },
        'Social Cues': { score: 88, change: 2, unit: '%' },
        'Comprehension': { score: 86, change: 4, unit: '%' }
      }
    },
    {
      id: 2,
      date: '2024-01-17',
      duration: 28,
      parameters: {
        'Response Time': { score: 88, change: 3, unit: '%' },
        'Coherence': { score: 82, change: 4, unit: '%' },
        'Engagement': { score: 95, change: 3, unit: '%' },
        'Vocabulary': { score: 90, change: 2, unit: 'words' },
        'Sentence Length': { score: 16, change: 1, unit: 'words' },
        'Topic Retention': { score: 85, change: 3, unit: '%' },
        'Emotional Tone': { score: 78, change: 3, unit: '%' },
        'Question Response': { score: 92, change: 2, unit: '%' },
        'Memory Recall': { score: 84, change: 4, unit: '%' },
        'Attention Span': { score: 88, change: 3, unit: 'min' },
        'Social Cues': { score: 90, change: 2, unit: '%' },
        'Comprehension': { score: 89, change: 3, unit: '%' }
      }
    },
    {
      id: 3,
      date: '2024-01-19',
      duration: 32,
      parameters: {
        'Response Time': { score: 90, change: 2, unit: '%' },
        'Coherence': { score: 85, change: 3, unit: '%' },
        'Engagement': { score: 98, change: 3, unit: '%' },
        'Vocabulary': { score: 92, change: 2, unit: 'words' },
        'Sentence Length': { score: 17, change: 1, unit: 'words' },
        'Topic Retention': { score: 88, change: 3, unit: '%' },
        'Emotional Tone': { score: 80, change: 2, unit: '%' },
        'Question Response': { score: 94, change: 2, unit: '%' },
        'Memory Recall': { score: 87, change: 3, unit: '%' },
        'Attention Span': { score: 90, change: 2, unit: 'min' },
        'Social Cues': { score: 92, change: 2, unit: '%' },
        'Comprehension': { score: 91, change: 2, unit: '%' }
      }
    }
  ];

  const handleDownloadReport = () => {
    alert('Downloading Chat Module Weekly Report...');
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
            <h1 className="text-3xl font-bold text-deepBlue mb-2">Chat & Conversation Analysis</h1>
            <p className="text-secondary">Weekly reports and analytics for chat sessions</p>
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
            <p className="text-sm text-secondary mb-1">Total Sessions</p>
            <p className="text-3xl font-bold text-deepBlue">{chatData.totalConversations}</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Avg Duration</p>
            <p className="text-3xl font-bold text-deepBlue">{chatData.avgLength} min</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Avg Engagement</p>
            <p className="text-3xl font-bold text-green-600">88%</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-secondary mb-1">Improvement</p>
            <p className="text-3xl font-bold text-green-600">+12%</p>
          </Card>
        </div>

        {/* Chat Sessions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-deepBlue">Chat Sessions This Week</h2>
          {chatSessions.map((session) => (
            <Card key={session.id} className="border-l-4 border-primary">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-deepBlue">Session #{session.id}</h3>
                  <p className="text-sm text-secondary">Date: {session.date} | Duration: {session.duration} minutes</p>
                </div>
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(session.parameters).map(([paramName, data]) => (
                  <div key={paramName} className="p-4 bg-secondaryBg rounded-lg">
                    <p className="text-xs text-secondary mb-1">{paramName}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-deepBlue">
                        {data.score} {data.unit === '%' ? '%' : ''}
                      </p>
                      <div className="flex items-center space-x-1">
                        {getChangeIcon(data.change)}
                        <span className={`text-sm font-semibold ${getChangeColor(data.change)}`}>
                          {data.change > 0 ? '+' : ''}{data.change}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-secondary mt-1">vs last week</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Top Topics */}
        <Card>
          <h3 className="text-xl font-bold text-deepBlue mb-4">Common Topics This Week</h3>
          <div className="flex flex-wrap gap-2">
            {chatData.commonTopics.map((topic, idx) => (
              <span key={idx} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                {topic}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ChatModule;
