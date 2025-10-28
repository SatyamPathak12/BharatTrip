import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, MapPin, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Already submitting, ignoring click');
      return;
    }

    setError('');
    setIsSubmitting(true);
    console.log('Login form submitted...');

    try {
      console.log('Calling login function...');
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, checking for redirect...');
        // Check if there's a redirect URL, otherwise go to home
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          console.log('Redirecting to:', redirectUrl);
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectUrl);
        } else {
          console.log('Redirecting to home page');
          navigate('/');
        }
      } else {
        console.log('Login failed, showing error');
        setError(result.errorMessage || 'Login failed. Please try again.');
        setIsSubmitting(false); // Reset loading state on error
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false); // Reset loading state on error
    }
    // Note: Don't reset isSubmitting on success, as we're navigating away
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative order-2 lg:order-1">
        <div 
          className="w-full bg-cover bg-center relative"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg)',
          }}
        >
          <div className="absolute inset-0 flex flex-col justify-center items-start p-12 text-white">
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-8">
              <MapPin className="h-10 w-10 text-white drop-shadow-lg" />
              <span className="text-3xl font-bold">
                <span className="text-white drop-shadow-lg">Bharat</span>
                <span className="text-orange-300 drop-shadow-lg">Trips</span>
              </span>
            </div>
            
            {/* Content */}
            <div className="max-w-md">
              <h1 className="text-4xl font-bold mb-6 leading-tight">
                Discover Incredible India
              </h1>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Explore the most beautiful destinations across India. Book unique accommodations and create unforgettable memories.
              </p>
              
              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">Verified properties across India</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">Best price guarantee</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">24/7 customer support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-3 xs:px-4 sm:px-6 lg:px-16 bg-white min-h-screen lg:min-h-auto order-1 lg:order-2">
        {/* Back Button */}
        <div className="absolute top-4 xs:top-6 left-3 xs:left-4 lg:left-auto lg:right-6 z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-1 xs:space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-xs xs:text-sm font-medium"
          >
            <ArrowLeft className="h-3 w-3 xs:h-4 xs:w-4" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Mobile Logo - Only visible on mobile */}
        <div className="lg:hidden text-center mb-4 xs:mb-6 mt-12 xs:mt-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-blue-600 p-3 xs:p-4 rounded-full shadow-lg">
              <MapPin className="h-7 w-7 xs:h-9 xs:w-9 text-white" />
            </div>
          </div>
          <div className="mb-2 xs:mb-3">
            <span className="text-2xl xs:text-3xl font-bold">
              <span className="text-blue-600">Bharat</span>
              <span className="text-orange-500">Trips</span>
            </span>
          </div>
          <p className="text-gray-600 text-xs xs:text-sm px-2 xs:px-4 mb-2">
            Your gateway to incredible India
          </p>
        </div>

        <div className="w-full max-w-sm xs:max-w-md mx-auto lg:mt-0 px-2 xs:px-0">
          {/* Header */}
          <div className="text-center mb-4 xs:mb-6">
            <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-xs xs:text-sm text-gray-600 px-2 xs:px-4">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3 xs:space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  className="appearance-none block w-full pl-7 xs:pl-10 pr-3 py-2.5 xs:py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  className="appearance-none block w-full pl-7 xs:pl-10 pr-8 xs:pr-10 py-2.5 xs:py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="absolute right-2 xs:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <div className="text-xs">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl mt-4"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;