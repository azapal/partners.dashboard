import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  invoiceService,
  type CreateInvoicePayload,
  type UpdateInvoicePayload,
} from '../service/partnerService';

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (branchId?: number) => [...invoiceKeys.lists(), branchId ?? 'all'] as const,
};

export const useGetInvoices = (branchId?: number) =>
  useQuery({ queryKey: invoiceKeys.list(branchId), queryFn: () => invoiceService.getAll(branchId) });

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => invoiceService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.lists() }),
  });
};

export const useUpdateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateInvoicePayload }) =>
      invoiceService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.lists() }),
  });
};

export const useDeleteInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoiceService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.lists() }),
  });
};
