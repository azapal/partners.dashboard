import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repConversationService } from '../service/repService';
import { useRepProfile } from './useRepAuth';

export const repConversationKeys = {
  all: ['repConversations'] as const,
  list: () => [...repConversationKeys.all, 'list'] as const,
  detail: (phone: string) => [...repConversationKeys.all, 'detail', phone] as const,
};

export const useGetRepOrders = () => {
  const profile = useRepProfile();

  return useQuery({
    queryKey: repConversationKeys.list(),
    queryFn: () => repConversationService.getAll(),
    enabled: !!profile,
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

export const useGetRepMetrics = () => {
  const profile = useRepProfile();

  return useQuery({
    queryKey: [...repConversationKeys.list(), 'metrics'],
    queryFn: async () => {
      const conversations = await repConversationService.getAll();
      return {
        total_assigned: conversations.length,
        pending: conversations.filter((c) => c.status === 'active').length,
        completed: conversations.filter((c) => c.status === 'resolved').length,
        failed: 0,
      };
    },
    enabled: !!profile,
  });
};

export const useResolveConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (phone: string) => repConversationService.resolve(phone),
    onSuccess: (_data, phone) => {
      queryClient.invalidateQueries({ queryKey: repConversationKeys.list() });
      queryClient.invalidateQueries({ queryKey: repConversationKeys.detail(phone) });
    },
  });
};
