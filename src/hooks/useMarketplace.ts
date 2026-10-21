import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  marketplaceService,
  publicMarketplaceService,
  routeBoardService,
  type RouteBoardFilters,
  type BriefStatus,
  type JobBriefPayload,
  type JobBriefUpdatePayload,
  type MarketplaceBriefFilters,
  type MarketplaceConversation,
  type MarketplaceListingPayload,
  type MarketplacePartnerFilters,
  type MarketplaceProfilePayload,
  type MarketplaceThread,
  type StartConversationPayload,
} from '../service/partnerService';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';
import { isElevatedAdminRole } from '../service/repService';
import { feedbackActions } from '../store/client/feedback';

/**
 * The Logistics network marketplace: storefronts, listings, job briefs and the
 * partner-to-partner inbox.
 *
 * The signed-in endpoints are for the partner owner and elevated admins only
 * (the same gate as partner/network/*). Any other rep would get a 403, which
 * fetchWithAuth treats as a dead session — so those queries are enabled only
 * for the sessions they actually serve, as useMobility is. The plain
 * two-profile check would sign a support rep out.
 *
 * The marketplace, briefs board and routes board are also public pages. The
 * browsing hooks below pick their source by session: signed in, the
 * authenticated endpoints (which exclude you from the directory and set
 * is_mine / conversation_id / response counts); signed out — or any session
 * those endpoints don't serve — the public ones, which send no token at all.
 * The source is part of each query key so the two caches never mix.
 */

export const marketplaceKeys = {
  all: ['marketplace'] as const,
  categories: () => [...marketplaceKeys.all, 'categories'] as const,
  partnersAll: () => [...marketplaceKeys.all, 'partners'] as const,
  partners: (filters: MarketplacePartnerFilters) => [...marketplaceKeys.partnersAll(), filters] as const,
  storefrontAll: () => [...marketplaceKeys.all, 'storefront'] as const,
  storefront: (code: string) => [...marketplaceKeys.storefrontAll(), code] as const,
  profile: () => [...marketplaceKeys.all, 'profile'] as const,
  myListings: () => [...marketplaceKeys.all, 'my-listings'] as const,
  briefsAll: () => [...marketplaceKeys.all, 'briefs'] as const,
  briefs: (filters: MarketplaceBriefFilters) => [...marketplaceKeys.briefsAll(), 'list', filters] as const,
  brief: (id: number) => [...marketplaceKeys.briefsAll(), 'detail', id] as const,
  routeBoard: () => ['pairing-routes', 'board'] as const,
  conversations: () => [...marketplaceKeys.all, 'conversations'] as const,
  thread: (id: number) => [...marketplaceKeys.all, 'thread', id] as const,
  unread: () => [...marketplaceKeys.all, 'unread'] as const,
};

export const useCanUseMarketplace = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || isElevatedAdminRole(repProfile?.invite_role?.name);
};

/**
 * There is no realtime channel, so the inbox polls — only while the tab is
 * visible. refetchIntervalInBackground: false already pauses a hidden tab; the
 * visibility check also covers the moment before TanStack's focus manager
 * notices.
 */
type Source = 'auth' | 'public';
const useSource = (): Source => (useCanUseMarketplace() ? 'auth' : 'public');

const whileVisible = (ms: number) => () =>
  typeof document === 'undefined' || document.visibilityState === 'visible' ? ms : false;

// ── Browsing ──────────────────────────────────────────────────────────────────

export const useMarketplaceCategories = () => {
  const source = useSource();
  return useQuery({
    queryKey: [...marketplaceKeys.categories(), source],
    queryFn: () => (source === 'auth' ? marketplaceService.categories() : publicMarketplaceService.categories()),
    staleTime: 5 * 60 * 1000,
  });
};

export const useMarketplacePartners = (filters: MarketplacePartnerFilters) => {
  const source = useSource();
  return useQuery({
    queryKey: [...marketplaceKeys.partnersAll(), source, filters],
    queryFn: () => (source === 'auth' ? marketplaceService.partners(filters) : publicMarketplaceService.partners(filters)),
    placeholderData: (prev) => prev,
  });
};

export const useStorefront = (partnerCode: string | null) => {
  const source = useSource();
  return useQuery({
    queryKey: [...marketplaceKeys.storefront(partnerCode ?? ''), source],
    queryFn: () =>
      source === 'auth'
        ? marketplaceService.storefront(partnerCode as string)
        : publicMarketplaceService.storefront(partnerCode as string),
    enabled: !!partnerCode,
    // A 404 means "not in the marketplace" — retrying won't change that.
    retry: false,
  });
};

// ── Your storefront ───────────────────────────────────────────────────────────

