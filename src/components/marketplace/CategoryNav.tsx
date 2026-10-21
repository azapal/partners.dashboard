import type { ReactNode } from "react";
import type { MarketplaceCategory } from "../../service/partnerService";
import { NIGERIAN_STATES } from "./shared";

/**
 * The categorised navigation shared by the marketplace and the briefs board:
 * a vertical rail on desktop, a horizontally scrolling chip row on a phone
 * (scrolling inside itself, so the page never scrolls sideways).
 *
 * Counts come from the categories endpoint — live listings from listed
 * partners, or open briefs — so they don't move with the search box.
 */
export const CategoryNav = ({
  categories,
  loading,
  selected,
  onSelect,
  countOf,
  allLabel,
  noun,
}: {
  categories: MarketplaceCategory[];
  loading?: boolean;
  selected: string;
  onSelect: (key: string) => void;
  countOf: (c: MarketplaceCategory) => number;
  allLabel: string;
  noun: string;
}) => {
  const total = categories.reduce((n, c) => n + countOf(c), 0);
  const items = [
    { key: "", name: allLabel, icon: "ri-apps-2-line", count: total },
    ...[...categories].sort((a, b) => a.order - b.order).map((c) => ({ key: c.key, name: c.name, icon: c.icon, count: countOf(c) })),
  ];

  if (loading) {
    return (
      <>
        <div className="flex gap-2 overflow-hidden lg:hidden">
          {Array.from({ length: 4 }).map((_, i) => <span key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-white" />)}
        </div>
        <div className="hidden flex-col gap-1.5 rounded-2xl bg-white p-3 shadow-card lg:flex">
          {Array.from({ length: 8 }).map((_, i) => <span key={i} className="h-9 animate-pulse rounded-xl bg-gray-50" />)}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Phone / tablet: chips */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:hidden" role="tablist" aria-label="Categories">
        {items.map((it) => {
          const on = it.key === selected;
          return (
            <button
              key={it.key || "all"}
              role="tab"
              aria-selected={on}
              onClick={() => onSelect(it.key)}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                on ? "bg-brand text-white shadow-sm" : "bg-white text-gray-600 shadow-card hover:text-gray-900"
              }`}
            >
              <i className={`${it.icon} text-sm`} />
              {it.name}
              <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${on ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>{it.count}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop: rail */}
      <nav aria-label="Categories" className="hidden rounded-2xl bg-white p-2 shadow-card lg:block">
        <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Categories</p>
        <div className="flex flex-col gap-0.5">
          {items.map((it) => {
            const on = it.key === selected;
            return (
              <button
                key={it.key || "all"}
                onClick={() => onSelect(it.key)}
                aria-current={on ? "true" : undefined}
                title={it.count === 1 ? `1 ${noun}` : `${it.count} ${noun}s`}
                className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                  on ? "bg-orange-50 font-semibold text-brand" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${on ? "bg-brand text-white" : "bg-gray-100 text-gray-500 group-hover:bg-white"}`}>
                  <i className={`${it.icon} text-base`} />
                </span>
                <span className="min-w-0 flex-1 truncate">{it.name}</span>
                <span className={`text-xs tabular-nums ${on ? "text-brand" : it.count ? "text-gray-500" : "text-gray-300"}`}>{it.count}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

/** Search, state and any extra filter, in one row that wraps on a phone. */
export const FilterBar = ({
  query,
  onQuery,
  placeholder,
  state,
  onState,
  children,
}: {
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
  state: string;
  onState: (s: string) => void;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
    <div className="relative min-w-0 flex-1">
      <i className="ri-search-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400" />
      <input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-gray-100 bg-white pl-9 pr-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-gray-200"
      />
    </div>
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:w-48 sm:flex-none">
        <i className="ri-map-pin-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400" />
        <select
          value={state}
          onChange={(e) => onState(e.target.value)}
          aria-label="State"
          className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-white pl-9 pr-8 text-sm text-gray-700 shadow-card focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <option value="">All states</option>
          {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <i className="ri-arrow-down-s-line pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>
      {children}
    </div>
  </div>
);
