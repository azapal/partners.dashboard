import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { virtualAccountService, type CreateVirtualAccountPayload } from '../service/partnerService';
import { walletKeys } from './useWallet';

export const virtualAccountKeys = {
  all: ['virtual-accounts'] as const,
  lists: () => [...virtualAccountKeys.all, 'list'] as const,
  list: (branchId?: number | null) => [...virtualAccountKeys.lists(), branchId ?? 'default'] as const,
};

export const useGetVirtualAccounts = (branchId?: number | null) =>
  useQuery({ queryKey: virtualAccountKeys.list(branchId), queryFn: () => virtualAccountService.getAll(branchId) });

export const useCreateVirtualAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVirtualAccountPayload) => virtualAccountService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: virtualAccountKeys.lists() });
      qc.invalidateQueries({ queryKey: walletKeys.hasAnyAccount() });
    },
  });
};

export const useDeactivateVirtualAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountNumber: string) => virtualAccountService.deactivate(accountNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: virtualAccountKeys.lists() }),
  });
};
