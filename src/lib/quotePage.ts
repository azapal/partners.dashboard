import config from "../../config/config";
import type { QuoteContactChannel, QuoteCopyChannel } from "../service/partnerService";

/**
 * Shared by the public quote page, its preview inside the dashboard, and the
 * leads list. The backend builds the same links and message
 * (modules/business/quote_page.py) — keep the formats in step.
 */

/**
 * Where a customer can send their request. WhatsApp only for now — see
 * CONTACT_CHANNELS in the backend's quote_page.py, which enforces the same.
 */
export const CONTACT_CHANNELS: {
  id: QuoteContactChannel;
  label: string;
  icon: string;
  /** "list" channels reach a person's phone, so they hold a team rather than one address. */
  kind: "single" | "list";
  /** Names the settings input; "Email" alone would collide with the copy-by-email switch. */
  inputLabel: string;
  placeholder: string;
  hint: string;
}[] = [
  { id: "whatsapp", label: "WhatsApp", icon: "ri-whatsapp-line", kind: "list", inputLabel: "Your WhatsApp number", placeholder: "+234 803 123 4567", hint: "A sales line, or the teammates who answer — their app opens with the request typed." },
];

/**
 * How a customer can get their own copy. Email only for now — WhatsApp needs a
 * template approved by Meta and texts need an SMS provider, and a channel that
 * can't actually send is worse than one that isn't offered.
 */
export const COPY_CHANNELS: { id: QuoteCopyChannel; label: string; icon: string; unavailable: string }[] = [
  { id: "email", label: "Email", icon: "ri-mail-line", unavailable: "Email sending isn't set up." },
];

export const channelLabel = (id: QuoteContactChannel | QuoteCopyChannel) =>
  CONTACT_CHANNELS.find((c) => c.id === id)?.label ?? id;
export const channelIcon = (id: QuoteContactChannel | QuoteCopyChannel) =>
  CONTACT_CHANNELS.find((c) => c.id === id)?.icon ?? "ri-chat-3-line";

/**
 * The link a partner shares. It goes to the backend rather than straight to the
 * page, because that's what carries their name and logo into a WhatsApp or
 * Instagram preview — it redirects to the page itself on arrival.
 */
export const shareLink = (slug: string) => {
  try {
    return `${new URL(config.api.azapal.baseUrl).origin}/q/${slug}`;
  } catch {
    // A malformed base URL shouldn't cost the partner their link.
    return `${window.location.origin}/quote/${slug}`;
  }
};

/** The link the customer's own device opens to send `message` to the partner. */
export const contactHref = (channel: QuoteContactChannel, address: string, message: string, subject: string) => {
  const text = encodeURIComponent(message);
  switch (channel) {
    case "whatsapp":
      return `https://wa.me/${address.replace(/^\+/, "")}?text=${text}`;
    case "instagram":
      return `https://ig.me/m/${address}`;
    case "email":
      return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${text}`;
    case "sms":
      return `sms:${address}?&body=${text}`;
  }
};

/** Black or white, whichever reads on the partner's colour — they choose it, not us. */
export const textOn = (hex: string) => {
  let value = hex.replace("#", "");
  if (value.length === 3) value = value.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  if ([r, g, b].some(Number.isNaN)) return "#ffffff";
  return 0.299 * r + 0.587 * g + 0.114 * b > 170 ? "#111111" : "#ffffff";
};

/**
 * The text a customer sends the partner. The live page uses the server's
 * (message_to_partner); this twin exists only so the dashboard preview can
 * show the same thing without saving a lead — keep the two worded the same.
 */
export const buildPartnerMessage = (args: {
  partnerName: string;
  reference: string;
  serviceLabel: string;
  details?: string;
  answers: { label: string; value: string }[];
  name: string;
  phone: string;
  email?: string;
}) =>
  [
    `Hi ${args.partnerName}, I'd like a quote for ${args.serviceLabel}.`,
    "",
    `Request ${args.reference}`,
    ...args.answers.map((a) => `${a.label}: ${a.value}`),
    ...(args.details ? [args.details] : []),
    "",
    `Name: ${args.name}`,
    `Phone: ${args.phone}`,
    ...(args.email ? [`Email: ${args.email}`] : []),
  ].join("\n");
