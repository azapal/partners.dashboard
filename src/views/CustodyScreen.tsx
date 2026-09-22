import { useMemo, useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { useGetTransactions } from "../hooks/useTransactions";
import { deriveCustodyChain, custodyStrength, EVIDENCE_STYLE } from "../lib/custody";
import type { Transaction } from "../service/partnerService";

/**
 * Custody — the chain of hands a consignment passed through.
 *
 * Assembled from records the platform already keeps (see lib/custody.ts). The
 * screen's real job is not to draw a pretty timeline but to show where the
 * chain would fail to prove anything: every link says how well it is evidenced,
 * and the header counts how much of it would survive a dispute.
 */

const day = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

export const CustodyScreen = () => {
  const { data, isLoading } = useGetTransactions({ page_size: 50 });
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const consignments = data?.results ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return consignments;
    return consignments.filter((tx) =>
      [tx.reference, String(tx.id), tx.driver?.name, tx.branch?.branch_code, tx.pickup_code]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [consignments, query]);

  const selected: Transaction | undefined =
    filtered.find((tx) => tx.id === selectedId) ?? filtered[0];

  const chain = selected ? deriveCustodyChain(selected) : [];
  const strength = custodyStrength(chain);

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Custody</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Every hand a consignment passed through, and how much of it you could actually prove.
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 px-4 py-3">
          <i className="ri-information-line mt-0.5 text-base text-blue-600" />
          <p className="text-xs leading-5 text-blue-900">
            <span className="font-semibold">Built from existing records.</span> Orders carry a
            pickup code, an assigned driver and a Checkout session code — this threads them into one
            chain. There's no event log yet, so links show <em>what</em> happened and who held it,
            but only some carry a time.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {/* ── Consignments ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl bg-white shadow-card">
              <div className="p-3">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Reference, driver, branch or code"
                    aria-label="Search consignments"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-orange-50"
                  />
                </div>
              </div>

              <div className="max-h-[32rem] divide-y divide-gray-100 overflow-y-auto">
                {isLoading && (
                  <p className="px-4 py-10 text-center text-sm text-gray-400">
                    <i className="ri-loader-4-line animate-spin text-lg" />
                  </p>
                )}
                {!isLoading && filtered.length === 0 && (
                  <p className="px-4 py-10 text-center text-sm text-gray-400">
                    {consignments.length ? "Nothing matches that." : "No consignments yet."}
                  </p>
                )}
                {filtered.map((tx) => {
                  const s = custodyStrength(deriveCustodyChain(tx));
                  const active = selected?.id === tx.id;
                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => setSelectedId(tx.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        active ? "bg-orange-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-xs font-semibold ${active ? "text-brand" : "text-gray-800"}`}>
                          {tx.reference ?? `Order #${tx.id}`}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-gray-400">
                          {tx.driver?.name ?? "No driver"} · {tx.branch?.branch_code ?? "no branch"}
                        </span>
                      </span>
                      {/*
                        Gaps, not a percentage. A barely-started order has one
                        proven link out of one and would score 100%, ranking it
                        above a finished delivery — the ratio isn't comparable
                        across stages. A count of unevidenced links is, and it
                        is the thing worth acting on.
                      */}
                      <span className="shrink-0 text-right">
                        {s.weak > 0 ? (
                          <>
                            <span className="block text-[11px] font-bold text-amber-600">{s.weak}</span>
                            <span className="block text-[9px] uppercase tracking-wide text-gray-400">
                              gap{s.weak === 1 ? "" : "s"}
                            </span>
                          </>
                        ) : (
                          <span className="block text-[10px] font-semibold text-emerald-600">
                            <i className="ri-shield-check-line" />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Chain ────────────────────────────────────────────────────── */}
          <div className="lg:col-span-3">
            {!selected ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-card">
                <p className="text-sm text-gray-400">Pick a consignment to see its chain.</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      {selected.reference ?? `Order #${selected.id}`}
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-400 capitalize">
                      {String(selected.status)} · {selected.delivery_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {strength.proven}
                      <span className="text-sm font-medium text-gray-400">/{strength.happened}</span>
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">links proven</p>
                  </div>
                </div>

                {strength.weak > 0 && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
                    <i className="ri-error-warning-line mt-0.5 text-sm text-amber-600" />
                    <p className="text-[11px] leading-4 text-amber-800">
                      {strength.weak} link{strength.weak === 1 ? "" : "s"} rest on the order's status
                      alone. If this delivery were disputed, {strength.weak === 1 ? "it" : "they"}{" "}
                      couldn't be evidenced.
                    </p>
                  </div>
                )}

                <ol className="mt-5">
                  {chain.map((link, i) => {
                    const style = EVIDENCE_STYLE[link.evidence];
                    const last = i === chain.length - 1;
                    return (
                      <li key={link.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              link.evidence === "pending" ? "bg-gray-100 text-gray-300" : "bg-gray-900 text-white"
                            }`}
                          >
                            <i className={`${link.icon} text-sm`} />
                          </span>
                          {!last && <span className="my-1 w-px flex-1 bg-gray-200" />}
                        </div>

                        <div className={`min-w-0 flex-1 ${last ? "pb-0" : "pb-5"}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={`text-sm font-semibold ${
                                link.evidence === "pending" ? "text-gray-400" : "text-gray-900"
                              }`}
                            >
                              {link.label}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${style.chip}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                              {style.label}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-medium text-gray-600">{link.holder}</p>
                          <p className="mt-0.5 text-[11px] leading-4 text-gray-400">{link.detail}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3">
                            {link.at && (
                              <span className="text-[10px] text-gray-400">
                                <i className="ri-time-line mr-1" />
                                {day(link.at)}
                              </span>
                            )}
                            {link.proof && (
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
                                {link.proof}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
