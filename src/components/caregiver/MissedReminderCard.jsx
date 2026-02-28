import PropTypes from 'prop-types';
import { Clock, AlertCircle } from 'lucide-react';

/**
 * Missed Reminder Card Component
 * Displays a missed reminder with time and category tag
 */
const MissedReminderCard = ({ reminder }) => {
  const { title, description, scheduled_time, category, priority, tag_color } = reminder;

  // Map category to color
  const getCategoryColor = (cat) => {
    const colors = {
      medication: 'bg-red-100 text-red-800 border-red-200',
      appointment: 'bg-blue-100 text-blue-800 border-blue-200',
      meal: 'bg-green-100 text-green-800 border-green-200',
      exercise: 'bg-purple-100 text-purple-800 border-purple-200',
      social: 'bg-pink-100 text-pink-800 border-pink-200',
      hydration: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[cat] || colors.default;
  };

  // Priority icon color
  const getPriorityColor = (pri) => {
    if (pri === 'critical') return 'text-red-600';
    if (pri === 'high') return 'text-orange-600';
    if (pri === 'medium') return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start space-x-2 flex-1">
          <AlertCircle className={`w-5 h-5 mt-0.5 ${getPriorityColor(priority)}`} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        {/* Category tag */}
        <span className={`px-2 py-1 text-xs font-medium rounded border ${getCategoryColor(category)}`}>
          {tag_color || category}
        </span>
      </div>
      
      {/* Scheduled time */}
      <div className="flex items-center text-xs text-gray-500 mt-2">
        <Clock className="w-4 h-4 mr-1" />
        <span>{scheduled_time}</span>
      </div>
    </div>
  );
};

MissedReminderCard.propTypes = {
  reminder: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    scheduled_time: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    priority: PropTypes.string,
    tag_color: PropTypes.string
  }).isRequired
};

export default MissedReminderCard;
