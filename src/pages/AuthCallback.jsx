import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function AuthCallback() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const loginToken = searchParams.get('token');
        const redirectTo = searchParams.get('redirect');

        // Handle error from URL params
        if (error) {
          console.error('Auth callback error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || error);
          return;
        }

        // Handle login token from email
        if (loginToken) {
          console.log('Processing login token...');
          
          // Import NotificationService dynamically to avoid circular imports
          const { default: NotificationService } = await import('@/services/NotificationService');
          const tokenResult = NotificationService.verifyLoginToken(loginToken);
          
          if (!tokenResult.valid) {
            console.error('Invalid login token:', tokenResult.error);
            setStatus('error');
            setMessage(tokenResult.error || 'Invalid or expired login link');
            return;
          }

          // Get user data and create session
          const { User, TourBooking } = await import('@/api/entities');
          
          let user;
          if (tokenResult.userId === 'guest' && tokenResult.storageKey) {
            // This is a guest booking - get booking data from localStorage
            try {
              const bookingDataStr = localStorage.getItem(tokenResult.storageKey);
              if (!bookingDataStr) {
                setStatus('error');
                setMessage('Booking data not found. Please try booking again.');
                return;
              }

              const bookingData = JSON.parse(bookingDataStr);

              // Create user account
              user = await User.create({
                email: bookingData.contact_email,
                full_name: bookingData.contact_name,
                phone: bookingData.contact_phone,
                role: 'tourist',
                is_active: true,
                created_via_booking: true
              });

              // Clean up localStorage
              localStorage.removeItem(tokenResult.storageKey);
              
              console.log('Created user account for guest booking:', user.id);
            } catch (error) {
              console.error('Error creating user from guest booking:', error);
              setStatus('error');
              setMessage('Failed to create user account');
              return;
            }
          } else {
            user = await User.get(tokenResult.userId);
            if (!user) {
              setStatus('error');
              setMessage('User account not found');
              return;
            }
          }

          // Create a simple session (in a real app, you'd use proper authentication)
          localStorage.setItem('user_session', JSON.stringify({
            user_id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            authenticated_at: Date.now()
          }));

          setStatus('success');
          setMessage('Successfully logged in! Redirecting to your dashboard...');
          
          // Redirect to the specified page or tourist dashboard
          setTimeout(() => {
            navigate(createPageUrl(redirectTo || 'TouristDashboard'));
          }, 2000);
          
          return;
        }

        // Handle email confirmation
        if (tokenHash && type) {
          console.log('Processing auth callback:', { type, tokenHash: tokenHash.substring(0, 10) + '...' });
          
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type
          });

          if (verifyError) {
            console.error('Email verification error:', verifyError);
            setStatus('error');
            setMessage(verifyError.message || 'Email verification failed');
            return;
          }

          if (data.user) {
            console.log('Email verification successful:', data.user.email);
            setStatus('success');
            setMessage('Email verified successfully! You can now log in.');
            
            // Redirect to login page after a short delay
            setTimeout(() => {
              navigate(createPageUrl('Login'));
            }, 3000);
          } else {
            setStatus('error');
            setMessage('Email verification failed - no user data received');
          }
        } else {
          // No token hash or type - might be a different auth flow
          console.log('No token hash or type found, checking session...');
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            setStatus('error');
            setMessage('Authentication failed');
            return;
          }

          if (session) {
            console.log('User already authenticated, redirecting to home');
            setStatus('success');
            setMessage('Already authenticated, redirecting...');
            setTimeout(() => {
              navigate(createPageUrl('Home'));
            }, 2000);
          } else {
            setStatus('error');
            setMessage('No authentication data found');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during authentication');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoToLogin = () => {
    navigate(createPageUrl('Login'));
  };

  const handleGoToRegister = () => {
    navigate(createPageUrl('Register'));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {status === 'loading' && (
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-12 w-12 text-green-600" />
              )}
              {status === 'error' && (
                <XCircle className="h-12 w-12 text-red-600" />
              )}
            </div>
            
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Verifying...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            
            <CardDescription>
              {status === 'loading' && 'Please wait while we verify your email...'}
              {status === 'success' && message}
              {status === 'error' && message}
            </CardDescription>
          </CardHeader>
          
          {(status === 'success' || status === 'error') && (
            <CardContent className="space-y-4">
              {status === 'success' && (
                <div className="space-y-2">
                  <Button 
                    onClick={handleGoToLogin}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>
              )}
              
              {status === 'error' && (
                <div className="space-y-2">
                  <Button 
                    onClick={handleRetry}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={handleGoToLogin}
                    variant="outline"
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                  <Button 
                    onClick={handleGoToRegister}
                    variant="ghost"
                    className="w-full"
                  >
                    Back to Registration
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}