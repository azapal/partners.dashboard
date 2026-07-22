import { useState, useEffect } from 'react';
import { DefaultModal } from './DefaultModal';
import { useGetShiftMates, useEscalate } from '../../hooks/useShiftMates';

interface EscalateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | number;
  orderLabel?: string;
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-300',
};

export function EscalateOrderModal({ isOpen, onClose, orderId, orderLabel }: EscalateOrderModalProps) {
  const { data: teamMembers, isLoading } = useGetShiftMates();
  const { mutate: escalate, isPending } = useEscalate();
  const [targetId, setTargetId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTargetId(null);
      setReason('');
      setError('');
      setSubmitted(false);
    }
  }, [isOpen]);

  const selectedMember = teamMembers?.find((m) => m.id === targetId) ?? null;

  const handleConfirm = () => {
    if (!targetId) { setError('Select a team member to escalate to.'); return; }
    if (!reason.trim()) { setError('Add a reason for escalation.'); return; }
    setError('');
    escalate(
      { targetRepId: targetId, orderId: String(orderId), note: reason.trim() },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => setError('Failed to escalate. Try again.'),
      }
    );
  };

  return (
    <DefaultModal
      isOpen={isOpen}
      onClose={onClose}
      title="Escalate order"
      subtitle={orderLabel ?? `Order #${orderId}`}
    >
      {submitted ? (
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <i className="ri-check-line text-2xl text-green-600" />
          </div>
          <p className="text-sm text-gray-700">
            Escalated to <span className="font-semibold">{selectedMember?.name}</span>.
          </p>
          <button
            onClick={onClose}
            className="mt-2 w-full h-11 bg-[#F14724] text-white rounded-xl text-sm font-semibold hover:bg-[#d63d1e] transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Escalate to</label>
            {isLoading ? (
              <p className="text-xs text-gray-400">Loading team members…</p>
            ) : (teamMembers?.length ?? 0) === 0 ? (
              <p className="text-xs text-gray-400">No team members found.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 -mx-1 px-1">
                {teamMembers!.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setTargetId(member.id)}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                      targetId === member.id ? 'border-[#F14724] bg-orange-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                      <span className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[member.status] ?? 'bg-gray-300'}`} />
                        <span className="text-[11px] text-gray-400">{member.role}</span>
                      </span>
                    </div>
                    {targetId === member.id && <i className="ri-check-line text-[#F14724] text-lg shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="escalation-reason" className="text-sm font-medium text-slate-700">
              Reason for escalation
            </label>
            <textarea
              id="escalation-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="What does this teammate need to know about this order?"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-100 resize-none"
            />
          </div>

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
              disabled={isPending || !targetId || !reason.trim()}
              className="flex-1 h-11 bg-[#F14724] text-white rounded-xl text-sm font-semibold hover:bg-[#d63d1e] transition-colors disabled:opacity-60"
            >
              {isPending ? 'Escalating…' : 'Escalate'}
            </button>
          </div>
        </div>
      )}
    </DefaultModal>
  );
}
