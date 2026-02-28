import PropTypes from 'prop-types';

/**
 * Activity Completion Progress Bar Component
 * Displays activity name with a visual progress bar showing completion rate
 */
const ActivityProgressBar = ({ name, completionRate, completed, total }) => {
  // Determine color based on completion rate
  const getBarColor = (rate) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <span className="text-sm text-gray-600">
          {completionRate}% ({completed}/{total})
        </span>
      </div>
      
      {/* Progress bar container */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${getBarColor(completionRate)}`}
          style={{ width: `${completionRate}%` }}
        />
      </div>
    </div>
  );
};

ActivityProgressBar.propTypes = {
  name: PropTypes.string.isRequired,
  completionRate: PropTypes.number.isRequired,
  completed: PropTypes.number,
  total: PropTypes.number
};

ActivityProgressBar.defaultProps = {
  completed: 0,
  total: 0
};

export default ActivityProgressBar;
