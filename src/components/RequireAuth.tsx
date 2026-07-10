import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePartnerProfile } from '../hooks/useAuth';

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const profile = usePartnerProfile();

  if (!profile) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
