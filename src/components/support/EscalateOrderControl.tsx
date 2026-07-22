import { useState } from 'react';
import { EscalateOrderModal } from '../modal/EscalateOrderModal';

interface EscalateOrderControlProps {
  orderId: string | number;
  orderLabel?: string;
}

export function EscalateOrderControl({ orderId, orderLabel }: EscalateOrderControlProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition-colors shrink-0"
      >
        <i className="ri-flag-2-line text-xs" />
        Escalate
      </button>

      <EscalateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={orderId}
        orderLabel={orderLabel}
      />
    </>
  );
}
