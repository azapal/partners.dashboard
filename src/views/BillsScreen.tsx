import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import {
  BILLABLE_FEATURES,
  SAMPLE_BILLS,
  SAMPLE_CURRENT_USAGE,
  SAMPLE_RECEIPTS,
  formatPrice,
  pluraliseUnit,
  type PlatformBill,
} from "../lib/data/billing";

/**
 * Bills — what the partner pays Azapal, metered per feature.
 *
 * Kept well apart from /financials, which is the partner billing their own
 * customers. Same words, opposite direction; the header says which is which
 * because a partner landing here by search must not think these are theirs.
 *
 * Every figure is placeholder data (see billing.ts). The banner stays until a
 * real usage endpoint exists.
 */

type Tab = "usage" | "invoices" | "receipts";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "usage", label: "Pay as you go", icon: "ri-speed-up-line" },
  { key: "invoices", label: "Invoice history", icon: "ri-file-list-3-line" },
  { key: "receipts", label: "Receipt history", icon: "ri-receipt-line" },
];

const isTab = (value: string | null): value is Tab => TABS.some((t) => t.key === value);

const naira = (n: number) => `₦${n.toLocaleString()}`;
const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const STATUS_STYLE: Record<PlatformBill["status"], string> = {
  paid: "bg-emerald-50 text-emerald-700",
  due: "bg-amber-50 text-amber-700",
  overdue: "bg-red-50 text-red-700",
};

export const BillsScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(() => {
    const requested = searchParams.get("tab");
    return isTab(requested) ? requested : "usage";
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  const featureById = useMemo(
    () => Object.fromEntries(BILLABLE_FEATURES.map((f) => [f.id, f])),
    [],
  );

  const runningTotal = SAMPLE_CURRENT_USAGE.reduce((sum, line) => sum + line.amount, 0);

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bills</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              What you pay Azapal for the platform. Invoices you send your own customers live under{" "}
              <button
                type="button"
                onClick={() => navigate("/financials?tab=invoices")}
                className="font-semibold text-brand hover:text-brand-hover"
              >
                Financials
              </button>
              .
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 w-fit overflow-x-auto shadow-card">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  tab === t.key ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <i className={`${t.icon} text-base`} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Non-negotiable while the figures are invented. */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <i className="ri-information-line mt-0.5 text-base text-amber-600" />
          <p className="text-xs leading-5 text-amber-800">
            <span className="font-semibold">Sample figures.</span> Usage metering isn't live yet, so
            the quantities, prices and history below are illustrative — not a bill, and not final
            pricing.
          </p>
        </div>

        {tab === "usage" && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-card">
                <p className="text-xs font-medium text-gray-400">This month so far</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{naira(runningTotal)}</p>
                <p className="mt-1 text-[11px] text-gray-400">Billed on the 1st</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-card">
                <p className="text-xs font-medium text-gray-400">Features in use</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {SAMPLE_CURRENT_USAGE.length}
                  <span className="text-base font-medium text-gray-400"> / {BILLABLE_FEATURES.length}</span>
                </p>
                <p className="mt-1 text-[11px] text-gray-400">You only pay for what you switch on</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-card">
                <p className="text-xs font-medium text-gray-400">Payment method</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Wallet debit</p>
                <button
                  type="button"
                  onClick={() => navigate("/PaymentMethod")}
                  className="mt-1 text-[11px] font-semibold text-brand hover:text-brand-hover"
                >
                  Change <i className="ri-arrow-right-line align-middle" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-card">
              <div className="border-b border-gray-100 px-5 py-3.5">
                <h2 className="text-sm font-semibold text-gray-800">Billable features</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  Nothing here charges until you use it.
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {BILLABLE_FEATURES.map((feature) => {
                  const usage = SAMPLE_CURRENT_USAGE.find((u) => u.featureId === feature.id);
                  return (
                    <div key={feature.id} className="flex items-center gap-4 px-5 py-4">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          usage ? "bg-orange-50 text-brand" : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        <i className={`${feature.icon} text-base`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{feature.name}</p>
                          {!usage && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                              Not in use
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">{feature.description}</p>
                      </div>
                      <div className="hidden w-36 shrink-0 text-right sm:block">
                        <p className="text-xs font-medium text-gray-600">{formatPrice(feature)}</p>
                        {usage && (
                          <p className="mt-0.5 text-[11px] text-gray-400">
                            {usage.quantity.toLocaleString()} {pluraliseUnit(usage.quantity, feature.unitLabel)}
                          </p>
                        )}
                      </div>
                      <div className="w-24 shrink-0 text-right">
                        <p className={`text-sm font-semibold ${usage ? "text-gray-900" : "text-gray-300"}`}>
                          {usage ? naira(usage.amount) : "—"}
                        </p>
                        {feature.manageAt && (
                          <button
                            type="button"
                            onClick={() => navigate(feature.manageAt!)}
                            className="mt-0.5 text-[11px] font-semibold text-brand hover:text-brand-hover"
                          >
                            Manage
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-5 py-3.5">
                <p className="text-sm font-semibold text-gray-700">Running total</p>
                <p className="text-base font-bold text-gray-900">{naira(runningTotal)}</p>
              </div>
            </div>
          </>
        )}

        {tab === "invoices" && (
          <div className="overflow-hidden rounded-2xl bg-white divide-y divide-gray-100 shadow-card">
            {SAMPLE_BILLS.map((bill) => {
              const open = expanded === bill.id;
              return (
                <div key={bill.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : bill.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{bill.reference}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {day(bill.periodStart)} – {day(bill.periodEnd)}
                      </p>
                    </div>
                    <span
                      className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:inline ${STATUS_STYLE[bill.status]}`}
                    >
                      {bill.status}
                    </span>
                    <p className="w-28 shrink-0 text-right text-sm font-semibold text-gray-900">
                      {naira(bill.amount)}
                    </p>
                    <i
                      className={`ri-arrow-down-s-line shrink-0 text-lg text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open && (
                    <div className="bg-gray-50/60 px-5 pb-4 pt-1">
                      {bill.lines.map((line) => {
                        const feature = featureById[line.featureId];
                        return (
                          <div
                            key={line.featureId}
                            className="flex items-center justify-between border-b border-gray-100 py-2 last:border-b-0 text-xs"
                          >
                            <span className="text-gray-600">{feature?.name ?? line.featureId}</span>
                            <span className="flex items-center gap-4">
                              <span className="text-gray-400">
                                {line.quantity.toLocaleString()} {pluraliseUnit(line.quantity, feature?.unitLabel)}
                              </span>
                              <span className="w-20 text-right font-semibold text-gray-800">
                                {naira(line.amount)}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "receipts" && (
          <div className="overflow-hidden rounded-2xl bg-white divide-y divide-gray-100 shadow-card">
            {SAMPLE_RECEIPTS.map((receipt) => (
              <div key={receipt.id} className="flex items-center gap-4 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <i className="ri-check-line text-base" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{receipt.reference}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    For {receipt.billReference} · {receipt.method}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-gray-900">{naira(receipt.amount)}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">{day(receipt.paidAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
