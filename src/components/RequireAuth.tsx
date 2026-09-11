import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePartnerProfile } from '../hooks/useAuth';
import { useRepProfile } from '../hooks/useRepAuth';
import { isElevatedAdminRole } from '../service/repService';

// A partner-owner session always passes (unchanged). A rep/employee session
// also passes, but only for Tenant Admin/Super Admin — the two roles given
// full main-dashboard parity; every other role stays confined to /support/*
// via RepRequireAuth, unaffected by this check.
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();

  const allowed = !!partnerProfile || isElevatedAdminRole(repProfile?.invite_role?.name);

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
