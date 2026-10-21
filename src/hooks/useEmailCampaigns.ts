import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  customerService,
  emailCampaignService,
  emailTemplateService,
  type CreateEmailCampaignPayload,
  type CustomerListParams,
  type EmailAudience,
  type EmailCampaign,
  type EmailContent,
  type EmailTemplatePayload,
} from '../service/partnerService';
import { feedbackActions } from '../store/client/feedback';
import { usePartnerProfile } from './useAuth';
import { useRepProfile } from './useRepAuth';
import { isElevatedAdminRole } from '../service/repService';
import { useQuotePageSettings } from './useQuotePage';

/**
 * The customer directory and the email campaigns sent to it.
 *
 * Every endpoint here is for the partner owner and Tenant/Super Admin reps only.
 * Any other rep would get a 403, which fetchWithAuth treats as a dead session —
 * so queries are enabled only for the sessions that can use them (as useMobility
 * does), not the usual `!!partnerProfile || !!repProfile`. QuoteRequestsPanel is
 * also shown to support reps, so it asks `useCanEmailCustomers()` before
 * offering anything from here.
 */

export const emailKeys = {
  all: ['customer-email'] as const,
  customers: (params: CustomerListParams) => [...emailKeys.all, 'customers', params] as const,
  preview: (content: EmailContent) => [...emailKeys.all, 'preview', content] as const,
  estimate: (audience: EmailAudience) => [...emailKeys.all, 'estimate', audience] as const,
  campaigns: () => [...emailKeys.all, 'campaigns'] as const,
  campaign: (id: number) => [...emailKeys.all, 'campaign', id] as const,
  templates: () => [...emailKeys.all, 'templates'] as const,
};

export const useCanEmailCustomers = () => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  return !!partnerProfile || isElevatedAdminRole(repProfile?.invite_role?.name);
};

/**
 * The partner's public quote page, when it's live — the natural thing for an
 * email's button to open, so starter designs and new buttons point there.
 */
export const useQuotePageLink = () => {
  const { data } = useQuotePageSettings(null);
  // Email links must be https (the server refuses anything else), so a local
  // http:// dev origin offers nothing rather than a link that can't be sent.
  const origin = window.location.origin;
  return data?.exists && data.is_published && data.slug && origin.startsWith('https://') ? `${origin}/quote/${data.slug}` : '';
};

const IN_PROGRESS = new Set(['queued', 'sending']);
export const isCampaignInProgress = (c: Pick<EmailCampaign, 'status'>) => IN_PROGRESS.has(c.status);

export const useCustomers = (params: CustomerListParams) => {
  const enabled = useCanEmailCustomers();
  return useQuery({
    queryKey: emailKeys.customers(params),
    queryFn: () => customerService.list(params),
    enabled,
    placeholderData: keepPreviousData,
  });
};

/*
 * Preview and estimate are POSTs, but they only read — so they're queries keyed
 * on their body, which gives caching and stale-while-typing for free. The caller
 * debounces what it passes in. No retry: a 400 here is the design being
 * mid-edit, and asking again won't change the answer.
 */
