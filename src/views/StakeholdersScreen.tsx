import { useMemo, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useGetStakeholders } from '../hooks/useStakeholders';
import { useGetBranches } from '../hooks/useBranchPartner';
import { AddStakeholderModal } from '../components/modal/AddStakeholderModal';
import { StakeholderPayoutModal } from '../components/modal/StakeholderPayoutModal';
import type { Stakeholder } from '../service/partnerService';

const naira = (value: string | number | null | undefined) =>
  `₦${Number(value ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TYPE_LABEL: Record<Stakeholder['stakeholder_type'], string> = {
  external: 'External business',
  network_partner: 'Network partner',
};

function TypeBadge({ type }: { type: Stakeholder['stakeholder_type'] }) {
  const isNetwork = type === 'network_partner';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${
        isNetwork ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
      }`}
    >
      <i className={isNetwork ? 'ri-links-line' : 'ri-building-line'} />
      {TYPE_LABEL[type]}
    </span>
  );
}

/**
 * The people at this organisation. Contacts, not payees — a stakeholder is paid
 * once, as an org, so these names exist to tell you who you're actually dealing
 * with and to label the split line. A network partner's facilitator is the same
 * idea, just sourced from the other partner's own staff.
 */
function Contacts({ stakeholder }: { stakeholder: Stakeholder }) {
  const people = stakeholder.collaborators;
  const facilitator = stakeholder.network_contact;

  if (!people.length && !facilitator) {
    return <p className="text-[11px] text-gray-300 mt-0.5">No contact recorded</p>;
  }

  const primary = people.find((p) => p.is_primary) ?? people[0];
  const label = primary
    ? `${primary.full_name}${primary.role_label ? ` · ${primary.role_label}` : ''}`
    : `${facilitator?.full_name}${facilitator?.role ? ` · ${facilitator.role}` : ''}`;

  return (
    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
      <i className="ri-user-line mr-1" />
      {label}
      {people.length > 1 && <span className="text-gray-400"> +{people.length - 1} more</span>}
    </p>
  );
}

