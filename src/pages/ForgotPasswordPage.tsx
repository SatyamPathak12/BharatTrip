import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, CheckCircle, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) throw error;

      setSuccessMessage('Verification code sent to your email!');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      setSuccessMessage('Email verified successfully!');
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccessMessage('Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
                Secure Your Account
              </h1>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Reset your password securely and get back to exploring incredible destinations across India.
              </p>
              
              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">Secure verification process</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">Instant password reset</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">24/7 account support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-3 xs:px-4 sm:px-6 lg:px-16 bg-white min-h-screen lg:min-h-auto order-1 lg:order-2">
        {/* Back Button */}
        <div className="absolute top-4 xs:top-6 left-3 xs:left-4 lg:left-auto lg:right-6 z-10">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center space-x-1 xs:space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-xs xs:text-sm font-medium"
          >
            <ArrowLeft className="h-3 w-3 xs:h-4 xs:w-4" />
            <span>Back to Login</span>
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
            Reset your password securely
          </p>
        </div>

        <div className="w-full max-w-sm xs:max-w-md mx-auto lg:mt-0 px-2 xs:px-0">
          {/* Header */}
          <div className="text-center mb-4 xs:mb-6">
            <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mb-2">
              {step === 'email' && 'Forgot Password?'}
              {step === 'otp' && 'Verify Your Email'}
              {step === 'password' && 'Set New Password'}
            </h2>
            <p className="text-xs xs:text-sm text-gray-600 px-2 xs:px-4">
              {step === 'email' && "Enter your email and we'll send you a verification code"}
              {step === 'otp' && 'Enter the 6-digit code sent to your email'}
              {step === 'password' && 'Create a new password for your account'}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-3 xs:space-y-4">
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl mt-4"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending code...</span>
                  </div>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-3 xs:space-y-4">
              <div>
                <label htmlFor="otp" className="block text-xs font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  disabled={isSubmitting}
                  className="appearance-none block w-full px-4 py-2.5 xs:py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-center text-2xl tracking-widest font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-500 font-medium transition-colors"
                >
                  Didn't receive code? Resend
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl mt-4"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>
          )}

          {/* Step 3: Password Reset */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-3 xs:space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-xs font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    disabled={isSubmitting}
                    className="appearance-none block w-full pl-7 xs:pl-10 pr-3 py-2.5 xs:py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    disabled={isSubmitting}
                    className="appearance-none block w-full pl-7 xs:pl-10 pr-3 py-2.5 xs:py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl mt-4"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Resetting password...</span>
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;