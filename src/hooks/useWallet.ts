import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { walletService, type WalletTransactionsQuery } from '../service/partnerService';

export const walletKeys = {
  all: ['wallet'] as const,
  balance: (branchId?: number | null) => [...walletKeys.all, 'balance', branchId ?? 'default'] as const,
  transactions: (query: WalletTransactionsQuery) => [...walletKeys.all, 'transactions', query] as const,
  providers: () => [...walletKeys.all, 'providers'] as const,
  hasAnyAccount: () => [...walletKeys.all, 'has-any-account'] as const,
};

export const useGetWalletBalance = (branchId?: number | null) =>
  useQuery({ queryKey: walletKeys.balance(branchId), queryFn: () => walletService.getBalance(branchId) });

export const useGetWalletTransactions = (query: WalletTransactionsQuery = {}) =>
  useQuery({
    queryKey: walletKeys.transactions(query),
    queryFn: () => walletService.getTransactions(query),
    placeholderData: keepPreviousData,
  });

// Fails/empties out while no Paystack integration is configured for this app —
// callers should treat an empty list as "unavailable", not retry it aggressively.
export const useGetBankProviders = () =>
  useQuery({
    queryKey: walletKeys.providers(),
    queryFn: () => walletService.getProviders(),
    retry: false,
  });

export const useHasAnyWalletAccount = () =>
  useQuery({ queryKey: walletKeys.hasAnyAccount(), queryFn: () => walletService.hasAnyAccount() });
