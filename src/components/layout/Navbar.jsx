import { Search, Bell, User, ChevronDown, Pill, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCaregiverProfile, logoutCaregiver, getMyAlerts } from '../../services/api';

const ALERT_ICONS = {
  medication_reminder_created: <Pill className="w-4 h-4 text-blue-500" />,
  medication_confirmed:        <CheckCircle className="w-4 h-4 text-green-500" />,
  new_high_priority:           <AlertTriangle className="w-4 h-4 text-orange-500" />,
  missed_medication:           <AlertTriangle className="w-4 h-4 text-red-500" />,
  missed_reminder:             <AlertTriangle className="w-4 h-4 text-red-500" />,
  snoozed_reminder:            <Clock className="w-4 h-4 text-yellow-500" />,
};

const ALERT_BG = {
  medication_reminder_created: 'bg-blue-50 border-blue-100',
  medication_confirmed:        'bg-green-50 border-green-100',
  new_high_priority:           'bg-orange-50 border-orange-100',
  missed_medication:           'bg-red-50 border-red-100',
  missed_reminder:             'bg-red-50 border-red-100',
  snoozed_reminder:            'bg-yellow-50 border-yellow-100',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const Navbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [caregiverName, setCaregiverName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();
  const notifRef = useRef(null);

  useEffect(() => {
    loadCaregiverInfo();
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadCaregiverInfo = async () => {
    const storedName = localStorage.getItem('caregiver_name');
    const storedPhoto = localStorage.getItem('profile_photo');
    if (storedName) setCaregiverName(storedName);
    if (storedPhoto) setProfilePhoto(storedPhoto);
    try {
      const response = await getCaregiverProfile();
      if (response.success) {
        const { first_name, last_name, profile_photo } = response.caregiver;
        const fullName = `${first_name} ${last_name}`;
        setCaregiverName(fullName);
        setProfilePhoto(profile_photo);
        localStorage.setItem('caregiver_name', fullName);
        if (profile_photo) localStorage.setItem('profile_photo', profile_photo);
      }
    } catch (error) {
      console.error('Failed to load caregiver info:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await getMyAlerts(3);
      if (data.success) setAlerts(data.alerts || []);
    } catch (e) {
      // silent
    }
  };

  const handleLogout = () => logoutCaregiver();

  const handleProfileClick = () => {
    navigate('/profile');
    setShowProfileMenu(false);
  };

  const unreadCount = alerts.filter(a => !a.resolved).length;

  return (
    <nav className="glass-strong shadow-glass-sm px-6 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
            <img
              src="/Hale_logo.png"
              alt="Hale Logo"
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.classList.add('bg-gradient-to-br', 'from-primary', 'to-accent');
                e.target.parentElement.innerHTML = '<span class="text-white font-bold text-lg">H</span>';
              }}
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-deepBlue tracking-tight">Caregiver Portal</h1>
            <p className="text-[10px] text-secondary/70 font-medium tracking-wide uppercase">Hale Dementia Care</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-secondary/50 w-4 h-4" />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/60 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/80 focus:border-primary/30
                placeholder:text-secondary/40 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="relative p-2 hover:bg-white/50 rounded-xl transition-all duration-200"
            >
              <Bell className="w-5 h-5 text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full
                  ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                    <button onClick={() => setShowNotifications(false)}>
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Alert list */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      No new notifications
                    </div>
                  ) : (
                    alerts.slice(0, 10).map((alert) => (
                      <div
                        key={alert._id}
                        className={`flex gap-3 px-4 py-3 border-l-4 ${ALERT_BG[alert.type] || 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {ALERT_ICONS[alert.type] || <Bell className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {alert.title || alert.reminder_title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {alert.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {timeAgo(alert.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => { setShowNotifications(false); navigate('/reminder-dashboard'); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all in Reminder Dashboard →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2.5 py-1.5 px-2 hover:bg-white/50 rounded-xl transition-all duration-200"
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-800 leading-tight">{caregiverName || 'Loading...'}</p>
                <p className="text-[10px] text-secondary">Caregiver</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-secondary hidden md:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 glass-strong rounded-2xl shadow-glass border border-white/50 py-1.5 z-50 animate-fade-in">
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left block px-4 py-2.5 text-sm text-gray-700 hover:bg-white/60 transition-colors rounded-lg mx-0"
                >
                  Profile Settings
                </button>
                <a href="/settings" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-white/60 transition-colors rounded-lg">
                  Preferences
                </a>
                <hr className="my-1.5 border-gray-200/50 mx-3" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2.5 text-sm text-red-500 hover:bg-red-50/60 transition-colors rounded-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
