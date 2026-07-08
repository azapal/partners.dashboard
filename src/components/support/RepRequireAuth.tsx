import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRepProfile } from '../../hooks/useRepAuth';

export const RepRequireAuth = ({ children }: { children: ReactNode }) => {
  const profile = useRepProfile();

  if (!profile) {
    return <Navigate to="/support/login" replace />;
  }

  return <>{children}</>;
};
