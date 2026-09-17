import { useEffect, useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { OpenWalletAccountModal } from "../components/modal/OpenWalletAccountModal";
import { InvoiceModal } from "../components/modal/InvoiceModal";
import { ReceiptModal } from "../components/modal/ReceiptModal";
import { DocumentPreviewModal } from "../components/modal/DocumentPreviewModal";
import { SettleInvoiceSplitModal } from "../components/modal/SettleInvoiceSplitModal";
import { InvoicePaymentLinkModal } from "../components/modal/InvoicePaymentLinkModal";
import { SettlementAccountCard } from "../components/modal/SettlementAccountCard";
import { PayoutSplitsPanel } from "../components/modal/PayoutSplitsPanel";
import { IncomingPaymentsPanel } from "../components/modal/IncomingPaymentsPanel";
import { DocumentBrandingModal } from "../components/modal/DocumentBrandingModal";
import { useGetWalletBalance, useGetWalletTransactions, useHasAnyWalletAccount } from "../hooks/useWallet";
import { useGetVirtualAccounts, useDeactivateVirtualAccount } from "../hooks/useVirtualAccounts";
import { useGetInvoices } from "../hooks/useInvoices";
import { useGetReceipts } from "../hooks/useReceipts";
import { useGetPartnerSplit, useSavePartnerSplit } from "../hooks/usePartnerSplit";
import { useGetStakeholders } from "../hooks/useStakeholders";
import { useGetBranches } from "../hooks/useBranchPartner";
import { FilterPopover } from "../components/filters/FilterPopover";
import { WALLET_REASON_LABELS } from "../service/partnerService";
import type { Invoice, Receipt, VirtualAccount, WalletTransactionType, InvoiceStatus, SplitMember } from "../service/partnerService";

type Tab = "wallet" | "accounts" | "invoices" | "receipts" | "split";
const PAGE_SIZE = 20;

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "wallet", label: "Wallet", icon: "ri-wallet-3-line" },
  { key: "accounts", label: "Virtual Accounts", icon: "ri-bank-card-2-line" },
  { key: "invoices", label: "Invoices", icon: "ri-file-list-3-line" },
  { key: "receipts", label: "Receipts", icon: "ri-receipt-line" },
  { key: "split", label: "Payout Split", icon: "ri-git-branch-line" },
];

