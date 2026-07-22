import { useQuery } from '@tanstack/react-query';
import { logisticsService } from '../service/partnerService';
import type { LogisticsTransactionsQuery } from '../service/partnerService';
import { usePartnerProfile } from './useAuth';

export const logisticsKeys = {
  all: ['logisticsTransactions'] as const,
  list: (query: LogisticsTransactionsQuery = {}) => [...logisticsKeys.all, 'list', query] as const,
  pairable: (query: LogisticsTransactionsQuery = {}) => [...logisticsKeys.all, 'pairable', query] as const,
};

export const useGetLogisticsTransactions = (query: LogisticsTransactionsQuery = {}) => {
  const profile = usePartnerProfile();

  return useQuery({
    queryKey: logisticsKeys.list(query),
    queryFn: () => logisticsService.getAll(query),
    enabled: !!profile,
  });
};

export const useGetPairableGroups = (query: LogisticsTransactionsQuery = {}) => {
  const profile = usePartnerProfile();

  return useQuery({
    queryKey: logisticsKeys.pairable(query),
    queryFn: () => logisticsService.getPairable(query),
    enabled: !!profile,
  });
};
