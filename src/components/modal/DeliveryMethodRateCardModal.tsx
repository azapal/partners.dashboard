import React, { useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { FormField } from '../inputs/FormField';
import { DELIVERY_METHODS } from '../../service/partnerService';
import type { DeliveryMethod, DeliveryMethodRateCard, RateCardStatus } from '../../service/partnerService';
import { useCreateDeliveryMethodRate, useUpdateDeliveryMethodRate, useDeleteDeliveryMethodRate } from '../../hooks/useRateCards';

interface DeliveryMethodRateCardModalProps {
  rate?: DeliveryMethodRateCard | null;
  onClose: () => void;
}

const inputClass = 'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full';

export const DeliveryMethodRateCardModal: React.FC<DeliveryMethodRateCardModalProps> = ({ rate, onClose }) => {
  const isEdit = !!rate;
  const [method, setMethod] = useState<DeliveryMethod>(rate?.method ?? DELIVERY_METHODS[0]);
  const [price, setPrice] = useState(rate ? String(rate.price) : '');
  const [status, setStatus] = useState<RateCardStatus>(rate?.status ?? 'Active');
  const [formError, setFormError] = useState<string | null>(null);

  const createRate = useCreateDeliveryMethodRate();
  const updateRate = useUpdateDeliveryMethodRate();
  const deleteRate = useDeleteDeliveryMethodRate();

  const isPending = createRate.isPending || updateRate.isPending || deleteRate.isPending;
  const canSubmit = Number(price) >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setFormError(null);

    const payload = { method, price: Number(price), status };

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
    if (window.confirm('Delete this delivery method rate? This cannot be undone.')) {
      deleteRate.mutate(rate.id, { onSuccess: onClose, onError: (err) => setFormError(err.message) });
    }
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Delivery Method Rate' : 'Add Delivery Method Rate'}
      subtitle="A flat fee for deliveries made this way, regardless of route or cargo."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Delivery Method">
          <select value={method} onChange={(e) => setMethod(e.target.value as DeliveryMethod)} className={inputClass}>
            {DELIVERY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Price (₦)" required>
            <input
              type="number" min={1} step="any" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 3500" className={inputClass}
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
