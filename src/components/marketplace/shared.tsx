import { useEffect, useRef, useState, type ReactNode } from "react";
import { feedbackStore } from "../../store/client/feedback";
import { BRAND_ORANGE } from "../../lib/brandColors";
import States from "../../utilities/states.json";
import { initialsOf } from "../support/SupportUI";
import type { MarketplacePartnerCard } from "../../service/partnerService";

/**
 * Pieces shared by the Logistics network marketplace: partner identity, money
 * and date formatting, the full-screen modal shell, and react-select styling.
 */

export const NIGERIAN_STATES: string[] = (States as { name: string }[]).map((s) => s.name);
export const STATE_OPTIONS = NIGERIAN_STATES.map((s) => ({ value: s, label: s }));

// ── Formatting ────────────────────────────────────────────────────────────────

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
export const formatNaira = (n: number) => naira.format(n);

export const budgetLabel = (min: number | null, max: number | null) => {
  if (min != null && max != null) return min === max ? formatNaira(min) : `${formatNaira(min)} – ${formatNaira(max)}`;
  if (min != null) return `From ${formatNaira(min)}`;
  if (max != null) return `Up to ${formatNaira(max)}`;
  return "Open to quotes";
};

export const formatDay = (iso: string | null | undefined) => {
  if (!iso) return "";
  // A bare YYYY-MM-DD is a calendar day, not a UTC instant — parse it as local.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

export const neededByLabel = (iso: string | null) => {
  if (!iso) return null;
  const day = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const when = formatDay(iso);
  if (days < 0) return { text: `Was due ${when}`, urgent: true };
  if (days === 0) return { text: "Needed today", urgent: true };
  if (days <= 7) return { text: `Needed in ${days} day${days === 1 ? "" : "s"}`, urgent: true };
  return { text: `Needed by ${when}`, urgent: false };
};

/** "now", "5m", "3h", "Tue", "12 Oct" — the inbox list's timestamp. */
export const shortTime = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h`;
  if (mins < 60 * 24 * 6) return d.toLocaleDateString("en-NG", { weekday: "short" });
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

export const clockTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" }) : "";

export const placeOf = (p: Pick<MarketplacePartnerCard, "city" | "state">) =>
  [p.city, p.state].filter(Boolean).join(", ");

/** wa.me wants the number as bare digits, international form. */
export const whatsappUrl = (raw: string) => {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
};

export const toCoord = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
};

// ── Identity ──────────────────────────────────────────────────────────────────

const LOGO_TINTS = ["bg-orange-100 text-brand", "bg-sky-100 text-sky-700", "bg-teal-100 text-teal-700", "bg-violet-100 text-violet-700", "bg-rose-100 text-rose-700", "bg-amber-100 text-amber-700"];

const tintFor = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return LOGO_TINTS[Math.abs(h) % LOGO_TINTS.length];
};

export const PartnerLogo = ({
  partner,
  size = "md",
}: {
  partner: Pick<MarketplacePartnerCard, "partner_name" | "partner_code" | "logo_url">;
  size?: "xs" | "sm" | "md" | "lg";
}) => {
  const [broken, setBroken] = useState(false);
  const box = {
    xs: "h-7 w-7 rounded-lg text-[10px]",
    sm: "h-9 w-9 rounded-xl text-xs",
    md: "h-12 w-12 rounded-2xl text-sm",
    lg: "h-16 w-16 rounded-2xl text-lg sm:h-20 sm:w-20 sm:text-xl",
  }[size];
  if (partner.logo_url && !broken) {
    return (
      <img
        src={partner.logo_url}
        alt=""
        onError={() => setBroken(true)}
        className={`${box} shrink-0 border border-gray-100 bg-white object-contain p-1`}
      />
    );
  }
  return (
    <span className={`${box} ${tintFor(partner.partner_code || partner.partner_name)} flex shrink-0 items-center justify-center font-bold`}>
      {initialsOf(partner.partner_name || "?")}
    </span>
  );
};

export const VerifiedBadge = ({ compact }: { compact?: boolean }) => (
  <span
    title="Verified by Azapal"
    className={`inline-flex shrink-0 items-center gap-0.5 rounded-full bg-sky-50 font-semibold text-sky-700 ${compact ? "px-1 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"}`}
  >
    <i className="ri-verified-badge-fill text-sm leading-none" />
    {!compact && "Verified"}
  </span>
);

export const CategoryChip = ({ icon, name, tone = "gray" }: { icon?: string; name: string; tone?: "gray" | "brand" }) => (
  <span
    className={`inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] font-medium ${
      tone === "brand" ? "bg-orange-50 text-brand" : "bg-gray-100 text-gray-600"
    }`}
  >
    {icon && <i className={`${icon} text-xs`} />}
    <span className="truncate">{name}</span>
  </span>
);

// ── Inputs ────────────────────────────────────────────────────────────────────

export const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200";

export const Field = ({
  label,
  required,
  hint,
  error,
  children,
  counter,
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | null;
  counter?: string;
  children: ReactNode;
}) => (
  // A wrapping <label>, so the text names whatever control is inside without
  // every caller threading an id through.
  <label className="flex min-w-0 flex-col gap-1.5">
    <span className="flex items-baseline justify-between gap-2">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </span>
      {counter && <span className="text-[11px] tabular-nums text-gray-400">{counter}</span>}
    </span>
    {children}
    {error ? (
      <span className="text-xs text-red-600">{error}</span>
    ) : hint ? (
      <span className="text-xs text-gray-400">{hint}</span>
    ) : null}
  </label>
);

export const Toggle = ({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
      checked ? "bg-brand" : "bg-gray-200"
    }`}
  >
    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);

