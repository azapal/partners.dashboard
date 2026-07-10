import { useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { useGetTransactions } from "../hooks/useTransactions";
import type { Transaction, TransactionPaymentStatus, TransactionStatus } from "../service/partnerService";

const STATUS_OPTIONS: (TransactionStatus | "All")[] = [
  "All", "pending", "approved", "shipped", "delivered", "canceled",
];

const PAYMENT_STATUS_OPTIONS: (TransactionPaymentStatus | "All")[] = [
  "All", "approved", "pending", "failed", "reversed", "refund",
];

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  approved: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-green-50 text-green-700",
  canceled: "bg-red-50 text-red-600",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-50 text-green-700",
  pending: "bg-yellow-50 text-yellow-700",
  failed: "bg-red-50 text-red-600",
  reversed: "bg-orange-50 text-orange-700",
  refund: "bg-purple-50 text-purple-700",
};

const formatAmount = (n: number) => `₦${n.toLocaleString()}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const StatusBadge = ({ value, styles }: { value: string; styles: Record<string, string> }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${styles[value] ?? "bg-gray-100 text-gray-600"}`}>
    {value}
  </span>
);

export const TransactionsScreen = () => {
  const [status, setStatus] = useState<TransactionStatus | "All">("All");
  const [paymentStatus, setPaymentStatus] = useState<TransactionPaymentStatus | "All">("All");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useGetTransactions({
    status: status === "All" ? undefined : status,
    payment_status: paymentStatus === "All" ? undefined : paymentStatus,
    page,
    page_size: PAGE_SIZE,
  });

  const transactions: Transaction[] = data?.results ?? [];
  const count = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const changeFilter = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500 mt-1">
            All delivery orders and their payment status.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 shrink-0">Status</span>
            <select
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none capitalize"
              value={status}
              onChange={(e) => changeFilter(setStatus)(e.target.value as TransactionStatus | "All")}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 shrink-0">Payment</span>
            <select
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none capitalize"
              value={paymentStatus}
              onChange={(e) => changeFilter(setPaymentStatus)(e.target.value as TransactionPaymentStatus | "All")}
            >
              {PAYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-orange-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sender</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Method</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-gray-400 text-sm">
                      <i className="ri-loader-4-line animate-spin text-xl" />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-gray-400 text-sm">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-orange-50/40 transition-colors">
                      <td className="px-5 py-3.5 text-gray-900 font-medium">#{tx.id}</td>
                      <td className="px-4 py-3.5 text-gray-600">{tx.sender_id}</td>
                      <td className="px-4 py-3.5 text-gray-900 font-semibold">{formatAmount(tx.total_amount)}</td>
                      <td className="px-4 py-3.5 text-gray-600 capitalize">{tx.delivery_method?.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3.5"><StatusBadge value={tx.status} styles={STATUS_STYLES} /></td>
                      <td className="px-4 py-3.5"><StatusBadge value={tx.payment_status} styles={PAYMENT_STATUS_STYLES} /></td>
                      <td className="px-4 py-3.5 text-gray-500">{formatDate(tx.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-50">
            {isLoading ? (
              <p className="text-center py-14 text-gray-400 text-sm">
                <i className="ri-loader-4-line animate-spin text-xl" />
              </p>
            ) : transactions.length === 0 ? (
              <p className="text-center py-14 text-gray-400 text-sm">No transactions found</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex flex-col gap-2 px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 text-sm">#{tx.id}</p>
                    <p className="font-semibold text-gray-900 text-sm">{formatAmount(tx.total_amount)}</p>
                  </div>
                  <p className="text-xs text-gray-400">{tx.sender_id} · {formatDate(tx.created_at)}</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={tx.status} styles={STATUS_STYLES} />
                    <StatusBadge value={tx.payment_status} styles={PAYMENT_STATUS_STYLES} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {count > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">
                Page {page} of {totalPages} · {count} transaction{count !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Previous page"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="ri-arrow-left-s-line text-base" />
                </button>
                <button
                  aria-label="Next page"
                  disabled={!data?.next || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="ri-arrow-right-s-line text-base" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
