import { useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { useCreateInvoicePaymentLink } from '../../hooks/useInvoices';
import { useGetVirtualAccounts } from '../../hooks/useVirtualAccounts';
import type { Invoice, PaymentRoute, PostPaymentAction } from '../../service/partnerService';

const naira = (value: number) =>
  `₦${Number(value ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ROUTES: { value: PaymentRoute; label: string; hint: string; icon: string }[] = [
  {
    value: 'wallet',
    label: 'Collect, then distribute',
    hint: 'Money lands in this branch’s wallet, then your split shares it out.',
    icon: 'ri-wallet-3-line',
  },
  {
    value: 'paystack_split',
    label: 'Paystack splits at payment',
    hint: 'Each party is settled to their own bank instantly. Everyone needs bank details.',
    icon: 'ri-git-branch-line',
  },
];

const ACTIONS: { value: PostPaymentAction; label: string; hint: string }[] = [
  { value: 'mark_paid', label: 'Mark the invoice paid', hint: 'Nothing else happens automatically.' },
  { value: 'distribute', label: 'Mark paid and distribute', hint: 'Stakeholder balances are credited straight away.' },
  {
    value: 'distribute_and_payout',
    label: 'Distribute and pay out',
    hint: 'Also transfers external stakeholders their balance, with no further review.',
  },
];

export const InvoicePaymentLinkModal = ({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) => {
  const [route, setRoute] = useState<PaymentRoute>(invoice.payment_route ?? 'wallet');
  const [action, setAction] = useState<PostPaymentAction>(invoice.post_payment_action ?? 'distribute');
  const [link, setLink] = useState<string | null>(invoice.payment_link);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateInvoicePaymentLink(invoice.id);
  // The branch's own account, offered as a bank-transfer alternative to the link.
  const { data: accounts = [] } = useGetVirtualAccounts(invoice.branch);
  const transferAccount = accounts.find((a) => a.status === 'Active') ?? accounts[0];
  const [copiedAccount, setCopiedAccount] = useState(false);
  // Paystack has already paid everyone by the time we hear about it, so there's no
  // wallet balance left to distribute or pay out on this route.
  const actionsApply = route === 'wallet';

  const handleCreate = () => {
    setError(null);
    create.mutate(
      { payment_route: route, post_payment_action: actionsApply ? action : 'mark_paid' },
      {
        onSuccess: (result) => setLink(result.payment_link),
        onError: (e: any) => setError(e.message || 'Could not create the payment link'),
      },
    );
  };

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy — select the link and copy it manually.');
    }
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title="Payment link"
      subtitle={`${invoice.invoice_number} · ${invoice.customer_name} · ${naira(invoice.total)}`}
      maxWidthClassName="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        {link ? (
          <>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Send this to your customer
              </p>
              <p className="text-xs text-gray-800 break-all font-mono">{link}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
              >
                <i className={`${copied ? 'ri-check-line' : 'ri-file-copy-line'} mr-1.5`} />
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Open
              </a>
            </div>
            {transferAccount && (
              <div className="rounded-xl border border-gray-200 p-3">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Or let them transfer directly
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{transferAccount.account_number}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {transferAccount.bank_name} · {transferAccount.account_name}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(transferAccount.account_number);
                        setCopiedAccount(true);
                        setTimeout(() => setCopiedAccount(false), 2000);
                      } catch {
                        setError('Could not copy the account number.');
                      }
                    }}
                    className="text-xs font-semibold text-brand hover:text-brand-hover shrink-0"
                  >
                    {copiedAccount ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {/* A transfer arrives with no reference tying it to this invoice, so
                    it lands in the reconciliation queue for someone to confirm. */}
                <p className="text-[11px] text-gray-400 mt-2">
                  A transfer can't carry this invoice's reference, so it'll appear under Invoices for you to
                  match to {invoice.invoice_number}.
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500">
              {invoice.payment_route === 'paystack_split'
                ? 'When it’s paid, Paystack settles each party to their own bank and the invoice is marked paid.'
                : invoice.post_payment_action === 'distribute_and_payout'
                  ? 'When it’s paid, the invoice is marked paid, the split is distributed, and external stakeholders are paid out automatically.'
                  : invoice.post_payment_action === 'distribute'
                    ? 'When it’s paid, the invoice is marked paid and the split is distributed to stakeholder balances.'
                    : 'When it’s paid, the invoice is marked paid. Distribution stays manual.'}
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Where the money goes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {ROUTES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRoute(option.value)}
                    className={`text-left p-3 rounded-xl border transition-colors ${
                      route === option.value ? 'border-brand bg-orange-50/60' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <i className={`${option.icon} text-base ${route === option.value ? 'text-brand' : 'text-gray-400'}`} />
                    <p className="text-sm font-semibold text-gray-900 mt-1">{option.label}</p>
                    <p className="text-[11px] text-gray-400 leading-snug">{option.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">When it’s paid</p>
              {actionsApply ? (
                <div className="flex flex-col gap-2 mt-2">
                  {ACTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAction(option.value)}
                      className={`text-left p-3 rounded-xl border transition-colors ${
                        action === option.value ? 'border-brand bg-orange-50/60' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                      <p className="text-[11px] text-gray-400 leading-snug">{option.hint}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
                  <i className="ri-information-line mt-0.5" />
                  Paystack pays everyone at the moment of payment, so there's nothing left to distribute
                  afterwards. The invoice is simply marked paid.
                </p>
              )}
            </div>

            {action === 'distribute_and_payout' && actionsApply && (
              <p className="flex items-start gap-1.5 rounded-xl bg-orange-50 p-3 text-xs text-orange-800">
                <i className="ri-alert-line mt-0.5" />
                Money will leave for stakeholders' banks with no further review. Check your split is right
                before sending this link.
              </p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={create.isPending}
                className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {create.isPending ? 'Creating…' : 'Create payment link'}
              </button>
            </div>
          </>
        )}
      </div>
    </DefaultModal>
  );
};