export const useEmailPreview = (content: (EmailContent & { sample_name?: string }) | null) => {
  const enabled = useCanEmailCustomers() && !!content && content.design.blocks.length > 0;
  return useQuery({
    queryKey: emailKeys.preview(content ?? { subject: '', design: { blocks: [] } }),
    queryFn: () => emailCampaignService.preview(content!),
    enabled,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEmailEstimate = (audience: EmailAudience | null) => {
  const enabled =
    useCanEmailCustomers() &&
    !!audience &&
    (audience.mode === 'filter' || audience.customer_ids.length > 0);
  return useQuery({
    queryKey: emailKeys.estimate(audience ?? { mode: 'customers', customer_ids: [] }),
    queryFn: () => emailCampaignService.estimate(audience!),
    enabled,
    placeholderData: keepPreviousData,
    retry: false,
    // A price can change under the partner; the send re-checks it anyway.
    staleTime: 30 * 1000,
  });
};

/** Polls every 5s while anything is still going out. */
export const useEmailCampaigns = () => {
  const enabled = useCanEmailCustomers();
  return useQuery({
    queryKey: emailKeys.campaigns(),
    queryFn: () => emailCampaignService.list(),
    enabled,
    refetchInterval: (query) => (query.state.data?.some(isCampaignInProgress) ? 5000 : false),
  });
};

export const useEmailCampaign = (id: number | null) => {
  const enabled = useCanEmailCustomers() && id != null;
  return useQuery({
    queryKey: emailKeys.campaign(id ?? 0),
    queryFn: () => emailCampaignService.get(id!),
    enabled,
    refetchInterval: (query) => (query.state.data && isCampaignInProgress(query.state.data) ? 5000 : false),
  });
};

export const useEmailTemplates = () => {
  const enabled = useCanEmailCustomers();
  return useQuery({
    queryKey: emailKeys.templates(),
    queryFn: () => emailTemplateService.list(),
    enabled,
  });
};

/**
 * Send a campaign — one customer or ten thousand.
 *
 * Silent on success here because the right words depend on the outcome: a single
 * email is sent there and then and can come back `failed`, while a bulk send is
 * only queued. So this hook says it with feedbackActions once it knows which.
 * `recipientName` is the one customer's name, for "Email sent to Ada."
 */
export const useSendEmailCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { silentSuccess: true },
    mutationFn: ({ payload }: { payload: CreateEmailCampaignPayload; recipientName?: string }) =>
      emailCampaignService.create(payload),
    onSuccess: (campaign, { recipientName }) => {
      qc.invalidateQueries({ queryKey: emailKeys.campaigns() });
      if (campaign.recipient_count === 1) {
        const who = recipientName?.trim() || 'your customer';
        if (campaign.status === 'sent') feedbackActions.success(`Email sent to ${who}.`, 'Sent');
        else if (campaign.status === 'failed')
          feedbackActions.error(`The email to ${who} couldn't be delivered. You haven't been charged for it.`);
        else feedbackActions.success(`Your email to ${who} is on its way.`, 'Sending');
        return;
      }
      feedbackActions.success(
        `Campaign queued — sending to ${campaign.recipient_count.toLocaleString()} customers. You can follow it under Campaigns.`,
        'Queued',
      );
    },
  });
};

export const useSendTestEmail = () =>
  useMutation({
    meta: { silentSuccess: true },
    mutationFn: (content: EmailContent) => emailCampaignService.sendTest(content),
    onSuccess: ({ to }) => feedbackActions.success(`Test sent to ${to}.`, 'Test sent'),
  });

export const useCancelEmailCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: "Campaign stopped. Emails that already went out stay sent.", successTitle: 'Stopped' },
    mutationFn: (id: number) => emailCampaignService.cancel(id),
    onSuccess: (_c, id) => {
      qc.invalidateQueries({ queryKey: emailKeys.campaigns() });
      qc.invalidateQueries({ queryKey: emailKeys.campaign(id) });
    },
  });
};

export const useCreateEmailTemplate = (successMessage = 'Template saved.') => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage },
    mutationFn: (payload: EmailTemplatePayload) => emailTemplateService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: emailKeys.templates() }),
  });
};

export const useUpdateEmailTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Template saved.' },
    mutationFn: ({ id, payload }: { id: number; payload: Partial<EmailTemplatePayload> }) =>
      emailTemplateService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: emailKeys.templates() }),
  });
};

export const useDeleteEmailTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    meta: { successMessage: 'Template deleted.' },
    mutationFn: (id: number) => emailTemplateService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: emailKeys.templates() }),
  });
};

/** Silent on success: it only fills the image block's URL until the email is sent. */
export const useUploadEmailImage = () =>
  useMutation({
    meta: { silentSuccess: true },
    mutationFn: (file: File) => emailCampaignService.uploadImage(file),
  });
