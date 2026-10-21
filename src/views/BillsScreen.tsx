import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { DailyBillingChart } from "../components/billing/DailyBillingChart";
import { useBillingAccounts, usePlatformBills, usePlatformPrices, usePlatformUsage } from "../hooks/usePlatformBilling";
import type { PlatformBill, PlatformBillLine, PlatformPriceKind, PlatformProjectedLine } from "../service/partnerService";

/**
 * Bills — what the partner pays Azapal, metered as they use it.
 *
 * Kept well apart from /financials, which is the partner billing their own
 * customers. Same words, opposite direction; the header says which is which
 * because a partner landing here by search must not think these are theirs.
 *
 * Nothing is charged as it happens. Usage is recorded at the price in force at
 * the time, rolled into one bill per account at month end, and settled from
 * whatever that account pays with. This screen is the running total in between,
 * which is the whole point of billing monthly — a bill that arrives as a
 * surprise has already failed.
 */

type Tab = "usage" | "bills";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "usage", label: "This month", icon: "ri-speed-up-line" },
  { key: "bills", label: "Bills", icon: "ri-file-list-3-line" },
];

const isTab = (value: string | null): value is Tab => TABS.some((t) => t.key === value);

const naira = (n: number) =>
  `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const STATUS_STYLE: Record<PlatformBill["status"], string> = {
  paid: "bg-emerald-50 text-emerald-700",
  issued: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
  draft: "bg-gray-100 text-gray-500",
  void: "bg-gray-100 text-gray-400",
};

const STATUS_LABEL: Record<PlatformBill["status"], string> = {
  paid: "Paid",
  issued: "Due",
  failed: "Payment failed",
  draft: "Draft",
  void: "Void",
};

export const BillsScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(() => {
    const requested = searchParams.get("tab");
    return isTab(requested) ? requested : "usage";
  });

  const { data: prices = [] } = usePlatformPrices();
  const { data: usage, isPending: usagePending } = usePlatformUsage();
  const { data: bills = [], isPending: billsPending } = usePlatformBills();
  const { data: accounts = [] } = useBillingAccounts();

  const priceLabel = (kind: PlatformPriceKind) => prices.find((p) => p.kind === kind)?.label ?? kind;
  const needsMethod = accounts.filter((a) => a.method === "");

  const show = (next: Tab) => {
    setTab(next);
    navigate(next === "usage" ? "/bills" : `/bills?tab=${next}`, { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="flex w-full flex-col gap-5 overflow-y-auto">
        <div>
          <p className="mt-0.5 text-sm text-gray-500">
            What you pay Azapal for using the platform. Nothing here is what your own customers owe you — that's{" "}
            <Link to="/financials" className="font-semibold text-brand hover:text-brand-hover">Financials</Link>.
          </p>
        </div>

        {needsMethod.length > 0 && (
          <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-5 py-3.5 text-sm text-amber-800">
            <i className="ri-error-warning-line mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              {needsMethod.length === 1
                ? `${needsMethod[0].branch?.branch_code ?? "Your company account"} has no way to pay yet.`
                : `${needsMethod.length} accounts have no way to pay yet.`}{" "}
              <Link to="/PaymentMethod" className="font-semibold underline underline-offset-2">Set one up</Link> before
              the first bill falls due.
            </span>
          </p>
        )}

        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex w-max items-center gap-1 rounded-xl bg-white p-1 shadow-card">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => show(t.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  tab === t.key ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <i className={t.icon} aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "usage" ? (
          usagePending ? (
            <p className="rounded-2xl bg-white py-14 text-center text-sm text-gray-400 shadow-card">Loading…</p>
          ) : (
            <>
              <section className="rounded-2xl bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">Running up this month</h2>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {usage ? `${day(usage.period_start)} to ${day(usage.period_end)}` : ""} · billed at month end
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{naira(usage?.total ?? 0)}</p>
                </div>

                {/* The pre-bill. Only shown when the rest of the month adds
                    something — "estimated ₦0 more" is noise, and a backend that
                    predates the estimate sends no projected_total at all. */}
                {usage?.projected_total != null && usage.projected_total > usage.total && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand/5 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">Estimated bill on {day(usage.period_end)}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        What you've run up so far, plus your live quote pages for the rest of the month
                        {hasPace(usage.scopes) ? " and orders at this month's pace" : ""}. New users and branches aren't
                        guessed at.
                      </p>
                    </div>
                    <p className="shrink-0 text-lg font-bold text-brand">≈ {naira(usage.projected_total)}</p>
                  </div>
                )}

                {(usage?.scopes.length ?? 0) === 0 ? (
                  <p className="mt-4 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-500">
                    Nothing used yet this month. Nothing here charges until you use it.
                  </p>
                ) : (
                  <div className="mt-4 flex flex-col gap-3">
                    {usage!.scopes.map((scope) => (
                      <div key={scope.scope} className="rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-100 px-3.5 py-2.5">
                          <p className="text-sm font-semibold text-gray-800">
                            {scope.branch_code ?? "Company account"}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">{naira(scope.total)}</p>
                        </div>
                        <ul className="divide-y divide-gray-50">
                          {scope.lines.map((line) => (
                            <Line key={line.kind} line={line} label={priceLabel(line.kind)} />
                          ))}
                          {scope.projected?.map((line, i) => (
                            <ProjectedLine key={`p-${line.kind}-${i}`} line={line} label={priceLabel(line.kind)} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {usage?.days?.length ? <DailyBillingChart days={usage.days} priceLabel={priceLabel} /> : null}

              <section className="rounded-2xl bg-white p-5 shadow-card">
                <h2 className="text-sm font-semibold text-gray-800">What you'd be charged for</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  Every one of these is shown again at the moment it applies, before you do it.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {prices.map((price) => {
                    const left = Math.max(0, price.free_allowance - price.used);
                    return (
                      <li key={price.kind} className="rounded-xl bg-gray-50 px-3.5 py-2.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm font-medium text-gray-800">{price.label}</span>
                          <span className="shrink-0 text-sm font-semibold text-gray-900">{naira(price.unit_amount)}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {price.unit_label}
                          {price.free_allowance > 0 &&
                            ` · ${left > 0 ? `${left} of your first ${price.free_allowance} still free` : "free allowance used up"}`}
                        </p>
                        {price.description && <p className="mt-1 text-[11px] text-gray-500">{price.description}</p>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          )
        ) : billsPending ? (
          <p className="rounded-2xl bg-white py-14 text-center text-sm text-gray-400 shadow-card">Loading…</p>
        ) : bills.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-card">
            <i className="ri-file-list-3-line text-3xl text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No bills yet. Your first one covers this month.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-card">
            {bills.map((bill) => (
              <BillRow key={bill.number} bill={bill} priceLabel={priceLabel} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const Line = ({ line, label }: { line: PlatformBillLine; label: string }) => (
  <li className="flex items-baseline justify-between gap-3 px-3.5 py-2">
    <span className="min-w-0 text-xs text-gray-600">
      {label}
      <span className="text-gray-400">
        {" "}· {line.quantity} × {naira(line.unit_amount)}
      </span>
    </span>
    <span className="shrink-0 text-xs font-medium text-gray-800">{naira(line.amount)}</span>
  </li>
);

const hasPace = (scopes: { projected?: PlatformProjectedLine[] }[]) =>
  scopes.some((s) => s.projected?.some((l) => l.basis === "pace"));

/** A line the rest of the month is expected to add — styled apart so it never reads as already owed. */
const ProjectedLine = ({ line, label }: { line: PlatformProjectedLine; label: string }) => (
  <li className="flex items-baseline justify-between gap-3 bg-gray-50/60 px-3.5 py-2">
    <span className="min-w-0 text-xs italic text-gray-500">
      {line.basis === "scheduled" ? "Still to come" : "At this pace"} · {label}
      {line.label && <span className="not-italic text-gray-400"> {line.label}</span>}
      <span className="text-gray-400">
        {" "}· ~{line.quantity} × {naira(line.unit_amount)}
      </span>
    </span>
    <span className="shrink-0 text-xs text-gray-500">+{naira(line.amount)}</span>
  </li>
);

const BillRow = ({ bill, priceLabel }: { bill: PlatformBill; priceLabel: (kind: PlatformPriceKind) => string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <i className={`ri-arrow-${open ? "down" : "right"}-s-line text-gray-400`} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-800">
            {bill.number}
            <span className="ml-2 font-normal text-gray-400">{bill.branch?.branch_code ?? "Company account"}</span>
          </span>
          <span className="block text-xs text-gray-500">
            {day(bill.period_start)} – {day(bill.period_end)}
            {bill.status === "issued" && bill.due_at ? ` · due ${day(bill.due_at)}` : ""}
            {bill.status === "paid" && bill.paid_at ? ` · paid ${day(bill.paid_at)}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-sm font-bold text-gray-900">{naira(bill.total)}</span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[bill.status]}`}>
          {STATUS_LABEL[bill.status]}
        </span>
      </button>
      {open && (
        <div className="bg-gray-50/60 px-5 pb-4 pt-1 sm:pl-12">
          {bill.last_error && (
            <p className="mb-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {/* Paystack's own words. A declined card is the partner's to fix,
                  and paraphrasing it into "payment failed" helps nobody. */}
              {bill.last_error}{" "}
              <Link to="/PaymentMethod" className="font-semibold underline underline-offset-2">Update your method</Link>
            </p>
          )}
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
            {bill.lines.map((line) => (
              <Line key={line.kind} line={line} label={priceLabel(line.kind)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BillsScreen;
