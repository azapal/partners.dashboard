import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { receiptService, type CreateReceiptPayload } from '../service/partnerService';
import { invoiceKeys } from './useInvoices';

export const receiptKeys = {
  all: ['receipts'] as const,
  lists: () => [...receiptKeys.all, 'list'] as const,
  list: (branchId?: number) => [...receiptKeys.lists(), branchId ?? 'all'] as const,
};

export const useGetReceipts = (branchId?: number) =>
  useQuery({ queryKey: receiptKeys.list(branchId), queryFn: () => receiptService.getAll(branchId) });

export const useCreateReceipt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReceiptPayload) => receiptService.create(payload),
    onSuccess: (_data, payload) => {
      qc.invalidateQueries({ queryKey: receiptKeys.lists() });
      // A receipt against an invoice marks it paid — the invoices list needs to
      // reflect that too, not just the receipts list.
      if (payload.related_invoice_id) qc.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
};

export const useDeleteReceipt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => receiptService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: receiptKeys.lists() }),
  });
};
