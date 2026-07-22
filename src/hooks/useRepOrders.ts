import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repConversationService, repOrderService } from '../service/repService';
import type { ConversationScope } from '../service/repService';
import { useRepProfile } from './useRepAuth';

export const repConversationKeys = {
  all: ['repConversations'] as const,
  list: (scope: ConversationScope = 'mine') => [...repConversationKeys.all, 'list', scope] as const,
  detail: (phone: string) => [...repConversationKeys.all, 'detail', phone] as const,
};

export const useGetRepOrders = (scope: ConversationScope = 'mine', enabled = true) => {
  const profile = useRepProfile();

  return useQuery({
    queryKey: repConversationKeys.list(scope),
    queryFn: () => repConversationService.getAll(scope),
    enabled: !!profile && enabled,
  });
};

export const useGetConversationDetail = (phone: string) => {
  const profile = useRepProfile();

  return useQuery({
    queryKey: repConversationKeys.detail(phone),
    queryFn: () => repConversationService.getDetail(phone),
    enabled: !!profile && !!phone,
  });
};

// Same queryKey + queryFn as useGetRepOrders('mine') on purpose — this
// shares that hook's cache entry (one network call between both, however
// many components use either) instead of independently re-fetching the
// same list just to derive counts from it.
export const useGetRepMetrics = () => {
  const profile = useRepProfile();

  return useQuery({
    queryKey: repConversationKeys.list('mine'),
    queryFn: () => repConversationService.getAll('mine'),
    select: (conversations) => ({
      total_assigned: conversations.length,
      pending: conversations.filter((c) => c.status === 'active').length,
      completed: conversations.filter((c) => c.status === 'resolved').length,
      failed: 0,
    }),
    enabled: !!profile,
  });
};

export const useResolveConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (phone: string) => repConversationService.resolve(phone),
    onSuccess: (_data, phone) => {
      queryClient.invalidateQueries({ queryKey: repConversationKeys.all });
      queryClient.invalidateQueries({ queryKey: repConversationKeys.detail(phone) });
    },
  });
};

export const useClaimConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (phone: string) => repConversationService.claim(phone),
    onSuccess: (_data, phone) => {
      queryClient.invalidateQueries({ queryKey: repConversationKeys.all });
      queryClient.invalidateQueries({ queryKey: repConversationKeys.detail(phone) });
    },
  });
};

export const useEscalateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phone, note }: { phone: string; note: string }) => repConversationService.escalate(phone, note),
    onSuccess: (_data, { phone }) => {
      queryClient.invalidateQueries({ queryKey: repConversationKeys.all });
      queryClient.invalidateQueries({ queryKey: repConversationKeys.detail(phone) });
    },
  });
};

export const useTakeOverConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (phone: string) => repConversationService.takeOver(phone),
    onSuccess: (_data, phone) => {
      queryClient.invalidateQueries({ queryKey: repConversationKeys.all });
      queryClient.invalidateQueries({ queryKey: repConversationKeys.detail(phone) });
    },
  });
};

export const useReassignConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phone, employeeId }: { phone: string; employeeId: number }) =>
      repConversationService.reassign(phone, employeeId),
    onSuccess: (_data, { phone }) => {
      queryClient.invalidateQueries({ queryKey: repConversationKeys.all });
      queryClient.invalidateQueries({ queryKey: repConversationKeys.detail(phone) });
    },
  });
};

// phone is passed through only to invalidate that conversation's detail
// query — assign-driver itself is keyed on the order id, not the phone.
export const useAssignDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string | number; driverId: number; phone: string }) =>
      repOrderService.assignDriver(orderId, driverId),
    onSuccess: (_data, { phone }) => {
      queryClient.invalidateQueries({ queryKey: repConversationKeys.detail(phone) });
    },
  });
};
