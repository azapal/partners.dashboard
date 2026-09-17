import React, { useEffect, useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { FormField } from '../inputs/FormField';
import { useCreateInvoice } from '../../hooks/useInvoices';
import { useGetTransactions } from '../../hooks/useTransactions';
import { useGetBranches } from '../../hooks/useBranchPartner';
import { useBillableCatalogue } from '../../hooks/useBillableCatalogue';
import { SearchableSelect } from '../inputs/SearchableSelect';
import type { InvoiceLineItem } from '../../service/partnerService';

interface InvoiceModalProps {
  onClose: () => void;
}

interface LineItemDraft {
  description: string;
  unit_price: string;
  /**
   * Custom rows only, and optional there — blank means one. A row taken from a
   * rate never carries this: the rate is one priced thing, and a quantity box on
   * it would only invite disagreeing with the configured price.
   */
  quantity?: string;
  /**
   * Which catalogue entry this came from, or '' for a one-off typed by hand.
   * Identifies the catalogue entry, which keeps an already-added rate out of the
   * picker. The invoice itself stores only the resolved description and price, so
   * a rate card changing later can't rewrite an invoice that's already been sent.
   */
  source: string;
  /** Carried through from the rate for display, e.g. a per-kg component. */
  hint?: string;
}

// Width is deliberately not in the base. Appending `w-28` to a class string that
// already ends in `w-full` does not override it — Tailwind emits utilities in its
// own canonical order, where w-full comes after the numeric widths, so w-full wins
// wherever it sits in the string. Every caller sets its own width instead.
const inputBase = 'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white';
const inputClass = `${inputBase} w-full`;
const formatAmount = (n: number) => `₦${n.toLocaleString()}`;

const emptyLineItem = (): LineItemDraft => ({ description: '', unit_price: '', quantity: '', source: '' });

// Currency and counts as text rather than type="number": number inputs bring
// spinners, scroll-to-change, and locale-dependent decimal handling that make a
// mess of money. inputMode still raises the right keypad on mobile.
const digitsAndDot = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
};
const digitsOnly = (value: string) => value.replace(/\D/g, '');

/** Blank quantity means one. */
const lineQuantity = (item: { quantity?: string }) => Math.max(1, Number(item.quantity || 1) || 1);

