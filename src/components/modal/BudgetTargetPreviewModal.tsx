import React, { useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { FormField } from '../inputs/FormField';
import type { PairingRoute, BudgetTargetPreview } from '../../service/partnerService';
import { useBudgetTargetPreview } from '../../hooks/usePairingRoutes';

interface BudgetTargetPreviewModalProps {
  route: PairingRoute;
  onClose: () => void;
}

const inputClass = 'h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white w-full';

function formatAmount(n: number): string {
  return `₦${n.toLocaleString()}`;
}

export const BudgetTargetPreviewModal: React.FC<BudgetTargetPreviewModalProps> = ({ route, onClose }) => {
  const [weightKg, setWeightKg] = useState('');
  const [includeLastMile, setIncludeLastMile] = useState(false);
  const [lastMileActualCost, setLastMileActualCost] = useState('');
  const [itemCount, setItemCount] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BudgetTargetPreview | null>(null);

  const preview = useBudgetTargetPreview();

  const canSubmit = Number(weightKg) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setResult(null);

    preview.mutate(
      {
        id: route.id,
        payload: {
          weight_kg: Number(weightKg),
          include_last_mile: includeLastMile,
          last_mile_actual_cost: includeLastMile ? Number(lastMileActualCost || 0) : 0,
          item_count: includeLastMile ? Number(itemCount || 1) : 1,
        },
      },
      {
        onSuccess: (data) => setResult(data),
        onError: (err) => setError(err.message),
      }
    );
  };

  return (
    <DefaultModal
      isOpen
      onClose={onClose}
      title="Preview Pricing"
      subtitle={`What one business would pay to join ${route.origin_state} → ${route.destination_state}.`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Assumed weight (kg)" required>
          <input
            type="number" min={0.1} step="any" value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g., 25" className={inputClass}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeLastMile}
            onChange={(e) => setIncludeLastMile(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          Include last-mile delivery
        </label>

        {includeLastMile && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Last-mile cost per item (₦)">
              <input
                type="number" min={0} step="any" value={lastMileActualCost} onChange={(e) => setLastMileActualCost(e.target.value)}
                placeholder="e.g., 1800" className={inputClass}
              />
            </FormField>
            <FormField label="Item count">
              <input
                type="number" min={1} step={1} value={itemCount} onChange={(e) => setItemCount(e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            Close
          </button>
          <button
            type="submit"
            disabled={!canSubmit || preview.isPending}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {preview.isPending && <i className="ri-loader-4-line animate-spin text-base" />}
            {preview.isPending ? 'Calculating…' : 'Preview'}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-4 bg-orange-50/60 rounded-xl border border-orange-100 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cargo fee</span>
            <span className="font-semibold text-gray-900">{formatAmount(result.cargo_fee)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last-mile fee</span>
            <span className="font-semibold text-gray-900">{formatAmount(result.last_mile_fee)}</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-orange-100">
            <span className="text-gray-800 font-medium">Total per business</span>
            <span className="font-bold text-brand">{formatAmount(result.total)}</span>
          </div>
          <p className="text-xs text-gray-500 pt-1">
            You'd need roughly {result.businesses_for_half_min_budget}–{result.businesses_for_half_max_budget} businesses
            like this one to reach half your budget range.
          </p>
        </div>
      )}
    </DefaultModal>
  );
};
