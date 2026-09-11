import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  pairingRouteService,
  type CreatePairingRoutePayload,
  type UpdatePairingRoutePayload,
  type BudgetTargetPreviewPayload,
} from '../service/partnerService';

export const pairingRouteKeys = {
  all: ['pairing-routes'] as const,
  lists: () => [...pairingRouteKeys.all, 'list'] as const,
};

export const useGetPairingRoutes = () =>
  useQuery({
    queryKey: pairingRouteKeys.lists(),
    queryFn: () => pairingRouteService.getAll(),
  });

export const useCreatePairingRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePairingRoutePayload) => pairingRouteService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: pairingRouteKeys.lists() }),
  });
};

export const useUpdatePairingRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePairingRoutePayload }) =>
      pairingRouteService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: pairingRouteKeys.lists() }),
  });
};

export const useDeletePairingRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => pairingRouteService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: pairingRouteKeys.lists() }),
  });
};

export const useBudgetTargetPreview = () => {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BudgetTargetPreviewPayload }) =>
      pairingRouteService.getBudgetTarget(id, payload),
  });
};