function PayoutReadiness({ stakeholder }: { stakeholder: Stakeholder }) {
  // A network partner is paid inside Azapal — the credit lands in the wallet they
  // already have — so a bank account is neither needed nor meaningful for them.
  if (stakeholder.stakeholder_type === 'network_partner') {
    return <span className="text-xs text-gray-400">Paid to Azapal wallet</span>;
  }
  if (stakeholder.payout_ready) {
    return (
      <span className="text-xs text-gray-600">
        {stakeholder.bank_name ?? 'Bank'} ···{stakeholder.account_number?.slice(-4)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
      <i className="ri-error-warning-line" />
      No bank account
    </span>
  );
}

export const StakeholdersScreen = () => {
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payingOut, setPayingOut] = useState<Stakeholder | null>(null);

  const { data: branches = [] } = useGetBranches();
  // Balances are a wallet-service call per stakeholder, so they're opt-in on the
  // API. This screen is where they matter, so it always asks for them.
  const { data: stakeholders = [], isLoading, error } = useGetStakeholders(branchId, true);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stakeholders;
    return stakeholders.filter(
      (s) =>
        s.organisation_name.toLowerCase().includes(term) ||
        s.stakeholder_code.toLowerCase().includes(term) ||
        s.network_partner?.partner_code.toLowerCase().includes(term) ||
        // Searching by a contact's name is how you find an org whose legal name
        // you don't remember — the person is usually who you actually dealt with.
        s.collaborators.some((c) => c.full_name.toLowerCase().includes(term)),
    );
  }, [stakeholders, search]);

  const totalOwed = stakeholders.reduce((sum, s) => sum + Number(s.balance ?? 0), 0);
  const needsBank = stakeholders.filter((s) => s.stakeholder_type === 'external' && !s.payout_ready).length;

  const stats = [
    { label: 'Stakeholders', value: String(stakeholders.length), icon: 'ri-team-line', color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Network partners', value: String(stakeholders.filter((s) => s.stakeholder_type === 'network_partner').length), icon: 'ri-links-line', color: 'text-teal-500', bg: 'bg-teal-50' },
    { label: 'Currently owed', value: naira(totalOwed), icon: 'ri-wallet-3-line', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Missing bank details', value: String(needsBank), icon: 'ri-error-warning-line', color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stakeholders…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {branches.length > 0 && (
              <select
                value={branchId ?? ''}
                onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2.5 text-sm border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <option value="">All branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_code}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
            >
              <i className="ri-add-line text-base" />
              Add stakeholder
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <i className={`${icon} text-lg ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 font-medium">{label}</p>
                <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-orange-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stakeholder</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payout destination</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Owed</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-gray-400 text-sm">
                      <i className="ri-loader-4-line animate-spin text-xl" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-red-600 text-sm">
                      {(error as Error).message}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-gray-400 text-sm">
                      {stakeholders.length === 0
                        ? 'No stakeholders yet — add the businesses you share payouts with.'
                        : 'No stakeholders match that search'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((stakeholder) => (
                    <tr key={stakeholder.id} className="border-b border-gray-50 hover:bg-orange-50/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900">{stakeholder.organisation_name}</p>
                        <p className="text-xs text-gray-400">
                          {stakeholder.network_partner
                            ? `${stakeholder.network_partner.partner_code}${stakeholder.network_branch ? ` · ${stakeholder.network_branch.branch_code}` : ''}`
                            : stakeholder.stakeholder_code}
                        </p>
                        <Contacts stakeholder={stakeholder} />
                      </td>
                      <td className="px-4 py-3.5">
                        <TypeBadge type={stakeholder.stakeholder_type} />
                      </td>
                      <td className="px-4 py-3.5">
                        <PayoutReadiness stakeholder={stakeholder} />
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-900">{naira(stakeholder.balance)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setPayingOut(stakeholder)}
                          disabled={!stakeholder.payout_ready || Number(stakeholder.balance ?? 0) <= 0}
                          title={
                            stakeholder.stakeholder_type === 'network_partner'
                              ? 'Network partners are paid into their Azapal wallet automatically'
                              : !stakeholder.payout_ready
                                ? 'Add bank details before paying this stakeholder out'
                                : undefined
                          }
                          className="text-brand hover:text-brand-hover text-sm font-semibold disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          Pay out
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-50">
            {isLoading ? (
              <p className="text-center py-14 text-gray-400 text-sm">
                <i className="ri-loader-4-line animate-spin text-xl" />
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-14 text-gray-400 text-sm">No stakeholders yet</p>
            ) : (
              filtered.map((stakeholder) => (
                <div key={stakeholder.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{stakeholder.organisation_name}</p>
                      <Contacts stakeholder={stakeholder} />
                    </div>
                    <p className="font-semibold text-gray-900 shrink-0">{naira(stakeholder.balance)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <TypeBadge type={stakeholder.stakeholder_type} />
                    <button
                      onClick={() => setPayingOut(stakeholder)}
                      disabled={!stakeholder.payout_ready || Number(stakeholder.balance ?? 0) <= 0}
                      className="text-brand text-sm font-semibold disabled:text-gray-300"
                    >
                      Pay out
                    </button>
                  </div>
                  <PayoutReadiness stakeholder={stakeholder} />
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 px-1">
          Shares are settled automatically when a delivery is completed, using the split configured under
          Financials → Split.
        </p>
      </div>

      {isAddOpen && <AddStakeholderModal onClose={() => setIsAddOpen(false)} branchId={branchId} />}
      {/* Keyed so switching straight from one stakeholder to another remounts the
          modal — without it the amount field would keep the previous person's value. */}
      {payingOut && (
        <StakeholderPayoutModal key={payingOut.id} stakeholder={payingOut} onClose={() => setPayingOut(null)} />
      )}
    </DashboardLayout>
  );
};
