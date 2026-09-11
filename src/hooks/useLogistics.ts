import { useQuery } from '@tanstack/react-query';
import { logisticsService } from '../service/partnerService';
import type { LogisticsTransactionsQuery } from '../service/partnerService';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';

export const logisticsKeys = {
  all: ['logisticsTransactions'] as const,
  list: (query: LogisticsTransactionsQuery = {}) => [...logisticsKeys.all, 'list', query] as const,
  pairable: (query: LogisticsTransactionsQuery = {}) => [...logisticsKeys.all, 'pairable', query] as const,
};

// !!partnerProfile || !!repProfile — a Tenant Admin/Super Admin employee (the
// only rep roles that ever reach this route, per RequireAuth) needs these
// queries to fire too, not just a partner-owner session.
export const useGetLogisticsTransactions = (query: LogisticsTransactionsQuery = {}) => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();

  return useQuery({
    queryKey: logisticsKeys.list(query),
    queryFn: () => logisticsService.getAll(query),
    enabled: !!partnerProfile || !!repProfile,
  });
};

export const useGetPairableGroups = (query: LogisticsTransactionsQuery = {}) => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();

  return useQuery({
    queryKey: logisticsKeys.pairable(query),
    queryFn: () => logisticsService.getPairable(query),
    enabled: !!partnerProfile || !!repProfile,
  });
};
