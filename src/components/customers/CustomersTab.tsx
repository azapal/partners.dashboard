import { useState } from "react";
import { useCustomers } from "../../hooks/useEmailCampaigns";
import { useDebounced, type AudienceSeed } from "../../lib/emailDesign";
import type { Customer, CustomerSourceKey } from "../../service/partnerService";
import { Avatar, CustomerStatusChip, whenShort } from "./shared";

/**
 * Everyone the partner has dealt with, across every live service — quote
 * requests (moves, deliveries, whatever the quote page offers), app orders,
 * invoices and checkouts — de-duplicated by email on the server.
 *
 * Selection is kept by id across pages, so a partner can page through and pick.
 * "Email all matching" doesn't select anything: it hands the builder the filter,
 * and the server works out who that is when it sends.
 */

const PAGE_SIZE = 25;

const SOURCE_ICON: Record<CustomerSourceKey, string> = {
  quote_request: "ri-price-tag-3-line",
  order: "ri-exchange-line",
  invoice: "ri-file-list-3-line",
  checkout: "ri-bank-card-line",
};

export const CustomersTab = ({
  onCompose,
  onCampaign,
}: {
  /** The mini composer, for one customer or a few. */
  onCompose: (customers: Customer[]) => void;
  /** The full builder, with this audience. */
  onCampaign: (audience: AudienceSeed) => void;
}) => {
  const [q, setQ] = useState("");
  const [source, setSource] = useState<CustomerSourceKey | "">("");
  const [service, setService] = useState("");
  const [hasEmail, setHasEmail] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Map<string, Customer>>(new Map());

  const search = useDebounced(q.trim(), 350);
  const { data, isPending, isError, error, refetch, isFetching } = useCustomers({
    q: search,
    source,
    service,
    emailable: hasEmail,
    page,
    page_size: PAGE_SIZE,
  });

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const rows = data?.results ?? [];
  const allOnPage = rows.length > 0 && rows.every((c) => selected.has(c.id));
  const togglePage = () =>
    setSelected((s) => {
      const next = new Map(s);
      rows.forEach((c) => (allOnPage ? next.delete(c.id) : next.set(c.id, c)));
      return next;
    });
  const toggle = (c: Customer) =>
    setSelected((s) => {
      const next = new Map(s);
      if (next.has(c.id)) next.delete(c.id);
      else next.set(c.id, c);
      return next;
    });

  const picked = [...selected.values()];
  // A handful is a quick note; past that it's a campaign and deserves the builder.
  const emailSelected = () => (picked.length <= 10 ? onCompose(picked) : onCampaign({ kind: "customers", customers: picked }));
  const filterLabel = [search && `“${search}”`, source && data?.sources.find((s) => s.key === source)?.label, service].filter(Boolean).join(" · ");
  const emailAll = () =>
    onCampaign({
      kind: "filter",
      filter: { ...(search ? { q: search } : {}), ...(source ? { source } : {}), ...(service ? { service } : {}) },
      label: filterLabel || "All customers",
    });

  if (isPending || (isError && !data)) {
    return (
      <div className="rounded-2xl bg-white py-16 text-center shadow-card">
        {isError ? (
          <>
            <p className="text-sm text-gray-500">Couldn't load your customers{error?.message ? ` — ${error.message}` : "."}</p>
            <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold text-brand hover:text-brand-hover">Try again</button>
          </>
        ) : (
          <p className="text-sm text-gray-400"><i className="ri-loader-4-line mr-1 animate-spin" />Loading customers…</p>
        )}
      </div>
    );
  }

  const filtered = !!(search || source || service || hasEmail);
  const from = data.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, data.total);
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      {/* ── Summary ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon="ri-group-line" label="All customers" value={data.all_total} />
        <Tile icon="ri-mail-check-line" label={filtered ? "Emailable · matching" : "Can be emailed"} value={data.emailable} sub={filtered ? `of ${data.total.toLocaleString()} matching` : `of ${data.all_total.toLocaleString()}`} />
        <div className="col-span-2 flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
          <p className="text-xs font-semibold text-gray-500">By source</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 xl:flex xl:flex-wrap xl:gap-x-6">
            {data.sources.length === 0 && <span className="text-xs text-gray-400">Nothing yet</span>}
            {data.sources.map((s) => (
              <div key={s.key} className="flex min-w-0 items-center gap-1.5 text-sm">
                <i className={`${SOURCE_ICON[s.key] ?? "ri-user-line"} text-gray-400`} />
                <span className="truncate text-gray-600">{s.label}</span>
                <span className="ml-auto font-semibold tabular-nums text-gray-900 xl:ml-1">{s.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-3 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <i className="ri-search-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search name, email or phone"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-gray-400"
            />
          </label>
          <div className="flex gap-2">
            {data.services.length > 0 && (
              <select value={service} onChange={(e) => resetPage(setService)(e.target.value)} aria-label="Service" className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none sm:flex-none">
                <option value="">All services</option>
                {data.services.map((s) => (
                  <option key={s.name} value={s.name}>{s.name} ({s.count})</option>
                ))}
              </select>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={hasEmail}
              onClick={() => resetPage(setHasEmail)(!hasEmail)}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium ${hasEmail ? "border-brand bg-orange-50 text-brand" : "border-gray-200 text-gray-600"}`}
            >
              <span className={`relative h-4 w-7 rounded-full transition-colors ${hasEmail ? "bg-brand" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${hasEmail ? "left-3.5" : "left-0.5"}`} />
              </span>
              Has email
            </button>
          </div>
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {[{ key: "" as const, label: "Everyone", count: data.all_total }, ...data.sources].map((s) => (
            <button
              key={s.key || "all"}
              type="button"
              onClick={() => resetPage(setSource)(s.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${source === s.key ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 hover:text-gray-800"}`}
            >
              {s.label} <span className="opacity-60">{s.count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk actions ── sticky while something is picked, so paging down a long list keeps them in reach. */}
      <div className={`flex flex-wrap items-center gap-2 ${picked.length > 0 ? "sticky top-0 z-10 -mx-1 rounded-xl bg-white/95 px-1 py-2 backdrop-blur" : ""}`}>
        <p className="mr-auto text-sm text-gray-500">
          {picked.length > 0 ? (
            <>
              <span className="font-semibold text-gray-900">{picked.length.toLocaleString()} selected</span>
              <button type="button" onClick={() => setSelected(new Map())} className="ml-2 text-xs font-semibold text-gray-400 hover:text-gray-700">Clear</button>
            </>
          ) : (
            <>{data.total.toLocaleString()} {filtered ? "matching" : "customers"}{isFetching && <i className="ri-loader-4-line ml-2 animate-spin text-gray-400" />}</>
          )}
        </p>
        {picked.length > 0 && (
          <button type="button" onClick={emailSelected} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <i className="ri-mail-line" />Email selected ({picked.length.toLocaleString()})
          </button>
        )}
        <button
          type="button"
          onClick={emailAll}
          disabled={data.emailable === 0}
          className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          <i className="ri-mail-send-line" />Email all {filtered ? "matching" : ""} ({data.emailable.toLocaleString()})
        </button>
      </div>

      {/* ── List ── */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white px-6 py-14 text-center shadow-card">
          <i className="ri-user-search-line text-3xl text-gray-300" />
          <p className="text-sm text-gray-500">
            {filtered ? "No customers match that." : "No customers yet. They appear here as people request quotes, order, or pay your invoices."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-card md:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold text-gray-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Check checked={allOnPage} onChange={togglePage} label="Select all on this page" />
                  </th>
                  <th className="px-2 py-3">Customer</th>
                  <th className="w-[26%] px-2 py-3">Services & sources</th>
                  <th className="w-28 px-2 py-3">Last activity</th>
                  <th className="w-20 px-2 py-3 text-right">Dealings</th>
                  <th className="w-28 px-2 py-3">Status</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((c) => (
                  <tr key={c.id} className={selected.has(c.id) ? "bg-orange-50/40" : "hover:bg-gray-50/60"}>
                    <td className="px-4 py-3"><Check checked={selected.has(c.id)} onChange={() => toggle(c)} label={`Select ${c.name}`} /></td>
                    <td className="px-2 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={c.name} muted={!c.emailable} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{c.name || "Unnamed"}</p>
                          <p className="truncate text-xs text-gray-500">{[c.email, c.phone].filter(Boolean).join(" · ") || "No contact details"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3"><Chips customer={c} /></td>
                    <td className="px-2 py-3 text-xs text-gray-500">{whenShort(c.last_activity)}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-gray-700">{c.interactions}</td>
                    <td className="px-2 py-3"><CustomerStatusChip customer={c} /></td>
                    <td className="px-4 py-3 text-right">
                      <EmailButton customer={c} onClick={() => onCompose([c])} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="flex flex-col gap-2 md:hidden">
            <label className="flex items-center gap-2 px-1 text-xs font-semibold text-gray-500">
              <Check checked={allOnPage} onChange={togglePage} label="Select all on this page" />
              Select all on this page
            </label>
            {rows.map((c) => (
              <div key={c.id} className={`flex gap-3 rounded-2xl bg-white p-3.5 shadow-card ${selected.has(c.id) ? "ring-2 ring-brand/30" : ""}`}>
                <div className="pt-1.5"><Check checked={selected.has(c.id)} onChange={() => toggle(c)} label={`Select ${c.name}`} /></div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{c.name || "Unnamed"}</p>
                      <p className="truncate text-xs text-gray-500">{c.email || c.phone || "No contact details"}</p>
                    </div>
                    <CustomerStatusChip customer={c} />
                  </div>
                  <Chips customer={c} />
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{c.interactions} dealing{c.interactions === 1 ? "" : "s"} · last {whenShort(c.last_activity)}</span>
                    <EmailButton customer={c} onClick={() => onCompose([c])} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{from.toLocaleString()}–{to.toLocaleString()} of {data.total.toLocaleString()}</span>
              <div className="flex gap-2">
                <PageButton disabled={page <= 1} onClick={() => setPage(page - 1)} icon="ri-arrow-left-s-line" label="Previous page" />
                <span className="flex items-center px-1 text-xs">{page} / {pages}</span>
                <PageButton disabled={page >= pages} onClick={() => setPage(page + 1)} icon="ri-arrow-right-s-line" label="Next page" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Tile = ({ icon, label, value, sub }: { icon: string; label: string; value: number; sub?: string }) => (
  <div className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-card">
    <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500"><i className={`${icon} text-gray-400`} />{label}</p>
    <p className="text-2xl font-bold tabular-nums text-gray-900">{value.toLocaleString()}</p>
    {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
  </div>
);

const Chips = ({ customer: c }: { customer: Customer }) => (
  <div className="flex flex-wrap gap-1">
    {c.services.map((s) => (
      <span key={s} className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-maroon">{s}</span>
    ))}
    {c.sources.map((s) => (
      <span key={s.source} title={`${s.count} · last ${whenShort(s.last_at)}`} className="flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
        <i className={SOURCE_ICON[s.source] ?? "ri-user-line"} />
        {s.label}{s.count > 1 && <span className="text-gray-400">×{s.count}</span>}
      </span>
    ))}
  </div>
);

const EmailButton = ({ customer, onClick }: { customer: Customer; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!customer.emailable}
    title={customer.emailable ? `Email ${customer.name}` : customer.unsubscribed ? "Unsubscribed" : "No email address"}
    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-orange-50 disabled:text-gray-300 disabled:hover:bg-transparent"
  >
    <i className="ri-mail-line" />Email
  </button>
);

const Check = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
  <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#F14724]" />
);

const PageButton = ({ disabled, onClick, icon, label }: { disabled: boolean; onClick: () => void; icon: string; label: string }) => (
  <button type="button" disabled={disabled} onClick={onClick} aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-600 shadow-card disabled:opacity-40">
    <i className={icon} />
  </button>
);
