import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../service/partnerService';

export const useGetDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });
