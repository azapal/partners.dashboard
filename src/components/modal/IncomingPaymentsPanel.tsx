import { useState } from 'react';
import {
  useGetIncomingPayments,
  useIgnoreIncomingPayment,
  useMatchIncomingPayment,
} from '../../hooks/useIncomingPayments';
import type { IncomingPayment } from '../../service/partnerService';

const naira = (value: string | number) =>
  `₦${Number(value ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

/**
 * One unmatched bank transfer, with the invoices it might settle.
 *
 * Suggestions are ordered best-first but never auto-applied. A transfer carries no
 * invoice reference, so an exact amount match is a strong hint and nothing more —
 * two open invoices for the same figure are indistinguishable, and only the partner
 * knows which customer actually paid.
 */
function PaymentRow({ payment }: { payment: IncomingPayment }) {
  const [selected, setSelected] = useState<number | null>(
    payment.suggestions?.find((s) => s.exact_amount)?.id ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const match = useMatchIncomingPayment();
  const ignore = useIgnoreIncomingPayment();

  const suggestions = payment.suggestions ?? [];
  const exactCount = suggestions.filter((s) => s.exact_amount).length;

  const handleMatch = () => {
    if (!selected) return;
    setError(null);
    match.mutate(
      { id: payment.id, invoiceId: selected },
      {
        onSuccess: (data) => {
          setResult(
            data.distribution_warning
              ? `Matched to ${data.invoice.invoice_number}, but distribution failed: ${data.distribution_warning}`
              : data.distributed
                ? `Matched to ${data.invoice.invoice_number} and distributed.`
                : `Matched to ${data.invoice.invoice_number}.`,
          );
        },
        onError: (e: any) => setError(e.message || 'Could not match this payment'),
      },
    );
  };

  if (result) {
    return (
      <div className="p-4 flex items-start gap-2 text-sm text-green-700">
        <i className="ri-checkbox-circle-line mt-0.5" />
        {result}
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{naira(payment.amount)}</p>
          <p className="text-xs text-gray-400 truncate">
            {[payment.payer_name, payment.sender_bank, formatDate(payment.paid_at)].filter(Boolean).join(' · ') ||
              payment.reference}
          </p>
          {payment.narration && <p className="text-[11px] text-gray-400 truncate italic">“{payment.narration}”</p>}
        </div>
        <button
          onClick={() => ignore.mutate({ id: payment.id })}
          disabled={ignore.isPending}
          className="text-xs font-semibold text-gray-400 hover:text-gray-700 shrink-0 disabled:opacity-50"
        >
          Not an invoice
        </button>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-xs text-gray-400">No open invoices on this branch to match against.</p>
      ) : (
        <>
          {exactCount > 1 && (
            <p className="flex items-start gap-1.5 rounded-lg bg-orange-50 p-2 text-[11px] text-orange-800">
              <i className="ri-alert-line mt-0.5" />
              {exactCount} open invoices are for this exact amount. Check which customer paid before confirming.
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => setSelected(suggestion.id)}
                className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                  selected === suggestion.id ? 'border-brand bg-orange-50/60' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.invoice_number} · {suggestion.customer_name}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {suggestion.status} · {formatDate(suggestion.created_at)}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold shrink-0 ${
                    suggestion.exact_amount ? 'text-green-700' : 'text-gray-500'
                  }`}
                >
                  {naira(suggestion.total)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {suggestions.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleMatch}
            disabled={!selected || match.isPending}
            className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {match.isPending ? 'Matching…' : 'Confirm match'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The reconciliation queue. Renders nothing when it's empty, so it only appears
 * when there's actually money waiting to be accounted for.
 */
export const IncomingPaymentsPanel = ({ branchId }: { branchId?: number | null }) => {
  const { data: payments = [], isLoading } = useGetIncomingPayments(branchId);

  if (isLoading || payments.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
      <div className="flex items-start gap-2 border-b border-gray-100 bg-orange-50/60 px-5 py-3">
        <i className="ri-bank-line text-base text-brand mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {payments.length} bank transfer{payments.length > 1 ? 's' : ''} waiting to be matched
          </p>
          <p className="text-xs text-gray-500">
            A transfer can't say which invoice it paid, so confirm the match and the invoice is settled the
            same way a card payment would be.
          </p>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {payments.map((payment) => (
          <PaymentRow key={payment.id} payment={payment} />
        ))}
      </div>
    </div>
  );
};
