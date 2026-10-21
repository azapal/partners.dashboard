import React, { useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import { useCreateBranch } from '../../hooks/useBranchPartner';
import { useGetInvites } from '../../hooks/useInvites';
import { MapLocationPicker } from '../map/MapLocationPicker';
import States from '../../utilities/states.json';
import type { CreateBranchPayload } from '../../service/partnerService';
import { BRAND_ORANGE } from '../../lib/brandColors';
import { PriceNotice } from '../billing/PriceNotice';
import { feedbackStore } from '../../store/client/feedback';

interface CreateBranchDrawerProps {
  onClose: () => void;
  /**
   * Initial field values, used when the assistant opens this drawer on the
   * user's behalf. Only ever prefills — the human still presses Create.
   */
  prefill?: Partial<CreateBranchPayload>;
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
    backgroundColor: state.isSelected ? BRAND_ORANGE : state.isFocused ? '#f9fafb' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    fontSize: '0.875rem',
  }),
  placeholder: (base: any) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
  singleValue: (base: any) => ({ ...base, fontSize: '0.875rem' }),
};

/**
 * Dropdown menus render into <body>: the map's Leaflet panes sit at z-index
 * 400+, so a menu opened over the map would otherwise appear behind it.
 */
const portalled = {
  menuPortalTarget: typeof document !== 'undefined' ? document.body : null,
  menuPosition: 'fixed' as const,
  styles: {
    ...selectStyles,
    menuPortal: (base: any) => ({ ...base, zIndex: 60 }),
  },
};

export const CreateBranchDrawer: React.FC<CreateBranchDrawerProps> = ({ onClose, prefill }) => {
  const [form, setForm] = useState<CreateBranchPayload>({ ...emptyForm, ...prefill });
  // The state/LGA selects carry their own option objects, so a prefilled value
  // has to be mirrored into them or the dropdowns would render empty over a
  // populated form.
  const [selectedState, setSelectedState] = useState<{ value: string; label: string } | null>(
    prefill?.state ? { value: prefill.state, label: prefill.state } : null,
  );
  const [selectedLga, setSelectedLga] = useState<{ value: string; label: string } | null>(
    prefill?.lga ? { value: prefill.lga, label: prefill.lga } : null,
  );
  const [selectedManagers, setSelectedManagers] = useState<{ value: string; label: string }[]>([]);

  const { mutate: createBranch, isPending } = useCreateBranch();
  const { data: invites = [] } = useGetInvites();

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
        // Omitted — the backend fills this in from the caller's own partner
        // record, which works the same whether the caller is a partner-owner
        // or a Tenant Admin/Super Admin employee session.
      },
      { onSuccess: onClose }
    );
  };

  // Full-screen, so Escape is the quickest way out. Two exceptions: an open
  // dropdown takes the first Escape to close itself, and a message modal on top
  // takes it to dismiss the message. Read in the capture phase, i.e. before
  // react-select sees the key — it swallows Escape whenever it has focus, open
  // or not, and by bubble time its menu has already reported itself closed.
  const menuOpen = useRef(false);
  const menuHandlers = {
    onMenuOpen: () => { menuOpen.current = true; },
    onMenuClose: () => { menuOpen.current = false; },
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || menuOpen.current || feedbackStore.state.queue.length > 0) return;
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const hasLocation = !!form.lat && !!form.lon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-branch-title"
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      {/* ── Header ── */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-4 py-4 sm:px-8">
        <div className="min-w-0">
          <h2 id="create-branch-title" className="text-xl font-bold text-gray-900 sm:text-2xl">Create Branch</h2>
          <p className="mt-0.5 text-sm text-gray-500">Pick who runs it, where it is, and pin it on the map.</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100">
          <i className="ri-close-line text-xl" />
        </button>
      </header>

      {/* ── Body ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <form id="create-branch-form" onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
          {/* Branch Manager */}
          <FormSection label="Branch Manager" required>
            <Select
              isMulti
              options={managerOptions}
              value={selectedManagers}
              onChange={(opts) => setSelectedManagers(opts ? [...opts] : [])}
              placeholder="Select one or more users…"
              {...portalled}
              {...menuHandlers}
              isClearable
            />
            {managerOptions.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                No users yet. <a href="/users" className="text-brand font-medium hover:underline">Invite users first →</a>
              </p>
            )}
          </FormSection>

          {/* State / LGA */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormSection label="State">
              <Select
                options={stateOptions}
                value={selectedState}
                onChange={(opt) => { setSelectedState(opt); setSelectedLga(null); }}
                placeholder="Select state…"
                {...portalled}
              {...menuHandlers}
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
                {...portalled}
              {...menuHandlers}
                isClearable
              />
            </FormSection>
          </div>

          {/* Branch location — under State/LGA, so the pin follows the area just chosen. */}
          <section className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">
                Branch Location<span className="text-red-400 ml-0.5">*</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Search an address or click/drag the pin on the map.</p>
            </div>

            {!hasLocation && (
              <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 rounded-xl px-3 py-2.5 text-xs">
                <i className="ri-error-warning-line text-base shrink-0" />
                A location is required — search or pin one below before you can save.
              </div>
            )}

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
          </section>

          {/* A one-off charge, and it lands on the company account rather
              than the branch being created — it can't pay for itself yet. */}
          <PriceNotice kind="branch_created" billedTo="your company account" />
        </form>
      </div>

      {/* ── Footer ── pinned, so Create is reachable without scrolling past the map. */}
      <footer className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 sm:px-8">
        <div className="mx-auto flex w-full max-w-3xl justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            form="create-branch-form"
            disabled={isPending || selectedManagers.length === 0 || !hasLocation}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isPending && <i className="ri-loader-4-line animate-spin text-base" />}
            {isPending ? 'Creating…' : 'Create Branch'}
          </button>
        </div>
      </footer>
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
