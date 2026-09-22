import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  publicQuoteService,
  quotePageService,
  type QuoteContactChannel,
  type QuotePageSettings,
  type QuoteRequestRecord,
  type QuoteRequestStatus,
  type SaveQuotePagePayload,
  type SubmitQuotePayload,
} from '../service/partnerService';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';

export const quotePageKeys = {
  all: ['quote-page'] as const,
  settings: () => [...quotePageKeys.all, 'settings'] as const,
  teammates: () => [...quotePageKeys.all, 'teammates'] as const,
  requests: () => [...quotePageKeys.all, 'requests'] as const,
  public: (slug: string) => [...quotePageKeys.all, 'public', slug] as const,
};

const useSessionReady = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || !!repProfile;
};

// ── Partner ───────────────────────────────────────────────────────────────────

export const useQuotePageSettings = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: quotePageKeys.settings(),
    queryFn: () => quotePageService.getSettings(),
    enabled,
  });
};

/** Writes the server's normalised copy straight back, as move rates do — see useMoveRates. */
export const useSaveQuotePageSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveQuotePagePayload) => quotePageService.saveSettings(payload),
    onSuccess: (saved) => qc.setQueryData<QuotePageSettings>(quotePageKeys.settings(), saved),
  });
};

/** People the partner can point a WhatsApp or text contact at. */
export const useQuoteTeammates = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: quotePageKeys.teammates(),
    queryFn: () => quotePageService.listTeammates(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useQuoteRequests = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: quotePageKeys.requests(),
    queryFn: () => quotePageService.listRequests(),
    enabled,
    // Leads arrive from outside the dashboard, so the app-wide minute of
    // staleness would hide one that landed a second ago: fetch whenever the
    // list is opened or the tab regains focus, and poll while it's open.
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
};

export const useUpdateQuoteRequestStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reference, status }: { reference: string; status: QuoteRequestStatus }) =>
      quotePageService.updateRequestStatus(reference, status),
    onSuccess: (updated) =>
      qc.setQueryData<QuoteRequestRecord[]>(quotePageKeys.requests(), (prev = []) =>
        prev.map((r) => (r.reference === updated.reference ? updated : r)),
      ),
  });
};

// ── Public (no session) ───────────────────────────────────────────────────────

export const usePublicQuotePage = (slug: string) =>
  useQuery({
    queryKey: quotePageKeys.public(slug),
    queryFn: () => publicQuoteService.getPage(slug),
    enabled: !!slug,
    // A missing page is a 404, not a blip — don't make the customer wait on a retry.
    retry: false,
  });

export const useSubmitPublicQuote = (slug: string) =>
  useMutation({
    mutationFn: (payload: SubmitQuotePayload) => publicQuoteService.submit(slug, payload),
  });

export const recordQuoteContact = (slug: string, reference: string, channel: QuoteContactChannel) =>
  publicQuoteService.recordContact(slug, reference, channel);
