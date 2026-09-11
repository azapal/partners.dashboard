import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  rateService,
  type CreateRatePayload,
  type UpdateRatePayload,
} from '../service/partnerService';

export const rateKeys = {
  all: ['rates'] as const,
  lists: () => [...rateKeys.all, 'list'] as const,
};

export const useGetRates = () =>
  useQuery({
    queryKey: rateKeys.lists(),
    queryFn: () => rateService.getAll(),
  });

export const useCreateRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRatePayload) => rateService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: rateKeys.lists() }),
  });
};

export const useUpdateRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRatePayload }) =>
      rateService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: rateKeys.lists() }),
  });
};

export const useDeleteRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rateService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: rateKeys.lists() }),
  });
};
