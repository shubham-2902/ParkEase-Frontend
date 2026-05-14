import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/ui/Spinner';
import { TOKEN_KEY, REFRESH_KEY, USER_KEY } from '../../utils/constants';

/**
 * OAuthCallbackPage — handles redirect from Google OAuth2.
 *
 * Spring Security redirects to:
 * http://localhost:3000/oauth2/callback
 *   ?token=<jwt>
 *   &userId=<id>
 *   &role=<DRIVER|MANAGER|ADMIN>
 *
 * This page:
 * 1. Reads token + userId + role from URL params
 * 2. Stores them in localStorage
 * 3. Updates AuthContext
 * 4. Redirects to correct dashboard
 */
const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { storeAuth }  = useAuth();

  useEffect(() => {
    const token         = searchParams.get('token');
    const refreshToken  = searchParams.get('refreshToken');
    const userId        = searchParams.get('userId');
    const role          = searchParams.get('role');
    const fullName      = searchParams.get('fullName');
    const email         = searchParams.get('email');
    const phone         = searchParams.get('phone');
    const isActive      = searchParams.get('isActive');
    const vehiclePlate  = searchParams.get('vehiclePlate');
    const profilePicUrl = searchParams.get('profilePicUrl');
    const provider      = searchParams.get('provider') || 'google';
    const createdAt     = searchParams.get('createdAt');
    const error         = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    if (token && userId && role) {
      const userObj = {
        id:            parseInt(userId),
        role,
        fullName:      fullName || '',
        email:         email    || '',
        phone:         phone    || '',
        isActive:      isActive === 'true',
        vehiclePlate:  vehiclePlate  || '',
        profilePicUrl: profilePicUrl || '',
        provider,
        createdAt,
      };

      storeAuth(token, userObj, refreshToken);

      // Redirect to correct dashboard
      const dashboardMap = {
        DRIVER:  '/driver/dashboard',
        MANAGER: '/manager/dashboard',
        ADMIN:   '/admin/dashboard',
      };

      navigate(dashboardMap[role] || '/', { replace: true });
    } else {
      // Missing params — go back to login
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <PageLoader message="Completing Google sign in..." />
  );
};

export default OAuthCallbackPage;