import { useState } from 'react';
import {
  useGetPayoutSplits,
  useSetDefaultPayoutSplit,
  useSetPayoutSplitStatus,
  useSplitSettlements,
} from '../../hooks/usePayoutSplits';
import { useGetBranches } from '../../hooks/useBranchPartner';
import { PayoutSplitModal } from './PayoutSplitModal';
import type { PayoutSplit, PayoutSplitStatus } from '../../service/partnerService';

const naira = (value: string | number) =>
  `₦${Number(value ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const STATUS_STYLE: Record<PayoutSplitStatus, string> = {
  active: 'bg-green-50 text-green-700',
  suspended: 'bg-orange-50 text-orange-700',
  terminated: 'bg-gray-100 text-gray-500',
};

const FILTERS: { key: PayoutSplitStatus | 'open'; label: string }[] = [
  { key: 'open', label: 'Active & suspended' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'terminated', label: 'Terminated' },
];

/** What this arrangement has actually paid out, snapshotted at settle time. */
function SettlementHistory({ split }: { split: PayoutSplit }) {
  const { data: settlements = [], isLoading } = useSplitSettlements(split.id);

  if (isLoading) return <p className="px-4 py-3 text-xs text-gray-400">Loading history…</p>;
  if (settlements.length === 0) {
    return <p className="px-4 py-3 text-xs text-gray-400">This split hasn't distributed anything yet.</p>;
  }

  return (
    <div className="divide-y divide-gray-50">
      {settlements.map((s) => (
        <div key={s.id} className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{naira(s.amount)}</p>
              <p className="text-[11px] text-gray-400 truncate">
                {formatDate(s.settled_at)} · {s.source}
                {s.invoice_number ? ` · ${s.invoice_number}` : ''}
                {s.transaction_id ? ` · delivery #${s.transaction_id}` : ''}
                {s.branch_code ? ` · ${s.branch_code}` : ''}
              </p>
            </div>
          </div>
          {s.credits.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
              {s.credits.map((c, i) => (
                <span key={i} className="text-[11px] text-gray-500">
                  {c.label || c.externalUserId}: <span className="font-medium text-gray-700">{naira(c.amount)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SplitCard({ split, branches }: { split: PayoutSplit; branches: any[] }) {
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStatus = useSetPayoutSplitStatus();
  const setDefault = useSetDefaultPayoutSplit();

  const isTerminated = split.status === 'terminated';
  const ownShare = split.members.find((m) => m.is_own_share);
  const stakeholderMembers = split.members.filter((m) => !m.is_own_share);

  const act = (fn: () => void) => {
    setError(null);
    fn();
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{split.name}</p>
            <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold capitalize ${STATUS_STYLE[split.status]}`}>
              {split.status}
            </span>
            {split.is_partner_default && (
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700">
                Your default
              </span>
            )}
            {split.default_for_branches.map((code) => (
              <span key={code} className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700">
                {code} default
              </span>
            ))}
          </div>
          {split.description && <p className="text-xs text-gray-400 mt-0.5">{split.description}</p>}
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {split.settlement_count} settlement{split.settlement_count === 1 ? '' : 's'}
        </span>
      </div>

      <div className="px-4 pb-3 flex flex-col gap-1">
        {stakeholderMembers.map((m, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-700 truncate">{m.label || m.external_user_id}</span>
            <span className="font-medium text-gray-900 shrink-0 ml-3">{m.share_percent}%</span>
          </div>
        ))}
        {ownShare && (
          <div className="flex items-center justify-between text-sm border-t border-gray-50 pt-1 mt-1">
            <span className="text-gray-500">{ownShare.label}</span>
            <span className="font-semibold text-gray-900">{ownShare.share_percent}%</span>
          </div>
        )}
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-3 border-t border-gray-50 px-4 py-2.5 flex-wrap">
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="text-xs font-semibold text-gray-500 hover:text-gray-800"
        >
          {showHistory ? 'Hide history' : 'History'}
        </button>

        {!isTerminated && (
          <>
            <button onClick={() => setEditing(true)} className="text-xs font-semibold text-brand hover:text-brand-hover">
              Edit
            </button>

            {split.status === 'active' ? (
              <button
                onClick={() =>
                  act(() =>
                    setStatus.mutate(
                      { id: split.id, status: 'suspended' },
                      { onError: (e: any) => setError(e.message) },
                    ),
                  )
                }
                className="text-xs font-semibold text-gray-500 hover:text-orange-700"
              >
                Suspend
              </button>
            ) : (
              <button
                onClick={() =>
                  act(() =>
                    setStatus.mutate({ id: split.id, status: 'active' }, { onError: (e: any) => setError(e.message) }),
                  )
                }
                className="text-xs font-semibold text-green-700 hover:text-green-800"
              >
                Reactivate
              </button>
            )}

            {split.status === 'active' && !split.is_partner_default && (
              <button
                onClick={() =>
                  act(() => setDefault.mutate({ id: split.id }, { onError: (e: any) => setError(e.message) }))
                }
                className="text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                Make my default
              </button>
            )}

            {split.status === 'active' && branches.length > 0 && (
              <select
                value=""
                onChange={(e) =>
                  e.target.value &&
                  act(() =>
                    setDefault.mutate(
                      { id: split.id, branchId: Number(e.target.value) },
                      { onError: (err: any) => setError(err.message) },
                    ),
                  )
                }
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white"
                aria-label={`Pin ${split.name} as a branch default`}
              >
                <option value="">Pin to branch…</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_code}
                  </option>
                ))}
              </select>
            )}

            {/* Terminating is permanent — the split stays readable because past
                settlements point at it, but it can never be reactivated. */}
            <button
              onClick={() => {
                if (!window.confirm(`Terminate "${split.name}"? This can't be undone — it stays visible in history.`)) return;
                act(() =>
                  setStatus.mutate({ id: split.id, status: 'terminated' }, { onError: (e: any) => setError(e.message) }),
                );
              }}
              className="text-xs font-semibold text-gray-400 hover:text-red-600 ml-auto"
            >
              Terminate
            </button>
          </>
        )}
      </div>

      {showHistory && <div className="border-t border-gray-50">{<SettlementHistory split={split} />}</div>}
      {editing && <PayoutSplitModal split={split} onClose={() => setEditing(false)} />}
    </div>
  );
}

/**
 * A partner's library of revenue-sharing arrangements.
 *
 * Replaces the single-split form: a partner can now run one arrangement per
 * counterparty group and point each branch at whichever applies.
 */
export const PayoutSplitsPanel = () => {
  const [filter, setFilter] = useState<PayoutSplitStatus | 'open'>('open');
  const [creating, setCreating] = useState(false);

  const { data: branches = [] } = useGetBranches();
  const { data: splits = [], isLoading } = useGetPayoutSplits(filter === 'open' ? undefined : filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f.key ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
        >
          <i className="ri-add-line text-base" />
          New split
        </button>
      </div>

      {isLoading ? (
        <p className="text-center py-14 text-gray-400 text-sm">
          <i className="ri-loader-4-line animate-spin text-xl" />
        </p>
      ) : splits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm font-semibold text-gray-700">No splits here</p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === 'open'
              ? 'Create one arrangement per organisation or team you share payouts with.'
              : `You have no ${filter} splits.`}
          </p>
        </div>
      ) : (
        splits.map((split) => <SplitCard key={split.id} split={split} branches={branches} />)
      )}

      <p className="text-xs text-gray-400 px-1">
        A completed delivery uses the branch's pinned split, falling back to your default. An invoice can name
        any active split instead. A suspended split won't distribute at all rather than paying a different
        arrangement's members.
      </p>

      {creating && <PayoutSplitModal onClose={() => setCreating(false)} />}
    </div>
  );
};
