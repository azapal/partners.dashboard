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

/**
 * What the preview shows until a partner uploads their own logo — the app has
 * to have *a* mark on its splash and sign-in screens, and Azapal's is the honest
 * one, since that is whose app it is until they brand it.
 */
export const DEFAULT_APP_LOGO = "/azapallogoV1.svg";

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
  | "splash"
  | "signin"
  | "home"
  | "track"
  | "book"
  | "chat"
  | "profile"
  | "settings"
  | "legal";

export const SCREENS: { id: ScreenId; label: string; always?: boolean }[] = [
  { id: "splash", label: "Splash", always: true },
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
  /** Uploaded image URLs for image/carousel, a video URL for video. */
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
  /** S3 URL from the branding bucket — never inline image data. */
  logo_url: string | null;
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
  logo_url: null,
  primary: BRAND_ORANGE,
  accent: "#8B2915",
  theme: "light",
  layout: "classic",
  services: [],
  platforms: { ios: true, android: true },
  screens: {
    splash: true, signin: true, home: true, track: true, book: true,
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

export const PALETTE_PRESETS = [
  { name: "Azapal", primary: BRAND_ORANGE, accent: "#8B2915" },
  { name: "Midnight", primary: "#0d1b3d", accent: "#3b5bdb" },
  { name: "Forest", primary: "#14532d", accent: "#16a34a" },
  { name: "Plum", primary: "#4c1d95", accent: "#a855f7" },
  { name: "Slate", primary: "#1f2937", accent: "#64748b" },
];

/**
 * The white-labelled Azapal app: the partner's logo and colours on Azapal's own
 * customer app. Deliberately just this — layout, screens and sign-in are
 * Azapal's, which is what makes it something that can go live the day it is
 * accepted. Anything more is the custom app.
 */
export interface WhiteLabelConfig {
  /** Shown in the app's header beside the logo. Defaults to the partner's name. */
  display_name: string;
  logo_url: string | null;
  primary: string;
  accent: string;
}

export const defaultWhiteLabel = (partnerName?: string): WhiteLabelConfig => ({
  display_name: partnerName ?? "",
  logo_url: null,
  primary: BRAND_ORANGE,
  accent: "#8B2915",
});

/** What the white-label app looks like, as a config PhoneFrame can render. */
export const whiteLabelPreview = (wl: WhiteLabelConfig, services: string[]): MobilityConfig => ({
  ...defaultConfig(wl.display_name),
  appName: wl.display_name,
  tagline: "on Azapal",
  logo_url: wl.logo_url,
  primary: wl.primary,
  accent: wl.accent,
  services,
});

export const naira = (n: number) =>
  `\u20a6${n.toLocaleString("en-NG", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
