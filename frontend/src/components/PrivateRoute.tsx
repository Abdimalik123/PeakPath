import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || loading) return;

    const onboardingComplete = localStorage.getItem('onboarding_complete');
    if (onboardingComplete) {
      setHasProfile(true);
      setProfileChecked(true);
      return;
    }

    // Check if profile exists on the server
    client.get('/profile')
      .then(() => {
        localStorage.setItem('onboarding_complete', 'true');
        setHasProfile(true);
      })
      .catch((err) => {
        // Only redirect to onboarding if the profile genuinely doesn't exist (404).
        // On network errors or server errors (500), assume profile exists to avoid
        // wrongly redirecting returning users to onboarding.
        if (err?.response?.status === 404) {
          setHasProfile(false);
        } else {
          // Non-404 error: assume profile exists, don't block the user
          localStorage.setItem('onboarding_complete', 'true');
          setHasProfile(true);
        }
      })
      .finally(() => setProfileChecked(true));
  }, [isAuthenticated, loading]);

  if (loading || (!profileChecked && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--brand-primary)] text-lg font-medium">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasProfile && location.pathname !== '/onboarding' && location.pathname !== '/onboarding-basic') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
