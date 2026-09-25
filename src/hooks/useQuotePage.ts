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
  settings: (branchId?: number | null) => [...quotePageKeys.all, 'settings', branchId ?? 'company'] as const,
  pages: () => [...quotePageKeys.all, 'pages'] as const,
  teammates: () => [...quotePageKeys.all, 'teammates'] as const,
  requests: (branchId?: number | null) => [...quotePageKeys.all, 'requests', branchId ?? 'all'] as const,
  public: (slug: string) => [...quotePageKeys.all, 'public', slug] as const,
};

const useSessionReady = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || !!repProfile;
};

// ── Partner ───────────────────────────────────────────────────────────────────

/** The company's page, or one branch's. */
export const useQuotePageSettings = (branchId?: number | null) => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: quotePageKeys.settings(branchId),
    queryFn: () => quotePageService.getSettings(branchId),
    enabled,
  });
};

/** Every page this partner has — the company's and one per branch. */
export const useQuotePages = () => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: quotePageKeys.pages(),
    queryFn: () => quotePageService.listPages(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

/** Writes the server's normalised copy straight back, so the editor sees what was saved. */
export const useSaveQuotePageSettings = (branchId?: number | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveQuotePagePayload) => quotePageService.saveSettings(payload, branchId),
    onSuccess: (saved) => {
      qc.setQueryData<QuotePageSettings>(quotePageKeys.settings(branchId), saved);
      // A page that has just come into existence, or changed its link, changes
      // the list the switcher reads.
      qc.invalidateQueries({ queryKey: quotePageKeys.pages() });
    },
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

export const useQuoteRequests = (branchId?: number | null) => {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: quotePageKeys.requests(branchId),
    queryFn: () => quotePageService.listRequests(branchId),
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
      // The same lead can sit in more than one list (all, and its branch's).
      qc.setQueriesData<QuoteRequestRecord[]>({ queryKey: [...quotePageKeys.all, 'requests'] }, (prev = []) =>
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