export const useMyMarketplaceProfile = () => {
  const enabled = useCanUseMarketplace();
  return useQuery({
    queryKey: marketplaceKeys.profile(),
    queryFn: () => marketplaceService.myProfile(),
    enabled,
  });
};

export const useMyListings = () => {
  const enabled = useCanUseMarketplace();
  return useQuery({
    queryKey: marketplaceKeys.myListings(),
    queryFn: () => marketplaceService.myListings(),
    enabled,
  });
};

const invalidateStorefront = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: marketplaceKeys.profile() });
  qc.invalidateQueries({ queryKey: marketplaceKeys.storefrontAll() });
  qc.invalidateQueries({ queryKey: marketplaceKeys.partnersAll() });
};

export const useSaveMarketplaceProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Storefront saved.' },
    mutationFn: (payload: MarketplaceProfilePayload) => marketplaceService.saveProfile(payload),
    onSuccess: (profile) => {
      qc.setQueryData(marketplaceKeys.profile(), profile);
      invalidateStorefront(qc);
    },
  });
};

/*
 * Listing and unlisting say different things, so this one is silent in the
 * MutationCache and words its own success. A refusal (no way to reach you)
 * still reaches the FeedbackModal from there, with the backend's reason.
 */
export const useSetStorefrontListed = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { silentSuccess: true },
    mutationFn: (is_listed: boolean) => marketplaceService.saveProfile({ is_listed }),
    onSuccess: (profile) => {
      qc.setQueryData(marketplaceKeys.profile(), profile);
      invalidateStorefront(qc);
      qc.invalidateQueries({ queryKey: marketplaceKeys.categories() });
      if (profile.is_listed) {
        feedbackActions.success('Your storefront is now a public page — anyone can see it, contacts included — and partners can message you.', 'Storefront listed');
      } else {
        feedbackActions.success('Your storefront is off the public marketplace. Existing conversations stay open.', 'Storefront hidden');
      }
    },
  });
};

const invalidateListings = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: marketplaceKeys.myListings() });
  qc.invalidateQueries({ queryKey: marketplaceKeys.categories() });
  qc.invalidateQueries({ queryKey: marketplaceKeys.storefrontAll() });
  qc.invalidateQueries({ queryKey: marketplaceKeys.partnersAll() });
};

export const useCreateListing = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Listing published.' },
    mutationFn: (payload: MarketplaceListingPayload) => marketplaceService.createListing(payload),
    onSuccess: () => invalidateListings(qc),
  });
};

export const useUpdateListing = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Listing updated.' },
    mutationFn: ({ id, payload }: { id: number; payload: Partial<MarketplaceListingPayload> }) =>
      marketplaceService.updateListing(id, payload),
    onSuccess: () => invalidateListings(qc),
  });
};

export const useDeleteListing = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Listing removed.' },
    mutationFn: (id: number) => marketplaceService.deleteListing(id),
    onSuccess: () => invalidateListings(qc),
  });
};

// ── Job briefs ────────────────────────────────────────────────────────────────

/** `mine` is a signed-in view only; signed out it stays disabled rather than ask the public board. */
export const useJobBriefs = (filters: MarketplaceBriefFilters) => {
  const source = useSource();
  return useQuery({
    queryKey: [...marketplaceKeys.briefs(filters), source],
    queryFn: () => (source === 'auth' ? marketplaceService.briefs(filters) : publicMarketplaceService.briefs(filters)),
    enabled: source === 'auth' || !filters.mine,
    placeholderData: (prev) => prev,
  });
};

export const useJobBrief = (id: number | null) => {
  const source = useSource();
  return useQuery({
    queryKey: [...marketplaceKeys.brief(id ?? 0), source],
    queryFn: () => (source === 'auth' ? marketplaceService.brief(id as number) : publicMarketplaceService.brief(id as number)),
    enabled: id != null,
    retry: false,
  });
};

// ── Pairing routes board ──────────────────────────────────────────────────────

/*
 * Under the pairing-routes key family, so the existing route mutations
 * (usePairingRoutes.ts, which invalidate ['pairing-routes', …]) refresh it.
 */
export const useRouteBoard = (filters: RouteBoardFilters) => {
  const source = useSource();
  return useQuery({
    queryKey: [...marketplaceKeys.routeBoard(), source, filters],
    queryFn: () => (source === 'auth' ? routeBoardService.list(filters) : publicMarketplaceService.routeBoard(filters)),
    placeholderData: (prev) => prev,
  });
};

const invalidateBriefs = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: marketplaceKeys.briefsAll() });
  qc.invalidateQueries({ queryKey: marketplaceKeys.categories() });
};

