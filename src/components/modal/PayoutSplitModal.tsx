import { useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { useCreatePayoutSplit, useUpdatePayoutSplit } from '../../hooks/usePayoutSplits';
import { useGetStakeholders } from '../../hooks/useStakeholders';
import type { PayoutSplit, PayoutSplitMemberPayload } from '../../service/partnerService';

const inputBase =
  'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white';

interface MemberDraft {
  stakeholder_id: string;
  collaborator_id: string;
  share_percent: string;
}

const emptyMember = (): MemberDraft => ({ stakeholder_id: '', collaborator_id: '', share_percent: '' });

/**
 * Creates or edits one named arrangement.
 *
 * Only stakeholder shares are entered; the partner's own share is the remainder,
 * computed here and appended server-side so wallet-service still sees exactly 100.
 */
export const PayoutSplitModal = ({ split, onClose }: { split?: PayoutSplit; onClose: () => void }) => {
  const { data: stakeholders = [] } = useGetStakeholders();
  const create = useCreatePayoutSplit();
  const update = useUpdatePayoutSplit();

  const [name, setName] = useState(split?.name ?? '');
  const [description, setDescription] = useState(split?.description ?? '');
  const [members, setMembers] = useState<MemberDraft[]>(
    split
      ? split.members
          .filter((m) => !m.is_own_share)
          .map((m) => ({
            stakeholder_id: String(m.stakeholder_id ?? ''),
            collaborator_id: String(m.collaborator_id ?? ''),
            share_percent: String(m.share_percent),
          }))
      : [emptyMember()],
  );
  const [error, setError] = useState<string | null>(null);

  const stakeholderTotal = members.reduce((sum, m) => sum + (Number(m.share_percent) || 0), 0);
  const yourShare = 100 - stakeholderTotal;
  const isValid =
    name.trim() !== '' &&
    yourShare >= 0 &&
    stakeholderTotal > 0 &&
    members.every((m) => m.stakeholder_id !== '' && Number(m.share_percent) > 0);

  const updateMember = (index: number, patch: Partial<MemberDraft>) =>
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  const handleSave = () => {
    setError(null);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      members: members.map<PayoutSplitMemberPayload>((m) => ({
        stakeholder_id: Number(m.stakeholder_id),
        collaborator_id: m.collaborator_id ? Number(m.collaborator_id) : null,
        share_percent: Number(m.share_percent),
      })),
    };
    const onError = (e: any) => setError(e.message || 'Could not save this split');

    if (split) update.mutate({ id: split.id, payload }, { onSuccess: onClose, onError });
    else create.mutate(payload, { onSuccess: onClose, onError });
  };

  const isPending = create.isPending || update.isPending;

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title={split ? 'Edit split' : 'New split'}
      subtitle="One arrangement per organisation or team you share payouts with"
      maxWidthClassName="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Swift Dispatch partnership"
            className={`${inputBase} w-full mt-1.5`}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this arrangement covers"
            className={`${inputBase} w-full mt-1.5`}
          />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Who shares in this</p>

          {stakeholders.length === 0 ? (
            <p className="rounded-xl bg-orange-50 p-3 text-xs text-orange-800">
              You have no stakeholders yet. Add the businesses you share payouts with under Stakeholders first.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((member, i) => {
                const stakeholder = stakeholders.find((s) => String(s.id) === member.stakeholder_id);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={member.stakeholder_id}
                      onChange={(e) => updateMember(i, { stakeholder_id: e.target.value, collaborator_id: '' })}
                      className={`${inputBase} flex-1 min-w-0`}
                      aria-label="Stakeholder"
                    >
                      <option value="">Select stakeholder…</option>
                      {stakeholders.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.organisation_name}
                        </option>
                      ))}
                    </select>

                    {/* Names the person on the ledger line; the organisation is
                        still who gets paid. */}
                    <select
                      value={member.collaborator_id}
                      onChange={(e) => updateMember(i, { collaborator_id: e.target.value })}
                      disabled={!stakeholder?.collaborators.length}
                      className={`${inputBase} w-40 shrink-0 disabled:bg-gray-50 disabled:text-gray-400`}
                      aria-label="Contact"
                    >
                      <option value="">{stakeholder?.collaborators.length ? 'Primary contact' : 'No contacts'}</option>
                      {(stakeholder?.collaborators ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={member.share_percent}
                      onChange={(e) => updateMember(i, { share_percent: e.target.value })}
                      placeholder="%"
                      className={`${inputBase} w-20 shrink-0`}
                      aria-label="Share percent"
                    />

                    {members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMembers((prev) => prev.filter((_, idx) => idx !== i))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-red-500 shrink-0"
                        aria-label="Remove member"
                      >
                        <i className="ri-close-line text-base" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setMembers((prev) => [...prev, emptyMember()])}
                className="self-start flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover"
              >
                <i className="ri-add-line text-base" />
                Add stakeholder
              </button>
            </div>
          )}
        </div>

        {/* The remainder, not a row to fill in — you aren't your own stakeholder. */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <span className="text-sm font-semibold text-gray-700">Your share</span>
          <span className={`text-sm font-bold ${yourShare < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {yourShare.toFixed(2)}%
          </span>
        </div>
        {yourShare < 0 && (
          <p className="text-xs text-red-600">
            Stakeholders are over 100% by {Math.abs(yourShare).toFixed(2)}%.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || isPending}
            className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving…' : split ? 'Save changes' : 'Create split'}
          </button>
        </div>
      </div>
    </DefaultModal>
  );
};
