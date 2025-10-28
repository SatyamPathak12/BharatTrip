import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...');
        
        // Get the session from the URL hash or search params
        const { data, error } = await supabase.auth.getSession();
        
        console.log('Auth callback session:', { data: !!data.session, error: error?.message });
        
        if (error) {
          console.error('Auth callback error:', error.message);
          navigate('/login?error=auth_callback_failed');
          return;
        }

        if (data.session) {
          console.log('Session found, user authenticated via magic link');
          
          // Check if there's a redirect_to parameter
          const redirectTo = searchParams.get('redirect_to') || '/';
          console.log('Redirecting to:', redirectTo);
          
          // Small delay to ensure auth state is updated
          setTimeout(() => {
            navigate(redirectTo);
          }, 1000);
        } else {
          console.log('No session found, redirecting to login');
          navigate('/login?error=no_session');
        }
      } catch (err) {
        console.error('Auth callback processing error:', err);
        navigate('/login?error=callback_processing_failed');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="text-center">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="bg-blue-600 p-4 rounded-full shadow-lg">
            <MapPin className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <div className="mb-6">
          <span className="text-3xl font-bold">
            <span className="text-blue-600">Bharat</span>
            <span className="text-orange-500">Trips</span>
          </span>
        </div>
        
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying your account...</h2>
        <p className="text-gray-600 mb-4">Please wait while we complete your authentication.</p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            🔐 Your email has been verified successfully. You'll be redirected shortly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;