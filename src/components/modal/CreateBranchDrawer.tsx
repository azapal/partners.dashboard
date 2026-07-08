import React, { useState } from 'react';
import Select from 'react-select';
import { useCreateBranch } from '../../hooks/useBranchPartner';
import { useGetInvites } from '../../hooks/useInvites';
import { usePartnerProfile } from '../../hooks/useAuth';
import { MapLocationPicker } from '../map/MapLocationPicker';
import States from '../../utilities/states.json';
import type { CreateBranchPayload } from '../../service/partnerService';

interface CreateBranchDrawerProps {
  onClose: () => void;
}

const emptyForm: CreateBranchPayload = {
  branch_manager: [],
  address: '',
  state: '',
  lga: '',
  lat: '',
  lon: '',
};

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderColor: state.isFocused ? '#9ca3af' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px #e5e7eb' : 'none',
    borderRadius: '0.75rem',
    minHeight: '44px',
    '&:hover': { borderColor: '#9ca3af' },
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#F14724' : state.isFocused ? '#f9fafb' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    fontSize: '0.875rem',
  }),
  placeholder: (base: any) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
  singleValue: (base: any) => ({ ...base, fontSize: '0.875rem' }),
};

export const CreateBranchDrawer: React.FC<CreateBranchDrawerProps> = ({ onClose }) => {
  const [form, setForm] = useState<CreateBranchPayload>(emptyForm);
  const [selectedState, setSelectedState] = useState<{ value: string; label: string } | null>(null);
  const [selectedLga, setSelectedLga] = useState<{ value: string; label: string } | null>(null);
  const [selectedManagers, setSelectedManagers] = useState<{ value: string; label: string }[]>([]);

  const { mutate: createBranch, isPending } = useCreateBranch();
  const { data: invites = [] } = useGetInvites();
  const profile = usePartnerProfile();

  const stateOptions = States.map((s) => ({ value: s.name, label: s.name }));
  const lgaOptions = selectedState
    ? (States.find((s) => s.name === selectedState.value)?.lgas ?? []).map((l) => ({ value: l, label: l }))
    : [];
  const managerOptions = invites.map((inv) => ({
    value: String(inv.id),
    label: `${inv.first_name} ${inv.last_name} — ${inv.email}`,
  }));

  const set = (k: keyof CreateBranchPayload, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBranch(
      {
        ...form,
        state: selectedState?.value ?? '',
        lga: selectedLga?.value ?? '',
        branch_manager: selectedManagers.map((m) => m.value),
        country: profile?.partner_country ?? '',
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden my-4">

        {/* ── Left: Form ── */}
        <div className="w-full lg:w-[52%] p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Branch</h2>
              <p className="text-sm text-gray-500 mt-1">Fill in the details and pin the location on the map.</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Branch Manager */}
            <FormSection label="Branch Manager" required>
              <Select
                isMulti
                options={managerOptions}
                value={selectedManagers}
                onChange={(opts) => setSelectedManagers(opts ? [...opts] : [])}
                placeholder="Select one or more users…"
                styles={selectStyles}
                isClearable
              />
              {managerOptions.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  No users yet. <a href="/users" className="text-[#F14724] font-medium hover:underline">Invite users first →</a>
                </p>
              )}
            </FormSection>

            {/* State / LGA */}
            <div className="grid grid-cols-2 gap-3">
              <FormSection label="State">
                <Select
                  options={stateOptions}
                  value={selectedState}
                  onChange={(opt) => { setSelectedState(opt); setSelectedLga(null); }}
                  placeholder="Select state…"
                  styles={selectStyles}
                  isClearable
                />
              </FormSection>
              <FormSection label="LGA">
                <Select
                  options={lgaOptions}
                  value={selectedLga}
                  onChange={setSelectedLga}
                  placeholder={selectedState ? 'Select LGA…' : 'Select state first'}
                  isDisabled={!selectedState}
                  styles={selectStyles}
                  isClearable
                />
              </FormSection>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || selectedManagers.length === 0}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-[#F14724] hover:bg-[#d63d1e] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {isPending && <i className="ri-loader-4-line animate-spin text-base" />}
                {isPending ? 'Creating…' : 'Create Branch'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Right: Map ── */}
        <div className="w-full lg:w-[48%] bg-gray-50 p-6 sm:p-8 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Branch Location</h3>
            <p className="text-xs text-gray-400 mt-0.5">Search an address or click/drag the pin on the map.</p>
          </div>

          <MapLocationPicker
            value={{ lat: form.lat ?? '', lon: form.lon ?? '', address: form.address ?? '' }}
            onChange={(loc) => setForm((p) => ({ ...p, lat: loc.lat, lon: loc.lon, address: loc.address }))}
          />

          {/* Address field (synced from map) */}
          <FormSection label="Full Address">
            <Field
              value={form.address ?? ''}
              onChange={(v) => set('address', v)}
              placeholder="Address will auto-fill from map pin"
            />
          </FormSection>
        </div>
      </div>
    </div>
  );
};

function FormSection({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Field({ value, onChange, placeholder, required }: {
  value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full"
    />
  );
}
