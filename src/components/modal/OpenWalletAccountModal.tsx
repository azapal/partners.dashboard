import React, { useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { FormField } from '../inputs/FormField';
import { useCreateVirtualAccount } from '../../hooks/useVirtualAccounts';
import { useGetBankProviders } from '../../hooks/useWallet';
import { useGetBranches } from '../../hooks/useBranchPartner';
import { WALLET_REASONS, type WalletReason } from '../../service/partnerService';

interface OpenWalletAccountModalProps {
  onClose: () => void;
  onCreated?: () => void;
  // Which scope to preselect — null/omitted means Partner Default.
  initialBranchId?: number | null;
}

const inputClass = 'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full';

export const OpenWalletAccountModal: React.FC<OpenWalletAccountModalProps> = ({ onClose, onCreated, initialBranchId = null }) => {
  const [reason, setReason] = useState<WalletReason | ''>('');
  const [bankSlug, setBankSlug] = useState('');
  const [branchId, setBranchId] = useState<number | null>(initialBranchId);
  const [formError, setFormError] = useState<string | null>(null);
  const createVirtualAccount = useCreateVirtualAccount();
  const { data: branches = [] } = useGetBranches();

  // Real list of banks Paystack actually supports for dedicated-account creation
  // (a short, specific list, not "all Nigerian banks"). Empty/erroring means no
  // Paystack integration is configured yet — an honest "unavailable" state, not a
  // fabricated fallback list, since sending the wrong bank identifier would just
  // fail against the real Paystack API anyway.
  const { data: providers = [], isLoading: loadingProviders, isError: providersError } = useGetBankProviders();
  const providersUnavailable = !loadingProviders && (providersError || providers.length === 0);

  const selectedReason = WALLET_REASONS.find((r) => r.value === reason);
  const canSubmit = reason !== '' && bankSlug !== '' && !providersUnavailable;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason === '' || bankSlug === '' || providersUnavailable) return;
    setFormError(null);
    createVirtualAccount.mutate(
      { reason, bank_name: bankSlug, branch_id: branchId },
      { onSuccess: () => { onClose(); onCreated?.(); }, onError: (err) => setFormError(err.message) }
    );
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title="Open a Wallet Account"
      subtitle="Get a dedicated account number your customers can pay into directly."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {branches.length > 0 && (
          <FormField label="Which wallet is this for?" required>
            <select
              value={branchId ?? ''}
              onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
              className={inputClass}
            >
              <option value="">Partner Default (not tied to a branch)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branch_code} · {b.state}</option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Reason for opening this account" required>
          <select value={reason} onChange={(e) => setReason(e.target.value as WalletReason)} className={inputClass}>
            <option value="">Select a reason…</option>
            {WALLET_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {selectedReason && <p className="text-xs text-gray-400 mt-1">{selectedReason.description}</p>}
        </FormField>

        <FormField label="Preferred bank" required>
          {loadingProviders ? (
            <div className={`${inputClass} flex items-center text-gray-400`}>
              <i className="ri-loader-4-line animate-spin text-base mr-2" /> Loading banks…
            </div>
          ) : providersUnavailable ? (
            <>
              <div className={`${inputClass} flex items-center text-gray-400 bg-gray-50`}>No banks available right now</div>
              <p className="text-xs text-amber-600 mt-1">
                Bank options aren't available yet — the payment provider isn't fully set up on our end. Try again later.
              </p>
            </>
          ) : (
            <select value={bankSlug} onChange={(e) => setBankSlug(e.target.value)} className={inputClass}>
              <option value="">Select a bank…</option>
              {providers.map((p) => <option key={p.provider_slug} value={p.provider_slug}>{p.bank_name}</option>)}
            </select>
          )}
        </FormField>

        <p className="text-xs text-gray-400">
          You can open more than one account — pick a different bank or reason each time.
          The account number and account name are assigned automatically once opened.
        </p>

        {formError && <p className="text-xs text-red-500">{formError}</p>}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || createVirtualAccount.isPending}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {createVirtualAccount.isPending && <i className="ri-loader-4-line animate-spin text-base" />}
            {createVirtualAccount.isPending ? 'Opening…' : 'Open Account'}
          </button>
        </div>
      </form>
    </DefaultModal>
  );
};
