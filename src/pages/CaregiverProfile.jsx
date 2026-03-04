import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Shield, Lock, Edit2, Save, X,
  Trash2, AlertCircle, CheckCircle2, Copy, Check, Camera
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

const InfoField = ({ label, value, icon: Icon }) => (
  <div className="p-4 bg-white/40 rounded-xl border border-white/50 hover:bg-white/60 transition-colors duration-200">
    <p className="text-[11px] font-medium text-secondary mb-1 uppercase tracking-wider">{label}</p>
    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-primary/60" />}
      {value || '—'}
    </p>
  </div>
);

const FormField = ({ label, name, value, onChange, type = 'text', placeholder }) => (
  <div>
    <label className="block text-xs font-medium text-secondary mb-1.5">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl text-sm
        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30
        placeholder:text-secondary/40 transition-all duration-200"
    />
  </div>
);

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
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size should be less than 5MB');
        return;
      }
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

        if (editData.first_name || editData.last_name) {
          localStorage.setItem('caregiver_name', `${response.caregiver.first_name} ${response.caregiver.last_name}`);
        }
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
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
            <p className="text-sm text-secondary">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-secondary mt-0.5">Manage your account information</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/50 rounded-xl flex items-center gap-3 animate-fade-in backdrop-blur-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50/70 border border-red-200/50 rounded-xl flex items-center gap-3 animate-fade-in backdrop-blur-sm">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Caregiver ID Card */}
        <Card className="!bg-gradient-to-br !from-deepBlue/5 !to-primary/5 !border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-secondary uppercase tracking-wider mb-1.5">Your Caregiver ID</p>
              <p className="text-2xl font-bold text-gray-900 tracking-wider font-mono">
                {profile?.caregiver_id}
              </p>
            </div>
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${copiedId
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-white/50 hover:bg-white/80 text-gray-700 border border-white/60'
                }`}
            >
              {copiedId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedId ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </Card>

        {/* Profile Information Card */}
        <Card>
          {!editing ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                </div>
                <Button
                  onClick={() => setEditing(true)}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </Button>
              </div>

              {/* Profile Photo Display */}
              {profile?.profile_photo && (
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <img
                      src={profile.profile_photo}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover ring-[3px] ring-primary/20 ring-offset-2"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <InfoField label="Full Name" value={`${profile?.first_name} ${profile?.last_name}`} />
                <InfoField label="Email" value={profile?.email} icon={Mail} />
                <InfoField label="Mobile Number" value={profile?.mobile_number} icon={Phone} />
                <InfoField label="District" value={profile?.district} icon={MapPin} />
                <InfoField label="NIC Number" value={profile?.nic_number} />
                <InfoField label="Gender" value={profile?.gender} />
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Emergency Contact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoField label="Contact Name" value={profile?.emergency_contact_name} />
                <InfoField label="Contact Number" value={profile?.emergency_contact_number} icon={Phone} />
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Edit2 className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
                </div>
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
                    size="sm"
                    className="flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </Button>
                </div>
              </div>

              {/* Profile Photo Upload */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-secondary mb-2 uppercase tracking-wider">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover ring-[3px] ring-primary/20 ring-offset-2"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/40 border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-secondary/40" />
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
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white/80 border border-white/60 rounded-xl cursor-pointer transition-all text-sm font-medium text-gray-700"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Change Photo
                    </label>
                    <p className="text-[10px] text-secondary mt-1.5">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <FormField label="First Name" name="first_name" value={editData.first_name} onChange={handleEditChange} />
                <FormField label="Last Name" name="last_name" value={editData.last_name} onChange={handleEditChange} />
                <FormField label="Mobile Number" name="mobile_number" value={editData.mobile_number} onChange={handleEditChange} type="tel" />
                <FormField label="District" name="district" value={editData.district} onChange={handleEditChange} />
                <FormField label="Emergency Contact Name" name="emergency_contact_name" value={editData.emergency_contact_name} onChange={handleEditChange} />
                <FormField label="Emergency Contact Number" name="emergency_contact_number" value={editData.emergency_contact_number} onChange={handleEditChange} type="tel" />
              </div>
            </form>
          )}
        </Card>

        {/* Change Password Card */}
        <Card>
          {!changingPassword ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Password & Security</h2>
                  <p className="text-xs text-secondary mt-0.5">Keep your account secure</p>
                </div>
              </div>
              <Button
                onClick={() => setChangingPassword(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                Change
              </Button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordData({ old_password: '', new_password: '', confirm_new_password: '' });
                  }}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </Button>
              </div>

              <div className="space-y-3 mb-5">
                <FormField
                  label="Current Password"
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  type="password"
                  placeholder="Enter current password"
                />
                <FormField
                  label="New Password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  type="password"
                  placeholder="Enter new password"
                />
                <FormField
                  label="Confirm New Password"
                  name="confirm_new_password"
                  value={passwordData.confirm_new_password}
                  onChange={handlePasswordChange}
                  type="password"
                  placeholder="Confirm new password"
                />
              </div>

              <Button type="submit" fullWidth>
                Update Password
              </Button>
            </form>
          )}
        </Card>

        {/* Danger Zone */}
        <Card className="!bg-red-50/30 !border-red-100/40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-red-800 flex items-center gap-2 mb-1">
                <Trash2 className="w-4 h-4" />
                Danger Zone
              </h2>
              <p className="text-xs text-red-600/70">
                Once you delete your account, there is no going back.
              </p>
            </div>
            <Button
              onClick={handleDeleteAccount}
              variant="danger"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default CaregiverProfile;
