import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationPreferenceService } from '../service/partnerService';
import type { NotificationPreferenceRow } from '../service/partnerService';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';

export const notificationPreferenceKeys = {
  all: ['notification-preferences'] as const,
  scope: (branchId?: number | null) => [...notificationPreferenceKeys.all, branchId ?? 'partner'] as const,
};

const useSessionReady = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || !!repProfile;
};

export const useNotificationPreferences = (branchId?: number | null) => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: notificationPreferenceKeys.scope(branchId),
    queryFn: () => notificationPreferenceService.get(branchId),
    enabled,
  });
};

export const useSaveNotificationPreferences = (branchId: number | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (preferences: Omit<NotificationPreferenceRow, 'label'>[]) =>
      notificationPreferenceService.save(branchId, preferences),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationPreferenceKeys.all }),
  });
};
