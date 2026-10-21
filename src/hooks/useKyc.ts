import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onboardingService, partnerKycService, type KycDocumentKind } from '../service/partnerService';
import { platformBillingKeys } from './usePlatformBilling';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';
import { isElevatedAdminRole } from '../service/repService';

/**
 * Verification, and how far the partner has got setting up.
 *
 * Both are read all over the app — a banner on the workspace, a gate on the
 * screens that cost money — so they share one cache and one set of keys.
 */

export const kycKeys = {
  all: ['partner-kyc'] as const,
  state: () => [...kycKeys.all, 'state'] as const,
  onboarding: () => [...kycKeys.all, 'onboarding'] as const,
};

const useSessionReady = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || !!repProfile;
};

export const useKycState = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: kycKeys.state(),
    queryFn: () => partnerKycService.get(),
    enabled,
  });
};

/**
 * The checklist, whether the dashboard can open at all, and whether the billable
 * features are shut.
 *
 * Asked for on every dashboard screen, so it is enabled only for the sessions
 * the endpoint actually serves — the partner owner and elevated admins. A rep
 * without those rights would get a 403, and fetchWithAuth treats a 403 as a
 * dead session and signs them out.
 */
export const useOnboarding = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  const enabled = !!partnerProfile || isElevatedAdminRole(repProfile?.invite_role?.name);
  return useQuery({
    queryKey: kycKeys.onboarding(),
    queryFn: () => onboardingService.get(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Skip billing setup for now. Writes the answer straight into the onboarding
 * cache, so the gate in DashboardLayout opens on the next render rather than
 * after a refetch. Silent on success: the dashboard opening is the answer.
 */
export const useSkipBillingSetup = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { silentSuccess: true },
    mutationFn: () => onboardingService.skipBilling(),
    onSuccess: (state) => qc.setQueryData(kycKeys.onboarding(), state),
  });
};

export const useUploadKycDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Document uploaded.' },
    mutationFn: ({ kind, file }: { kind: KycDocumentKind; file: File }) => partnerKycService.upload(kind, file),
    onSuccess: (state) => {
      qc.setQueryData(kycKeys.state(), state);
      qc.invalidateQueries({ queryKey: kycKeys.onboarding() });
    },
  });
};

export const useSubmitKyc = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Sent for verification. We'll email you when it's checked." },
    mutationFn: () => partnerKycService.submit(),
    onSuccess: (state) => {
      qc.setQueryData(kycKeys.state(), state);
      qc.invalidateQueries({ queryKey: kycKeys.onboarding() });
      // Being verified opens up what a branch can be billed for, so the
      // billing screens are stale the moment this changes.
      qc.invalidateQueries({ queryKey: platformBillingKeys.all });
    },
  });
};
