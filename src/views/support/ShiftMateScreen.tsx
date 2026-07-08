import { useState } from 'react';
import { RepDashboardLayout } from '../../layouts/RepDashboardLayout';
import { EscalateModal } from '../../components/modal/EscalateModal';
import { useGetShiftMates } from '../../hooks/useShiftMates';
import type { ShiftMate, ShiftStatus } from '../../service/repService';

const STATUS_DOT: Record<ShiftStatus, string> = {
  active: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-300',
};

const STATUS_LABEL: Record<ShiftStatus, string> = {
  active: 'Active',
  away: 'Away',
  offline: 'Offline',
};

function avatarColor(id: number) {
  const colors = ['bg-orange-400', 'bg-blue-400', 'bg-teal-400', 'bg-purple-400', 'bg-pink-400'];
  return colors[id % colors.length];
}

const ShiftMateScreen = () => {
  const { data: mates = [], isLoading } = useGetShiftMates();
  const [escalateTarget, setEscalateTarget] = useState<ShiftMate | null>(null);

  return (
    <RepDashboardLayout>
      <div className="w-full flex flex-col gap-5">
        <p className="text-sm text-gray-500">
          See who's currently on shift in your branch and escalate to them when you need backup.
        </p>

        {isLoading ? (
          <p className="text-center py-14 text-gray-400 text-sm">
            <i className="ri-loader-4-line animate-spin text-xl" />
          </p>
        ) : mates.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No teammates found for your branch.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mates.map((mate) => {
              const initials = mate.name
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? '')
                .join('');

              return (
                <div
                  key={mate.id}
                  className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-xl ${avatarColor(mate.id)} flex items-center justify-center`}>
                        <span className="text-white text-sm font-bold">{initials}</span>
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${STATUS_DOT[mate.status]}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{mate.name}</p>
                      <p className="text-xs text-gray-400 truncate">{mate.role}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{STATUS_LABEL[mate.status]}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setEscalateTarget(mate)}
                    disabled={mate.status === 'offline'}
                    className="shrink-0 flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="ri-alarm-warning-line text-sm" />
                    Escalate
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EscalateModal
        isOpen={!!escalateTarget}
        onClose={() => setEscalateTarget(null)}
        shiftMate={escalateTarget}
      />
    </RepDashboardLayout>
  );
};

export default ShiftMateScreen;
