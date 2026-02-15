import { Home, MessageSquare, Brain, Gamepad2, Bell, Settings, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Chat', icon: MessageSquare, path: '/chat' },
    { name: 'MMSE', icon: Brain, path: '/mmse' },
    { name: 'Game', icon: Gamepad2, path: '/game' },
    { name: 'Reminder', icon: Bell, path: '/reminder' },
    { name: 'Profile', icon: User, path: '/profile' },
    { name: 'Settings', icon: Settings, path: '/settings' }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className="w-64 bg-white border-r border-border h-screen sticky top-[73px] overflow-y-auto">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                active
                  ? 'bg-primary/10 text-primary border-l-4 border-primary'
                  : 'text-secondary hover:bg-secondaryBg hover:text-deepBlue'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
              <span className={`font-medium ${active ? 'font-semibold' : ''}`}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Stats Section */}
      <div className="p-4 mt-8">
        <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
          <h3 className="text-sm font-semibold text-deepBlue mb-3">Quick Stats</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-secondary">Active Users</p>
              <p className="text-2xl font-bold text-deepBlue">12</p>
            </div>
            <div>
              <p className="text-xs text-secondary">Pending Reports</p>
              <p className="text-2xl font-bold text-deepBlue">3</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
