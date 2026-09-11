import React, { useEffect, useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { FormField } from '../inputs/FormField';
import { useCreateReceipt } from '../../hooks/useReceipts';
import { useGetInvoices } from '../../hooks/useInvoices';
import { useGetTransactions } from '../../hooks/useTransactions';
import { useGetBranches } from '../../hooks/useBranchPartner';
import type { ReceiptPaymentMethod } from '../../service/partnerService';

interface ReceiptModalProps {
  onClose: () => void;
}

const inputClass = 'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full';
const formatAmount = (n: number) => `₦${n.toLocaleString()}`;

const PAYMENT_METHODS: { value: ReceiptPaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'wallet', label: 'Wallet' },
];

type LinkMode = 'none' | 'invoice' | 'transaction';

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ onClose }) => {
  const { data: branches = [] } = useGetBranches();
  const [branchId, setBranchId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ReceiptPaymentMethod>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [linkMode, setLinkMode] = useState<LinkMode>('none');
  const [relatedInvoiceId, setRelatedInvoiceId] = useState('');
  const [relatedTransactionId, setRelatedTransactionId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: invoices = [] } = useGetInvoices();
  const { data: txPage } = useGetTransactions({ page_size: 50 });
  const transactions = txPage?.results ?? [];
  const createReceipt = useCreateReceipt();

  useEffect(() => {
    if (!branchId && branches.length > 0) setBranchId(branches[0].id);
  }, [branches, branchId]);

  const applyInvoice = (id: string) => {
    setRelatedInvoiceId(id);
    const inv = invoices.find((i) => String(i.id) === id);
    if (!inv) return;
    if (!customerName.trim()) setCustomerName(inv.customer_name);
    setAmount(String(inv.total));
  };

  const applyTransaction = (id: string) => {
    setRelatedTransactionId(id);
    const tx = transactions.find((t) => String(t.id) === id);
    if (!tx) return;
    if (!customerName.trim()) setCustomerName(tx.sender_id);
    if (tx.total_amount != null) setAmount(String(tx.total_amount));
  };

  const canSubmit = branchId !== '' && customerName.trim() !== '' && Number(amount) >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (branchId === '' || !canSubmit) return;
    setFormError(null);
    createReceipt.mutate(
      {
        branch_id: Number(branchId),
        customer_name: customerName.trim(),
        amount: Number(amount),
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim() || null,
        related_invoice_id: linkMode === 'invoice' && relatedInvoiceId ? Number(relatedInvoiceId) : null,
        related_transaction_id: linkMode === 'transaction' && relatedTransactionId ? Number(relatedTransactionId) : null,
      },
      { onSuccess: onClose, onError: (err) => setFormError(err.message) }
    );
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title="Create Receipt"
      subtitle="Record a payment received from one of your customers."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Branch" required>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={inputClass}>
            <option value="">Select a branch…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.branch_code} · {b.state}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Link to (optional)">
          <select
            value={linkMode}
            onChange={(e) => {
              const mode = e.target.value as LinkMode;
              setLinkMode(mode);
              setRelatedInvoiceId('');
              setRelatedTransactionId('');
            }}
            className={inputClass}
          >
            <option value="none">Nothing — standalone receipt</option>
            <option value="invoice">An invoice</option>
            <option value="transaction">A delivery</option>
          </select>
        </FormField>

        {linkMode === 'invoice' && (
          <FormField label="Invoice">
            <select value={relatedInvoiceId} onChange={(e) => applyInvoice(e.target.value)} className={inputClass}>
              <option value="">Select an invoice…</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} — {inv.customer_name} — {formatAmount(inv.total)}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {linkMode === 'transaction' && (
          <FormField label="Delivery">
            <select value={relatedTransactionId} onChange={(e) => applyTransaction(e.target.value)} className={inputClass}>
              <option value="">Select a delivery…</option>
              {transactions.map((tx) => (
                <option key={tx.id} value={tx.id}>
                  #{tx.id} — {tx.sender_id} — {formatAmount(tx.total_amount ?? 0)}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Customer name" required>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g., Jane Doe" className={inputClass} />
          </FormField>
          <FormField label="Amount (₦)" required>
            <input type="number" min={1} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 15000" className={inputClass} />
          </FormField>
          <FormField label="Payment method" required>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as ReceiptPaymentMethod)} className={inputClass}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </FormField>
          <FormField label="Payment reference">
            <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="e.g., PSK-88213" className={inputClass} />
          </FormField>
        </div>

        {formError && <p className="text-xs text-red-500">{formError}</p>}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || createReceipt.isPending}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {createReceipt.isPending && <i className="ri-loader-4-line animate-spin text-base" />}
            {createReceipt.isPending ? 'Creating…' : 'Create Receipt'}
          </button>
        </div>
      </form>
    </DefaultModal>
  );
};
