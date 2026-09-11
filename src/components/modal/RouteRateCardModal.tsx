import React, { useState } from 'react';
import Select from 'react-select';
import { DefaultModal } from './DefaultModal';
import { FormField } from '../inputs/FormField';
import States from '../../utilities/states.json';
import { CARGO_TYPES } from '../../lib/data/logisticsNetwork';
import type { CargoType } from '../../lib/data/logisticsNetwork';
import type { RateCardStatus, RouteRateCard } from '../../service/partnerService';
import { useCreateRouteRate, useUpdateRouteRate, useDeleteRouteRate } from '../../hooks/useRateCards';
import { BRAND_ORANGE } from '../../lib/brandColors';

interface RouteRateCardModalProps {
  rate?: RouteRateCard | null;
  onClose: () => void;
}

type Option = { value: string; label: string };

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

export const RouteRateCardModal: React.FC<RouteRateCardModalProps> = ({ rate, onClose }) => {
  const isEdit = !!rate;
  const [origin, setOrigin] = useState<Option | null>(rate ? { value: rate.origin_state, label: rate.origin_state } : null);
  const [destination, setDestination] = useState<Option | null>(rate ? { value: rate.destination_state, label: rate.destination_state } : null);
  const [cargoType, setCargoType] = useState<CargoType>(rate?.cargo_type ?? 'General Goods');
  const [price, setPrice] = useState(rate ? String(rate.price) : '');
  const [status, setStatus] = useState<RateCardStatus>(rate?.status ?? 'Active');
  const [formError, setFormError] = useState<string | null>(null);

  const createRate = useCreateRouteRate();
  const updateRate = useUpdateRouteRate();
  const deleteRate = useDeleteRouteRate();

  const isPending = createRate.isPending || updateRate.isPending || deleteRate.isPending;
  const canSubmit = origin && destination && Number(price) >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !origin || !destination) return;
    setFormError(null);

    const payload = {
      origin_state: origin.value,
      destination_state: destination.value,
      cargo_type: cargoType,
      price: Number(price),
      status,
    };

    if (isEdit) {
      updateRate.mutate(
        { id: rate!.id, payload },
        { onSuccess: onClose, onError: (err) => setFormError(err.message) }
      );
    } else {
      createRate.mutate(payload, { onSuccess: onClose, onError: (err) => setFormError(err.message) });
    }
  };

  const handleDelete = () => {
    if (!rate) return;
    if (window.confirm('Delete this route rate? This cannot be undone.')) {
      deleteRate.mutate(rate.id, { onSuccess: onClose, onError: (err) => setFormError(err.message) });
    }
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Route Rate' : 'Add Route Rate'}
      subtitle="What you charge to move cargo between two states."
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

        <FormField label="Cargo Type">
          <select value={cargoType} onChange={(e) => setCargoType(e.target.value as CargoType)} className={inputClass}>
            {CARGO_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Price (₦)" required>
            <input
              type="number" min={1} step="any" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 15000" className={inputClass}
            />
          </FormField>
          <FormField label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as RateCardStatus)} className={inputClass}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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
              type="submit" disabled={!canSubmit || isPending}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {isPending && <i className="ri-loader-4-line animate-spin text-base" />}
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Rate'}
            </button>
          </div>
        </div>
      </form>
    </DefaultModal>
  );
};