// The escape hatch. Not every charge is on a rate card — waiting time, damages,
// a negotiated one-off — and an invoice you can't write is worse than one typed
// by hand, so picking this reveals the free-text fields.
const CUSTOM_ITEM = 'custom';

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ onClose }) => {
  const { data: branches = [] } = useGetBranches();
  const [branchId, setBranchId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [relatedTransactionId, setRelatedTransactionId] = useState('');
  // Starts empty: the picker above the list is how a row comes into existence,
  // so there's no blank row to fill in.
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: txPage } = useGetTransactions({ page_size: 50 });
  const transactions = txPage?.results ?? [];
  const createInvoice = useCreateInvoice();
  const { items: catalogue, isLoading: catalogueLoading, kindLabel } = useBillableCatalogue();

  // Already-added rates drop out of the picker. Without a quantity there's nothing
  // a second identical line could mean, so the fix is to stop offering it rather
  // than to silently ignore the click.
  const addedSources = new Set(lineItems.map((li) => li.source));
  const catalogueOptions = [
    ...catalogue
      .filter((item) => !addedSources.has(item.id))
      .map((item) => ({
        value: item.id,
        label: `${kindLabel[item.kind]} · ${item.label} — ${formatAmount(item.unitPrice)}${item.hint ? ` (${item.hint})` : ''}`,
      })),
    { value: CUSTOM_ITEM, label: 'Something else — type it in' },
  ];

  const addFromCatalogue = (id: string) => {
    if (!id) return;
    if (id === CUSTOM_ITEM) {
      setLineItems((items) => [...items, { ...emptyLineItem(), source: CUSTOM_ITEM }]);
      return;
    }
    const item = catalogue.find((c) => c.id === id);
    if (!item) return;

    setLineItems((items) => [
      ...items,
      { source: item.id, description: item.description, unit_price: String(item.unitPrice), hint: item.hint },
    ]);
  };

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
      unit_price: tx.total_amount != null ? String(tx.total_amount) : '',
      source: CUSTOM_ITEM,
    }]);
  };

  const updateLineItem = (index: number, patch: Partial<LineItemDraft>) => {
    setLineItems((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  // No "keep at least one" guard any more — an empty list is a valid state that
  // the picker resolves, and Submit already requires at least one item.
  const removeLineItem = (index: number) =>
    setLineItems((items) => items.filter((_, i) => i !== index));

  const validLineItems: InvoiceLineItem[] = lineItems
    // unit_price must actually have been entered. Number('') is 0, so a blank
    // price would otherwise pass as a free line — the risk on a "Something else"
    // row, where both fields start empty. A deliberate 0 is still allowed; an
    // omission isn't.
    .filter(
      (li) =>
        li.description.trim() !== '' &&
        li.unit_price.trim() !== '' &&
        Number.isFinite(Number(li.unit_price)) &&
        Number(li.unit_price) >= 0,
    )
    // Rate rows always resolve to 1; a custom row uses whatever was typed, or 1
    // if it was left blank. The field stays on the wire either way — it's part of
    // the Invoice contract and older invoices carry real quantities.
    .map((li) => ({
      description: li.description.trim(),
      quantity: lineQuantity(li),
      unit_price: Number(li.unit_price),
    }));

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
          <label className="text-sm font-medium text-gray-700">Items</label>

          {/* One picker for the whole list rather than one per row. Adding is the
              action; the rows below are a record of what's been added, not a form. */}
          <SearchableSelect
            label=""
            options={catalogueOptions}
            loading={catalogueLoading}
            value=""
            onChange={addFromCatalogue}
            placeholder={catalogue.length === 0 ? 'No rates set yet…' : 'Add a rate…'}
          />

          <div className="flex flex-col gap-2">
            {lineItems.length === 0 && (
              <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                No items yet — add one from your rates above.
              </p>
            )}

            {lineItems.map((item, i) => {
              const isCustom = item.source === CUSTOM_ITEM;

              return (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                  <div className="flex-1 min-w-0">
                    {/* A row taken from a rate is shown, not edited — the rate the
                        partner configured is the price, and retyping it here would
                        only be a way to disagree with themselves. A custom row has
                        no rate behind it, so it still needs its fields. */}
                    {isCustom ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(i, { description: e.target.value })}
                          placeholder="Item"
                          className={`${inputBase} flex-1 min-w-0`}
                          aria-label="Item"
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(i, { unit_price: digitsAndDot(e.target.value) })}
                          placeholder="Amount"
                          className={`${inputBase} w-32 shrink-0`}
                          aria-label="Amount"
                        />
                        {/* Optional: most one-offs are a single charge, so an empty
                            box reads as one rather than as something unfinished. */}
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.quantity ?? ''}
                          onChange={(e) => updateLineItem(i, { quantity: digitsOnly(e.target.value) })}
                          placeholder="Qty"
                          className={`${inputBase} w-20 shrink-0`}
                          aria-label="Quantity (optional)"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
                        {item.hint && <p className="text-xs text-gray-400">{item.hint}</p>}
                      </>
                    )}
                  </div>

                  <p className="w-28 text-right text-sm font-semibold text-gray-900 shrink-0">
                    {item.unit_price.trim() === ''
                      ? '—'
                      : formatAmount(lineQuantity(item) * Number(item.unit_price))}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeLineItem(i)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors shrink-0"
                    aria-label={`Remove ${item.description || 'item'}`}
                  >
                    <i className="ri-close-line text-base" />
                  </button>
                </div>
              );
            })}

            {!catalogueLoading && catalogue.length === 0 && (
              <p className="flex items-start gap-1.5 rounded-xl bg-orange-50 p-3 text-xs text-orange-800">
                <i className="ri-information-line mt-0.5" />
                You have no rates set yet, so there's nothing to pick from. Add them under Rates, or
                choose "Something else" above to charge a one-off.
              </p>
            )}
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
