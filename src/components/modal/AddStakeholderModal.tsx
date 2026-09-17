import { useState } from 'react';
import { DefaultModal } from './DefaultModal';
import {
  useCreateStakeholder,
  useGetBanks,
  useNetworkPartner,
  useResolveAccount,
  useSearchNetworkPartners,
} from '../../hooks/useStakeholders';
import type { CollaboratorPayload, StakeholderType } from '../../service/partnerService';

const inputClass =
  'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full';
const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wide';

const emptyCollaborator = (): CollaboratorPayload => ({
  first_name: '',
  last_name: '',
  role_label: '',
  email: '',
  phone: '',
});

/**
 * Picks a network partner from the Azapal directory. Search returns identity only
 * — code, name, city — and the contact details, branches and facilitators arrive
 * only once a specific partner is selected by exact code.
 */
function NetworkPartnerPicker({
  selectedCode,
  onSelect,
  branchCode,
  onBranchChange,
  contactId,
  onContactChange,
}: {
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
  branchCode: string;
  onBranchChange: (code: string) => void;
  contactId: number | null;
  onContactChange: (id: number | null) => void;
}) {
  const [term, setTerm] = useState('');
  const { data: results = [], isFetching } = useSearchNetworkPartners(term);
  const { data: selected, isLoading: loadingDetail } = useNetworkPartner(selectedCode);

  if (selectedCode && selected) {
    return (
      <div className="rounded-xl border border-gray-200 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              {selected.partner_name}
              {selected.is_verified && <i className="ri-verified-badge-fill text-blue-500" />}
            </p>
            <p className="text-[11px] text-gray-400">
              {selected.partner_code}
              {selected.city ? ` · ${selected.city}` : ''}
              {selected.email ? ` · ${selected.email}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              onBranchChange('');
              onContactChange(null);
            }}
            className="text-xs font-semibold text-gray-400 hover:text-gray-700 shrink-0"
          >
            Change
          </button>
        </div>

        {selected.branches.length > 0 && (
          <div className="mt-3">
            <label className={labelClass}>Branch (optional)</label>
            <select value={branchCode} onChange={(e) => onBranchChange(e.target.value)} className={`${inputClass} mt-1.5`}>
              <option value="">Whole partner</option>
              {selected.branches.map((branch) => (
                <option key={branch.id} value={branch.branch_code}>
                  {branch.branch_code} — {branch.address}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Picking a branch settles into that branch's own wallet, which reconciles better on their side.
            </p>
          </div>
        )}

        <div className="mt-3">
          <label className={labelClass}>Who's facilitating this</label>
          {selected.facilitators.length === 0 ? (
            <p className="text-[11px] text-gray-400 mt-1.5">
              No admins or managers listed at this partner yet.
            </p>
          ) : (
            <select
              value={contactId ?? ''}
              onChange={(e) => onContactChange(e.target.value ? Number(e.target.value) : null)}
              className={`${inputClass} mt-1.5`}
            >
              <option value="">Select a contact…</option>
              {selected.facilitators.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.first_name} {person.last_name} — {person.role}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className={labelClass}>Find the partner</label>
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search by name, partner code or city…"
        className={`${inputClass} mt-1.5`}
      />
      {loadingDetail && <p className="text-xs text-gray-400 mt-2">Loading partner…</p>}
      {term.trim().length > 0 && term.trim().length < 2 && (
        <p className="text-[11px] text-gray-400 mt-1.5">Type at least 2 characters.</p>
      )}
      {term.trim().length >= 2 && (
        <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
          {isFetching && <p className="text-xs text-gray-400 p-3">Searching…</p>}
          {!isFetching && results.length === 0 && <p className="text-xs text-gray-400 p-3">No partners found</p>}
          {results.map((result) => (
            <button
              key={result.partner_code}
              type="button"
              onClick={() => onSelect(result.partner_code)}
              className="w-full text-left p-3 hover:bg-orange-50/50 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                {result.partner_name}
                {result.is_verified && <i className="ri-verified-badge-fill text-blue-500 text-xs" />}
              </p>
              <p className="text-[11px] text-gray-400">
                {result.partner_code}
                {result.city ? ` · ${result.city}` : ''}
                {result.branch_count ? ` · ${result.branch_count} branch${result.branch_count > 1 ? 'es' : ''}` : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const AddStakeholderModal = ({ onClose, branchId }: { onClose: () => void; branchId: number | null }) => {
  const [type, setType] = useState<StakeholderType>('external');
  const [organisationName, setOrganisationName] = useState('');
  const [reason, setReason] = useState('');
  const [collaborators, setCollaborators] = useState<CollaboratorPayload[]>([emptyCollaborator()]);

  const [networkCode, setNetworkCode] = useState<string | null>(null);
  const [networkBranchCode, setNetworkBranchCode] = useState('');
  const [networkContactId, setNetworkContactId] = useState<number | null>(null);

  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: banks = [] } = useGetBanks();
  const { data: networkPartner } = useNetworkPartner(networkCode);
  const resolve = useResolveAccount();
  const create = useCreateStakeholder();

  const isExternal = type === 'external';
  // For a network partner the organisation name comes from the directory, so the
  // field is filled in rather than typed — that's the whole point of the picker.
  const effectiveName = isExternal ? organisationName.trim() : (networkPartner?.partner_name ?? '');
  const canSubmit = isExternal ? !!effectiveName : !!networkCode;

  function updateCollaborator(index: number, patch: Partial<CollaboratorPayload>) {
    setCollaborators((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

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

  const handleSubmit = () => {
    setError(null);
    create.mutate(
      {
        organisation_name: effectiveName,
        stakeholder_type: type,
        reason_for_partnership: reason.trim() || null,
        branch_id: branchId,
        // Only send collaborators that actually name someone — an untouched blank
        // row shouldn't become an empty contact.
        collaborators: collaborators.filter((c) => c.first_name.trim()),
        ...(isExternal
          ? { bank_code: bankCode || null, account_number: accountNumber || null }
          : {
              network_partner_code: networkCode as string,
              network_branch_code: networkBranchCode || undefined,
              network_contact_id: networkContactId,
            }),
      },
      {
        onSuccess: (stakeholder) => {
          // The record saves even when the bank account is rejected, so surface that
          // rather than closing on what looks like a clean success.
          if (stakeholder.bank_warning) {
            setError(`Stakeholder saved, but the bank account was rejected: ${stakeholder.bank_warning}`);
            return;
          }
          onClose();
        },
        onError: (e: any) => setError(e.message || 'Could not add stakeholder'),
      },
    );
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title="Add stakeholder"
      subtitle="An organisation you share payouts with"
      maxWidthClassName="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className={labelClass}>Type</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {(
              [
                { value: 'external', label: 'External business', hint: 'Not on Azapal — paid to their bank', icon: 'ri-building-line' },
                { value: 'network_partner', label: 'Network partner', hint: 'On Azapal — paid to their wallet', icon: 'ri-links-line' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`text-left p-3 rounded-xl border transition-colors ${
                  type === option.value ? 'border-brand bg-orange-50/60' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <i className={`${option.icon} text-base ${type === option.value ? 'text-brand' : 'text-gray-400'}`} />
                <p className="text-sm font-semibold text-gray-900 mt-1">{option.label}</p>
                <p className="text-[11px] text-gray-400 leading-snug">{option.hint}</p>
              </button>
            ))}
          </div>
        </div>

        {isExternal ? (
          <div>
            <label className={labelClass}>Organisation or team name</label>
            <input
              type="text"
              value={organisationName}
              onChange={(e) => setOrganisationName(e.target.value)}
              placeholder="e.g. Swift Dispatch Ltd"
              className={`${inputClass} mt-1.5`}
            />
          </div>
        ) : (
          <NetworkPartnerPicker
            selectedCode={networkCode}
            onSelect={setNetworkCode}
            branchCode={networkBranchCode}
            onBranchChange={setNetworkBranchCode}
            contactId={networkContactId}
            onContactChange={setNetworkContactId}
          />
        )}

        <div>
          <label className={labelClass}>Reason for the partnership</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Handles all last-mile drops in Lekki"
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white w-full mt-1.5"
          />
        </div>

        {/* Contacts. Deliberately not payees — the organisation is paid once, into
            the account below, and these names exist to label split lines. */}
        <div className="border-t border-gray-100 pt-4">
          <p className={labelClass}>People you deal with</p>
          <p className="text-[11px] text-gray-400 mt-1 mb-2">
            Contacts only — payouts always go to the organisation. The first one labels the split line.
          </p>
          <div className="flex flex-col gap-3">
            {collaborators.map((collaborator, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={collaborator.first_name}
                  onChange={(e) => updateCollaborator(index, { first_name: e.target.value })}
                  placeholder="First name"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={collaborator.last_name ?? ''}
                  onChange={(e) => updateCollaborator(index, { last_name: e.target.value })}
                  placeholder="Last name"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={collaborator.role_label ?? ''}
                  onChange={(e) => updateCollaborator(index, { role_label: e.target.value })}
                  placeholder="Role (e.g. Operations Lead)"
                  className={inputClass}
                />
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={collaborator.email ?? ''}
                    onChange={(e) => updateCollaborator(index, { email: e.target.value })}
                    placeholder="Email"
                    className={inputClass}
                  />
                  {collaborators.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCollaborators((prev) => prev.filter((_, i) => i !== index))}
                      aria-label={`Remove ${collaborator.first_name || 'this person'}`}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold px-2 shrink-0"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  )}
                </div>
                <input
                  type="tel"
                  value={collaborator.phone ?? ''}
                  onChange={(e) => updateCollaborator(index, { phone: e.target.value })}
                  placeholder="Phone"
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCollaborators((prev) => [...prev, emptyCollaborator()])}
            className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover transition-colors"
          >
            <i className="ri-add-line text-base" />
            Add another person
          </button>
        </div>

        {isExternal && (
          <div className="border-t border-gray-100 pt-4">
            <p className={labelClass}>Payout account (optional)</p>
            <p className="text-[11px] text-gray-400 mt-1 mb-2">
              The organisation's account. Needed before you can pay them out — you can add it later.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={bankCode}
                onChange={(e) => {
                  setBankCode(e.target.value);
                  setResolvedName(null);
                }}
                className={inputClass}
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
                className="mt-2 text-sm font-semibold text-brand hover:text-brand-hover disabled:opacity-50"
              >
                {resolve.isPending ? 'Checking…' : 'Verify account name'}
              </button>
            )}

            {resolvedName && (
              <p className="mt-2 text-sm font-semibold text-green-700 flex items-center gap-1.5">
                <i className="ri-checkbox-circle-line" />
                {resolvedName}
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || create.isPending}
            className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {create.isPending ? 'Adding…' : 'Add stakeholder'}
          </button>
        </div>
      </div>
    </DefaultModal>
  );
};
