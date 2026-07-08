import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  inviteService,
  type CreateInvitePayload,
  type UpdateInvitePayload,
} from '../service/partnerService';

export const inviteKeys = {
  all: ['invites'] as const,
  lists: () => [...inviteKeys.all, 'list'] as const,
  detail: (id: string) => [...inviteKeys.all, 'detail', id] as const,
};

export const useGetInvites = () =>
  useQuery({
    queryKey: inviteKeys.lists(),
    queryFn: () => inviteService.getAll(),
  });

export const useCreateInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvitePayload) => inviteService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inviteKeys.lists() }),
  });
};

export const useUpdateInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInvitePayload }) =>
      inviteService.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: inviteKeys.lists() });
      qc.invalidateQueries({ queryKey: inviteKeys.detail(id) });
    },
  });
};

export const useDeleteInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inviteService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inviteKeys.lists() }),
  });
};
