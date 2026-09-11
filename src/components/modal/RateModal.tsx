import React, { useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { FormField } from '../inputs/FormField';
import type { Rate, RateScope } from '../../service/partnerService';
import { useCreateRate, useUpdateRate, useDeleteRate } from '../../hooks/useRates';
import { useGetItemCategories } from '../../hooks/useItemCategories';

interface RateModalProps {
  rate?: Rate | null;
  onClose: () => void;
}

const inputClass = 'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full';

export const RateModal: React.FC<RateModalProps> = ({ rate, onClose }) => {
  const isEdit = !!rate;
  const [region, setRegion] = useState(rate?.region ?? '');
  const [scope, setScope] = useState<RateScope>(rate?.scope ?? 'intra');
  const [price, setPrice] = useState(rate ? String(rate.price) : '');
  const [window_, setWindow] = useState(rate?.window ?? '');
  const [pickupService, setPickupService] = useState(rate?.pickup_service ?? '');
  const [categoryId, setCategoryId] = useState(rate?.category ? String(rate.category.id) : '');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: categories = [] } = useGetItemCategories();
  const createRate = useCreateRate();
  const updateRate = useUpdateRate();
  const deleteRate = useDeleteRate();

  const isPending = createRate.isPending || updateRate.isPending || deleteRate.isPending;
  const canSubmit = region.trim() !== '' && Number(price) >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setFormError(null);

    const payload = {
      region: region.trim(),
      scope,
      category_id: categoryId === '' ? null : Number(categoryId),
      price: Number(price),
      window: window_,
      pickup_service: pickupService,
    };

    if (isEdit) {
      updateRate.mutate(
        { id: rate!.id, payload },
        { onSuccess: onClose, onError: (err) => setFormError(err.message) }
      );
    } else {
      createRate.mutate(payload, {
        onSuccess: onClose,
        onError: (err) => setFormError(err.message),
      });
    }
  };

  const handleDelete = () => {
    if (!rate) return;
    if (window.confirm('Delete this rate? This cannot be undone.')) {
      deleteRate.mutate(rate.id, {
        onSuccess: onClose,
        onError: (err) => setFormError(err.message),
      });
    }
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Rate' : 'Add Rate'}
      subtitle="What you charge a business for this region and scope."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Region" required>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g., Lagos"
              className={inputClass}
            />
            {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}
          </FormField>
          <FormField label="Scope">
            <select value={scope} onChange={(e) => setScope(e.target.value as RateScope)} className={inputClass}>
              <option value="intra">Intra (within Nigeria)</option>
              <option value="international">International</option>
            </select>
          </FormField>
        </div>

        <FormField label="Category">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">No specific category (base rate)</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>

        <FormField label="Price (₦)" required>
          <input
            type="number"
            min={1}
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g., 4500"
            className={inputClass}
          />
        </FormField>

        <FormField label="Window">
          <input
            type="text"
            value={window_}
            onChange={(e) => setWindow(e.target.value)}
            placeholder="e.g., Same-day, 9am–6pm"
            className={inputClass}
          />
        </FormField>

        <FormField label="Pickup service">
          <input
            type="text"
            value={pickupService}
            onChange={(e) => setPickupService(e.target.value)}
            placeholder="e.g., Rider pickup within 2 hours"
            className={inputClass}
          />
        </FormField>

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
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Rate'}
            </button>
          </div>
        </div>
      </form>
    </DefaultModal>
  );
};