export const useCreateBrief = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Brief posted. Partners who can do it will see it on the board.' },
    mutationFn: (payload: JobBriefPayload) => marketplaceService.createBrief(payload),
    onSuccess: () => invalidateBriefs(qc),
  });
};

export const useUpdateBrief = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Brief updated.' },
    mutationFn: ({ id, payload }: { id: number; payload: JobBriefUpdatePayload }) =>
      marketplaceService.updateBrief(id, payload),
    onSuccess: () => invalidateBriefs(qc),
  });
};

/* Closing and reopening say different things — worded here, not in the cache. */
export const useSetBriefStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { silentSuccess: true },
    mutationFn: ({ id, status }: { id: number; status: BriefStatus }) =>
      marketplaceService.updateBrief(id, { status }),
    onSuccess: (brief) => {
      invalidateBriefs(qc);
      feedbackActions.success(
        brief.status === 'closed'
          ? 'It is off the board. Conversations about it stay in your inbox.'
          : 'It is back on the board for partners to answer.',
        brief.status === 'closed' ? 'Brief closed' : 'Brief reopened',
      );
    },
  });
};

export const useDeleteBrief = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Brief deleted.' },
    mutationFn: (id: number) => marketplaceService.deleteBrief(id),
    onSuccess: () => invalidateBriefs(qc),
  });
};

// ── Inbox ─────────────────────────────────────────────────────────────────────

export const useMarketplaceUnread = () => {
  const enabled = useCanUseMarketplace();
  return useQuery({
    queryKey: marketplaceKeys.unread(),
    queryFn: () => marketplaceService.unread(),
    enabled,
    refetchInterval: whileVisible(30_000),
    refetchIntervalInBackground: false,
    select: (d) => d.unread ?? 0,
  });
};

export const useMarketplaceConversations = () => {
  const enabled = useCanUseMarketplace();
  return useQuery({
    queryKey: marketplaceKeys.conversations(),
    queryFn: () => marketplaceService.conversations(),
    enabled,
    refetchInterval: whileVisible(30_000),
    refetchIntervalInBackground: false,
  });
};

/**
 * One thread. The GET marks it read server-side, so when the cached list says
 * it had unread messages, zero it there and refresh the badge — without
 * refetching the whole list on every 10s poll.
 */
export const useMarketplaceThread = (id: number | null) => {
  const enabled = useCanUseMarketplace();
  const qc = useQueryClient();
  return useQuery({
    queryKey: marketplaceKeys.thread(id ?? 0),
    queryFn: async () => {
      const thread = await marketplaceService.thread(id as number);
      const list = qc.getQueryData<MarketplaceConversation[]>(marketplaceKeys.conversations());
      const hadUnread = !list || list.some((c) => c.id === thread.id && c.unread_count > 0);
      if (list) {
        qc.setQueryData<MarketplaceConversation[]>(
          marketplaceKeys.conversations(),
          list.map((c) => (c.id === thread.id ? { ...c, unread_count: 0 } : c)),
        );
      }
      if (hadUnread) qc.invalidateQueries({ queryKey: marketplaceKeys.unread() });
      return thread;
    },
    enabled: enabled && id != null,
    refetchInterval: whileVisible(10_000),
    refetchIntervalInBackground: false,
  });
};

/* A chat message is not an event worth a blocking modal — the bubble appearing is the success. */
export const useSendMarketplaceMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { silentSuccess: true },
    mutationFn: ({ conversationId, body }: { conversationId: number; body: string }) =>
      marketplaceService.sendMessage(conversationId, body),
    onSuccess: (message, { conversationId }) => {
      // In the thread at once, so the bubble doesn't blink out between the
      // send resolving and the refetch landing.
      qc.setQueryData<MarketplaceThread>(marketplaceKeys.thread(conversationId), (t) =>
        t && !t.messages.some((m) => m.id === message.id) ? { ...t, messages: [...t.messages, message] } : t,
      );
      qc.invalidateQueries({ queryKey: marketplaceKeys.thread(conversationId) });
      qc.invalidateQueries({ queryKey: marketplaceKeys.conversations() });
    },
  });
};

/* Starting a thread lands the user in it, which says it worked. */
export const useStartConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { silentSuccess: true },
    mutationFn: (payload: StartConversationPayload) => marketplaceService.startConversation(payload),
    onSuccess: (_conversation, { partner_code, brief_id }) => {
      qc.invalidateQueries({ queryKey: marketplaceKeys.conversations() });
      qc.invalidateQueries({ queryKey: marketplaceKeys.storefront(partner_code) }); // prefix: both sources
      qc.invalidateQueries({ queryKey: [...marketplaceKeys.all, 'thread'] });
      if (brief_id) qc.invalidateQueries({ queryKey: marketplaceKeys.briefsAll() });
    },
  });
};
