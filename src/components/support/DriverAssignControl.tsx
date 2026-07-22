import { useState } from 'react';
import { DriverReassignModal } from '../modal/DriverReassignModal';
import { useGetOrderDrivers } from '../../hooks/useRepTransactions';

interface DriverAssignControlProps {
  driverId?: number | null;
  onAssign: (driverId: number, callbacks: { onSuccess: () => void; onError: (message: string) => void }) => void;
  isPending: boolean;
}

// Shared by OrderConversationSheet's per-conversation order list and the
// rep-portal Orders screen — same interaction either place: a searchable
// dropdown of drivers (any role can see this roster, see useGetOrderDrivers)
// inside a modal, opened from this small trigger.
export function DriverAssignControl({ driverId, onAssign, isPending }: DriverAssignControlProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: drivers, isLoading } = useGetOrderDrivers();

  const assignedDriver = driverId
    ? drivers?.find((d) => d.id === driverId)?.name ?? `Driver #${driverId}`
    : null;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-400">
          {assignedDriver ? `Driver: ${assignedDriver}` : 'No driver assigned'}
        </span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-[11px] font-semibold text-[#F14724] hover:text-[#d63d1e] transition-colors shrink-0"
        >
          {assignedDriver ? 'Reassign' : 'Assign driver'}
        </button>
      </div>

      <DriverReassignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        drivers={drivers ?? []}
        isLoadingDrivers={isLoading}
        currentDriverId={driverId}
        isPending={isPending}
        onAssign={onAssign}
      />
    </div>
  );
}