// react-select, styled like the rest of the dashboard's inputs.
const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderColor: state.isFocused ? "#9ca3af" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 2px #e5e7eb" : "none",
    borderRadius: "0.75rem",
    minHeight: "44px",
    "&:hover": { borderColor: "#9ca3af" },
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? BRAND_ORANGE : state.isFocused ? "#f9fafb" : "white",
    color: state.isSelected ? "white" : "#374151",
    fontSize: "0.875rem",
  }),
  placeholder: (base: any) => ({ ...base, color: "#9ca3af", fontSize: "0.875rem" }),
  singleValue: (base: any) => ({ ...base, fontSize: "0.875rem" }),
  multiValue: (base: any) => ({ ...base, backgroundColor: "#fff1ed", borderRadius: "0.5rem" }),
  multiValueLabel: (base: any) => ({ ...base, color: BRAND_ORANGE, fontSize: "0.75rem", fontWeight: 600 }),
  multiValueRemove: (base: any) => ({ ...base, color: BRAND_ORANGE, borderRadius: "0.5rem", ":hover": { backgroundColor: "#ffe1d8" } }),
  menuPortal: (base: any) => ({ ...base, zIndex: 80 }),
};

/*
 * Menus render into <body>: a storefront's map has Leaflet panes at z-index
 * 400+, and the modals here are fixed full-screen layers — a menu left inside
 * either would be clipped or drawn behind. The open/close handlers feed the
 * Escape rule in FullScreenModal: an open menu takes the first Escape.
 */
let openMenus = 0;
export const selectProps = {
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuPosition: "fixed" as const,
  styles: selectStyles,
  onMenuOpen: () => { openMenus += 1; },
  onMenuClose: () => { openMenus = Math.max(0, openMenus - 1); },
};

// ── Full-screen modal ─────────────────────────────────────────────────────────

/*
 * The same full-screen shape as CreateBranchDrawer — header, scrolling body,
 * pinned footer — so a storefront or a form has the whole screen on a phone.
 * Modals here stack (a storefront preview opens over the editor), so Escape
 * closes only the topmost, and not at all while a select menu or the
 * FeedbackModal is open. Read in the capture phase, before react-select
 * swallows the key.
 */
const modalStack: number[] = [];
let nextModalId = 1;

export const FullScreenModal = ({
  onClose,
  title,
  subtitle,
  leading,
  actions,
  footer,
  children,
  labelId,
  bodyClassName = "",
}: {
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  labelId: string;
  bodyClassName?: string;
}) => {
  const idRef = useRef(0);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const id = nextModalId++;
    idRef.current = id;
    modalStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (modalStack[modalStack.length - 1] !== id) return;
      if (openMenus > 0 || feedbackStore.state.queue.length > 0) return;
      closeRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      const i = modalStack.indexOf(id);
      if (i >= 0) modalStack.splice(i, 1);
      // A select unmounted mid-open never reports closing; don't let that
      // swallow every later Escape.
      if (modalStack.length === 0) openMenus = 0;
    };
  }, []);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={labelId} className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5 sm:px-8 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          <div className="min-w-0">
            <h2 id={labelId} className="truncate text-lg font-bold text-gray-900 sm:text-xl">{title}</h2>
            {subtitle && <div className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm">{subtitle}</div>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100">
            <i className="ri-close-line text-xl" />
          </button>
        </div>
      </header>
      <div className={`min-h-0 flex-1 overflow-y-auto bg-gray-50/60 ${bodyClassName}`}>{children}</div>
      {footer && (
        <footer className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 sm:px-8">{footer}</footer>
      )}
    </div>
  );
};

/** The inline "couldn't load" line for a query that failed. */
export const LoadError = ({ what, error, onRetry }: { what: string; error: unknown; onRetry?: () => void }) => (
  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3">
    <i className="ri-error-warning-line mt-0.5 text-base text-red-600" />
    <p className="flex-1 text-xs leading-5 text-red-800">
      Couldn't load {what} — {error instanceof Error ? error.message : "please try again"}.
    </p>
    {onRetry && (
      <button onClick={onRetry} className="text-xs font-semibold text-red-700 hover:underline">Retry</button>
    )}
  </div>
);

/** The value, once it has stopped changing for `ms` — so search doesn't fire per keystroke. */
export const useDebounced = <T,>(value: T, ms = 300): T => {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
};
