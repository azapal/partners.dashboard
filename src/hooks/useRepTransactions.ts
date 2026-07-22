import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repOrderService } from '../service/repService';
import type { TransactionsQuery } from '../service/partnerService';
import { useRepProfile } from './useRepAuth';

export const repTransactionKeys = {
  all: ['repTransactions'] as const,
  list: (query: TransactionsQuery = {}) => [...repTransactionKeys.all, 'list', query] as const,
};

export const orderDriverKeys = {
  all: ['orderDrivers'] as const,
};

// Unlike useGetBranchAgents, this isn't manager-gated — assign-driver
// itself works for any employee, so the picker roster should too.
export const useGetOrderDrivers = () => {
  const profile = useRepProfile();

  return useQuery({
    queryKey: orderDriverKeys.all,
    queryFn: () => repOrderService.getDrivers(),
    enabled: !!profile,
  });
};

export const useGetRepTransactions = (query: TransactionsQuery = {}) => {
  const profile = useRepProfile();

  return useQuery({
    queryKey: repTransactionKeys.list(query),
    queryFn: () => repOrderService.getAll(query),
    enabled: !!profile,
  });
};

export const useAssignDriverToOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string | number; driverId: number }) =>
      repOrderService.assignDriver(orderId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repTransactionKeys.all });
    },
  });
};
