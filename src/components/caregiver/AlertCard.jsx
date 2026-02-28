import PropTypes from 'prop-types';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import Button from '../common/Button';

/**
 * Alert Card Component
 * Displays caregiver alerts with priority indicators and resolve actions
 */
const AlertCard = ({ alert, onResolve }) => {
  const { _id, title, message, priority, type, created_at, resolved } = alert;

  // Priority styles
  const getPriorityStyles = (pri) => {
    const styles = {
      critical: {
        bg: 'bg-red-50 border-red-300',
        icon: 'text-red-600',
        badge: 'bg-red-600 text-white'
      },
      high: {
        bg: 'bg-orange-50 border-orange-300',
        icon: 'text-orange-600',
        badge: 'bg-orange-600 text-white'
      },
      medium: {
        bg: 'bg-yellow-50 border-yellow-300',
        icon: 'text-yellow-600',
        badge: 'bg-yellow-600 text-white'
      },
      low: {
        bg: 'bg-blue-50 border-blue-300',
        icon: 'text-blue-600',
        badge: 'bg-blue-600 text-white'
      }
    };
    return styles[pri] || styles.medium;
  };

  const styles = getPriorityStyles(priority);

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`border rounded-lg p-4 ${resolved ? 'bg-gray-50 border-gray-200 opacity-75' : styles.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          {resolved ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <AlertTriangle className={`w-5 h-5 mt-0.5 ${styles.icon}`} />
          )}
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles.badge}`}>
                {priority.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-700">{message}</p>
            <p className="text-xs text-gray-500 mt-2">{formatDate(created_at)}</p>
          </div>
        </div>
        
        {/* Resolve button */}
        {!resolved && onResolve && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResolve(_id)}
            className="ml-2"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {resolved && (
        <div className="text-xs text-green-600 flex items-center mt-2">
          <CheckCircle className="w-3 h-3 mr-1" />
          Resolved
        </div>
      )}
    </div>
  );
};

AlertCard.propTypes = {
  alert: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    type: PropTypes.string,
    created_at: PropTypes.string.isRequired,
    resolved: PropTypes.bool
  }).isRequired,
  onResolve: PropTypes.func
};

export default AlertCard;
