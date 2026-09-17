import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settleInvoiceSplit, stakeholderService } from '../service/partnerService';
import type {
  CollaboratorPayload,
  SaveSettlementAccountPayload,
  CreatePayoutPayload,
  CreateStakeholderPayload,
  UpdateStakeholderPayload,
} from '../service/partnerService';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';

export const stakeholderKeys = {
  all: ['stakeholders'] as const,
  list: (branchId?: number | null, includeBalances?: boolean) =>
    [...stakeholderKeys.all, 'list', branchId ?? 'default', includeBalances ?? false] as const,
  detail: (id: number) => [...stakeholderKeys.all, 'detail', id] as const,
  payouts: (id: number) => [...stakeholderKeys.all, 'payouts', id] as const,
  banks: ['stakeholder-banks'] as const,
  network: ['partner-network'] as const,
  settlement: ['partner-settlement-account'] as const,
};

// Both profiles, not just the partner one — a Tenant Admin/Super Admin employee
// reaches this screen too (see RequireAuth), and gating on the partner alone would
// leave them looking at a permanently empty list.
const useSessionReady = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || !!repProfile;
};

export const useGetStakeholders = (branchId?: number | null, includeBalances = false) => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: stakeholderKeys.list(branchId, includeBalances),
    queryFn: () => stakeholderService.getAll({ branchId, includeBalances }),
    enabled,
  });
};

export const useGetStakeholder = (id: number | null) => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: stakeholderKeys.detail(id ?? 0),
    queryFn: () => stakeholderService.getById(id as number),
    enabled: enabled && !!id,
  });
};

export const useCreateStakeholder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStakeholderPayload) => stakeholderService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKeys.all }),
  });
};

export const useUpdateStakeholder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateStakeholderPayload }) =>
      stakeholderService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKeys.all }),
  });
};

export const useDeleteStakeholder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => stakeholderService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKeys.all }),
  });
};

export const useGetStakeholderPayouts = (id: number | null) => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: stakeholderKeys.payouts(id ?? 0),
    queryFn: () => stakeholderService.getPayouts(id as number),
    enabled: enabled && !!id,
  });
};

export const usePayStakeholder = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayoutPayload) => stakeholderService.payout(id, payload),
    // A payout changes the balance shown on every stakeholder view, not just the
    // payout list, so the whole namespace is invalidated.
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKeys.all }),
  });
};

// The bank list is a static reference table behind a Paystack call — worth holding
// for the session rather than refetching per modal open.
export const useGetBanks = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: stakeholderKeys.banks,
    queryFn: () => stakeholderService.getBanks(),
    enabled,
    staleTime: 60 * 60 * 1000,
  });
};

/**
 * Account name enquiry. A mutation rather than a query because it's an explicit
 * user action ("check this account") with a side effect at Paystack, and because a
 * failed lookup is a normal answer the form needs to show, not a cache entry.
 */
export const useResolveAccount = () =>
  useMutation({
    mutationFn: ({ accountNumber, bankCode }: { accountNumber: string; bankCode: string }) =>
      stakeholderService.resolveAccount(accountNumber, bankCode),
  });

// ── Collaborators (contacts at a stakeholder organisation) ────────────────────
// All invalidate the whole stakeholder namespace: collaborators are embedded in
// the stakeholder payload, so a list fetched anywhere goes stale when one changes.

export const useAddCollaborator = (stakeholderId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CollaboratorPayload) => stakeholderService.addCollaborator(stakeholderId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKeys.all }),
  });
};

export const useUpdateCollaborator = (stakeholderId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CollaboratorPayload> }) =>
      stakeholderService.updateCollaborator(stakeholderId, id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKeys.all }),
  });
};

export const useRemoveCollaborator = (stakeholderId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => stakeholderService.removeCollaborator(stakeholderId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKeys.all }),
  });
};

// ── Partner directory ─────────────────────────────────────────────────────────

/**
 * Identity-only fuzzy search. Held briefly rather than refetched per keystroke,
 * and disabled below 2 characters because the server rejects shorter terms —
 * an empty query would be a downloadable list of every partner.
 */
export const useSearchNetworkPartners = (query: string) => {
  const enabled = useSessionReady();
  const term = query.trim();
  return useQuery({
    queryKey: [...stakeholderKeys.network, 'search', term] as const,
    queryFn: () => stakeholderService.searchNetwork(term),
    enabled: enabled && term.length >= 2,
    staleTime: 60 * 1000,
  });
};

/** The full card. Only fetched once a specific partner has been chosen. */
export const useNetworkPartner = (partnerCode: string | null) => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: [...stakeholderKeys.network, 'detail', partnerCode ?? ''] as const,
    queryFn: () => stakeholderService.getNetworkPartner(partnerCode as string),
    enabled: enabled && !!partnerCode,
  });
};

/**
 * Distributes a paid invoice's total across the split. Invalidates both invoices
 * (settled_at changes) and stakeholders (their balances just moved).
 */
export const useSettleInvoiceSplit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => settleInvoiceSplit(invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stakeholderKeys.all });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

// ── The partner's own settlement account ─────────────────────────────────────

export const useSettlementAccount = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: stakeholderKeys.settlement,
    queryFn: () => stakeholderService.getSettlementAccount(),
    enabled,
  });
};

export const useSaveSettlementAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveSettlementAccountPayload) => stakeholderService.saveSettlementAccount(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKeys.settlement }),
  });
};

export const useRemoveSettlementAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => stakeholderService.removeSettlementAccount(),
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKeys.settlement }),
  });
};
