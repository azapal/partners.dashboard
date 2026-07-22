import { useState } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { sheetActions } from '../../store/client/sheets';
import type { BranchManager } from '../../service/partnerService';
import { useGetInvites } from '../../hooks/useInvites';
import { MapLocationPicker } from '../map/MapLocationPicker';
import { SearchableSelect } from '../inputs/SearchableSelect';

type BranchStatus = 'Active' | 'Inactive';

interface BranchDetail {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  lat: string;
  lon: string;
  status: BranchStatus;
  branch_managers: BranchManager[];
}

type SavePayload = {
  status: BranchStatus;
  address: string;
  lat: string;
  lon: string;
  managerIds: string[];
};

const closeSheet = () =>
  sheetActions.toggleBasicResizableSheet({ name: null, show: false, props: null });

export const BranchDetailSheet = () => {
  const { modal: { props } } = useAppStore((s) => s);
  const branch: BranchDetail = props?.branch;
  const onSave: (id: string, data: SavePayload) => void = props?.onSave;
  const onDelete: (id: string) => void = props?.onDelete;

  const { data: invites = [] } = useGetInvites();

  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<BranchStatus>('Active');
  const [location, setLocation] = useState({ lat: '', lon: '', address: '' });
  const [managerIds, setManagerIds] = useState<string[]>([]);

  if (!branch) return null;

  // Build options: all invites + any existing managers not present in the invite list
  const inviteIdSet = new Set(invites.map((inv) => String(inv.id)));
  const orphanOpts = branch.branch_managers
    .filter((m) => !inviteIdSet.has(String(m.id)))
    .map((m) => ({ value: String(m.id), label: `${m.first_name} ${m.last_name}` }));
  const managerOptions = [
    ...orphanOpts,
    ...invites.map((inv) => ({
      value: String(inv.id),
      label: `${inv.first_name} ${inv.last_name}`,
    })),
  ];

  const handleStartEdit = () => {
    setStatus(branch.status);
    setLocation({ lat: branch.lat ?? '', lon: branch.lon ?? '', address: branch.city ?? '' });
    setManagerIds(branch.branch_managers.map((m) => String(m.id)));
    setEditing(true);
  };

  const handleSave = () => {
    onSave?.(branch.id, {
      status,
      address: location.address,
      lat: location.lat,
      lon: location.lon,
      managerIds,
    });
    setEditing(false);
  };

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 pt-4 pb-4 border-b border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            Edit Branch
          </p>
          <h2 className="font-bold text-gray-900 text-base mt-0.5">{branch.code}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BranchStatus)}
              className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#F14724] focus:ring-2 focus:ring-orange-100"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Map / Address */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Location</p>
            {(!location.lat || !location.lon) && (
              <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 rounded-xl px-3 py-2.5 text-xs mb-2">
                <i className="ri-error-warning-line text-base shrink-0" />
                No location set for this branch — search or pin one below.
              </div>
            )}
            <MapLocationPicker value={location} onChange={setLocation} />
          </div>

          {/* Managers */}
          <SearchableSelect
            multi
            label="Branch Managers"
            options={managerOptions}
            value={managerIds}
            onChange={setManagerIds}
            placeholder="Search and add managers…"
          />
        </div>

        <div className="px-5 py-4 border-t border-gray-100 space-y-2">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={() => setEditing(false)}
            className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW MODE ──────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (window.confirm('Delete this branch? This cannot be undone.')) {
      onDelete?.(branch.id);
      closeSheet();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-2 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 shadow-sm">
            <i className="ri-git-branch-line text-2xl text-[#F14724]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 text-base leading-tight">{branch.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{branch.code}</p>
            <span
              className={`inline-block mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                branch.status === 'Active'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {branch.status}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <Section title="Branch Details">
          <DetailRow icon="ri-map-pin-line" label="Address" value={branch.city || '—'} />
          {branch.lat && branch.lon && (
            <DetailRow
              icon="ri-crosshair-line"
              label="Coordinates"
              value={`${parseFloat(branch.lat).toFixed(5)}, ${parseFloat(branch.lon).toFixed(5)}`}
            />
          )}
        </Section>

        <Section
          title={`Branch Managers (${branch.branch_managers.length})`}
        >
          {branch.branch_managers.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No managers assigned.</p>
          ) : (
            branch.branch_managers.map((manager, index) => (
              <div key={manager.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[#F14724]">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {manager.first_name} {manager.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{manager.email}</p>
                  </div>
                </div>
                <a
                  href={`mailto:${manager.email}`}
                  title={`Email ${manager.first_name}`}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#F14724] hover:bg-orange-50 transition-colors"
                >
                  <i className="ri-mail-line text-sm" />
                </a>
              </div>
            ))
          )}
        </Section>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <button
          onClick={handleStartEdit}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <i className="ri-edit-line text-base" />
          Edit Branch
        </button>
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl text-sm font-semibold transition-colors"
        >
          <i className="ri-delete-bin-line text-base" />
          Delete Branch
        </button>
      </div>
    </div>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        {title}
      </p>
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
        <i className={`${icon} text-sm text-[#F14724]`} />
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400 shrink-0">{label}</p>
        <p className="text-sm font-medium text-gray-800 truncate text-right">{value}</p>
      </div>
    </div>
  );
}
