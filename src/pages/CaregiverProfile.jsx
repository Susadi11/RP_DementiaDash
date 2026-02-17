import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Shield, Lock, Edit2, Save, X,
  Trash2, AlertCircle, CheckCircle2, Copy, Check, Camera, XIcon as XCircle
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import {
  getCaregiverProfile,
  updateCaregiverProfile,
  changePassword,
  deleteCaregiverAccount,
  logoutCaregiver
} from '../services/api';

const CaregiverProfile = () => {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    mobile_number: '',
    district: '',
    profile_photo: '',
    emergency_contact_name: '',
    emergency_contact_number: ''
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getCaregiverProfile();
      if (response.success) {
        setProfile(response.caregiver);
        setPhotoPreview(response.caregiver.profile_photo || null);
        setEditData({
          first_name: response.caregiver.first_name || '',
          last_name: response.caregiver.last_name || '',
          mobile_number: response.caregiver.mobile_number || '',
          district: response.caregiver.district || '',
          profile_photo: response.caregiver.profile_photo || '',
          emergency_contact_name: response.caregiver.emergency_contact_name || '',
          emergency_contact_number: response.caregiver.emergency_contact_number || ''
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setPhotoPreview(base64String);
        setEditData(prev => ({
          ...prev,
          profile_photo: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setEditData(prev => ({
      ...prev,
      profile_photo: ''
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await updateCaregiverProfile(editData);
      if (response.success) {
        setProfile(response.caregiver);
        setPhotoPreview(response.caregiver.profile_photo || null);
        setSuccess('Profile updated successfully!');
        setEditing(false);
        
        // Update localStorage if name changed
        if (editData.first_name || editData.last_name) {
          localStorage.setItem('caregiver_name', `${response.caregiver.first_name} ${response.caregiver.last_name}`);
        }
        
        // Update localStorage if photo changed
        if (response.caregiver.profile_photo) {
          localStorage.setItem('profile_photo', response.caregiver.profile_photo);
        } else {
          localStorage.removeItem('profile_photo');
        }
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await changePassword(
        passwordData.old_password,
        passwordData.new_password,
        passwordData.confirm_new_password
      );
      if (response.success) {
        setSuccess('Password changed successfully!');
        setChangingPassword(false);
        setPasswordData({ old_password: '', new_password: '', confirm_new_password: '' });
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const response = await deleteCaregiverAccount();
      if (response.success) {
        alert('Your account has been deleted successfully.');
        logoutCaregiver();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete account');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profile?.caregiver_id || '');
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary font-medium">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-deepBlue mb-2">My Profile</h1>
          <p className="text-secondary">Manage your account information</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Caregiver ID Card */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-secondary mb-2">Your Caregiver ID</p>
              <p className="text-3xl font-bold text-gray-900 tracking-wider">
                {profile?.caregiver_id}
              </p>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-secondaryBg hover:bg-gray-200 text-gray-900 rounded-xl transition-all font-medium"
            >
              {copiedId ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copiedId ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </Card>

        {/* Profile Information Card */}
        <Card>
          {!editing ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-deepBlue flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </h2>
                <Button
                  onClick={() => setEditing(true)}
                  variant="secondary"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
              </div>

              {/* Profile Photo Display */}
              {profile?.profile_photo && (
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <img
                      src={profile.profile_photo}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-secondaryBg p-4 rounded-xl border border-border">
                  <p className="text-sm font-medium text-secondary mb-1">Full Name</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                </div>
                <div className="bg-secondaryBg p-4 rounded-xl border border-border">
                  <p className="text-sm font-medium text-secondary mb-1">Email</p>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {profile?.email}
                  </p>
                </div>
                <div className="bg-secondaryBg p-4 rounded-xl border border-border">
                  <p className="text-sm font-medium text-secondary mb-1">Mobile Number</p>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    {profile?.mobile_number}
                  </p>
                </div>
                <div className="bg-secondaryBg p-4 rounded-xl border border-border">
                  <p className="text-sm font-medium text-secondary mb-1">District</p>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {profile?.district}
                  </p>
                </div>
                <div className="bg-secondaryBg p-4 rounded-xl border border-border">
                  <p className="text-sm font-medium text-secondary mb-1">NIC Number</p>
                  <p className="text-lg font-semibold text-gray-900">{profile?.nic_number}</p>
                </div>
                <div className="bg-secondaryBg p-4 rounded-xl border border-border">
                  <p className="text-sm font-medium text-secondary mb-1">Gender</p>
                  <p className="text-lg font-semibold text-gray-900">{profile?.gender}</p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-secondaryBg p-4 rounded-xl border border-border">
                  <p className="text-sm font-medium text-secondary mb-1">Contact Name</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile?.emergency_contact_name}
                  </p>
                </div>
                <div className="bg-secondaryBg p-4 rounded-xl border border-border">
                  <p className="text-sm font-medium text-secondary mb-1">Contact Number</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile?.emergency_contact_number}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-deepBlue flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-primary" />
                  Edit Profile
                </h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setPhotoPreview(profile?.profile_photo || null);
                      setEditData({
                        first_name: profile?.first_name || '',
                        last_name: profile?.last_name || '',
                        mobile_number: profile?.mobile_number || '',
                        district: profile?.district || '',
                        profile_photo: profile?.profile_photo || '',
                        emergency_contact_name: profile?.emergency_contact_name || '',
                        emergency_contact_number: profile?.emergency_contact_number || ''
                      });
                    }}
                    variant="secondary"
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </div>

              {/* Profile Photo Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-secondaryBg border-4 border-border flex items-center justify-center">
                      <Camera className="w-8 h-8 text-secondary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="profile_photo_edit"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="profile_photo_edit"
                      className="inline-block px-4 py-2 bg-secondaryBg hover:bg-gray-200 border-2 border-border rounded-xl cursor-pointer transition-all font-medium text-gray-900"
                    >
                      <Camera className="w-4 h-4 inline mr-2" />
                      Change Photo
                    </label>
                    <p className="text-xs text-secondary mt-2">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={editData.first_name}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-secondaryBg border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={editData.last_name}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-secondaryBg border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile_number"
                    value={editData.mobile_number}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-secondaryBg border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={editData.district}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-secondaryBg border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={editData.emergency_contact_name}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-secondaryBg border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact_number"
                    value={editData.emergency_contact_number}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-secondaryBg border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </form>
          )}
        </Card>

        {/* Change Password Card */}
        <Card>
          {!changingPassword ? (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-deepBlue flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Password & Security
                </h2>
                <p className="text-secondary">Keep your account secure</p>
              </div>
              <Button
                onClick={() => setChangingPassword(true)}
                variant="secondary"
                className="flex items-center gap-2 px-4 py-2"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </Button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-deepBlue flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Change Password
                </h2>
                <Button
                  type="button"
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordData({ old_password: '', new_password: '', confirm_new_password: '' });
                  }}
                  variant="secondary"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="old_password"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-3 bg-secondaryBg border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-secondaryBg border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirm_new_password"
                    value={passwordData.confirm_new_password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-3 bg-secondaryBg border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <Button type="submit" fullWidth className="py-3">
                Update Password
              </Button>
            </form>
          )}
        </Card>

        {/* Danger Zone */}
        <Card padding="p-8">
          <h2 className="text-xl font-bold text-red-800 flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h2>
          <p className="text-red-700 mb-6">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button
            onClick={handleDeleteAccount}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete My Account
          </Button>
        </Card>
      </div>
    </Layout>
  );
};

export default CaregiverProfile;
