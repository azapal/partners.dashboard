import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { splitService, type SplitMember } from '../service/partnerService';

export const splitKeys = {
  all: ['partner-split'] as const,
  scoped: (branchId?: number | null) => [...splitKeys.all, branchId ?? 'default'] as const,
};

export const useGetPartnerSplit = (branchId?: number | null) =>
  useQuery({ queryKey: splitKeys.scoped(branchId), queryFn: () => splitService.get(branchId) });

export const useSavePartnerSplit = (branchId?: number | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, members }: { name?: string; members: SplitMember[] }) => splitService.save(name, members, branchId),
    onSuccess: () => qc.invalidateQueries({ queryKey: splitKeys.all }),
  });
};