const formatAmount = (n: number) => `₦${n.toLocaleString()}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export const FinancialsScreen = () => {
  const [tab, setTab] = useState<Tab>("wallet");
  const [showOpenWallet, setShowOpenWallet] = useState(false);
  // null = "Partner Default" (not tied to any branch) — shared across the Wallet,
  // Virtual Accounts, and Split tabs, since they're all views into the same
  // branch-scoped identity space (see wallet_identity() on the backend).
  const [walletBranchId, setWalletBranchId] = useState<number | null>(null);
  const { data: branches = [] } = useGetBranches();
  const { data: hasAccount, isLoading: isLoadingHasAccount } = useHasAnyWalletAccount();

  if (!isLoadingHasAccount && !hasAccount) {
    return (
      <DashboardLayout>
        <div className="w-full flex flex-col gap-5 h-[calc(100vh-140px)]">
          <FinancialsIntroScreen onOpenWallet={() => setShowOpenWallet(true)} />
        </div>
        {showOpenWallet && (
          <OpenWalletAccountModal
            onClose={() => setShowOpenWallet(false)}
            onCreated={() => setTab("accounts")}
          />
        )}
      </DashboardLayout>
    );
  }

  const showBranchScope = branches.length > 0 && (tab === "wallet" || tab === "accounts" || tab === "split");

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm overflow-x-auto">
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

          {showBranchScope && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 font-medium">Viewing:</span>
              <select
                value={walletBranchId ?? ""}
                onChange={(e) => setWalletBranchId(e.target.value ? Number(e.target.value) : null)}
                className="h-10 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white"
              >
                <option value="">Partner Default</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.branch_code} · {b.state}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {tab === "wallet" && <WalletPanel branchId={walletBranchId} />}
        {tab === "accounts" && <VirtualAccountsPanel branchId={walletBranchId} />}
        {tab === "invoices" && <InvoicesPanel />}
        {tab === "receipts" && <ReceiptsPanel />}
        {tab === "split" && <SplitPanel branchId={walletBranchId} />}
      </div>
    </DashboardLayout>
  );
};

/* ---------- Intro / landing (no wallet account yet) ---------- */

function FinancialsIntroScreen({ onOpenWallet }: { onOpenWallet: () => void }) {
  return (
    <div className="w-full h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src="/wallet-onboarding.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/95 via-[#142449]/70 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end p-10">
          <p className="text-2xl font-semibold text-white leading-tight">
            Get paid directly, on your terms.
          </p>
          <p className="text-sm text-blue-100/80 mt-2 max-w-sm">
            Open a dedicated account number so customers can pay straight into your business —
            no manual transfers to chase down.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center text-center p-10 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
          <i className="ri-wallet-3-line text-2xl text-brand" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">You haven't opened a wallet account yet</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Open one to start collecting payments, generate invoices and receipts for your
          customers, and track it all in one place. You can open more than one, at different
          banks, for different purposes.
        </p>
        <button
          onClick={onOpenWallet}
          className="mt-2 flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
        >
          <i className="ri-add-line text-base" />
          Open a Wallet Account
        </button>
      </div>
    </div>
  );
}

/* ---------- Wallet ---------- */

const WALLET_TYPE_STYLES: Record<WalletTransactionType, string> = {
  credit: "bg-green-50 text-green-700",
  debit: "bg-red-50 text-red-600",
};

function WalletPanel({ branchId }: { branchId: number | null }) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [branchId]);
  const { data: balance, isLoading: isLoadingBalance } = useGetWalletBalance(branchId);
  const { data, isLoading, isFetching } = useGetWalletTransactions({ page, page_size: PAGE_SIZE, branch_id: branchId });

  const transactions = data?.results ?? [];
  const count = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 font-medium">Available balance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {isLoadingBalance ? "—" : formatAmount(balance?.balance ?? 0)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 font-medium">Pending balance</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">
            {isLoadingBalance ? "—" : formatAmount(balance?.pending_balance ?? 0)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-orange-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Balance after</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-14 text-gray-400 text-sm"><i className="ri-loader-4-line animate-spin text-xl" /></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-14 text-gray-400 text-sm">No wallet activity yet</td></tr>
              ) : (
                transactions.map((wtx, i) => (
                  <tr key={wtx.id ?? `${wtx.reference}-${i}`} className="border-b border-gray-50 hover:bg-orange-50/40 transition-colors">
                    <td className="px-5 py-3.5 text-gray-800">{wtx.description}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${WALLET_TYPE_STYLES[wtx.type]}`}>{wtx.type}</span>
                    </td>
                    <td className={`px-4 py-3.5 font-semibold ${wtx.type === "credit" ? "text-green-700" : "text-red-600"}`}>
                      {wtx.type === "credit" ? "+" : "-"}{formatAmount(wtx.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{wtx.balance_after != null ? formatAmount(wtx.balance_after) : "—"}</td>
                    <td className="px-4 py-3.5 text-gray-500">{formatDate(wtx.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-50">
          {isLoading ? (
            <p className="text-center py-14 text-gray-400 text-sm"><i className="ri-loader-4-line animate-spin text-xl" /></p>
          ) : transactions.length === 0 ? (
            <p className="text-center py-14 text-gray-400 text-sm">No wallet activity yet</p>
          ) : (
            transactions.map((wtx, i) => (
              <div key={wtx.id ?? `${wtx.reference}-${i}`} className="flex flex-col gap-1.5 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-800">{wtx.description}</p>
                  <p className={`text-sm font-semibold ${wtx.type === "credit" ? "text-green-700" : "text-red-600"}`}>
                    {wtx.type === "credit" ? "+" : "-"}{formatAmount(wtx.amount)}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  {formatDate(wtx.created_at)}{wtx.balance_after != null ? ` · Balance ${formatAmount(wtx.balance_after)}` : ""}
                </p>
              </div>
            ))
          )}
        </div>

        {count > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">Page {page} of {totalPages} · {count} entries</p>
            <div className="flex items-center gap-2">
              <button aria-label="Previous page" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <i className="ri-arrow-left-s-line text-base" />
              </button>
              <button aria-label="Next page" disabled={!data?.next || isFetching} onClick={() => setPage((p) => p + 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <i className="ri-arrow-right-s-line text-base" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Virtual Accounts ---------- */

function VirtualAccountsPanel({ branchId }: { branchId: number | null }) {
  const { data: accounts = [], isLoading } = useGetVirtualAccounts(branchId);
  const [showOpenWallet, setShowOpenWallet] = useState(false);
  const deactivate = useDeactivateVirtualAccount();

  const handleDeactivate = (account: VirtualAccount) => {
    const label = account.reason ? WALLET_REASON_LABELS[account.reason] : "default";
    if (window.confirm(`Deactivate this ${label} account? Customers will no longer be able to pay into it.`)) {
      deactivate.mutate(account.account_number);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button onClick={() => setShowOpenWallet(true)} className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors">
          <i className="ri-add-line text-base" />
          Open a Wallet Account
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {isLoading ? (
          <p className="text-center py-14 text-gray-400 text-sm"><i className="ri-loader-4-line animate-spin text-xl" /></p>
        ) : accounts.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No virtual accounts yet — open one so customers can pay you directly.</p>
        ) : (
          accounts.map((acc) => (
            <div key={acc.account_number} className="flex items-center gap-4 p-5">
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <i className="ri-bank-card-2-line text-xl text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{acc.reason ? WALLET_REASON_LABELS[acc.reason] : "Default account"}</p>
                <p className="text-sm text-gray-600 mt-0.5">{acc.account_number} · {acc.bank_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{acc.account_name}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${acc.status === "Active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {acc.status}
              </span>
              {acc.status === "Active" && (
                <button
                  onClick={() => handleDeactivate(acc)}
                  disabled={deactivate.isPending}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors shrink-0 disabled:opacity-60"
                >
                  Deactivate
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showOpenWallet && (
        <OpenWalletAccountModal onClose={() => setShowOpenWallet(false)} initialBranchId={branchId} />
      )}
    </div>
  );
}

/* ---------- Invoices ---------- */

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-500",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  overdue: "bg-red-50 text-red-600",
  void: "bg-gray-100 text-gray-400",
};

function InvoicesPanel() {
  const { data: branches = [] } = useGetBranches();
  const [branchFilter, setBranchFilter] = useState<number | undefined>(undefined);
  const { data: invoices = [], isLoading } = useGetInvoices(branchFilter);
  const [showCreate, setShowCreate] = useState(false);
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [settling, setSettling] = useState<Invoice | null>(null);
  const [showBranding, setShowBranding] = useState(false);
  const [linking, setLinking] = useState<Invoice | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        {branches.length > 1 ? (
          <FilterPopover activeCount={branchFilter ? 1 : 0} panelClassName="w-56">
            {(close) => (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setBranchFilter(undefined); close(); }}
                  className={`text-left px-3 py-2 rounded-lg text-sm ${branchFilter === undefined ? "bg-orange-50 text-brand font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  All branches
                </button>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setBranchFilter(Number(b.id)); close(); }}
                    className={`text-left px-3 py-2 rounded-lg text-sm ${branchFilter === Number(b.id) ? "bg-orange-50 text-brand font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {b.branch_code} · {b.state}
                  </button>
                ))}
              </div>
            )}
          </FilterPopover>
        ) : <span />}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBranding(true)}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <i className="ri-palette-line text-base" />
            Design
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors">
            <i className="ri-add-line text-base" />
            Create Invoice
          </button>
        </div>
      </div>

      <IncomingPaymentsPanel branchId={branchFilter ?? null} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {isLoading ? (
          <p className="text-center py-14 text-gray-400 text-sm"><i className="ri-loader-4-line animate-spin text-xl" /></p>
        ) : invoices.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No invoices yet</p>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="w-full flex items-center gap-4 p-5 hover:bg-orange-50/40 transition-colors">
              <button onClick={() => setPreview(inv)} className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-gray-900">{inv.invoice_number} · {inv.customer_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(inv.created_at)}
                  {inv.payment_link && inv.status !== "paid" && " · payment link sent"}
                  {inv.settled_at && " · split distributed"}
                </p>
              </button>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${INVOICE_STATUS_STYLES[inv.status]}`}>{inv.status}</span>
              <p className="text-sm font-semibold text-gray-900 shrink-0 w-24 text-right">{formatAmount(inv.total)}</p>
              {/* A link can be created for anything unpaid, and reopened afterwards
                  to copy it again. Once paid there's nothing left to collect. */}
              {inv.status !== "paid" && (
                <button
                  onClick={() => setLinking(inv)}
                  className="text-brand hover:text-brand-hover text-sm font-semibold shrink-0"
                >
                  {inv.payment_link ? "Payment link" : "Get paid"}
                </button>
              )}
              {/* Only a paid, not-yet-distributed invoice can be split — the money
                  has to have actually arrived before it can be shared out. */}
              {inv.status === "paid" && !inv.settled_at && (
                <button
                  onClick={() => setSettling(inv)}
                  className="text-brand hover:text-brand-hover text-sm font-semibold shrink-0"
                >
                  Distribute
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showCreate && <InvoiceModal onClose={() => setShowCreate(false)} />}
      {preview && <DocumentPreviewModal document={{ kind: "invoice", data: preview }} onClose={() => setPreview(null)} />}
      {settling && <SettleInvoiceSplitModal invoice={settling} onClose={() => setSettling(null)} />}
      {linking && <InvoicePaymentLinkModal key={linking.id} invoice={linking} onClose={() => setLinking(null)} />}
      {showBranding && <DocumentBrandingModal onClose={() => setShowBranding(false)} />}
    </div>
  );
}

/* ---------- Receipts ---------- */

function ReceiptsPanel() {
  const { data: branches = [] } = useGetBranches();
  const [branchFilter, setBranchFilter] = useState<number | undefined>(undefined);
  const { data: receipts = [], isLoading } = useGetReceipts(branchFilter);
  const [showCreate, setShowCreate] = useState(false);
  const [preview, setPreview] = useState<Receipt | null>(null);
  const [showBranding, setShowBranding] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        {branches.length > 1 ? (
          <FilterPopover activeCount={branchFilter ? 1 : 0} panelClassName="w-56">
            {(close) => (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setBranchFilter(undefined); close(); }}
                  className={`text-left px-3 py-2 rounded-lg text-sm ${branchFilter === undefined ? "bg-orange-50 text-brand font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  All branches
                </button>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setBranchFilter(Number(b.id)); close(); }}
                    className={`text-left px-3 py-2 rounded-lg text-sm ${branchFilter === Number(b.id) ? "bg-orange-50 text-brand font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {b.branch_code} · {b.state}
                  </button>
                ))}
              </div>
            )}
          </FilterPopover>
        ) : <span />}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBranding(true)}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <i className="ri-palette-line text-base" />
            Design
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors">
            <i className="ri-add-line text-base" />
            Create Receipt
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {isLoading ? (
          <p className="text-center py-14 text-gray-400 text-sm"><i className="ri-loader-4-line animate-spin text-xl" /></p>
        ) : receipts.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No receipts yet</p>
        ) : (
          receipts.map((rec) => (
            <button
              key={rec.id}
              onClick={() => setPreview(rec)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-orange-50/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{rec.receipt_number} · {rec.customer_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(rec.issued_at)} · {rec.payment_method.replace(/_/g, " ")}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 shrink-0">{formatAmount(rec.amount)}</p>
            </button>
          ))
        )}
      </div>

      {showCreate && <ReceiptModal onClose={() => setShowCreate(false)} />}
      {preview && <DocumentPreviewModal document={{ kind: "receipt", data: preview }} onClose={() => setPreview(null)} />}
      {showBranding && <DocumentBrandingModal onClose={() => setShowBranding(false)} />}
    </div>
  );
}

/* ---------- Payout Split ---------- */
// How a settled amount fans out across a partner's own dispatchers/stakeholders —
// a different concept from the Wallet/Virtual Accounts/Invoices/Receipts panels
// above (all real too, backed by wallet-service or azapal-backend's own models —
// see partnerService.ts).

const inputClass = "h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full";

function emptyMember(): SplitMember {
  return { external_user_id: "", label: "", share_percent: 0 };
}

/**
 * Resolves percentage shares into actual naira for one amount, mirroring
 * wallet-service's own arithmetic exactly so the preview can't disagree with what
 * settlement will do: every member except the last is rounded to the cent, and the
 * last absorbs whatever is left so the parts always total the whole.
 *
 * The partner is the last member here because the server appends their remainder
 * after the stakeholders — see PartnerSplitView.put.
 */
function resolveShares(amount: number, members: SplitMember[], yourShare: number) {
  const stakeholderAmounts = members.map(
    (m) => Math.round(amount * (Number(m.share_percent) || 0) / 100 * 100) / 100,
  );

  // Whoever is last in the list wallet-service receives absorbs the remainder.
  // That's the partner when they have a share — the server appends them last —
  // but when stakeholders already take the full 100% no partner member is
  // appended at all, and the last *stakeholder* absorbs it instead. Getting this
  // wrong makes the preview disagree with settlement by a cent.
  if (yourShare <= 0) {
    if (stakeholderAmounts.length > 0) {
      const allocated = stakeholderAmounts.slice(0, -1).reduce((sum, a) => sum + a, 0);
      stakeholderAmounts[stakeholderAmounts.length - 1] = Math.round((amount - allocated) * 100) / 100;
    }
    return { stakeholderAmounts, yourAmount: 0 };
  }

  const allocated = stakeholderAmounts.reduce((sum, a) => sum + a, 0);
  return { stakeholderAmounts, yourAmount: Math.round((amount - allocated) * 100) / 100 };
}

function SplitPanel({ branchId }: { branchId: number | null }) {
  const { data: config, isLoading } = useGetPartnerSplit(branchId);
  const { data: stakeholders = [] } = useGetStakeholders(branchId);
  const { data: invoices = [] } = useGetInvoices(branchId ?? undefined);
  // The wallet the distribution actually draws on. Shown next to the preview
  // because a percentage split can look perfectly valid while the branch has no
  // balance to distribute — an invoice paid in cash being the obvious case.
  const { data: walletBalance } = useGetWalletBalance(branchId);
  const save = useSavePartnerSplit(branchId);

  const [name, setName] = useState("");
  const [members, setMembers] = useState<SplitMember[]>([emptyMember(), emptyMember()]);
  const [loadedFor, setLoadedFor] = useState<number | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<number | null>(null);
  const [distributing, setDistributing] = useState<Invoice | null>(null);

  if (loadedFor !== branchId && config !== undefined) {
    setLoadedFor(branchId);
    setName(config?.name ?? "");
    // Drop the partner's own member: it's derived from the remainder now, and
    // leaving it in the editable list would double-count against the 100% the
    // server re-appends on save.
    const stakeholderMembers = (config?.members ?? []).filter((m) => m.external_user_id !== config?.partnerRef);
    setMembers(stakeholderMembers.length ? stakeholderMembers : [emptyMember()]);
  }

  // Only the stakeholders' shares are edited here. The partner's own share is
  // whatever's left — you aren't your own stakeholder, and making people "add
  // themselves" to reach 100% was the confusing part of the old form. wallet-service
  // still requires exactly 100, so the partner is appended as a member on save.
  const stakeholderTotal = members.reduce((sum, m) => sum + (Number(m.share_percent) || 0), 0);
  const yourShare = 100 - stakeholderTotal;
  const isValid =
    yourShare >= 0 && stakeholderTotal > 0 && members.every((m) => m.external_user_id.trim());

  // Any invoice can be previewed — modelling "what would everyone get if INV-0020
  // gets paid" is a normal planning question, and the amount is known long before
  // the money arrives. Distributing is the part that requires a paid invoice.
  // Actionable ones sort first so the common case is at the top of the list.
  const previewableInvoices = [...invoices].sort((a, b) => {
    const rank = (inv: Invoice) => (inv.status === "paid" && !inv.settled_at ? 0 : inv.status === "paid" ? 1 : 2);
    return rank(a) - rank(b) || b.id - a.id;
  });
  const previewInvoice = previewableInvoices.find((inv) => inv.id === previewInvoiceId) ?? null;
  const preview = previewInvoice ? resolveShares(previewInvoice.total, members, yourShare) : null;

  const canDistribute = !!previewInvoice && previewInvoice.status === "paid" && !previewInvoice.settled_at;
  // The distribution draws on this wallet, not on the invoice — they can disagree.
  // Only a shortfall on something actually distributable is a problem worth
  // warning about; on an unpaid invoice it's just noise.
  const availableBalance = Number(walletBalance?.balance ?? 0);
  const shortBalance = canDistribute && availableBalance < (previewInvoice?.total ?? 0);

  // Members come back from wallet-service as bare wallet identities, so re-associate
  // them with the stakeholder directory by external_user_id to show real names.
  const stakeholderByExternalId = new Map(stakeholders.map((s) => [s.external_user_id, s]));

  function selectStakeholder(index: number, stakeholderId: string) {
    const stakeholder = stakeholders.find((s) => String(s.id) === stakeholderId);
    if (!stakeholder) return;
    const primary = stakeholder.collaborators.find((c) => c.is_primary) ?? stakeholder.collaborators[0];
    updateMember(index, {
      stakeholder_id: stakeholder.id,
      external_user_id: stakeholder.external_user_id,
      // Default to the org's primary contact; the label itself is composed
      // server-side so the ledger always agrees with what was chosen here.
      collaborator_id: primary?.id,
      label: primary ? `${stakeholder.organisation_name} · ${primary.full_name}` : stakeholder.organisation_name,
    });
  }

  function selectCollaborator(index: number, collaboratorId: string) {
    const member = members[index];
    const stakeholder = stakeholderByExternalId.get(member.external_user_id);
    if (!stakeholder) return;
    const collaborator = stakeholder.collaborators.find((c) => String(c.id) === collaboratorId);
    updateMember(index, {
      collaborator_id: collaborator?.id,
      label: collaborator
        ? `${stakeholder.organisation_name} · ${collaborator.full_name}`
        : stakeholder.organisation_name,
    });
  }

  function updateMember(index: number, patch: Partial<SplitMember>) {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }
  function addMember() {
    setMembers((prev) => [...prev, emptyMember()]);
  }
  function removeMember(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    setError(null);
    save.mutate(
      { name: name || undefined, members },
      { onError: (e: any) => setError(e.message || "Failed to save") },
    );
  }

  if (isLoading) {
    return <p className="text-center py-14 text-gray-400 text-sm"><i className="ri-loader-4-line animate-spin text-xl" /></p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <PayoutSplitsPanel />

      {/* The original single split, kept because partners who configured one
          before named splits existed still settle through it when no named
          arrangement applies. See resolve_split's fallback. */}
      <details className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-gray-500">
          Legacy single split
        </summary>
      <div className="p-5 pt-0">
        <p className="text-sm text-gray-500 mb-4">
          Used only when no named split above applies. How an amount splits between you and your stakeholders. Set only what each stakeholder takes —
          whatever's left is your share. Applied automatically when a delivery completes, and whenever you
          distribute a paid invoice.
        </p>

        {stakeholders.length === 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-orange-50 p-3 text-sm text-orange-800">
            <i className="ri-information-line mt-0.5" />
            <p>
              You have no stakeholders yet. Add the businesses you share payouts with under{" "}
              <a href="/stakeholders" className="font-semibold underline">
                Stakeholders
              </a>
              , then come back to set their shares.
            </p>
          </div>
        )}

        {previewableInvoices.length > 0 && (
          <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Preview against an invoice
                </label>
                <select
                  value={previewInvoiceId ?? ""}
                  onChange={(e) => setPreviewInvoiceId(e.target.value ? Number(e.target.value) : null)}
                  className={`${inputClass} mt-1.5`}
                >
                  <option value="">Percentages only</option>
                  {previewableInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} · {inv.customer_name} · {formatAmount(inv.total)} ·{" "}
                      {inv.settled_at ? "distributed" : inv.status}
                    </option>
                  ))}
                </select>
              </div>
              {previewInvoice && (
                <div className="sm:text-right shrink-0">
                  <p className="text-[11px] text-gray-400 font-medium">Branch wallet balance</p>
                  <p className={`text-sm font-bold ${shortBalance ? "text-red-600" : "text-gray-900"}`}>
                    {formatAmount(availableBalance)}
                  </p>
                </div>
              )}
            </div>

            {previewInvoice && (
              <>
                {/* A split can be perfectly valid and still undistributable — the
                    money comes from the wallet, so an invoice paid in cash has
                    nothing behind it here. Better said before the click. */}
                {shortBalance && (
                  <p className="mt-3 flex items-start gap-1.5 text-xs text-red-600">
                    <i className="ri-error-warning-line mt-0.5" />
                    This branch's wallet holds less than the invoice total, so distributing it will fail.
                    The payment has to have landed in this wallet first.
                  </p>
                )}
                {previewInvoice.settled_at ? (
                  <p className="mt-3 text-xs text-gray-500">
                    Already distributed on {formatDate(previewInvoice.settled_at)} — shown here for reference.
                  </p>
                ) : canDistribute ? (
                  <button
                    onClick={() => setDistributing(previewInvoice)}
                    disabled={!isValid || shortBalance}
                    className="mt-3 bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Distribute {formatAmount(previewInvoice.total)}
                  </button>
                ) : (
                  <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
                    <i className="ri-information-line mt-0.5" />
                    Preview only — this invoice is{" "}
                    <span className="font-semibold">{previewInvoice.status}</span>. It can be distributed once
                    the customer has paid it.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Split name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Standard dispatch split"
          className={`${inputClass} mt-1.5 mb-5`}
        />

        <div className="flex flex-col gap-3">
          {members.map((m, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-2 items-center">
              <select
                value={stakeholderByExternalId.get(m.external_user_id)?.id ?? ""}
                onChange={(e) => selectStakeholder(i, e.target.value)}
                className={inputClass}
                aria-label="Stakeholder"
              >
                <option value="">Select stakeholder…</option>
                {stakeholders.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.organisation_name}
                  </option>
                ))}
                {/* A member configured before the stakeholder directory existed, or
                    pointing at a wallet with no stakeholder record, would otherwise
                    vanish from the dropdown and be silently dropped on save. */}
                {m.external_user_id && !stakeholderByExternalId.has(m.external_user_id) && (
                  <option value="">{m.label || m.external_user_id} (unlinked)</option>
                )}
              </select>
              {/* Names the contact on this line. The organisation is still the
                  payee — this only decides what the ledger entry reads as. */}
              <select
                value={m.collaborator_id ?? ""}
                onChange={(e) => selectCollaborator(i, e.target.value)}
                disabled={!stakeholderByExternalId.get(m.external_user_id)?.collaborators.length}
                className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
                aria-label="Contact"
              >
                <option value="">
                  {stakeholderByExternalId.get(m.external_user_id)?.collaborators.length
                    ? "Organisation only"
                    : "No contacts"}
                </option>
                {(stakeholderByExternalId.get(m.external_user_id)?.collaborators ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                    {c.role_label ? ` · ${c.role_label}` : ""}
                  </option>
                ))}
              </select>
              <div className="flex flex-col">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={m.share_percent}
                  onChange={(e) => updateMember(i, { share_percent: Number(e.target.value) })}
                  placeholder="Share %"
                  className={inputClass}
                  aria-label="Share percent"
                />
                {preview && (
                  <span className="mt-1 text-[11px] font-semibold text-gray-600 text-right">
                    {formatAmount(preview.stakeholderAmounts[i] ?? 0)}
                  </span>
                )}
              </div>
              {members.length > 1 && (
                <button
                  onClick={() => removeMember(i)}
                  className="text-red-600 hover:text-red-700 text-sm font-semibold px-2 py-2.5"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addMember}
          className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover transition-colors"
        >
          <i className="ri-add-line text-base" />
          Add stakeholder to split
        </button>

        {/* Your own share is the remainder, not a row you have to add. The server
            appends it as a real split member so wallet-service still sees 100%. */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <span className="text-sm font-semibold text-gray-700">Your share</span>
          <span className={`text-sm font-bold ${yourShare < 0 ? "text-red-600" : "text-gray-900"}`}>
            {preview && <span className="mr-2 font-semibold text-gray-500">{formatAmount(preview.yourAmount)}</span>}
            {yourShare.toFixed(2)}%
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className={`text-sm font-semibold ${yourShare < 0 ? "text-red-600" : "text-gray-500"}`}>
            {yourShare < 0
              ? `Stakeholders are over 100% by ${Math.abs(yourShare).toFixed(2)}%`
              : `Stakeholders take ${stakeholderTotal.toFixed(2)}%`}
          </p>
          <button
            onClick={handleSave}
            disabled={!isValid || save.isPending}
            className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {save.isPending ? "Saving…" : "Save split"}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        {save.isSuccess && !error && <p className="text-sm text-green-700 mt-3">Split saved.</p>}
      </div>
      </details>

      <SettlementAccountCard />

      {distributing && (
        <SettleInvoiceSplitModal
          invoice={distributing}
          onClose={() => setDistributing(null)}
        />
      )}
    </div>
  );
}
