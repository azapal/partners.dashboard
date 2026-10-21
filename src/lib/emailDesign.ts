import { useEffect, useState } from 'react';
import type {
  Customer,
  EmailBlock,
  EmailCampaignType,
  EmailContent,
  EmailDesign,
  EmailTemplate,
} from '../service/partnerService';

/**
 * The pieces the email composer and campaign builder share: what a draft is,
 * the starter designs per campaign type, and the client-side checks that mirror
 * modules/helpers/mailer.py's clean_design closely enough to say what's wrong
 * before the server does.
 */

export interface EmailDraft {
  name: string;
  campaign_type: EmailCampaignType;
  subject: string;
  preheader: string;
  design: EmailDesign;
  template_id: number | null;
}

/** Who a campaign goes to, as the screen that opened the builder knew it. */
export type AudienceSeed =
  | { kind: 'customers'; customers: Customer[] }
  | { kind: 'filter'; filter: { q?: string; source?: string; service?: string }; label: string };

export type BuilderStep = 'type' | 'design' | 'audience' | 'review';

/** What opens the campaign builder — from scratch, carried over from the composer, or a template to edit. */
export interface BuilderSeed {
  mode: 'campaign' | 'template';
  draft?: EmailDraft;
  audience?: AudienceSeed;
  /** Template mode: the template being edited; omitted for a new one. */
  templateId?: number;
  startAt?: BuilderStep;
}

export const DEFAULT_THEME ={ accent: '#F14724', background: '#F4F5F7', text: '#1F2937' };

export const CAMPAIGN_TYPES: { id: EmailCampaignType; label: string; icon: string; blurb: string }[] = [
  { id: 'promo', label: 'Promo', icon: 'ri-megaphone-line', blurb: 'Tell customers about a service or offer.' },
  { id: 'seasonal', label: 'Seasonal', icon: 'ri-sun-line', blurb: 'Festive greetings, holiday hours, peak-season reminders.' },
  { id: 'discount', label: 'Discount', icon: 'ri-coupon-3-line', blurb: 'A code or percentage off their next booking.' },
  { id: 'update', label: 'Update', icon: 'ri-notification-3-line', blurb: 'News, new routes, changes they should know about.' },
];

export const campaignTypeLabel = (t: EmailCampaignType) => CAMPAIGN_TYPES.find((c) => c.id === t)?.label ?? t;

