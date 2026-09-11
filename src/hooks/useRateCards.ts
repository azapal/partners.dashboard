import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  routeRateCardService,
  cargoRateCardService,
  deliveryMethodRateCardService,
  type CreateRouteRateCardPayload,
  type UpdateRouteRateCardPayload,
  type CreateCargoRateCardPayload,
  type UpdateCargoRateCardPayload,
  type CreateDeliveryMethodRateCardPayload,
  type UpdateDeliveryMethodRateCardPayload,
} from '../service/partnerService';

// ── Route Rate Cards ──────────────────────────────────────────────────────────

export const routeRateKeys = {
  all: ['route-rates'] as const,
  lists: () => [...routeRateKeys.all, 'list'] as const,
};

export const useGetRouteRates = () =>
  useQuery({ queryKey: routeRateKeys.lists(), queryFn: () => routeRateCardService.getAll() });

export const useCreateRouteRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRouteRateCardPayload) => routeRateCardService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: routeRateKeys.lists() }),
  });
};

export const useUpdateRouteRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRouteRateCardPayload }) =>
      routeRateCardService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: routeRateKeys.lists() }),
  });
};

export const useDeleteRouteRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => routeRateCardService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: routeRateKeys.lists() }),
  });
};

// ── Cargo Rate Cards ──────────────────────────────────────────────────────────

export const cargoRateKeys = {
  all: ['cargo-rates'] as const,
  lists: () => [...cargoRateKeys.all, 'list'] as const,
};

export const useGetCargoRates = () =>
  useQuery({ queryKey: cargoRateKeys.lists(), queryFn: () => cargoRateCardService.getAll() });

export const useCreateCargoRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCargoRateCardPayload) => cargoRateCardService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: cargoRateKeys.lists() }),
  });
};

export const useUpdateCargoRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCargoRateCardPayload }) =>
      cargoRateCardService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: cargoRateKeys.lists() }),
  });
};

export const useDeleteCargoRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cargoRateCardService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: cargoRateKeys.lists() }),
  });
};

// ── Delivery Method Rate Cards ────────────────────────────────────────────────

export const deliveryMethodRateKeys = {
  all: ['delivery-method-rates'] as const,
  lists: () => [...deliveryMethodRateKeys.all, 'list'] as const,
};

export const useGetDeliveryMethodRates = () =>
  useQuery({
    queryKey: deliveryMethodRateKeys.lists(),
    queryFn: () => deliveryMethodRateCardService.getAll(),
  });

export const useCreateDeliveryMethodRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDeliveryMethodRateCardPayload) => deliveryMethodRateCardService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryMethodRateKeys.lists() }),
  });
};

export const useUpdateDeliveryMethodRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDeliveryMethodRateCardPayload }) =>
      deliveryMethodRateCardService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryMethodRateKeys.lists() }),
  });
};

export const useDeleteDeliveryMethodRate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deliveryMethodRateCardService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryMethodRateKeys.lists() }),
  });
};
