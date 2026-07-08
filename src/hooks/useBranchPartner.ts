import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  branchPartnerService,
  type CreateBranchPayload,
  type UpdateBranchPayload,
} from '../service/partnerService';

export const branchKeys = {
  all: ['branch-partners'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  detail: (id: string) => [...branchKeys.all, 'detail', id] as const,
};

export const useGetBranches = () =>
  useQuery({
    queryKey: branchKeys.lists(),
    queryFn: () => branchPartnerService.getAll(),
  });

export const useCreateBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBranchPayload) => branchPartnerService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: branchKeys.lists() }),
  });
};

export const useUpdateBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBranchPayload }) =>
      branchPartnerService.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: branchKeys.lists() });
      qc.invalidateQueries({ queryKey: branchKeys.detail(id) });
    },
  });
};

export const useDeleteBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => branchPartnerService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: branchKeys.lists() }),
  });
};
