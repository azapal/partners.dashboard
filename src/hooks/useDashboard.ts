import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../service/partnerService';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';

export const useGetDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });

/** Which parts of Azapal this partner actually uses — the workspace's "Your activity". */
export const useWorkspaceFeatureUsage = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return useQuery({
    queryKey: ['dashboard-feature-usage'],
    queryFn: () => dashboardService.getFeatureUsage(),
    enabled: !!partnerProfile || !!repProfile,
    staleTime: 60 * 1000,
  });
};
