import React, { useEffect, useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { FormField } from '../inputs/FormField';
import { useCreateInvoice } from '../../hooks/useInvoices';
import { useGetTransactions } from '../../hooks/useTransactions';
import { useGetBranches } from '../../hooks/useBranchPartner';
import type { InvoiceLineItem } from '../../service/partnerService';

interface InvoiceModalProps {
  onClose: () => void;
}

interface LineItemDraft {
  description: string;
  quantity: string;
  unit_price: string;
}

const inputClass = 'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full';
const formatAmount = (n: number) => `₦${n.toLocaleString()}`;

const emptyLineItem = (): LineItemDraft => ({ description: '', quantity: '1', unit_price: '' });

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ onClose }) => {
  const { data: branches = [] } = useGetBranches();
  const [branchId, setBranchId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [relatedTransactionId, setRelatedTransactionId] = useState('');
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([emptyLineItem()]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: txPage } = useGetTransactions({ page_size: 50 });
  const transactions = txPage?.results ?? [];
  const createInvoice = useCreateInvoice();

  useEffect(() => {
    if (!branchId && branches.length > 0) setBranchId(branches[0].id);
  }, [branches, branchId]);

  const applyTransaction = (id: string) => {
    setRelatedTransactionId(id);
    const tx = transactions.find((t) => String(t.id) === id);
    if (!tx) return;
    if (!customerName.trim()) setCustomerName(tx.sender_id);
    setLineItems([{
      description: `Delivery — ${tx.delivery_method?.replace(/_/g, ' ') || 'service'} (Transaction #${tx.id})`,
      quantity: '1',
      unit_price: tx.total_amount != null ? String(tx.total_amount) : '',
    }]);
  };

  const updateLineItem = (index: number, patch: Partial<LineItemDraft>) => {
    setLineItems((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addLineItem = () => setLineItems((items) => [...items, emptyLineItem()]);
  const removeLineItem = (index: number) =>
    setLineItems((items) => (items.length > 1 ? items.filter((_, i) => i !== index) : items));

  const validLineItems: InvoiceLineItem[] = lineItems
    .filter((li) => li.description.trim() !== '' && Number(li.unit_price) >= 0 && Number(li.quantity) >= 1)
    .map((li) => ({ description: li.description.trim(), quantity: Number(li.quantity), unit_price: Number(li.unit_price) }));

  const total = validLineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);
  const canSubmit = branchId !== '' && customerName.trim() !== '' && validLineItems.length === lineItems.length && validLineItems.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (branchId === '' || !canSubmit) return;
    setFormError(null);
    createInvoice.mutate(
      {
        branch_id: Number(branchId),
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || null,
        customer_phone: customerPhone.trim() || null,
        customer_address: customerAddress.trim() || null,
        related_transaction_id: relatedTransactionId ? Number(relatedTransactionId) : null,
        line_items: validLineItems,
        due_date: dueDate || null,
        notes: notes.trim() || null,
      },
      { onSuccess: onClose, onError: (err) => setFormError(err.message) }
    );
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title="Create Invoice"
      subtitle="Bill one of your own customers for a delivery or service."
      maxWidthClassName="max-w-2xl"
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

        {transactions.length > 0 && (
          <FormField label="Start from a delivery (optional)">
            <select value={relatedTransactionId} onChange={(e) => applyTransaction(e.target.value)} className={inputClass}>
              <option value="">None — enter details manually</option>
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
          <FormField label="Customer email">
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="jane@example.com" className={inputClass} />
          </FormField>
          <FormField label="Customer phone">
            <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+234…" className={inputClass} />
          </FormField>
          <FormField label="Due date">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
          </FormField>
        </div>

        <FormField label="Customer address">
          <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Billing address" className={inputClass} />
        </FormField>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Line items</label>
            <button type="button" onClick={addLineItem} className="text-xs font-semibold text-brand hover:text-brand-hover transition-colors flex items-center gap-1">
              <i className="ri-add-line text-sm" /> Add line
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {lineItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(i, { description: e.target.value })}
                  placeholder="Description"
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="number"
                  min={1}
                  step="any"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(i, { quantity: e.target.value })}
                  placeholder="Qty"
                  className={`${inputClass} w-20`}
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={item.unit_price}
                  onChange={(e) => updateLineItem(i, { unit_price: e.target.value })}
                  placeholder="Unit price"
                  className={`${inputClass} w-32`}
                />
                <button
                  type="button"
                  onClick={() => removeLineItem(i)}
                  disabled={lineItems.length === 1}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent shrink-0"
                  aria-label="Remove line"
                >
                  <i className="ri-close-line text-base" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <p className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">{formatAmount(total)}</span>
          </p>
        </div>

        <FormField label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Thank you for your business."
            rows={2}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full resize-none"
          />
        </FormField>

        {formError && <p className="text-xs text-red-500">{formError}</p>}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || createInvoice.isPending}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {createInvoice.isPending && <i className="ri-loader-4-line animate-spin text-base" />}
            {createInvoice.isPending ? 'Creating…' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </DefaultModal>
  );
};
