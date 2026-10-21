import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  pairingRouteService,
  type CreatePairingRoutePayload,
  type UpdatePairingRoutePayload,
  type BudgetTargetPreviewPayload,
} from '../service/partnerService';

// `all` also covers the marketplace's route board (['pairing-routes', 'board', …]),
// so a create/edit/delete here refreshes the board.
export const pairingRouteKeys = {
  all: ['pairing-routes'] as const,
  lists: () => [...pairingRouteKeys.all, 'list'] as const,
};

/**
 * Your own routes. `enabled` lets a page that is also public (the pairing
 * routes board) skip this partner-only call for a signed-out visitor.
 */
export const useGetPairingRoutes = (enabled = true) =>
  useQuery({
    queryKey: pairingRouteKeys.lists(),
    queryFn: () => pairingRouteService.getAll(),
    enabled,
  });

export const useCreatePairingRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Route created.' },
    mutationFn: (payload: CreatePairingRoutePayload) => pairingRouteService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: pairingRouteKeys.all }),
  });
};

export const useUpdatePairingRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Route updated.' },
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePairingRoutePayload }) =>
      pairingRouteService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: pairingRouteKeys.all }),
  });
};

export const useDeletePairingRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Route deleted.' },
    mutationFn: (id: number) => pairingRouteService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: pairingRouteKeys.all }),
  });
};

export const useBudgetTargetPreview = () => {
  return useMutation({
    meta: { silentSuccess: true },
    mutationFn: ({ id, payload }: { id: number; payload: BudgetTargetPreviewPayload }) =>
      pairingRouteService.getBudgetTarget(id, payload),
  });
};
