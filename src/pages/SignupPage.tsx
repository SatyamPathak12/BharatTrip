import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, MapPin, ArrowLeft, Check } from 'lucide-react';

const SignupPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Send magic link OTP using Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      );

      // Create user account with temporary password and send email confirmation
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-12) + 'Temp1!', // Temporary password
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      console.log('Signup response:', { data, signupError });

      if (signupError) {
        // Check for various "already registered" error messages
        const errorMsg = signupError.message.toLowerCase();
        if (errorMsg.includes('already registered') || 
            errorMsg.includes('user already exists') || 
            errorMsg.includes('already in use') ||
            signupError.status === 422) {
          setError(' This email is already registered. Please try logging in or use a different email address.');
        } else {
          setError(signupError.message);
        }
      } else if (data.user) {
        // Check if user needs email confirmation or if email is already confirmed (existing user)
        // When identities array is empty, it means email is already registered
        if (data.user.identities && data.user.identities.length === 0) {
          setError(' This email is already registered. Please try logging in or use a different email address.');
        } else {
          // New user, proceed to OTP verification
          setStep('otp');
          setError('');
        }
      } else {
        // No user data and no error - something went wrong
        setError('Failed to send verification code. Please try again.');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: formData.otp,
        type: 'email',
      });

      if (verifyError) {
        setError('Invalid verification code. Please check your email and try again.');
      } else {
        setStep('password');
        setError('');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set password and complete signup
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      );

      // Update user password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        // Successfully created account with password
        navigate('/');
      }
    } catch (err) {
      console.error('Error setting password:', err);
      setError('Failed to set password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      );

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) {
        setError(otpError.message);
      } else {
        setError('');
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successMsg.textContent = 'Verification code resent!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
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
                Start Your Journey Today
              </h1>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Join thousands of travelers who trust BharatTrips for their perfect getaway. Create your account and unlock exclusive deals.
              </p>
              
              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">Instant booking confirmation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">Exclusive member discounts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">Personalized recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 bg-white">
        {/* Back Button */}
        <div className="absolute top-6 left-6 lg:left-auto lg:right-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </button>
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {/* Step 1 */}
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'email' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
                }`}>
                  {step === 'email' ? '1' : <Check className="h-5 w-5" />}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Email</span>
              </div>
              <div className={`flex-1 h-1 mx-2 ${step !== 'email' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              
              {/* Step 2 */}
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'otp' ? 'bg-blue-600 text-white' : step === 'password' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {step === 'password' ? <Check className="h-5 w-5" /> : '2'}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Verify</span>
              </div>
              <div className={`flex-1 h-1 mx-2 ${step === 'password' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              
              {/* Step 3 */}
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'password' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Password</span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 'email' && 'Create Account'}
              {step === 'otp' && 'Verify Your Email'}
              {step === 'password' && 'Set Your Password'}
            </h2>
            <p className="text-gray-600">
              {step === 'email' && (
                <>
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Sign in here
                  </Link>
                </>
              )}
              {step === 'otp' && `We sent a verification code to ${formData.email}`}
              {step === 'password' && 'Choose a strong password for your account'}
            </p>
          </div>

          {/* Step 1: Email Form */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending Code...</span>
                  </div>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification Form */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={formData.otp}
                  onChange={handleInputChange}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify Code'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-500 transition-colors disabled:opacity-50"
                >
                  Didn't receive the code? Resend
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Change email address
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Password Form */}
          {step === 'password' && (
            <form onSubmit={handleSetPassword} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Complete Signup'
                )}
              </button>
            </form>
          )}

          {/* Terms */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-center text-xs text-gray-600 leading-relaxed">
              By signing up, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;