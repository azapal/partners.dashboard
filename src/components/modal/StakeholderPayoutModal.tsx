import { useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { useGetStakeholderPayouts, usePayStakeholder } from '../../hooks/useStakeholders';
import type { PayoutStatus, Stakeholder } from '../../service/partnerService';

const naira = (value: string | number | null | undefined) =>
  `₦${Number(value ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STYLE: Record<PayoutStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  success: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-600',
  reversed: 'bg-orange-50 text-orange-600',
};

export const StakeholderPayoutModal = ({
  stakeholder,
  onClose,
}: {
  stakeholder: Stakeholder;
  onClose: () => void;
}) => {
  const balance = Number(stakeholder.balance ?? 0);
  const [amount, setAmount] = useState<string>(balance > 0 ? balance.toFixed(2) : '');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { data: history } = useGetStakeholderPayouts(stakeholder.id);
  const pay = usePayStakeholder(stakeholder.id);

  const value = Number(amount);
  const isValid = value > 0 && value <= balance;

  const handlePay = () => {
    setError(null);
    pay.mutate(
      { amount: value, description: `Payout to ${stakeholder.organisation_name}` },
      {
        onSuccess: () => setDone(true),
        onError: (e: any) => setError(e.message || 'Payout failed'),
      },
    );
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title={`Pay ${stakeholder.organisation_name}`}
      subtitle={
        stakeholder.account_name
          ? `${stakeholder.account_name} · ${stakeholder.bank_name ?? ''} ···${stakeholder.account_number?.slice(-4)}`
          : undefined
      }
      maxWidthClassName="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Currently owed</span>
          <span className="text-lg font-bold text-gray-900">{naira(balance)}</span>
        </div>

        {done ? (
          <div className="text-center py-4">
            <i className="ri-checkbox-circle-line text-3xl text-green-600" />
            <p className="text-sm font-semibold text-gray-900 mt-2">Payout sent</p>
            {/* Deliberately not "paid": most transfers settle asynchronously and can
                still fail, in which case the amount returns to their balance. */}
            <p className="text-xs text-gray-500 mt-1">
              The transfer is on its way. If the bank rejects it, the amount returns to their balance
              automatically.
            </p>
            <button
              onClick={onClose}
              className="mt-4 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</label>
              <input
                type="number"
                min={0}
                max={balance}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 px-3 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white w-full"
              />
              {value > balance && <p className="text-xs text-red-600 mt-1">More than this stakeholder is owed.</p>}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={!isValid || pay.isPending}
                className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pay.isPending ? 'Sending…' : `Send ${naira(value || 0)}`}
              </button>
            </div>
          </>
        )}

        {!!history?.payouts.length && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent payouts</p>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {history.payouts.slice(0, 8).map((payout) => (
                <div key={payout.reference} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">{naira(payout.amount)}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {new Date(payout.createdAt).toLocaleDateString()}
                      {payout.failureReason ? ` · ${payout.failureReason}` : ''}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0 ${STATUS_STYLE[payout.status]}`}>
                    {payout.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DefaultModal>
  );
};
