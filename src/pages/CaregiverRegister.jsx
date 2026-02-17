import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, FileText, IdCard, Building2, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const CaregiverRegister = () => {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [caregiverUserId, setCaregiverUserId] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nic: '',
    address: '',
    ministryRegNo: '',
    organization: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateUserId = () => {
    // Generate a unique user ID (format: CG-YYYY-XXXXX)
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `CG-${year}-${randomNum}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Generate unique user ID
    const userId = generateUserId();
    setCaregiverUserId(userId);

    // In a real application, you would send this data to your backend
    console.log('Caregiver Registration Data:', {
      ...formData,
      userId
    });

    // Show success message with user ID
    setIsSubmitted(true);
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-deepBlue to-primary flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-3xl font-bold text-deepBlue mb-2">
              Registration Successful!
            </h2>

            <p className="text-secondary mb-6">
              Your caregiver account has been created successfully.
            </p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Your Unique Caregiver ID
              </p>
              <div className="bg-white rounded-lg p-4 mb-3">
                <p className="text-3xl font-bold text-primary tracking-wider">
                  {caregiverUserId}
                </p>
              </div>
              <p className="text-xs text-secondary">
                Please save this ID for your records
              </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Important: When Registering Elder Persons
                  </h3>
                  <p className="text-sm text-secondary mb-2">
                    When you register an elderly person under your care, you must provide this
                    <span className="font-bold text-amber-700"> Unique Caregiver ID ({caregiverUserId})</span> to link them to your account.
                  </p>
                  <p className="text-sm text-secondary">
                    This ensures proper tracking and allows you to manage their cognitive health monitoring effectively.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleBackToLogin}
                className="w-full"
              >
                Proceed to Login
              </Button>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    fullName: '',
                    email: '',
                    phone: '',
                    dateOfBirth: '',
                    nic: '',
                    address: '',
                    ministryRegNo: '',
                    organization: '',
                    password: '',
                    confirmPassword: ''
                  });
                }}
                className="w-full text-secondary hover:text-primary transition-colors text-sm font-medium"
              >
                Register Another Caregiver
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-deepBlue to-primary flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-deepBlue mb-2">
            Caregiver Registration
          </h1>
          <p className="text-secondary">
            Create your caregiver account to start monitoring elderly care
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-border">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-900 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* NIC */}
              <div>
                <label htmlFor="nic" className="block text-sm font-medium text-gray-900 mb-2">
                  National Identity Card (NIC) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IdCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                  <input
                    type="text"
                    id="nic"
                    name="nic"
                    value={formData.nic}
                    onChange={handleChange}
                    placeholder="e.g., 199012345678"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+94 71 234 5678"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-secondary w-5 h-5" />
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your full address"
                    rows="3"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-border">
              Professional Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ministry Registration Number */}
              <div>
                <label htmlFor="ministryRegNo" className="block text-sm font-medium text-gray-900 mb-2">
                  Ministry Registration Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                  <input
                    type="text"
                    id="ministryRegNo"
                    name="ministryRegNo"
                    value={formData.ministryRegNo}
                    onChange={handleChange}
                    placeholder="e.g., MH/CG/2024/12345"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-secondary mt-1">
                  Official registration number from Ministry of Health or relevant authority
                </p>
              </div>

              {/* Organization */}
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-900 mb-2">
                  Organization/Facility
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="e.g., Community Care Center"
                    className="w-full pl-12 pr-4 py-3 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-secondary mt-1">
                  Optional: Name of care facility or organization
                </p>
              </div>
            </div>
          </div>

          {/* Account Security Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-border">
              Account Security
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter a strong password"
                    required
                    minLength="8"
                    className="w-full pl-12 pr-4 py-3 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    minLength="8"
                    className="w-full pl-12 pr-4 py-3 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button type="submit" className="w-full py-4 text-lg">
              Register as Caregiver
            </Button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-secondary">
              Already have an account?{' '}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-primary hover:underline font-medium"
              >
                Login here
              </button>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CaregiverRegister;
