import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shiftService } from '../service/repService';
import type { EscalatePayload } from '../service/repService';
import { useRepProfile } from './useRepAuth';

export const shiftMateKeys = {
  all: ['shiftMates'] as const,
  list: (branchCode?: string) => [...shiftMateKeys.all, 'list', branchCode] as const,
};

export const useGetShiftMates = () => {
  const profile = useRepProfile();

  return useQuery({
    queryKey: shiftMateKeys.list(profile?.branch?.branch_code),
    queryFn: () => shiftService.getTeamMembers(profile!.branch?.branch_code ?? ''),
    enabled: !!profile,
  });
};

export const useEscalate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EscalatePayload) => shiftService.escalate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftMateKeys.all });
    },
  });
};
