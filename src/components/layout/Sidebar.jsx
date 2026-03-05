import { Home, MessageSquare, Brain, Gamepad2, Bell, Settings, User, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Chat', icon: MessageSquare, path: '/chat' },
    { name: 'MMSE', icon: Brain, path: '/mmse' },
    { name: 'Game', icon: Gamepad2, path: '/game' },
    { name: 'Reminder', icon: Bell, path: '/reminder' },
    { name: 'Medication', icon: Activity, path: '/reminder-dashboard' },
    { name: 'Profile', icon: User, path: '/profile' },
    { name: 'Settings', icon: Settings, path: '/settings' }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className="w-[260px] glass h-full overflow-y-auto shadow-glass-sm">
      <nav className="p-4 pt-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${active
                  ? 'bg-primary/10 text-primary shadow-glow-sm'
                  : 'text-secondary hover:bg-white/60 hover:text-deepBlue hover:translate-x-0.5'
                }`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-200 ${active
                  ? 'bg-primary/15'
                  : 'group-hover:bg-primary/5'
                }`}>
                <Icon className={`w-[18px] h-[18px] transition-colors duration-200 ${active ? 'text-primary' : 'text-secondary group-hover:text-primary/70'
                  }`} />
              </div>
              <span className={`text-[13px] tracking-wide ${active ? 'font-semibold' : 'font-medium'
                }`}>{item.name}</span>

              {active && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
