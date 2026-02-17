import { Search, Bell, User, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCaregiverProfile, logoutCaregiver } from '../../services/api';

const Navbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [caregiverName, setCaregiverName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCaregiverInfo();
  }, []);

  const loadCaregiverInfo = async () => {
    // First try to get from localStorage
    const storedName = localStorage.getItem('caregiver_name');
    const storedPhoto = localStorage.getItem('profile_photo');

    if (storedName) {
      setCaregiverName(storedName);
    }
    if (storedPhoto) {
      setProfilePhoto(storedPhoto);
    }

    // Then fetch from API to get latest info
    try {
      const response = await getCaregiverProfile();
      if (response.success) {
        const { first_name, last_name, profile_photo } = response.caregiver;
        const fullName = `${first_name} ${last_name}`;
        setCaregiverName(fullName);
        setProfilePhoto(profile_photo);

        // Update localStorage
        localStorage.setItem('caregiver_name', fullName);
        if (profile_photo) {
          localStorage.setItem('profile_photo', profile_photo);
        }
      }
    } catch (error) {
      console.error('Failed to load caregiver info:', error);
    }
  };

  const handleLogout = () => {
    logoutCaregiver();
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowProfileMenu(false);
  };

  return (
    <nav className="bg-white border-b border-border px-6 py-2 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden">
            <img
              src="/Hale_logo.png"
              alt="Hale Logo"
              className="w-20 h-20 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.classList.add('bg-primary');
                e.target.parentElement.innerHTML = '<span class="text-white font-bold text-xl">H</span>';
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-deepBlue">Caregiver Portal</h1>
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
            <Bell className="w-6 h-6 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-secondaryBg rounded-xl transition-colors"
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-gray-800">
                  {caregiverName || 'Loading...'}
                </p>
                <p className="text-xs text-secondary">Caregiver</p>
              </div>
              <ChevronDown className="w-4 h-4 text-secondary hidden md:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-border py-2 z-50">
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-800 hover:bg-secondaryBg"
                >
                  Profile Settings
                </button>
                <a href="/settings" className="block px-4 py-2 text-sm text-gray-800 hover:bg-secondaryBg">
                  Preferences
                </a>
                <hr className="my-2 border-border" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
