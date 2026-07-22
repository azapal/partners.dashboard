import React, { useState } from 'react';
import Select from 'react-select';
import States from '../../utilities/states.json';
import { CARGO_TYPES, FREQUENCIES } from '../../lib/data/logisticsNetwork';
import type { CargoType, Frequency, LogisticsRoute } from '../../lib/data/logisticsNetwork';

interface AddRouteModalProps {
  onClose: () => void;
  onAdd: (route: LogisticsRoute) => void;
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
    backgroundColor: state.isSelected ? '#F14724' : state.isFocused ? '#f9fafb' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    fontSize: '0.875rem',
  }),
  placeholder: (base: any) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
  singleValue: (base: any) => ({ ...base, fontSize: '0.875rem' }),
};

const stateOptions: Option[] = States.map((s) => ({ value: s.name, label: s.name }));

export const AddRouteModal: React.FC<AddRouteModalProps> = ({ onClose, onAdd }) => {
  const [businessName, setBusinessName] = useState('');
  const [origin, setOrigin] = useState<Option | null>(null);
  const [originAddress, setOriginAddress] = useState('');
  const [destination, setDestination] = useState<Option | null>(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [cargoType, setCargoType] = useState<CargoType>('General Goods');
  const [frequency, setFrequency] = useState<Frequency>('One-time');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    businessName.trim() && origin && originAddress.trim() && destination && destinationAddress.trim() && preferredDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !origin || !destination) return;
    setSubmitting(true);

    const route: LogisticsRoute = {
      id: `RT-${Math.floor(1000 + Math.random() * 9000)}`,
      businessName: businessName.trim(),
      originState: origin.value,
      originAddress: originAddress.trim(),
      destinationState: destination.value,
      destinationAddress: destinationAddress.trim(),
      cargoType,
      frequency,
      preferredDate,
      status: 'Active',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    // Simulated network delay — dummy data only, no backend yet.
    setTimeout(() => {
      onAdd(route);
      setSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-start justify-between gap-3 px-6 sm:px-8 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Delivery Route</h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload a departure and arrival route so we can pair it with other partners heading the same way.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors shrink-0"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <FormField label="Customer / Business Name" required>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Greenline Foods"
              required
              className="h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full"
            />
          </FormField>

          {/* Departure */}
          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <i className="ri-map-pin-2-line text-blue-500 text-sm" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Departure</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="State" required>
                <Select
                  options={stateOptions}
                  value={origin}
                  onChange={setOrigin}
                  placeholder="Select origin state…"
                  styles={selectStyles}
                  isClearable
                />
              </FormField>
              <FormField label="Pickup Address" required>
                <input
                  type="text"
                  value={originAddress}
                  onChange={(e) => setOriginAddress(e.target.value)}
                  placeholder="e.g., Wuse Zone 4 Depot"
                  required
                  className="h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full"
                />
              </FormField>
            </div>
          </div>

          {/* Arrival */}
          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <i className="ri-flag-2-line text-green-600 text-sm" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Arrival</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="State" required>
                <Select
                  options={stateOptions}
                  value={destination}
                  onChange={setDestination}
                  placeholder="Select destination state…"
                  styles={selectStyles}
                  isClearable
                />
              </FormField>
              <FormField label="Drop-off Address" required>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder="e.g., Ikeja Distribution Yard"
                  required
                  className="h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full"
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Cargo Type">
              <select
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value as CargoType)}
                className="h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full"
              >
                {CARGO_TYPES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Frequency">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Preferred Date" required>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
                className="h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full"
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#F14724] hover:bg-[#d63d1e] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <i className="ri-loader-4-line animate-spin text-base" />}
              {submitting ? 'Saving…' : 'Save Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
