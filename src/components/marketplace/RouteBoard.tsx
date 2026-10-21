import { useEffect, useMemo, useState } from "react";
import { useRouteBoard } from "../../hooks/useMarketplace";
import { useDeletePairingRoute, useGetPairingRoutes } from "../../hooks/usePairingRoutes";
import type { PairingRoute, RouteBoardItem } from "../../service/partnerService";
import { AddRouteModal } from "../modal/AddRouteModal";
import { BudgetTargetPreviewModal } from "../modal/BudgetTargetPreviewModal";
import { useNetwork } from "./NetworkShell";
import { SignInLink } from "./SignInLink";
import { LoadError, NIGERIAN_STATES, PartnerLogo, VerifiedBadge, formatDay, formatNaira, useDebounced } from "./shared";

/**
 * Pairing routes — a public board of every partner's upcoming routes, so a
 * load heading the same way can join one. Budgets are the owner's private
 * planning range: the board never carries them.
 *
 * Signed in, your own routes on the board say "Yours" with edit / delete /
 * pricing, and "Your routes" lists all of yours (past ones too, with budgets)
 * from the partner endpoint. Editing needs the full route, so it is looked up
 * there by id — the board item doesn't have the budgets the form edits.
 */

const FREQUENCY_LABELS: Record<string, string> = { one_time: "One-time", daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const RouteBoard = ({
  addRequest,
  onAddRequestHandled,
}: {
  /** The assistant's `route.create`: a prefill to open Add Route with. */
  addRequest?: { nonce: number; prefill: { origin_state?: string; destination_state?: string } } | null;
  onAddRequestHandled?: () => void;
}) => {
  const { signedIn, openPartner } = useNetwork();
  const [view, setView] = useState<"board" | "mine">("board");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [query, setQuery] = useState("");
  const q = useDebounced(query);

  const { data: board = [], isLoading, isFetching, error, refetch } = useRouteBoard({ origin, destination, q });
  const { data: mine = [], isLoading: mineLoading } = useGetPairingRoutes(signedIn);
  const mineById = useMemo(() => new Map(mine.map((r) => [r.id, r])), [mine]);

  const [adding, setAdding] = useState<{ origin_state?: string; destination_state?: string } | null>(null);
  const [editing, setEditing] = useState<PairingRoute | null>(null);
  const [pricing, setPricing] = useState<PairingRoute | null>(null);
  const remove = useDeletePairingRoute();

  // Opened once per request, then handed back so a remount doesn't reopen it.
  useEffect(() => {
    if (!addRequest || !signedIn) return;
    setAdding(addRequest.prefill);
    onAddRequestHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addRequest, signedIn]);

  const del = (r: PairingRoute) => {
    if (window.confirm(`Delete ${r.origin_state} → ${r.destination_state}? This can't be undone.`)) remove.mutate(r.id);
  };

  const filtered = !!(origin || destination || q.trim());
  const ownActions = (id: number) => {
    const full = mineById.get(id);
    return full ? { full, onEdit: () => setEditing(full), onDelete: () => del(full), onPricing: () => setPricing(full) } : null;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-brand">
            <i className="ri-route-line text-xl" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">Share the trip, share the cost</p>
            <p className="mt-0.5 text-xs leading-5 text-gray-500">
              Routes partners are already running. Heading the same way? Join one — or post yours so others can.
            </p>
          </div>
        </div>
        {signedIn ? (
          <button onClick={() => setAdding({})} className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
            <i className="ri-add-line" /> Add route
          </button>
        ) : (
          <SignInLink className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
            <i className="ri-login-box-line" /> Sign in to add a route
          </SignInLink>
        )}
      </div>

      {signedIn && (
        <div role="tablist" aria-label="Routes" className="flex w-fit items-center gap-1 rounded-xl bg-white p-1 shadow-card">
          {([["board", "All routes", "ri-layout-grid-line"], ["mine", "Your routes", "ri-user-line"]] as const).map(([id, label, icon]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${view === id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <i className={icon} /> {label}
              {id === "mine" && mine.length > 0 && <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-600">{mine.length}</span>}
            </button>
          ))}
        </div>
      )}

      {view === "mine" && signedIn ? (
        <MyRoutes routes={mine} loading={mineLoading} onEdit={setEditing} onDelete={del} onPricing={setPricing} onAdd={() => setAdding({})} />
      ) : (
        <>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <i className="ri-search-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cargo, partner or state…"
                className="h-11 w-full rounded-xl border border-gray-100 bg-white pl-9 pr-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:w-[26rem]">
              <StateSelect label="From" value={origin} onChange={setOrigin} />
              <button
                type="button"
                aria-label="Swap from and to"
                onClick={() => { setOrigin(destination); setDestination(origin); }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-gray-700"
              >
                <i className="ri-arrow-left-right-line" />
              </button>
              <StateSelect label="To" value={destination} onChange={setDestination} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              {isLoading ? "Loading routes…" : (
                <>
                  <span className="font-semibold text-gray-800">{board.length}</span> upcoming route{board.length === 1 ? "" : "s"}
                  {isFetching && <i className="ri-loader-4-line ml-1.5 animate-spin text-gray-400" />}
                </>
              )}
            </p>
            {filtered && (
              <button onClick={() => { setOrigin(""); setDestination(""); setQuery(""); }} className="text-xs font-semibold text-brand hover:text-brand-hover">Clear filters</button>
            )}
          </div>

          {error ? (
            <LoadError what="routes" error={error} onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-white shadow-card" />)}
            </div>
          ) : board.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-card">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-brand"><i className="ri-road-map-line text-2xl" /></span>
              <p className="text-sm font-semibold text-gray-800">{filtered ? "No upcoming routes match" : "No upcoming routes yet"}</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
                {filtered ? "Try another state, or swap the direction." : "When partners schedule routes, they show up here for others to join."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {board.map((r) => (
                <RouteCard key={r.id} route={r} own={r.is_mine ? ownActions(r.id) : null} onOpenPartner={openPartner} />
              ))}
            </div>
          )}
        </>
      )}

      {adding && <AddRouteModal prefill={adding} onClose={() => setAdding(null)} />}
      {editing && <AddRouteModal route={editing} onClose={() => setEditing(null)} />}
      {pricing && <BudgetTargetPreviewModal route={pricing} onClose={() => setPricing(null)} />}
    </div>
  );
};

function StateSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative min-w-0">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-11 w-full min-w-0 appearance-none truncate rounded-xl border border-gray-100 bg-white pl-12 pr-7 text-sm text-gray-700 shadow-card focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        <option value="">Any</option>
        {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <i className="ri-arrow-down-s-line pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

function RouteCard({
  route: r,
  own,
  onOpenPartner,
}: {
  route: RouteBoardItem;
  own: { full: PairingRoute; onEdit: () => void; onDelete: () => void; onPricing: () => void } | null;
  onOpenPartner: (code: string) => void;
}) {
  const recurring = r.frequency !== "one_time";
  return (
    <article className={`flex min-w-0 flex-col rounded-2xl bg-white p-4 shadow-card sm:p-5 ${r.is_mine ? "ring-2 ring-orange-100" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{r.frequency_label || FREQUENCY_LABELS[r.frequency] || r.frequency}</span>
        <span className="flex items-center gap-1.5">
          {r.is_mine && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">Yours</span>}
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.is_open_for_joining ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            {r.is_open_for_joining ? "Open to join" : "Full"}
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-base font-bold text-gray-900">
        <span className="min-w-0 truncate">{r.origin_state}</span>
        <i className="ri-arrow-right-line shrink-0 text-brand" />
        <span className="min-w-0 truncate">{r.destination_state}</span>
      </div>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1"><i className="ri-calendar-event-line" />{recurring ? "Next" : "On"} {formatDay(r.preferred_date)}</span>
        {r.cargo_type && <span className="flex items-center gap-1"><i className="ri-box-3-line" />{r.cargo_type}</span>}
      </p>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <span className="flex min-w-0 items-center gap-2">
            <PartnerLogo partner={r.partner} size="xs" />
            {r.partner.has_storefront ? (
              <button onClick={() => onOpenPartner(r.partner.partner_code)} className="truncate text-xs font-semibold text-gray-800 hover:text-brand hover:underline">
                {r.partner.partner_name}
              </button>
            ) : (
              <span className="truncate text-xs font-medium text-gray-700">{r.partner.partner_name}</span>
            )}
            {r.partner.is_verified && <VerifiedBadge compact />}
          </span>
          {r.partner.has_storefront && !r.is_mine && (
            <button onClick={() => onOpenPartner(r.partner.partner_code)} className="shrink-0 text-xs font-semibold text-brand hover:text-brand-hover">Storefront</button>
          )}
        </div>
        {own && (
          <div className="mt-3 flex flex-wrap justify-end gap-1">
            <button onClick={own.onPricing} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"><i className="ri-calculator-line" /> Pricing</button>
            <button onClick={own.onEdit} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"><i className="ri-edit-line" /> Edit</button>
            <button onClick={own.onDelete} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"><i className="ri-delete-bin-line" /> Delete</button>
          </div>
        )}
      </div>
    </article>
  );
}

function MyRoutes({
  routes,
  loading,
  onEdit,
  onDelete,
  onPricing,
  onAdd,
}: {
  routes: PairingRoute[];
  loading: boolean;
  onEdit: (r: PairingRoute) => void;
  onDelete: (r: PairingRoute) => void;
  onPricing: (r: PairingRoute) => void;
  onAdd: () => void;
}) {
  if (loading) return <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white shadow-card" />)}</div>;
  if (routes.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center shadow-card">
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-brand"><i className="ri-route-line text-2xl" /></span>
        <p className="text-sm font-semibold text-gray-800">You haven't added a route</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">Add a route you run regularly and other partners heading the same way can join it.</p>
        <button onClick={onAdd} className="mt-4 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover">Add route</button>
      </div>
    );
  }
  const t = today();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500">Only you see the budgets. Past-dated routes are off the public board.</p>
      {routes.map((r) => {
        const past = r.preferred_date.slice(0, 10) < t;
        return (
          <article key={r.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card sm:flex-row sm:items-center sm:p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  {r.origin_state} <i className="ri-arrow-right-line text-brand" /> {r.destination_state}
                </p>
                {past ? (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">Past — not on the board</span>
                ) : (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.is_open_for_joining ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {r.is_open_for_joining ? "Open to join" : "Closed"}
                  </span>
                )}
              </div>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>{FREQUENCY_LABELS[r.frequency] ?? r.frequency}</span>
                <span>{formatDay(r.preferred_date)}</span>
                <span>{r.cargo_type}</span>
                <span className="font-semibold text-gray-700">{formatNaira(r.min_budget)} – {formatNaira(r.max_budget)}</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1">
              <button onClick={() => onPricing(r)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"><i className="ri-calculator-line" /> Pricing</button>
              <button onClick={() => onEdit(r)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"><i className="ri-edit-line" /> Edit</button>
              <button onClick={() => onDelete(r)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"><i className="ri-delete-bin-line" /> Delete</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
