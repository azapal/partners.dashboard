import { DefaultModal } from './DefaultModal';
import { useSettleInvoiceSplit } from '../../hooks/useStakeholders';
import type { Invoice } from '../../service/partnerService';

const naira = (value: number) =>
  `₦${Number(value ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Distributes a paid invoice's total across the stakeholder split — the manual
 * counterpart to the automatic settlement that fires when a delivery completes.
 *
 * The money is taken from the branch's own wallet, so an invoice the customer paid
 * into that branch's virtual account settles cleanly and a cash-paid one fails with
 * an insufficient-balance error. That's worth saying plainly up front rather than
 * letting it surface as a confusing failure.
 */
export const SettleInvoiceSplitModal = ({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) => {
  const settle = useSettleInvoiceSplit();

  const handleSettle = () => {
    settle.mutate(invoice.id, { onSuccess: onClose });
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title="Distribute this invoice"
      subtitle={`${invoice.invoice_number} · ${invoice.customer_name}`}
      maxWidthClassName="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount to share</span>
          <span className="text-lg font-bold text-gray-900">{naira(invoice.total)}</span>
        </div>

        <p className="text-sm text-gray-500">
          This shares the invoice total across the payout split configured for this branch, crediting
          each stakeholder's balance. It can only be done once.
        </p>
        <p className="text-xs text-gray-400">
          The amount comes out of this branch's wallet, so the payment needs to have landed there
          already — an invoice settled in cash won't have the balance to distribute.
        </p>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSettle}
            disabled={settle.isPending}
            className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {settle.isPending ? 'Distributing…' : `Distribute ${naira(invoice.total)}`}
          </button>
        </div>
      </div>
    </DefaultModal>
  );
};
