import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandingService } from '../service/partnerService';
import type { UpdateBrandingPayload } from '../service/partnerService';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';

export const brandingKeys = { all: ['document-branding'] as const };

const useSessionReady = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || !!repProfile;
};

/**
 * Read by every document preview, so it's held for the session — branding changes
 * rarely and refetching it per preview would be wasteful.
 */
export const useDocumentBranding = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: brandingKeys.all,
    queryFn: () => brandingService.get(),
    enabled,
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateBranding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBrandingPayload) => brandingService.update(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: brandingKeys.all }),
  });
};

export const useResetBranding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => brandingService.reset(),
    onSuccess: () => qc.invalidateQueries({ queryKey: brandingKeys.all }),
  });
};

/** Uploads to S3 and hands back the URL; saving it is a separate, explicit step. */
export const useUploadBrandingAsset = () =>
  useMutation({
    mutationFn: ({ kind, file }: { kind: 'logo' | 'watermark'; file: File }) =>
      brandingService.uploadAsset(kind, file),
  });
