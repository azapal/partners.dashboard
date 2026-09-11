import { useEffect, useState } from "react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { OpenWalletAccountModal } from "../components/modal/OpenWalletAccountModal";
import { InvoiceModal } from "../components/modal/InvoiceModal";
import { ReceiptModal } from "../components/modal/ReceiptModal";
import { DocumentPreviewModal } from "../components/modal/DocumentPreviewModal";
import { useGetWalletBalance, useGetWalletTransactions, useHasAnyWalletAccount } from "../hooks/useWallet";
import { useGetVirtualAccounts, useDeactivateVirtualAccount } from "../hooks/useVirtualAccounts";
import { useGetInvoices } from "../hooks/useInvoices";
import { useGetReceipts } from "../hooks/useReceipts";
import { useGetPartnerSplit, useSavePartnerSplit } from "../hooks/usePartnerSplit";
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
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors">
          <i className="ri-add-line text-base" />
          Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {isLoading ? (
          <p className="text-center py-14 text-gray-400 text-sm"><i className="ri-loader-4-line animate-spin text-xl" /></p>
        ) : invoices.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No invoices yet</p>
        ) : (
          invoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => setPreview(inv)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-orange-50/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{inv.invoice_number} · {inv.customer_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.created_at)}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${INVOICE_STATUS_STYLES[inv.status]}`}>{inv.status}</span>
              <p className="text-sm font-semibold text-gray-900 shrink-0 w-24 text-right">{formatAmount(inv.total)}</p>
            </button>
          ))
        )}
      </div>

      {showCreate && <InvoiceModal onClose={() => setShowCreate(false)} />}
      {preview && <DocumentPreviewModal document={{ kind: "invoice", data: preview }} onClose={() => setPreview(null)} />}
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
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors">
          <i className="ri-add-line text-base" />
          Create Receipt
        </button>
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

function SplitPanel({ branchId }: { branchId: number | null }) {
  const { data: config, isLoading } = useGetPartnerSplit(branchId);
  const save = useSavePartnerSplit(branchId);

  const [name, setName] = useState("");
  const [members, setMembers] = useState<SplitMember[]>([emptyMember(), emptyMember()]);
  const [loadedFor, setLoadedFor] = useState<number | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  if (loadedFor !== branchId && config !== undefined) {
    setLoadedFor(branchId);
    setName(config?.name ?? "");
    setMembers(config?.members.length ? config.members : [emptyMember(), emptyMember()]);
  }

  const total = members.reduce((sum, m) => sum + (Number(m.share_percent) || 0), 0);
  const isValid = Math.abs(total - 100) < 0.005 && members.every((m) => m.external_user_id.trim());

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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm text-gray-500 mb-4">
          How a settled amount splits between you and your own dispatchers or stakeholders. Shares must add up to
          exactly 100%.
        </p>

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
              <input
                type="text"
                value={m.external_user_id}
                onChange={(e) => updateMember(i, { external_user_id: e.target.value })}
                placeholder="Recipient reference"
                className={inputClass}
              />
              <input
                type="text"
                value={m.label ?? ""}
                onChange={(e) => updateMember(i, { label: e.target.value })}
                placeholder="Label (e.g. Dispatcher)"
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={m.share_percent}
                onChange={(e) => updateMember(i, { share_percent: Number(e.target.value) })}
                placeholder="Share %"
                className={inputClass}
              />
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
          Add recipient
        </button>

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className={`text-sm font-semibold ${Math.abs(total - 100) < 0.005 ? "text-green-700" : "text-red-600"}`}>
            Total: {total.toFixed(2)}%
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
    </div>
  );
}
