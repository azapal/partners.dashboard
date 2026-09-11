import React, { useState } from 'react';
import Select from 'react-select';
import { DefaultModal } from './DefaultModal';
import { FormField } from '../inputs/FormField';
import States from '../../utilities/states.json';
import { CARGO_TYPES } from '../../lib/data/logisticsNetwork';
import type { CargoType } from '../../lib/data/logisticsNetwork';
import type { PairingFrequency, PairingRoute } from '../../service/partnerService';
import { BRAND_ORANGE } from '../../lib/brandColors';
import {
  useCreatePairingRoute,
  useUpdatePairingRoute,
  useDeletePairingRoute,
} from '../../hooks/usePairingRoutes';

interface AddRouteModalProps {
  route?: PairingRoute | null;
  onClose: () => void;
}

type Option = { value: string; label: string };

const FREQUENCY_OPTIONS: { value: PairingFrequency; label: string }[] = [
  { value: 'one_time', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

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

const stateOptions: Option[] = States.map((s) => ({ value: s.name, label: s.name }));
const inputClass = 'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full';

function minPreferredDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export const AddRouteModal: React.FC<AddRouteModalProps> = ({ route, onClose }) => {
  const isEdit = !!route;
  const [origin, setOrigin] = useState<Option | null>(route ? { value: route.origin_state, label: route.origin_state } : null);
  const [destination, setDestination] = useState<Option | null>(route ? { value: route.destination_state, label: route.destination_state } : null);
  const [cargoType, setCargoType] = useState<CargoType>(route?.cargo_type ?? 'General Goods');
  const [frequency, setFrequency] = useState<PairingFrequency>(route?.frequency ?? 'one_time');
  const [preferredDate, setPreferredDate] = useState(route?.preferred_date ?? '');
  const [minBudget, setMinBudget] = useState(route ? String(route.min_budget) : '');
  const [maxBudget, setMaxBudget] = useState(route ? String(route.max_budget) : '');
  const [formError, setFormError] = useState<string | null>(null);

  const createRoute = useCreatePairingRoute();
  const updateRoute = useUpdatePairingRoute();
  const deleteRoute = useDeletePairingRoute();

  const isPending = createRoute.isPending || updateRoute.isPending || deleteRoute.isPending;
  const canSubmit =
    !!origin && !!destination && !!preferredDate &&
    Number(minBudget) > 0 && Number(maxBudget) > 0 && Number(maxBudget) >= Number(minBudget);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !origin || !destination) return;
    setFormError(null);

    const payload = {
      origin_state: origin.value,
      destination_state: destination.value,
      frequency,
      preferred_date: preferredDate,
      cargo_type: cargoType,
      min_budget: Number(minBudget),
      max_budget: Number(maxBudget),
    };

    if (isEdit) {
      updateRoute.mutate(
        { id: route!.id, payload },
        { onSuccess: onClose, onError: (err) => setFormError(err.message) }
      );
    } else {
      createRoute.mutate(payload, { onSuccess: onClose, onError: (err) => setFormError(err.message) });
    }
  };

  const handleDelete = () => {
    if (!route) return;
    if (window.confirm('Delete this route? This cannot be undone.')) {
      deleteRoute.mutate(route.id, { onSuccess: onClose, onError: (err) => setFormError(err.message) });
    }
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Route' : 'Add Route'}
      subtitle="A scheduled route businesses can discover and join in the app."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Origin State" required>
            <Select options={stateOptions} value={origin} onChange={setOrigin} placeholder="Select…" styles={selectStyles} isClearable />
          </FormField>
          <FormField label="Destination State" required>
            <Select options={stateOptions} value={destination} onChange={setDestination} placeholder="Select…" styles={selectStyles} isClearable />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Cargo Type">
            <select value={cargoType} onChange={(e) => setCargoType(e.target.value as CargoType)} className={inputClass}>
              {CARGO_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Frequency">
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as PairingFrequency)} className={inputClass}>
              {FREQUENCY_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Preferred Date" required>
          <input
            type="date"
            value={preferredDate}
            min={minPreferredDate()}
            onChange={(e) => setPreferredDate(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Min Budget (₦)" required>
            <input
              type="number" min={1} step="any" value={minBudget} onChange={(e) => setMinBudget(e.target.value)}
              placeholder="e.g., 30000" className={inputClass}
            />
          </FormField>
          <FormField label="Max Budget (₦)" required>
            <input
              type="number" min={1} step="any" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="e.g., 100000" className={inputClass}
            />
          </FormField>
        </div>

        {formError && <p className="text-xs text-red-500">{formError}</p>}

        <div className="flex justify-between gap-3 pt-2 border-t border-gray-100">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-60"
            >
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {isPending && <i className="ri-loader-4-line animate-spin text-base" />}
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Route'}
            </button>
          </div>
        </div>
      </form>
    </DefaultModal>
  );
};
