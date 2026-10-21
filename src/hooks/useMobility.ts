import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  mobilityService,
  type MobilityAppAction,
  type MobilityProduct,
} from '../service/partnerService';
import { platformBillingKeys } from './usePlatformBilling';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';
import { isElevatedAdminRole } from '../service/repService';

/**
 * The partner's mobile apps, and who to call at sales.
 *
 * The apps endpoint is for the partner owner and elevated admins only. Any other
 * rep would get a 403, which fetchWithAuth treats as a dead session — so the
 * query is enabled only for the sessions it actually serves, as useOnboarding is.
 */

export const mobilityKeys = {
  all: ['mobility'] as const,
  apps: () => [...mobilityKeys.all, 'apps'] as const,
  salesContact: () => [...mobilityKeys.all, 'sales-contact'] as const,
};

const useCanManageApps = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || isElevatedAdminRole(repProfile?.invite_role?.name);
};

export const useMobilityApps = () => {
  const enabled = useCanManageApps();
  return useQuery({
    queryKey: mobilityKeys.apps(),
    queryFn: () => mobilityService.list(),
    enabled,
  });
};

export const useSalesContact = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return useQuery({
    queryKey: mobilityKeys.salesContact(),
    queryFn: () => mobilityService.salesContact(),
    enabled: !!partnerProfile || !!repProfile,
    staleTime: 30 * 60 * 1000,
  });
};

/*
 * Save and the app actions are silent on success: what to say depends on the
 * product, the step, and whether a request saved first, so AppStatusCard says it
 * once with feedbackActions. Failures still go to the FeedbackModal from here.
 * Image uploads are silent because they only fill a field until the next save.
 */
export const useSaveMobilityApp = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { silentSuccess: true },
    mutationFn: ({ product, config }: { product: MobilityProduct; config: object }) =>
      mobilityService.save(product, config),
    onSuccess: () => qc.invalidateQueries({ queryKey: mobilityKeys.apps() }),
  });
};

export const useMobilityAppAction = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { silentSuccess: true },
    mutationFn: ({ product, action }: { product: MobilityProduct; action: MobilityAppAction }) =>
      mobilityService.act(product, action),
    onSuccess: (_app, { action }) => {
      qc.invalidateQueries({ queryKey: mobilityKeys.apps() });
      // Accepting a quote writes a usage row, so the Bills screen is stale.
      if (action === 'accept') qc.invalidateQueries({ queryKey: platformBillingKeys.all });
    },
  });
};

export const useUploadAppImage = () =>
  useMutation({
    meta: { silentSuccess: true },
    mutationFn: ({ kind, file }: { kind: 'app_logo' | 'app_media'; file: File }) =>
      mobilityService.uploadImage(kind, file),
  });
