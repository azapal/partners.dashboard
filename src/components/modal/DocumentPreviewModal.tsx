import React from 'react';
import { DefaultModal } from './DefaultModal';
import { usePartnerProfile } from '../../hooks/useAuth';
import { useRepProfile } from '../../hooks/useRepAuth';
import type { Invoice, Receipt } from '../../service/partnerService';

type PreviewDocument =
  | { kind: 'invoice'; data: Invoice }
  | { kind: 'receipt'; data: Receipt };

interface DocumentPreviewModalProps {
  document: PreviewDocument;
  onClose: () => void;
}

const formatAmount = (n: number) => `₦${n.toLocaleString()}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  card: 'Card',
  cash: 'Cash',
  wallet: 'Wallet',
};

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ document: doc, onClose }) => {
  const partnerProfile = usePartnerProfile();
  const repProfile = useRepProfile();
  // A Tenant Admin/Super Admin session has no partner_hq_address to show (not
  // carried on inviting_partner) — the letterhead just omits that line rather
  // than fabricating one; the business name still comes through.
  const businessName = partnerProfile?.partner_name ?? repProfile?.inviting_partner?.partner_name;
  const businessAddress = partnerProfile?.partner_hq_address;

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title={doc.kind === 'invoice' ? doc.data.invoice_number : doc.data.receipt_number}
      subtitle={doc.kind === 'invoice' ? 'Invoice' : 'Receipt'}
      maxWidthClassName="max-w-2xl"
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #azapal-printable-document, #azapal-printable-document * { visibility: visible; }
          #azapal-printable-document { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
        }
      `}</style>

      <div id="azapal-printable-document" className="flex flex-col gap-6">
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div>
            <p className="text-lg font-bold text-gray-900">{businessName ?? 'Your business'}</p>
            {businessAddress && <p className="text-xs text-gray-400 mt-0.5">{businessAddress}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {doc.kind === 'invoice' ? 'Invoice' : 'Receipt'}
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {doc.kind === 'invoice' ? doc.data.invoice_number : doc.data.receipt_number}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(doc.kind === 'invoice' ? doc.data.created_at : doc.data.issued_at)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">Billed to</p>
          <p className="text-sm font-semibold text-gray-900">{doc.data.customer_name}</p>
          {doc.kind === 'invoice' && (
            <>
              {doc.data.customer_email && <p className="text-xs text-gray-500 mt-0.5">{doc.data.customer_email}</p>}
              {doc.data.customer_phone && <p className="text-xs text-gray-500">{doc.data.customer_phone}</p>}
              {doc.data.customer_address && <p className="text-xs text-gray-500">{doc.data.customer_address}</p>}
            </>
          )}
        </div>

        {doc.kind === 'invoice' ? (
          <>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Qty</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Unit price</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.data.line_items.map((li, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-4 py-2.5 text-gray-800">{li.description}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-right">{li.quantity}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-right">{formatAmount(li.unit_price)}</td>
                      <td className="px-4 py-2.5 text-gray-900 font-medium text-right">{formatAmount(li.quantity * li.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-48 flex flex-col gap-1">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatAmount(doc.data.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatAmount(doc.data.total)}</span>
                </div>
              </div>
            </div>

            {doc.data.due_date && (
              <p className="text-xs text-gray-400">Due {formatDate(doc.data.due_date)}</p>
            )}
            {doc.data.notes && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500">{doc.data.notes}</p>
              </div>
            )}
          </>
        ) : (
          <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Amount paid</span>
              <span className="text-sm font-semibold text-gray-900">{formatAmount(doc.data.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Payment method</span>
              <span className="text-sm text-gray-800">{PAYMENT_METHOD_LABELS[doc.data.payment_method] ?? doc.data.payment_method}</span>
            </div>
            {doc.data.payment_reference && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Reference</span>
                <span className="text-sm text-gray-800">{doc.data.payment_reference}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 print:hidden">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors flex items-center gap-2"
          >
            <i className="ri-printer-line text-base" />
            Print
          </button>
        </div>
      </div>
    </DefaultModal>
  );
};
