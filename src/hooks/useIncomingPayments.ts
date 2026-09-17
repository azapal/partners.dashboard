import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incomingPaymentService } from '../service/partnerService';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';

export const incomingPaymentKeys = {
  all: ['incoming-payments'] as const,
  list: (branchId?: number | null, showAll?: boolean) =>
    [...incomingPaymentKeys.all, 'list', branchId ?? 'default', showAll ?? false] as const,
};

const useSessionReady = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || !!repProfile;
};

export const useGetIncomingPayments = (branchId?: number | null, showAll = false) => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: incomingPaymentKeys.list(branchId, showAll),
    queryFn: () => incomingPaymentService.getAll({ branchId, all: showAll }),
    enabled,
  });
};

/**
 * Matching marks the invoice paid and may distribute it, so invoices and
 * stakeholder balances both go stale alongside the queue itself.
 */
export const useMatchIncomingPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, invoiceId }: { id: number; invoiceId: number }) => incomingPaymentService.match(id, invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: incomingPaymentKeys.all });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['stakeholders'] });
    },
  });
};

export const useIgnoreIncomingPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, undo }: { id: number; undo?: boolean }) => incomingPaymentService.ignore(id, undo),
    onSuccess: () => qc.invalidateQueries({ queryKey: incomingPaymentKeys.all }),
  });
};
