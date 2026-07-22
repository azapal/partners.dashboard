import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { presenceService, isManagerRole } from '../service/repService';
import { useRepProfile } from './useRepAuth';

export const agentKeys = {
  all: ['branchAgents'] as const,
  list: (branchCode?: string) => [...agentKeys.all, 'list', branchCode] as const,
};

// Manager-only endpoint — gate on role here too, not just at the route/nav
// level, so a non-manager landing on /support/team never even fires the
// request before the redirect kicks in.
export const useGetBranchAgents = () => {
  const profile = useRepProfile();
  const branchCode = profile?.branch?.branch_code;
  const isManager = isManagerRole(profile?.invite_role?.name);

  return useQuery({
    queryKey: agentKeys.list(branchCode),
    queryFn: () => presenceService.getBranchAgents(branchCode!),
    enabled: !!profile && !!branchCode && isManager,
  });
};

export const useUpdateShiftStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: 'active' | 'away') => presenceService.updateShiftStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
};
