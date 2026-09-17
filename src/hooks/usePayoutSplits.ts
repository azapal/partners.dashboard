import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payoutSplitService } from '../service/partnerService';
import type {
  CreatePayoutSplitPayload,
  PayoutSplitStatus,
} from '../service/partnerService';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';

export const payoutSplitKeys = {
  all: ['payout-splits'] as const,
  list: (status?: string) => [...payoutSplitKeys.all, 'list', status ?? 'default'] as const,
  settlements: (id: number) => [...payoutSplitKeys.all, 'settlements', id] as const,
};

const useSessionReady = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || !!repProfile;
};

export const useGetPayoutSplits = (status?: PayoutSplitStatus | 'all') => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: payoutSplitKeys.list(status),
    queryFn: () => payoutSplitService.getAll(status),
    enabled,
  });
};

export const useCreatePayoutSplit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayoutSplitPayload) => payoutSplitService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: payoutSplitKeys.all }),
  });
};

export const useUpdatePayoutSplit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreatePayoutSplitPayload> }) =>
      payoutSplitService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: payoutSplitKeys.all }),
  });
};

/** Status changes can clear a default, so the whole namespace goes stale. */
export const useSetPayoutSplitStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: PayoutSplitStatus }) =>
      payoutSplitService.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: payoutSplitKeys.all }),
  });
};

export const useSetDefaultPayoutSplit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, branchId }: { id: number; branchId?: number | null }) =>
      payoutSplitService.setDefault(id, branchId),
    onSuccess: () => qc.invalidateQueries({ queryKey: payoutSplitKeys.all }),
  });
};

/** Only fetched when a split's history is actually opened. */
export const useSplitSettlements = (id: number | null) => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: payoutSplitKeys.settlements(id ?? 0),
    queryFn: () => payoutSplitService.getSettlements(id as number),
    enabled: enabled && !!id,
  });
};
