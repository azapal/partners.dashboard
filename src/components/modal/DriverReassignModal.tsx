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
  onAssign: (driverId: number, callbacks: { onSuccess: () => void; onError: (message: string) => void }) => void;
}

const AVAILABILITY_LABEL: Record<ShiftStatus, string> = {
  active: 'Available',
  away: 'Away',
  offline: 'Offline',
};

export function DriverReassignModal({
  isOpen, onClose, drivers, isLoadingDrivers, currentDriverId, isPending, onAssign,
}: DriverReassignModalProps) {
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');

  // Reset local selection each time the modal reopens, otherwise a stale
  // pick from a previous order (or previous open) would carry over.
  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentDriverId != null ? String(currentDriverId) : '');
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
    setError('');
    onAssign(id, {
      onSuccess: () => { setError(''); onClose(); },
      onError: (message) => setError(message),
    });
  };

  const hasChanged = !!selectedId && Number(selectedId) !== currentDriverId;

  return (
    <DefaultModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign driver"
      subtitle="Choose a driver for this order."
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
            className="flex-1 h-11 bg-[#F14724] text-white rounded-xl text-sm font-semibold hover:bg-[#d63d1e] transition-colors disabled:opacity-60"
          >
            {isPending ? 'Reassigning…' : 'Reassign driver'}
          </button>
        </div>
      </div>
    </DefaultModal>
  );
}
