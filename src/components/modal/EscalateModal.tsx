import { useState } from 'react';
import { DefaultModal } from './DefaultModal';
import { useEscalate } from '../../hooks/useShiftMates';
import type { ShiftMate } from '../../service/repService';

interface EscalateModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftMate: ShiftMate | null;
}

export const EscalateModal = ({ isOpen, onClose, shiftMate }: EscalateModalProps) => {
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { mutate: escalate, isPending } = useEscalate();

  if (!shiftMate) return null;

  const handleClose = () => {
    setNote('');
    setSubmitted(false);
    onClose();
  };

  const handleConfirm = () => {
    escalate(
      { targetRepId: shiftMate.id, note },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  return (
    <DefaultModal isOpen={isOpen} onClose={handleClose} title="Escalate to teammate">
      {submitted ? (
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <i className="ri-check-line text-2xl text-green-600" />
          </div>
          <p className="text-sm text-gray-700">
            Escalated to <span className="font-semibold">{shiftMate.name}</span>.
          </p>
          <button
            onClick={handleClose}
            className="mt-2 w-full h-11 bg-[#F14724] text-white rounded-xl text-sm font-semibold hover:bg-[#d63d1e] transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Escalating this to <span className="font-semibold text-gray-900">{shiftMate.name}</span> ({shiftMate.role}).
          </p>

          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium text-slate-700">
              Note (optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What does this teammate need to know?"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-100 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 h-11 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 h-11 bg-[#F14724] text-white rounded-xl text-sm font-semibold hover:bg-[#d63d1e] transition-colors disabled:opacity-60"
            >
              {isPending ? 'Escalating…' : 'Escalate'}
            </button>
          </div>
        </div>
      )}
    </DefaultModal>
  );
};