export const naira = (n: number) =>
  `₦${n.toLocaleString(undefined, { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

/** Starter designs, one per type. Buttons start with `link` — the partner's quote page when they have one. */
export const starterDraft = (type: EmailCampaignType, link = ''): EmailDraft => {
  const base = { template_id: null, campaign_type: type };
  switch (type) {
    case 'discount':
      return {
        ...base,
        name: 'Discount',
        subject: '{{first_name}}, 20% off your next delivery',
        preheader: 'A thank-you for moving with us — this week only.',
        design: {
          theme: { ...DEFAULT_THEME, accent: '#F14724' },
          blocks: [
            { type: 'text', text: 'A THANK-YOU FOR YOU', align: 'center' },
            { type: 'heading', text: '20% OFF', align: 'center' },
            { type: 'text', text: 'Your next delivery or move with us, booked before Sunday.', align: 'center' },
            { type: 'spacer', size: 16 },
            { type: 'text', text: 'Use code  SAVE20  when you book.', align: 'center' },
            { type: 'button', label: 'Book now', url: link, align: 'center' },
            { type: 'divider' },
            { type: 'text', text: 'One use per customer. Ends Sunday at midnight.', align: 'center' },
          ],
        },
      };
    case 'seasonal':
      return {
        ...base,
        name: 'Seasonal',
        subject: 'Season’s greetings from all of us',
        preheader: 'Our holiday hours, and how to get your deliveries in on time.',
        design: {
          theme: { accent: '#0F766E', background: '#F0FDFA', text: '#1F2937' },
          blocks: [
            { type: 'heading', text: 'Happy holidays, {{first_name}}!', align: 'center' },
            { type: 'text', text: 'Thank you for trusting us with your deliveries this year. Here’s how we’re working over the festive period so nothing arrives late.', align: 'center' },
            { type: 'divider' },
            { type: 'heading', text: 'Holiday hours', align: 'left' },
            { type: 'text', text: '24 Dec — open until 2pm\n25–26 Dec — closed\n27 Dec onwards — normal hours', align: 'left' },
            { type: 'button', label: 'Book before the rush', url: link, align: 'center' },
          ],
        },
      };
    case 'update':
      return {
        ...base,
        name: 'Update',
        subject: 'What’s new with us',
        preheader: 'New routes, faster pickups — the short version.',
        design: {
          theme: { accent: '#1D4ED8', background: '#F4F5F7', text: '#1F2937' },
          blocks: [
            { type: 'heading', text: 'Hi {{first_name}}, here’s what’s new', align: 'left' },
            { type: 'text', text: 'We’ve been busy. A quick round-up of what’s changed and what it means for you:', align: 'left' },
            { type: 'text', text: '• Same-day pickups now run until 6pm\n• We now cover more areas\n• Track every delivery from one link', align: 'left' },
            { type: 'button', label: 'See what’s new', url: link, align: 'left' },
          ],
        },
      };
    default:
      return {
        ...base,
        name: 'Promo',
        subject: 'Moving or sending something, {{first_name}}?',
        preheader: 'Fast, careful and fairly priced — get a quote in a minute.',
        design: {
          theme: { ...DEFAULT_THEME },
          blocks: [
            { type: 'heading', text: 'Moves and deliveries, done properly', align: 'center' },
            { type: 'text', text: 'Hi {{first_name}}, whether it’s a parcel across town or a whole home across the country, we pick up on time, handle it with care and keep you posted until it lands.', align: 'center' },
            { type: 'button', label: 'Get a quote', url: link, align: 'center' },
            { type: 'spacer', size: 16 },
            { type: 'text', text: 'Questions? Just reply to this email — it comes straight to us.', align: 'center' },
          ],
        },
      };
  }
};

export const draftFromTemplate = (t: EmailTemplate): EmailDraft => ({
  name: t.name,
  campaign_type: t.campaign_type,
  subject: t.subject,
  preheader: t.preheader,
  design: { theme: { ...DEFAULT_THEME, ...t.design.theme }, blocks: t.design.blocks },
  template_id: t.id,
});

export const newBlock = (type: EmailBlock['type'], link = ''): EmailBlock => {
  switch (type) {
    case 'heading': return { type, text: 'A heading', align: 'left' };
    case 'text': return { type, text: '', align: 'left' };
    case 'image': return { type, url: '', alt: '' };
    case 'button': return { type, label: 'Book now', url: link, align: 'center' };
    case 'divider': return { type };
    default: return { type: 'spacer', size: 24 };
  }
};

const isHttps = (url: string) => {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' && !!u.host;
  } catch {
    return false;
  }
};
const isButtonUrl = (url: string) => {
  const v = url.trim();
  return /^mailto:.+/.test(v) || /^tel:.+/.test(v) || isHttps(v);
};

/** What's wrong with one block, or null — the same rules the server applies. */
export const blockProblem = (b: EmailBlock): string | null => {
  switch (b.type) {
    case 'heading':
      if (!b.text.trim()) return 'Write the heading, or remove the block.';
      if (b.text.length > 150) return 'Keep headings under 150 characters.';
      return null;
    case 'text':
      if (!b.text.trim()) return 'Write something, or remove the block.';
      if (b.text.length > 3000) return 'Keep it under 3,000 characters.';
      return null;
    case 'image':
      if (!b.url.trim()) return 'Upload an image or paste its https:// address.';
      if (!isHttps(b.url)) return 'The image address must start with https://.';
      if (b.link && !isHttps(b.link)) return 'The image link must be a full https:// address.';
      return null;
    case 'button':
      if (!b.label.trim()) return 'Give the button a label.';
      if (b.label.length > 40) return 'Keep button labels to 40 characters.';
      if (!b.url.trim()) return 'Add the link this button opens.';
      if (!isButtonUrl(b.url)) return 'Use a full https:// link, mailto: or tel:.';
      return null;
    default:
      return null;
  }
};

export const draftProblems = (d: Pick<EmailDraft, 'subject' | 'design'>): string[] => {
  const out: string[] = [];
  if (!d.subject.trim()) out.push('Write a subject line.');
  if (d.subject.length > 150) out.push('Keep the subject under 150 characters.');
  if (d.design.blocks.length === 0) out.push('Add something to the email.');
  if (d.design.blocks.length > 40) out.push('Keep it to 40 blocks or fewer.');
  if (d.design.blocks.some((b) => blockProblem(b))) out.push('Some blocks need finishing — see the highlighted ones.');
  return out;
};

/**
 * The draft as the preview endpoint will take it while it's still being written:
 * unfinished blocks are left out rather than failing the whole preview, and a
 * button without its link yet still shows, pointed at a placeholder.
 */
export const previewContent = (d: Pick<EmailDraft, 'subject' | 'preheader' | 'design'>): EmailContent => ({
  subject: d.subject || '(no subject)',
  preheader: d.preheader,
  design: {
    theme: d.design.theme,
    blocks: d.design.blocks
      .map((b): EmailBlock | null => {
        if (b.type === 'button') {
          if (!b.label.trim()) return null;
          return { ...b, label: b.label.slice(0, 40), url: isButtonUrl(b.url) ? b.url : 'https://example.com' };
        }
        if (b.type === 'image' && b.link && !isHttps(b.link)) return { ...b, link: undefined };
        return blockProblem(b) ? null : b;
      })
      .filter((b): b is EmailBlock => !!b),
  },
});

/** The design to send: as written, minus `undefined`s. */
export const sendContent = (d: EmailDraft): EmailContent => ({
  subject: d.subject.trim(),
  preheader: d.preheader.trim(),
  design: d.design,
});

/**
 * `value` settled for `ms`. Compared by content, not identity: callers pass
 * objects rebuilt every render, and an identity dependency would restart the
 * timer on the very re-render its own update causes.
 */
export const useDebounced = <T,>(value: T, ms = 450): T => {
  const [v, setV] = useState(value);
  const key = JSON.stringify(value);
  useEffect(() => {
    const t = setTimeout(() => setV(JSON.parse(key) as T), ms);
    return () => clearTimeout(t);
  }, [key, ms]);
  return v;
};

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';
