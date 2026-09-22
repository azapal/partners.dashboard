import { currencySymbol, money, type MoveRateSet, type QuoteLine } from "./data/moveRates";
import type {
  PublicRateSet,
  QuoteContactChannel,
  QuoteCopyChannel,
} from "../service/partnerService";

/**
 * Shared by the public quote page, its preview inside the dashboard, and the
 * leads list. The backend builds the same links and message
 * (modules/business/quote_page.py) — keep the formats in step.
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
  { id: "whatsapp", label: "WhatsApp", icon: "ri-whatsapp-line", kind: "list", inputLabel: "Your WhatsApp number", placeholder: "+234 803 123 4567", hint: "Opens a chat with the quote already typed." },
  { id: "instagram", label: "Instagram", icon: "ri-instagram-line", kind: "single", inputLabel: "Your Instagram handle", placeholder: "@yourhandle", hint: "Opens your DMs. Instagram can't pre-fill text, so the quote is copied for them to paste." },
  { id: "email", label: "Email", icon: "ri-mail-line", kind: "single", inputLabel: "Your email address", placeholder: "bookings@yourcompany.com", hint: "Opens their email app with the quote as the message." },
  { id: "sms", label: "Text message", icon: "ri-message-2-line", kind: "list", inputLabel: "Your number for texts", placeholder: "+234 803 123 4567", hint: "Opens their messages app with the quote typed." },
];

export const COPY_CHANNELS: { id: QuoteCopyChannel; label: string; icon: string; unavailable: string }[] = [
  { id: "email", label: "Email", icon: "ri-mail-line", unavailable: "Email sending isn't set up." },
  { id: "whatsapp", label: "WhatsApp", icon: "ri-whatsapp-line", unavailable: "Waiting on Azapal's WhatsApp quote template to be approved by Meta." },
  { id: "sms", label: "Text message", icon: "ri-message-2-line", unavailable: "Waiting on Azapal to connect an SMS provider." },
];

export const channelLabel = (id: QuoteContactChannel | QuoteCopyChannel) =>
  CONTACT_CHANNELS.find((c) => c.id === id)?.label ?? id;
export const channelIcon = (id: QuoteContactChannel | QuoteCopyChannel) =>
  CONTACT_CHANNELS.find((c) => c.id === id)?.icon ?? "ri-chat-3-line";

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

export const toRateSet = (s: PublicRateSet): MoveRateSet => ({
  country: s.country,
  currency: s.currency,
  symbol: currencySymbol(s.currency),
  base: s.base,
  modifiers: s.modifiers,
  customFields: s.custom_fields,
});

/**
 * The text a customer sends the partner. The live page uses the server's
 * (message_to_partner); this twin exists only so the dashboard preview can
 * show the same thing without saving a lead.
 */
export const buildPartnerMessage = (args: {
  partnerName: string;
  reference: string;
  symbol: string;
  lines: QuoteLine[];
  total: number;
  answers: { label: string; value: string }[];
  name: string;
  phone: string;
  email?: string;
}) =>
  [
    `Hi ${args.partnerName}, I'd like to book this move.`,
    "",
    `Quote ${args.reference}`,
    ...args.lines.map((l) => `${l.label}${l.detail ? ` (${l.detail})` : ""}: ${money(args.symbol, l.amount)}`),
    `Total: ${money(args.symbol, args.total)}`,
    ...args.answers.map((a) => `${a.label}: ${a.value}`),
    "",
    `Name: ${args.name}`,
    `Phone: ${args.phone}`,
    ...(args.email ? [`Email: ${args.email}`] : []),
  ].join("\n");
