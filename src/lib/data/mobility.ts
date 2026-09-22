import { BRAND_ORANGE } from "../brandColors";

/**
 * The branded app a partner configures.
 *
 * Everything a partner can change lives in one object, and the preview renders
 * straight from it — there is no second source of truth describing "what the
 * app looks like". That is what lets the canvas show eight screens at once and
 * have all of them move the instant a colour changes.
 *
 * Layout is a *preset*, not a pile of switches. A partner choosing a brand is
 * not choosing a header treatment and a nav treatment independently; the three
 * presets are coherent combinations, which is why they read as designed rather
 * than assembled.
 */

export type LayoutId = "classic" | "bold" | "minimal";

export interface LayoutPreset {
  id: LayoutId;
  label: string;
  blurb: string;
  header: "solid" | "hero" | "plain";
  nav: "tabs" | "floating" | "drawer";
}

export const LAYOUTS: LayoutPreset[] = [
  {
    id: "classic",
    label: "Classic",
    blurb: "Solid header, labelled tab bar. Familiar and legible.",
    header: "solid",
    nav: "tabs",
  },
  {
    id: "bold",
    label: "Bold",
    blurb: "Gradient hero and a floating pill nav. Consumer-app feel.",
    header: "hero",
    nav: "floating",
  },
  {
    id: "minimal",
    label: "Minimal",
    blurb: "Quiet header, side drawer. Puts content first.",
    header: "plain",
    nav: "drawer",
  },
];

export type ScreenId =
  | "signin"
  | "home"
  | "track"
  | "book"
  | "chat"
  | "profile"
  | "settings"
  | "legal";

export const SCREENS: { id: ScreenId; label: string; always?: boolean }[] = [
  { id: "signin", label: "Sign in" },
  { id: "home", label: "Home", always: true },
  { id: "track", label: "Tracking" },
  { id: "book", label: "Booking" },
  { id: "chat", label: "Chat" },
  { id: "profile", label: "Profile" },
  { id: "settings", label: "Settings" },
  { id: "legal", label: "Legal" },
];

export type SectionType = "carousel" | "image" | "video" | "text" | "services";

export interface AppSection {
  id: string;
  type: SectionType;
  title: string;
  /** Body for text, caption for media. */
  body?: string;
  /** Data URLs for image/carousel, a URL for video. */
  media?: string[];
}

export const SECTION_TYPES: { type: SectionType; label: string; icon: string; hint: string }[] = [
  { type: "carousel", label: "Carousel", icon: "ri-slideshow-3-line", hint: "Swipeable promo cards" },
  { type: "image", label: "Image", icon: "ri-image-line", hint: "A single banner" },
  { type: "video", label: "Video", icon: "ri-video-line", hint: "An embedded clip" },
  { type: "text", label: "Text", icon: "ri-text", hint: "A note or announcement" },
  { type: "services", label: "Services", icon: "ri-apps-2-line", hint: "Your service grid" },
];

export interface ProfileField {
  id: string;
  label: string;
  enabled: boolean;
}

export const DEFAULT_PROFILE_FIELDS: ProfileField[] = [
  { id: "name", label: "Full name", enabled: true },
  { id: "phone", label: "Phone number", enabled: true },
  { id: "email", label: "Email address", enabled: true },
  { id: "address", label: "Saved addresses", enabled: true },
  { id: "orders", label: "Order history", enabled: true },
  { id: "wallet", label: "Wallet balance", enabled: false },
  { id: "referral", label: "Referral code", enabled: false },
];

export interface MobilityConfig {
  appName: string;
  tagline: string;
  logoDataUrl: string | null;
  primary: string;
  accent: string;
  theme: "light" | "dark";
  layout: LayoutId;
  services: string[];
  platforms: { ios: boolean; android: boolean };
  screens: Record<ScreenId, boolean>;
  auth: { google: boolean; apple: boolean; email: boolean; phone: boolean };
  profileFields: ProfileField[];
  sections: AppSection[];
  legal: { privacy: string; terms: string };
}

/**
 * Placeholder legal copy. Deliberately written as instructions to replace it
 * rather than as usable terms — shipping plausible-looking boilerplate that a
 * partner might publish unread would be worse than shipping nothing.
 */
export const LEGAL_PLACEHOLDER = {
  privacy:
    "Replace this with your privacy policy. It should say what personal data you collect (name, phone, addresses, location), why you collect it, who you share it with, how long you keep it, and how a customer asks for it to be deleted. If you operate in Nigeria this needs to satisfy the NDPA — take advice rather than copying another company's text.",
  terms:
    "Replace this with your terms and conditions. It should cover what you are agreeing to deliver, your pricing and payment terms, cancellation and refunds, your liability limit for loss or damage, what is excluded from carriage, and the law the agreement falls under.",
};

export const defaultConfig = (partnerName?: string): MobilityConfig => ({
  appName: partnerName ?? "",
  tagline: "Delivery, done properly",
  logoDataUrl: null,
  primary: BRAND_ORANGE,
  accent: "#8B2915",
  theme: "light",
  layout: "classic",
  services: [],
  platforms: { ios: true, android: true },
  screens: {
    signin: true, home: true, track: true, book: true,
    chat: true, profile: true, settings: true, legal: true,
  },
  auth: { google: true, apple: true, email: true, phone: false },
  profileFields: DEFAULT_PROFILE_FIELDS.map((f) => ({ ...f })),
  sections: [
    { id: "s1", type: "carousel", title: "What's new", body: "Promotions and announcements" },
    { id: "s2", type: "services", title: "Services" },
  ],
  legal: { privacy: LEGAL_PLACEHOLDER.privacy, terms: LEGAL_PLACEHOLDER.terms },
});

/**
 * One-time fee to start a build, denominated in USD. Local currencies are
 * offered for payment but never converted in the UI — see ActivationModal.
 */
export const ACTIVATION_FEE_USD = 1500;

export const BILLING_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US dollars" },
  { code: "NGN", symbol: "\u20a6", name: "Nigerian naira" },
  { code: "GHS", symbol: "GH\u20b5", name: "Ghanaian cedi" },
  { code: "KES", symbol: "KSh", name: "Kenyan shilling" },
  { code: "ZAR", symbol: "R", name: "South African rand" },
  { code: "XOF", symbol: "CFA", name: "West African CFA franc" },
  { code: "EGP", symbol: "E\u00a3", name: "Egyptian pound" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian shilling" },
];

export const PALETTE_PRESETS = [
  { name: "Azapal", primary: BRAND_ORANGE, accent: "#8B2915" },
  { name: "Midnight", primary: "#0d1b3d", accent: "#3b5bdb" },
  { name: "Forest", primary: "#14532d", accent: "#16a34a" },
  { name: "Plum", primary: "#4c1d95", accent: "#a855f7" },
  { name: "Slate", primary: "#1f2937", accent: "#64748b" },
];
