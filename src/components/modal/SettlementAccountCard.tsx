import { useState } from 'react';
import {
  useGetBanks,
  useRemoveSettlementAccount,
  useResolveAccount,
  useSaveSettlementAccount,
  useSettlementAccount,
} from '../../hooks/useStakeholders';

const inputClass =
  'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full';

/**
 * The partner's own bank account.
 *
 * Lives next to the split rather than in Settings because this is the only place
 * its absence actually bites: on the Paystack-split payment route the partner's
 * own share is settled to their bank like any other member, and without an account
 * on file that route can't be used at all.
 */
export const SettlementAccountCard = () => {
  const { data: account, isLoading } = useSettlementAccount();
  const { data: banks = [] } = useGetBanks();
  const resolve = useResolveAccount();
  const save = useSaveSettlementAccount();
  const remove = useRemoveSettlementAccount();

  const [editing, setEditing] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setBankCode(account?.bank_code ?? '');
    setAccountNumber(account?.account_number ?? '');
    setResolvedName(null);
    setError(null);
    setEditing(true);
  };

  const handleResolve = () => {
    setError(null);
    setResolvedName(null);
    resolve.mutate(
      { accountNumber, bankCode },
      {
        onSuccess: (data) => setResolvedName(data.accountName),
        onError: (e: any) => setError(e.message || 'Could not verify that account'),
      },
    );
  };

  const handleSave = () => {
    setError(null);
    save.mutate(
      { bank_code: bankCode, account_number: accountNumber, bank_name: banks.find((b) => b.code === bankCode)?.name },
      {
        onSuccess: () => setEditing(false),
        onError: (e: any) => setError(e.message || 'Could not save the account'),
      },
    );
  };

  if (isLoading) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">Your settlement account</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Where your own share is paid when Paystack splits a payment at collection. Not needed if you
            only collect into your wallet.
          </p>
        </div>
        {!editing && (
          <button
            onClick={startEditing}
            className="text-sm font-semibold text-brand hover:text-brand-hover shrink-0"
          >
            {account?.is_configured ? 'Change' : 'Add'}
          </button>
        )}
      </div>

      {!editing && account?.is_configured && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{account.account_name}</p>
            <p className="text-xs text-gray-500 truncate">
              {account.bank_name ?? 'Bank'} · ···{account.account_number?.slice(-4)}
            </p>
          </div>
          <button
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            className="text-xs font-semibold text-red-600 hover:text-red-700 shrink-0 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      )}

      {!editing && !account?.is_configured && (
        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
          <i className="ri-information-line mt-0.5" />
          No account on file, so the "Paystack splits at payment" route is unavailable on invoices.
        </p>
      )}

      {editing && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={bankCode}
              onChange={(e) => {
                setBankCode(e.target.value);
                setResolvedName(null);
              }}
              className={inputClass}
              aria-label="Bank"
            >
              <option value="">Select bank…</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, ''));
                setResolvedName(null);
              }}
              placeholder="Account number"
              className={inputClass}
            />
          </div>

          {bankCode && accountNumber.length >= 10 && !resolvedName && (
            <button
              type="button"
              onClick={handleResolve}
              disabled={resolve.isPending}
              className="self-start text-sm font-semibold text-brand hover:text-brand-hover disabled:opacity-50"
            >
              {resolve.isPending ? 'Checking…' : 'Verify account name'}
            </button>
          )}

          {resolvedName && (
            <p className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
              <i className="ri-checkbox-circle-line" />
              {resolvedName}
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!bankCode || accountNumber.length < 10 || save.isPending}
              className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {save.isPending ? 'Saving…' : 'Save account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
