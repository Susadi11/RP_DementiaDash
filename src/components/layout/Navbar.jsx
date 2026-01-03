import { Search, Bell, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <nav className="bg-white border-b border-border px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <h1 className="text-2xl font-bold text-deepBlue">Hale Caregiver Portal</h1>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
            <input
              type="text"
              placeholder="Search elderly users..."
              className="w-full pl-12 pr-4 py-2.5 bg-secondaryBg border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-secondaryBg rounded-xl transition-colors">
            <Bell className="w-6 h-6 text-deepBlue" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-secondaryBg rounded-xl transition-colors"
            >
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-deepBlue">Sarah Johnson</p>
                <p className="text-xs text-secondary">Caregiver</p>
              </div>
              <ChevronDown className="w-4 h-4 text-secondary hidden md:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-border py-2">
                <a href="#" className="block px-4 py-2 text-sm text-deepBlue hover:bg-secondaryBg">
                  Profile Settings
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-deepBlue hover:bg-secondaryBg">
                  Preferences
                </a>
                <hr className="my-2 border-border" />
                <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
