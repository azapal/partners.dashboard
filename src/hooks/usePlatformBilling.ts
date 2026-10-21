import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformBillingService } from '../service/partnerService';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';

/**
 * What Azapal charges this partner, and how each branch pays it.
 *
 * Prices are cached hard and everything else lightly: a price changes when
 * Azapal changes it, which is rare, while a balance changes when a partner pays
 * and they will be looking at the screen when they do.
 */

export const platformBillingKeys = {
  all: ['platform-billing'] as const,
  prices: () => [...platformBillingKeys.all, 'prices'] as const,
  accounts: () => [...platformBillingKeys.all, 'accounts'] as const,
  bills: () => [...platformBillingKeys.all, 'bills'] as const,
  usage: () => [...platformBillingKeys.all, 'usage'] as const,
};

const useSessionReady = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || !!repProfile;
};

/**
 * Azapal's price list. Read by every screen that is about to run a charge up,
 * so it is deliberately cheap to ask for and shared across all of them.
 */
export const usePlatformPrices = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: platformBillingKeys.prices(),
    queryFn: () => platformBillingService.getPrices(),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
};

export const useBillingAccounts = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: platformBillingKeys.accounts(),
    queryFn: () => platformBillingService.getAccounts(),
    enabled,
  });
};

export const usePlatformBills = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: platformBillingKeys.bills(),
    queryFn: () => platformBillingService.getBills(),
    enabled,
  });
};

export const usePlatformUsage = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: platformBillingKeys.usage(),
    queryFn: () => platformBillingService.getUsage(),
    enabled,
    // Usage moves as the partner works; the point of metering monthly is that
    // they can watch it happen.
    staleTime: 60 * 1000,
  });
};

export const useOpenTransferAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Bank transfer is set up — pay your Azapal bills into the account shown.' },
    mutationFn: ({ scope, preferredBank }: { scope: string; preferredBank?: string }) =>
      platformBillingService.openTransferAccount(scope, preferredBank),
    onSuccess: () => qc.invalidateQueries({ queryKey: platformBillingKeys.accounts() }),
  });
};

/**
 * Hands back the hosted Paystack page. The caller sends the partner there; the
 * card lands on file when the charge succeeds, so the account list is what
 * confirms it — not this response.
 *
 * Starting one marks the account as having a setup in flight, which is what
 * tells the setup screen to say "confirming" instead of asking for a card
 * again, so the cached list is wrong the moment this returns.
 */
export const useStartCardSetup = () => {
  const qc = useQueryClient();
  return useMutation({
    // Silent on success: the next thing that happens is the redirect to Paystack.
    meta: { silentSuccess: true },
    mutationFn: ({ scope, callbackUrl }: { scope: string; callbackUrl?: string }) =>
      platformBillingService.startCardSetup(scope, callbackUrl),
    onSuccess: () => qc.invalidateQueries({ queryKey: platformBillingKeys.accounts() }),
  });
};

export const useRemoveBillingCard = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Card removed.' },
    mutationFn: (scope: string) => platformBillingService.removeCard(scope),
    onSuccess: () => qc.invalidateQueries({ queryKey: platformBillingKeys.accounts() }),
  });
};
