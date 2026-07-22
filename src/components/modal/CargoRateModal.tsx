import React, { useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { FormField } from '../inputs/FormField';
import { CARGO_TYPES } from '../../lib/data/logisticsNetwork';
import type { CargoType } from '../../lib/data/logisticsNetwork';
import type { CargoTypeRate, RateStatus } from '../../lib/data/rates';

interface CargoRateModalProps {
  rate?: CargoTypeRate | null;
  onClose: () => void;
  onSave: (rate: CargoTypeRate) => void;
  onDelete?: (id: string) => void;
}

const inputClass = 'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full';

export const CargoRateModal: React.FC<CargoRateModalProps> = ({ rate, onClose, onSave, onDelete }) => {
  const isEdit = !!rate;
  const [cargoType, setCargoType] = useState<CargoType>(rate?.cargoType ?? 'General Goods');
  const [basePrice, setBasePrice] = useState(rate ? String(rate.basePrice) : '');
  const [pricePerKg, setPricePerKg] = useState(rate ? String(rate.pricePerKg) : '');
  const [status, setStatus] = useState<RateStatus>(rate?.status ?? 'Active');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = Number(basePrice) > 0 && Number(pricePerKg) >= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const saved: CargoTypeRate = {
      id: rate?.id ?? `CR-${Math.floor(1000 + Math.random() * 9000)}`,
      cargoType,
      basePrice: Number(basePrice),
      pricePerKg: Number(pricePerKg),
      status,
      createdAt: rate?.createdAt ?? new Date().toISOString().slice(0, 10),
    };

    // Simulated network delay — dummy data only, no backend yet.
    setTimeout(() => {
      onSave(saved);
      setSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Cargo Rate' : 'Add Cargo Rate'}
      subtitle="A flat pricing rule for this cargo type, wherever you deliver."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Cargo Type">
          <select value={cargoType} onChange={(e) => setCargoType(e.target.value as CargoType)} className={inputClass}>
            {CARGO_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Base Price (₦)" required>
            <input
              type="number" min={0} step={100} value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
              placeholder="e.g., 5000" required className={inputClass}
            />
          </FormField>
          <FormField label="Price per KG (₦)" required>
            <input
              type="number" min={0} step={50} value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)}
              placeholder="e.g., 400" required className={inputClass}
            />
          </FormField>
        </div>

        <FormField label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as RateStatus)} className={inputClass}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </FormField>

        <div className="flex justify-between gap-3 pt-2 border-t border-gray-100">
          {isEdit && onDelete ? (
            <button
              type="button"
              onClick={() => { onDelete(rate!.id); onClose(); }}
              className="px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
            >
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit" disabled={!canSubmit || submitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#F14724] hover:bg-[#d63d1e] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <i className="ri-loader-4-line animate-spin text-base" />}
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Rate'}
            </button>
          </div>
        </div>
      </form>
    </DefaultModal>
  );
};
