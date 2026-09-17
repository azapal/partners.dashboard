import { useState, useEffect } from 'react';
import { DefaultModal } from './DefaultModal';
import { SearchableSelect } from '../inputs/SearchableSelect';
import type { Driver, ShiftStatus } from '../../service/repService';

interface DriverReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  isLoadingDrivers?: boolean;
  currentDriverId?: number | null;
  isPending: boolean;
  // The order has no price yet (a WhatsApp booking). The server won't dispatch
  // it unpriced, so the fee is collected here and sent with the assignment.
  requiresFee?: boolean;
  onAssign: (
    driverId: number,
    callbacks: { onSuccess: () => void; onError: (message: string) => void },
    dispatchAmount?: number,
  ) => void;
}

const AVAILABILITY_LABEL: Record<ShiftStatus, string> = {
  active: 'Available',
  away: 'Away',
  offline: 'Offline',
};

export function DriverReassignModal({
  isOpen, onClose, drivers, isLoadingDrivers, currentDriverId, isPending, requiresFee, onAssign,
}: DriverReassignModalProps) {
  const [selectedId, setSelectedId] = useState('');
  const [fee, setFee] = useState('');
  const [error, setError] = useState('');

  // Reset local selection each time the modal reopens, otherwise a stale
  // pick from a previous order (or previous open) would carry over.
  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentDriverId != null ? String(currentDriverId) : '');
      setFee('');
      setError('');
    }
  }, [isOpen, currentDriverId]);

  const options = drivers.map((driver) => ({
    value: String(driver.id),
    label: driver.status ? `${driver.name} — ${AVAILABILITY_LABEL[driver.status]}` : driver.name,
  }));

  const handleConfirm = () => {
    const id = Number(selectedId);
    if (!id) { setError('Pick a driver to continue.'); return; }
    let dispatchAmount: number | undefined;
    if (requiresFee) {
      dispatchAmount = Number(fee);
      if (!Number.isInteger(dispatchAmount) || dispatchAmount <= 0) {
        setError('Enter the delivery fee in whole naira.');
        return;
      }
    }
    setError('');
    onAssign(id, {
      onSuccess: () => { setError(''); onClose(); },
      onError: (message) => setError(message),
    }, dispatchAmount);
  };

  const hasChanged = !!selectedId && Number(selectedId) !== currentDriverId;

  return (
    <DefaultModal
      isOpen={isOpen}
      onClose={onClose}
      title={currentDriverId ? 'Reassign driver' : 'Assign driver'}
      subtitle={requiresFee ? 'This order has no price yet — set the delivery fee and pick a driver.' : 'Choose a driver for this order.'}
    >
      <div className="flex flex-col gap-4">
        <SearchableSelect
          label="Driver"
          options={options}
          value={selectedId}
          onChange={setSelectedId}
          loading={isLoadingDrivers}
          placeholder="Search drivers…"
        />

        {requiresFee && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-700">Delivery fee (₦)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="e.g. 1500"
              className="h-11 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand"
            />
            <span className="text-[11px] text-gray-400">
              The customer is sent this price with a payment link on WhatsApp.
            </span>
          </label>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending || !hasChanged}
            className="flex-1 h-11 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
          >
            {isPending ? 'Saving…' : requiresFee ? 'Set fee & assign' : currentDriverId ? 'Reassign driver' : 'Assign driver'}
          </button>
        </div>
      </div>
    </DefaultModal>
  );
}
