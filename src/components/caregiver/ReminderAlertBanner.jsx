import PropTypes from 'prop-types';
import { AlertTriangle, Bell, X } from 'lucide-react';
import { useState } from 'react';

/**
 * ReminderAlertBanner
 *
 * Displays a dismissible banner at the top of the reminders page when
 * there are unresolved high/critical medication caregiver alerts.
 *
 * Props:
 *   alerts       – array from the caregiver_alerts collection (already filtered to unresolved)
 *   onViewAlerts – callback to navigate to the Alerts tab
 */
const ReminderAlertBanner = ({ alerts, onViewAlerts }) => {
  const [dismissed, setDismissed] = useState(false);

  // Only surface medication alerts at high or critical severity
  const urgentAlerts = alerts.filter(
    (a) =>
      !a.resolved &&
      (a.priority === 'critical' || a.priority === 'high') &&
      (a.type === 'missed_medication' ||
        a.type === 'snoozed_reminder' ||
        a.type === 'new_high_priority')
  );

  if (dismissed || urgentAlerts.length === 0) return null;

  const hasCritical = urgentAlerts.some((a) => a.priority === 'critical');

  const bannerBg    = hasCritical ? 'bg-red-600'    : 'bg-orange-500';
  const bannerHover = hasCritical ? 'hover:bg-red-700' : 'hover:bg-orange-600';
  const buttonBg    = hasCritical ? 'bg-red-700 hover:bg-red-800' : 'bg-orange-600 hover:bg-orange-700';

  // Build short summary line
  const missedCount = urgentAlerts.filter((a) => a.type === 'missed_medication').length;
  const snoozedCount = urgentAlerts.filter((a) => a.type === 'snoozed_reminder').length;
  const newHighCount = urgentAlerts.filter((a) => a.type === 'new_high_priority').length;

  const parts = [];
  if (missedCount)  parts.push(`${missedCount} missed`);
  if (snoozedCount) parts.push(`${snoozedCount} snoozed`);
  if (newHighCount) parts.push(`${newHighCount} new high-priority`);

  const summary = parts.join(' · ');

  return (
    <div
      className={`${bannerBg} text-white rounded-lg px-4 py-3 flex items-center justify-between shadow-md`}
      role="alert"
    >
      {/* Left: icon + text */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm mr-1">
            {urgentAlerts.length} caregiver alert{urgentAlerts.length > 1 ? 's' : ''}
          </span>
          <span className="text-sm opacity-90 truncate">— {summary}</span>
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
        <button
          onClick={onViewAlerts}
          className={`flex items-center space-x-1 ${buttonBg} text-white text-xs font-medium px-3 py-1.5 rounded transition-colors`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>View Alerts</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className={`${bannerHover} rounded p-1 transition-colors`}
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

ReminderAlertBanner.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      priority: PropTypes.string,
      type: PropTypes.string,
      resolved: PropTypes.bool,
    })
  ).isRequired,
  onViewAlerts: PropTypes.func.isRequired,
};

export default ReminderAlertBanner;
