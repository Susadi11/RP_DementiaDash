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
    <nav className="glass-strong shadow-glass-sm px-6 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
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

        {/* Search Bar */}
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
          {/* Notifications */}
          <button className="relative p-2 hover:bg-white/50 rounded-xl transition-all duration-200">
            <Bell className="w-5 h-5 text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2.5 py-1.5 px-2 hover:bg-white/50 rounded-xl transition-all duration-200"
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-800 leading-tight">
                  {caregiverName || 'Loading...'}
                </p>
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
