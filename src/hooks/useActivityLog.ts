import { useQueries, useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  partnerLogService,
  partnerSessionService,
  branchPartnerService,
  type PartnerLogsQuery,
  type PartnerSessionsQuery,
} from '../service/partnerService';

export const useGetPartnerLogs = (query: PartnerLogsQuery = {}) =>
  useQuery({
    queryKey: ['partner-logs', query],
    queryFn: () => partnerLogService.getAll(query),
    placeholderData: keepPreviousData,
  });

export const useGetPartnerSessions = (query: PartnerSessionsQuery = {}) =>
  useQuery({
    queryKey: ['partner-sessions', query],
    queryFn: () => partnerSessionService.getAll(query),
    placeholderData: keepPreviousData,
  });

/**
 * Resolves employee ids to display names by fetching each unique branch's
 * branch_managers list (logs/sessions only carry numeric ids, not names).
 */
export const useBranchManagerNames = (branchIds: (number | null | undefined)[]) => {
  const uniqueIds = Array.from(
    new Set(branchIds.filter((id): id is number => typeof id === 'number'))
  );

  const results = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ['branch-partners', 'detail', String(id)],
      queryFn: () => branchPartnerService.getById(String(id)),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const nameMap = new Map<number, string>();
  for (const r of results) {
    r.data?.branch_managers?.forEach((m) => {
      nameMap.set(m.id, `${m.first_name} ${m.last_name}`.trim());
    });
  }
  return nameMap;
};
