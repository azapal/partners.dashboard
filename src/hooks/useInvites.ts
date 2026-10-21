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

/**
 * `silent` turns off the per-call FeedbackModal (both outcomes) for the bulk
 * invite, which shows each row's result in its table and one summary at the end.
 */
export const useCreateInvite = ({ silent = false }: { silent?: boolean } = {}) => {
  const qc = useQueryClient();
  return useMutation({
    meta: silent ? { silentSuccess: true, silentError: true } : { successMessage: 'Invite sent.' },
    mutationFn: (payload: CreateInvitePayload) => inviteService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inviteKeys.lists() }),
  });
};

export const useUpdateInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    // Silent on success: one hook covers edit, suspend, reactivate and
    // terminate, so the caller says which it was (UserManagementScreen).
    meta: { silentSuccess: true },
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
    meta: { successMessage: 'User deleted.' },
    mutationFn: (id: string) => inviteService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inviteKeys.lists() }),
  });
};
