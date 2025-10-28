import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, RotateCcw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const OTPPage: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { user, verifyOTP, isLoading, pendingEmail, resendOTP } = useAuth();
  const { sendMagicLink } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!pendingEmail) {
      navigate('/signup');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingEmail, navigate]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    
    if (pastedData.length === 6) {
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setError('');
    console.log('Verifying OTP code:', otpCode);
    
    try {
      const success = await verifyOTP(otpCode);
      console.log('OTP verification result:', success);
      if (success) {
        console.log('OTP verification successful, navigating to home...');
        navigate('/');
      } else {
        console.log('OTP verification failed, showing error...');
        setError('Invalid verification code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = () => {
    console.log('Resending OTP to:', pendingEmail || user?.email);
    setTimeLeft(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
    
    // Call the resendOTP function from auth context
    if (pendingEmail) {
      resendOTP().then((success) => {
        if (success) {
          console.log('OTP resent successfully');
          // Also try sending a magic link as backup
          sendMagicLink(pendingEmail).then((magicLinkSent) => {
            if (magicLinkSent) {
              console.log('Magic link also sent as backup');
            }
          });
        } else {
          setError('Failed to resend verification code. Please try again.');
        }
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length === 6) {
      handleVerifyOTP(otpCode);
    } else {
      setError('Please enter a complete 6-digit OTP');
    }
  };

  if (!user) {
    return null;
  }

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
                Verify Your Account
              </h1>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                We've sent a verification code to your email. Enter it below to complete your account setup and start exploring India.
              </p>
              
              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">Secure account verification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">Quick and easy process</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                  <span className="text-gray-200">Enhanced account security</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - OTP Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 bg-white">
        {/* Back Button */}
        <div className="absolute top-6 left-6 lg:left-auto lg:right-6">
          <button
            onClick={() => navigate('/signup')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Your Account
            </h2>
            <p className="text-gray-600 mb-1">
              We've sent a 6-digit verification code to
            </p>
            <p className="font-medium text-gray-900">{pendingEmail || user?.email}</p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 text-center mb-6">
                Enter Verification Code
              </label>
              <div className="flex justify-center space-x-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {/* Timer and Resend */}
            <div className="text-center">
              {!canResend ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code? Resend in{' '}
                    <span className="font-medium text-blue-600">{timeLeft}s</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Check your email for a magic link or enter the 6-digit code above
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="flex items-center justify-center space-x-1 text-blue-600 hover:text-blue-500 font-medium mx-auto transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Resend Code & Magic Link</span>
                  </button>
                  <p className="text-xs text-gray-500">
                    We'll send both an OTP code and a magic link to your email
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || otp.some(digit => !digit)}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify Account'
                )}
              </button>
            </div>

            {/* Skip Button */}
            <div>
              <button
                type="button"
                onClick={handleSkipVerification}
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span>Skipping...</span>
                  </div>
                ) : (
                  'Skip Verification for Now'
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default OTPPage;