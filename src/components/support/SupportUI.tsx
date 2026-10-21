import type { ReactNode } from "react";

/**
 * Small presentational pieces shared by the /support/* screens, so every page
 * in the rep shell has the same intro line, card header, stat tile, empty and
 * loading states. Surfaces follow the house rule in index.css: a card is
 * `bg-white rounded-2xl shadow-card`, with borders only where they divide.
 */

/** The line under the header's page title, with room for page-level actions. */
export const PageIntro = ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <p className="max-w-2xl text-sm leading-6 text-gray-500">{children}</p>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`overflow-hidden rounded-2xl bg-white shadow-card ${className}`}>{children}</div>
);

export const CardHeader = ({
  icon,
  title,
  meta,
  children,
}: {
  icon?: string;
  title: string;
  meta?: ReactNode;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
    <div className="flex min-w-0 items-center gap-2.5">
      {icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-brand">
          <i className={`${icon} text-base`} />
        </span>
      )}
      <h2 className="truncate text-sm font-semibold text-gray-900">{title}</h2>
      {meta != null && (
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">{meta}</span>
      )}
    </div>
    {children}
  </div>
);

const TONES = {
  brand: "bg-orange-50 text-brand",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-emerald-50 text-emerald-600",
  blue: "bg-sky-50 text-sky-600",
  red: "bg-red-50 text-red-500",
  navy: "bg-slate-100 text-brand-navy",
} as const;

export type Tone = keyof typeof TONES;

export const StatTile = ({
  icon,
  label,
  value,
  tone = "brand",
  hint,
  loading,
}: {
  icon: string;
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
  loading?: boolean;
}) => (
  <div className="flex min-w-0 flex-col gap-2 rounded-2xl bg-white p-3.5 shadow-card sm:gap-3 sm:p-5">
    <div className="flex items-start justify-between gap-2">
      <p className="min-w-0 text-xs font-medium leading-snug text-gray-500 sm:truncate">{label}</p>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>
        <i className={`${icon} text-base`} />
      </span>
    </div>
    {loading ? (
      <span className="h-7 w-12 animate-pulse rounded-md bg-gray-100" />
    ) : (
      <p className="text-2xl font-bold tabular-nums tracking-tight text-gray-900">{value}</p>
    )}
    {hint && <p className="-mt-2 hidden truncate text-[11px] text-gray-400 sm:block">{hint}</p>}
  </div>
);

export const EmptyState = ({
  icon,
  title,
  children,
  compact,
}: {
  icon: string;
  title: string;
  children?: ReactNode;
  compact?: boolean;
}) => (
  <div className={`flex flex-col items-center justify-center px-6 text-center ${compact ? "py-10" : "py-16"}`}>
    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-brand">
      <i className={`${icon} text-xl`} />
    </span>
    <p className="text-sm font-semibold text-gray-800">{title}</p>
    {children && <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">{children}</p>}
  </div>
);

/** Skeleton rows standing in for a list while its query loads. */
export const LoadingRows = ({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) => (
  <div role="status" aria-label={label} className="divide-y divide-gray-50">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-4 sm:px-5">
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-gray-100" />
        <div className="flex flex-1 flex-col gap-2">
          <span className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
          <span className="h-2.5 w-2/3 animate-pulse rounded bg-gray-50" />
        </div>
        <span className="hidden h-5 w-16 animate-pulse rounded-full bg-gray-100 sm:block" />
      </div>
    ))}
  </div>
);

const AVATAR_COLORS = ["bg-orange-400", "bg-sky-500", "bg-teal-500", "bg-violet-400", "bg-rose-400", "bg-amber-500"];

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export const Avatar = ({
  id,
  name,
  size = "md",
  status,
}: {
  id: number;
  name: string;
  size?: "sm" | "md" | "lg";
  status?: "active" | "away" | "offline";
}) => {
  const box = size === "lg" ? "h-16 w-16 rounded-2xl text-xl" : size === "sm" ? "h-8 w-8 rounded-lg text-[11px]" : "h-10 w-10 rounded-xl text-xs";
  const dot = { active: "bg-emerald-500", away: "bg-amber-400", offline: "bg-gray-300" };
  return (
    <div className="relative shrink-0">
      <div className={`${box} ${AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length]} flex items-center justify-center font-bold text-white`}>
        {initialsOf(name)}
      </div>
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${dot[status]}`}
          aria-label={status}
        />
      )}
    </div>
  );
};

export const Pill = ({ className, children }: { className: string; children: ReactNode }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${className}`}>
    {children}
  </span>
);

/** Shared table header cell look. */
export const thClass = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 first:pl-5";
