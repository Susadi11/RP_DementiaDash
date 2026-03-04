import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield, Activity, Users, Heart } from 'lucide-react';
import { loginCaregiver } from '../services/api';
import loginBg from '../assets/login.jpeg';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginCaregiver(formData.email, formData.password);

      if (response.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const features = [
    { icon: Activity, text: 'Monitor cognitive health in real-time' },
    { icon: Users, text: 'Manage multiple patient profiles' },
    { icon: Shield, text: 'Secure & HIPAA-compliant platform' },
    { icon: Heart, text: 'AI-powered care recommendations' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image Sidebar */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between relative overflow-hidden flex-shrink-0">
        {/* Background image */}
        <img src={loginBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A8A]/70 via-[#1E3A8A]/50 to-[#0EA5E9]/60" />

        <div className="relative z-10 flex flex-col justify-center h-full px-12 py-16">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
              Hale Caregiver<br />Portal
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              Empowering caregivers with intelligent tools for better elderly care management.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-5">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-100 text-[15px] font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-12 pb-8">
          <div className="border-t border-white/20 pt-6">
            <p className="text-blue-200 text-sm">
              © 2026 Hale. Trusted by healthcare professionals.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-[440px]">
          {/* Logo */}
          <div className="flex justify-center lg:justify-start mb-8">
            <img src="/Hale_logo.png" alt="Hale Logo" className="w-20 h-20 object-contain" />
          </div>

          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-500 text-base">
              Sign in to your caregiver account to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-semibold text-primary hover:text-accent transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-400 font-medium">New to Hale?</span>
              </div>
            </div>

            {/* Create Account */}
            <button
              type="button"
              onClick={() => navigate('/register/caregiver')}
              className="w-full py-3.5 rounded-xl text-primary font-semibold text-base bg-white border-2 border-gray-200 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              Create Caregiver Account
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Protected by industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
