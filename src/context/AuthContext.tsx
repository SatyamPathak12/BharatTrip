import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'host' | 'admin';
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; errorMessage?: string }>;
  signup: (email: string, password: string, name: string, isHost: boolean) => Promise<{ success: boolean; needsVerification?: boolean; errorMessage?: string }>;
  verifyOTP: (otp: string) => Promise<boolean>;
  skipVerification: () => Promise<boolean>;
  sendMagicLink: (email: string) => Promise<boolean>;
  resendOTP: () => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  pendingEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Check for existing session on mount
  React.useEffect(() => {
    const getSession = async () => {
      try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if user needs email verification
        if (!session.user.email_confirmed_at) {
          console.log('User session found but email not confirmed, setting pending email');
          setPendingEmail(session.user.email || '');
          setUser(null); // Don't set user until verified
            setAuthInitialized(true);
          return;
        }
          await loadUserProfile(session.user);
        } else {
          console.log('No existing session found');
      }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setAuthInitialized(true);
      }
    };
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if user needs email verification
        if (!session.user.email_confirmed_at) {
          console.log('User signed in but email not confirmed, setting pending email');
          setPendingEmail(session.user.email || '');
          setUser(null); // Don't set user until verified
          return;
        }
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPendingEmail(null);
      }
      setAuthInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    console.log('Loading user profile for:', supabaseUser.id);
    console.log('User email_confirmed_at in loadUserProfile:', supabaseUser.email_confirmed_at);
    try {
      // Create user object directly from Supabase auth data
      // This avoids database dependency issues
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || 'User',
        role: supabaseUser.user_metadata?.role || 'user',
        isVerified: !!supabaseUser.email_confirmed_at,
      };

      console.log('User verification status:', userData.isVerified);
      setUser(userData);
      console.log('User state updated from auth data');
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      // Create user object as fallback
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || 'User',
        role: 'user',
        isVerified: false, // Default to unverified in error case
      };
      setUser(userData);
      console.log('User state updated with catch fallback data');
    }
  };
  

  const login = async (email: string, password: string): Promise<{ success: boolean; errorMessage?: string }> => {
    console.log('Starting login process...');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase auth response:', { data: !!data, error: error?.message });

      if (error) {
        console.error('Login error:', error.message);
        setIsLoading(false);
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, errorMessage: 'Invalid email or password. Please check your credentials and try again.' };
        } else if (error.message.includes('Email not confirmed')) {
          return { success: false, errorMessage: 'Please verify your email address before logging in.' };
        } else {
          return { success: false, errorMessage: error.message };
        }
      }

      if (data.user) {
        console.log('Login successful, loading profile...');
        await loadUserProfile(data.user);
        console.log('Profile loading completed');
        return { success: true };
      }

      console.log('No user data received');
      setIsLoading(false);
      return { success: false, errorMessage: 'Login failed. Please try again.' };
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { success: false, errorMessage: 'Network error occurred. Please check your connection and try again.' };
    }
  };

  const signup = async (email: string, password: string, name: string, isHost: boolean): Promise<{ success: boolean; needsVerification?: boolean; errorMessage?: string }> => {
    console.log('Starting signup process...');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: isHost ? 'host' : 'user',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      console.log('Supabase signup response:', { data: !!data, error: error?.message });
      console.log('User email_confirmed_at:', data.user?.email_confirmed_at);
      console.log('Session exists:', !!data.session);

      if (error) {
        console.error('Signup error:', error.message);
        setIsLoading(false);
        
        // Handle specific error cases
        if (error.message.includes('User already registered') || error.message.includes('user_already_exists')) {
          return { success: false, errorMessage: 'This email is already registered. Please use a different email or try logging in instead.' };
        } else if (error.message.includes('Password should be at least')) {
          return { success: false, errorMessage: 'Password must be at least 6 characters long.' };
        } else if (error.message.includes('Invalid email')) {
          return { success: false, errorMessage: 'Please enter a valid email address.' };
        } else {
          return { success: false, errorMessage: `Account creation failed: ${error.message}` };
        }
      }

      if (data.user) {
        console.log('User created successfully');
        
        // Check if email is already confirmed or if we have a session
        if (data.user.email_confirmed_at || data.session) {
          console.log('User email already confirmed or session exists, logging in directly');
          await loadUserProfile(data.user);
          setIsLoading(false);
          return { success: true, needsVerification: false };
        } else {
          console.log('User created but needs verification, setting pending email...');
          setPendingEmail(email);
          setIsLoading(false);
          return { success: true, needsVerification: true };
        }
      }

      console.log('No user data received from signup');
      setIsLoading(false);
      return { success: false, errorMessage: 'Account creation failed. Please try again.' };
    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);
      return { success: false, errorMessage: 'Network error occurred. Please check your internet connection and try again.' };
    }
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    console.log('Starting OTP verification for:', pendingEmail);
    setIsLoading(true);
    try {
      if (!pendingEmail) {
        console.error('No pending email for OTP verification');
        setIsLoading(false);
        return false;
      }

      console.log('Calling Supabase verifyOtp...');
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otp,
        type: 'signup'
      });

      console.log('OTP verification response:', { data: !!data, error: error?.message });

      if (error) {
        console.error('OTP verification error:', error.message);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        console.log('OTP verification successful, creating user object...');
        // Create user object directly from auth data
        const userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || 'User',
          role: data.user.user_metadata?.role || 'user',
          isVerified: true, // OTP verified means email is confirmed
        };

        setUser(userData);
        console.log('User state updated after OTP verification');
        
        setPendingEmail(null);
        setIsLoading(false);
        console.log('OTP verification completed successfully');
        return true;
      }

      console.log('No user data received from OTP verification');
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('OTP verification error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const sendMagicLink = async (email: string): Promise<boolean> => {
    console.log('Sending magic link to:', email);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create new users via magic link
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            redirect_to: `${window.location.origin}/otp-verification`
          }
        }
      });

      console.log('Magic link response:', { data, error: error?.message });

      if (error) {
        console.error('Magic link error:', error.message);
        setIsLoading(false);
        return false;
      }

      console.log('Magic link sent successfully to:', email);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Magic link error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const resendOTP = async (): Promise<boolean> => {
    console.log('Resending OTP to:', pendingEmail);
    if (!pendingEmail) {
      console.error('No pending email for OTP resend');
      return false;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            redirect_to: `${window.location.origin}/otp-verification`
          }
        }
      });

      console.log('OTP resend response:', { data, error: error?.message });

      if (error) {
        console.error('OTP resend error:', error.message);
        setIsLoading(false);
        return false;
      }

      console.log('OTP resent successfully');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('OTP resend error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const skipVerification = async (): Promise<boolean> => {
    console.log('Skipping verification for:', pendingEmail);
    if (!pendingEmail) {
      console.error('No pending email to skip verification for');
      return false;
    }

    setIsLoading(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('Creating user profile without verification...');
        // Create user object directly from auth data
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'User',
          role: session.user.user_metadata?.role || 'user',
          isVerified: false, // Mark as unverified since we're skipping
        };

        setUser(userData);
        setPendingEmail(null);
        console.log('User profile created without verification');
        setIsLoading(false);
        return true;
      }

      console.log('No session found for skip verification');
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Skip verification error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setPendingEmail(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      verifyOTP,
      skipVerification,
      sendMagicLink,
      resendOTP,
      logout,
      isLoading,
      pendingEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
};