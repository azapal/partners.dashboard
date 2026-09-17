import { useState } from 'react';
import { DriverReassignModal } from '../modal/DriverReassignModal';
import { useGetOrderDrivers } from '../../hooks/useRepTransactions';

interface DriverAssignControlProps {
  driverId?: number | null;
  onAssign: (
    driverId: number,
    callbacks: { onSuccess: () => void; onError: (message: string) => void },
    dispatchAmount?: number,
  ) => void;
  isPending: boolean;
  // The order has no price yet (a WhatsApp booking): the server refuses to
  // dispatch it unpriced, so the modal collects the delivery fee as well.
  requiresFee?: boolean;
}

// Shared by OrderConversationSheet's per-conversation order list and the
// rep-portal Orders screen — same interaction either place: a searchable
// dropdown of drivers (any role can see this roster, see useGetOrderDrivers)
// inside a modal, opened from this small trigger.
export function DriverAssignControl({ driverId, onAssign, isPending, requiresFee }: DriverAssignControlProps) {
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
          className="text-[11px] font-semibold text-brand hover:text-brand-hover transition-colors shrink-0"
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
        requiresFee={requiresFee}
        onAssign={onAssign}
      />
    </div>
  );
}
