import { Link, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { QuotePageSettings } from "../components/quote/QuotePageSettings";
import { QuoteRequestsPanel } from "../components/quote/QuoteRequestsPanel";
import { useQuotePageSettings, useQuotePages, useQuoteRequests } from "../hooks/useQuotePage";
import type { QuoteServiceId } from "../lib/data/quoteServices";

/**
 * The quote page a partner shares with their customers — one screen, one view
 * per thing it quotes for.
 *
 * `?view=` is the whole navigation: `page` for the page itself, a service's key
 * for the form customers fill in for it, `requests` for the leads it brings in.
 * A service is set up on its own view rather than ticked on a list, because
 * switching it on is the smallest part of setting it up — the questions it asks
 * are what the partner actually has to write.
 *
 * The services on offer are the ones the partner ticked under Services; the
 * questions asked about each are theirs to write, here.
 *
 * `?branch=` picks which page: the company's, or one branch's. A branch page
 * inherits the company's and overrides only its link, wording and contacts —
 * what it quotes for, and what it asks, stays one decision for the company.
 */

type View = { id: string; tab: string; service?: QuoteServiceId };

const PAGE_VIEW: View = { id: "page", tab: "Page" };
const REQUESTS_VIEW: View = { id: "requests", tab: "Quote requests" };

export const QuotePageScreen = () => {
  const [params, setParams] = useSearchParams();
  const { data: pages = [] } = useQuotePages();
  const branchParam = Number(params.get("branch")) || null;
  const branchId = pages.some((p) => p.branch === branchParam) ? branchParam : null;
  const onCompanyPage = branchId === null;

  const go = (next: { view?: string; branch?: number | null }) => {
    const id = next.view ?? view.id;
    const branch = next.branch === undefined ? branchId : next.branch;
    setParams({ ...(id === "page" ? {} : { view: id }), ...(branch ? { branch: String(branch) } : {}) });
  };
  const showView = (id: string) => go({ view: id });

  const { data: settings, isPending } = useQuotePageSettings(branchId);
  const { data: requests } = useQuoteRequests();
  const newLeads = requests?.filter((r) => r.status === "new").length ?? 0;
  const offered = new Set((settings?.services ?? []).map((s) => s.service));

  // One tab per service the page could offer. A service still on the page but no
  // longer ticked under Services keeps its tab, so it can be found and explained.
  const available = settings?.available_services ?? [];
  const lapsed = (settings?.services ?? []).filter((s) => !available.some((a) => a.service === s.service));
  const views: View[] = [
    PAGE_VIEW,
    ...available.map((a) => ({ id: a.service, tab: a.name, service: a.service })),
    ...lapsed.map((s) => ({ id: s.service, tab: s.label, service: s.service })),
    REQUESTS_VIEW,
  ];
  const view = views.find((v) => v.id === params.get("view")) ?? PAGE_VIEW;
  // Nothing to quote for until the partner says what they offer.
  const nothingOffered = !!settings && available.length === 0;

  return (
    <DashboardLayout>
      <div className="flex w-full flex-col gap-5 overflow-y-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {/* <h1 className="text-xl font-bold text-gray-900">Quote page</h1> */}
            <p className="mt-0.5 text-sm text-gray-500">
              One page your customers open to tell you about a job, ask you for a price and leave their details.
            </p>
          </div>
          {/* Only worth a switcher once there's more than the company's own. */}
          {pages.length > 1 && (
            <select
              value={branchId ?? "company"}
              onChange={(e) => go({ branch: e.target.value === "company" ? null : Number(e.target.value) })}
              aria-label="Which page"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-orange-50"
            >
              {pages.map((p) => (
                <option key={p.branch ?? "company"} value={p.branch ?? "company"}>
                  {p.branch_code ?? "Company page"}
                  {p.exists ? (p.is_published ? " · live" : " · draft") : " · not set up"}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex w-max items-center gap-1 rounded-xl bg-white p-1 shadow-card">
            {views.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => showView(v.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  view.id === v.id ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {/* A service that's live on the page carries a dot, so the row
                    doubles as the list of what's switched on. */}
                {v.service && onCompanyPage && offered.has(v.service) && (
                  <span className={`h-1.5 w-1.5 rounded-full ${view.id === v.id ? "bg-white" : "bg-emerald-500"}`} />
                )}
                {v.tab}
                {v.id === "requests" && newLeads > 0 && (
                  <span className={`rounded-full px-1.5 text-[10px] ${view.id === v.id ? "bg-white/25" : "bg-orange-100 text-brand"}`}>
                    {newLeads}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {nothingOffered && onCompanyPage && view.id === "page" && (
          <p className="rounded-2xl bg-white px-5 py-3.5 text-sm text-gray-500 shadow-card">
            Nothing can go on your page yet. Tick the services you offer under{" "}
            <Link to="/service" className="font-semibold text-brand hover:text-brand-hover">Services</Link>
            , then write the questions customers answer for each one here.
          </p>
        )}

        {view.id === "requests" ? (
          <QuoteRequestsPanel onOpenSettings={() => showView("page")} branchId={branchId} />
        ) : isPending ? (
          <p className="rounded-2xl bg-white py-14 text-center text-sm text-gray-400 shadow-card">Loading…</p>
        ) : (
          <QuotePageSettings view={view.service ?? "page"} branchId={branchId} />
        )}
      </div>
    </DashboardLayout>
  );
};
