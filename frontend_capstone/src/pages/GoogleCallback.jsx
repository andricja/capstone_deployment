import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('GoogleCallback: Processing callback...');
        console.log('URL params:', window.location.href);
        
        // Get data from query parameters (sent by backend)
        const success = searchParams.get('success');
        const token = searchParams.get('token');
        const userJson = searchParams.get('user');

        console.log('Parsed params:', { success, hasToken: !!token, hasUser: !!userJson });

        if (success === 'true' && token && userJson) {
          console.log('Parsing user data...');
          const user = JSON.parse(userJson);
          console.log('User:', user);

          // Store token
          localStorage.setItem('token', token);
          console.log('Token stored');

          // Update auth context
          setUser(user);
          console.log('Auth context updated');

          // Get pre-auth URL or redirect to dashboard
          const preAuthUrl = sessionStorage.getItem('preAuthUrl');
          sessionStorage.removeItem('preAuthUrl');

          const targetUrl = (preAuthUrl && preAuthUrl !== '/') ? preAuthUrl : `/${user.role}/dashboard`;
          console.log('Redirecting to:', targetUrl);

          navigate(targetUrl);
        } else {
          console.error('Missing required data:', { success, hasToken: !!token, hasUser: !!userJson });
          throw new Error('Authentication failed - missing required data');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        console.error('Error details:', error.message, error.stack);
        toast.error('Failed to sign in with Google. Please try again.');
        navigate('/?error=google_auth_failed');
      }
    };

    handleCallback();
  }, [navigate, setUser, toast, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Please wait while we verify your Google account
        </p>
      </div>
    </div>
  );
}
