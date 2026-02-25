import { MessageCircle } from 'lucide-react';
import ModuleCard from './ModuleCard';
import DonutChart from '../charts/DonutChart';

const ChatReport = ({ data }) => {
  const moodData = [
    { name: 'Happy', value: data.moods.happy },
    { name: 'Neutral', value: data.moods.neutral },
    { name: 'Sad', value: data.moods.sad },
    { name: 'Anxious', value: data.moods.anxious }
  ];

  return (
    <ModuleCard title="Chat & Conversation Analysis" icon={MessageCircle}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Metrics */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-secondary mb-1">Total Conversations</p>
            <p className="text-3xl font-bold text-deepBlue">{data.totalConversations}</p>
          </div>
          <div>
            <p className="text-sm text-secondary mb-1">Avg. Conversation Length</p>
            <p className="text-3xl font-bold text-deepBlue">{data.avgLength} min</p>
          </div>
          <div>
            <p className="text-sm text-secondary mb-1">Most Active Time</p>
            <p className="text-lg font-semibold text-deepBlue">{data.mostActiveTime}</p>
          </div>
        </div>

        {/* Mood Chart */}
        <div>
          <p className="text-sm font-semibold text-deepBlue mb-3">Mood Distribution</p>
          <DonutChart data={moodData} height={200} />
        </div>
      </div>

      {/* Common Topics */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-deepBlue mb-3">Common Topics</p>
        <div className="flex flex-wrap gap-2">
          {data.commonTopics.map((topic, index) => (
            <span
              key={index}
              className="px-3 py-1.5 bg-blue-100 text-primary rounded-full text-sm font-medium"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Sample Conversations */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-deepBlue mb-3">Recent Conversations</p>
        <div className="space-y-3">
          {data.sampleConversations.map((conv, index) => (
            <div key={index} className="p-3 bg-secondaryBg rounded-lg">
              <p className="text-sm text-secondary mb-1">{conv.date}</p>
              <p className="text-sm text-deepBlue">{conv.snippet}</p>
            </div>
          ))}
        </div>
      </div>
    </ModuleCard>
  );
};

export default ChatReport;
