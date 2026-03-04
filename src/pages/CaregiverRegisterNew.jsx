import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Lock, MapPin, Shield,
  Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Camera, X as XIcon,
  ClipboardList, Heart, Users, Activity
} from 'lucide-react';
import { registerCaregiver } from '../services/api';
import loginBg from '../assets/login.jpeg';

const CaregiverRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [caregiverUserId, setCaregiverUserId] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    nic_number: '',
    mobile_number: '',
    district: '',
    gender: '',
    email: '',
    password: '',
    confirm_password: '',
    profile_photo: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
    declaration_accepted: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
        setFormData(prev => ({ ...prev, profile_photo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, profile_photo: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await registerCaregiver(formData);
      if (response.success) {
        setCaregiverUserId(response.caregiver.caregiver_id);
        setIsSubmitted(true);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Activity, text: 'Monitor cognitive health metrics' },
    { icon: Users, text: 'Manage multiple patients at once' },
    { icon: ClipboardList, text: 'Access detailed care reports' },
    { icon: Heart, text: 'AI-powered care recommendations' },
  ];

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";
  const inputWithIconClass = "w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-10">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Registration Successful!
            </h2>
            <p className="text-gray-500 mb-8">
              Your caregiver account has been created.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Your Caregiver ID
              </p>
              <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                <p className="text-3xl font-bold text-gray-900 tracking-wider font-mono">
                  {caregiverUserId}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Save this ID — you'll need it to link patients to your account
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1.5 text-sm">Important</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Use your Caregiver ID when linking elderly persons</li>
                    <li>• You can manage multiple patients from your dashboard</li>
                    <li>• Keep your account credentials secure</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' }}
            >
              Continue to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image Sidebar */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[460px] flex-col justify-between relative overflow-hidden flex-shrink-0">
        {/* Background image */}
        <img src={loginBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A8A]/70 via-[#1E3A8A]/50 to-[#0EA5E9]/60" />

        <div className="relative z-10 flex flex-col justify-center h-full px-10 py-16">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
              Join the Hale<br />Community
            </h1>
            <p className="text-blue-200 text-base leading-relaxed">
              Register as a caregiver and start providing better care with intelligent monitoring tools.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">What you'll get</p>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-blue-100 text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-10 pb-8">
          <div className="border-t border-white/20 pt-5">
            <p className="text-blue-200 text-sm">
              © 2026 Hale. Trusted by healthcare professionals.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Back button */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>



          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Create your account
            </h2>
            <p className="text-gray-500 text-sm">
              Fill in your details to register as a caregiver
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Personal Information</h3>
              </div>

              {/* Profile Photo */}
              <div className="mb-5">
                <label className={labelClass}>Profile Photo <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                      <button type="button" onClick={removePhoto}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-all">
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input type="file" id="profile_photo_upload" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <label htmlFor="profile_photo_upload"
                      className="inline-block px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-all text-sm font-medium text-gray-700">
                      Choose Photo
                    </label>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF. Max 5MB.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name <span className="text-red-400">*</span></label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className={inputClass} placeholder="John" />
                </div>
                <div>
                  <label className={labelClass}>Last Name <span className="text-red-400">*</span></label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required className={inputClass} placeholder="Doe" />
                </div>
                <div>
                  <label className={labelClass}>NIC Number <span className="text-red-400">*</span></label>
                  <input type="text" name="nic_number" value={formData.nic_number} onChange={handleChange} required className={inputClass} placeholder="123456789V" />
                </div>
                <div>
                  <label className={labelClass}>Gender <span className="text-red-400">*</span></label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required className={inputClass}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email Address <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputWithIconClass} placeholder="john.doe@example.com" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Mobile Number <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="tel" name="mobile_number" value={formData.mobile_number} onChange={handleChange} required className={inputWithIconClass} placeholder="+94 71 234 5678" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>District / City <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" name="district" value={formData.district} onChange={handleChange} required className={inputWithIconClass} placeholder="Colombo" />
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Emergency Contact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Contact Name <span className="text-red-400">*</span></label>
                  <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} required className={inputClass} placeholder="Emergency contact name" />
                </div>
                <div>
                  <label className={labelClass}>Contact Number <span className="text-red-400">*</span></label>
                  <input type="tel" name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleChange} required className={inputClass} placeholder="+94 71 234 5678" />
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Security</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password" value={formData.password} onChange={handleChange}
                      required minLength={8} className={`${inputWithIconClass} pr-11`} placeholder="Min. 8 characters"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirm Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password" value={formData.confirm_password} onChange={handleChange}
                      required className={`${inputWithIconClass} pr-11`} placeholder="Confirm password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox" name="declaration_accepted"
                  checked={formData.declaration_accepted} onChange={handleChange} required
                  className="mt-0.5 w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-700">I hereby declare that</span> all the information provided above is true and accurate. I understand that providing false information may result in account termination.
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                'Create Caregiver Account'
              )}
            </button>

            {/* Login link */}
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-gray-500 text-sm pt-4">
                Already have an account?{' '}
                <button type="button" onClick={() => navigate('/login')}
                  className="font-semibold text-primary hover:text-accent transition-colors">
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CaregiverRegister;
