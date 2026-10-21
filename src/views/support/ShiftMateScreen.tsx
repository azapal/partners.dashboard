import { useState } from 'react';
import { RepDashboardLayout } from '../../layouts/RepDashboardLayout';
import { EscalateModal } from '../../components/modal/EscalateModal';
import { useGetShiftMates } from '../../hooks/useShiftMates';
import type { ShiftMate, ShiftStatus } from '../../service/repService';
import { Avatar, Card, EmptyState, PageIntro } from '../../components/support/SupportUI';

const STATUS_LABEL: Record<ShiftStatus, string> = {
  active: 'Active',
  away: 'Away',
  offline: 'Offline',
};

const STATUS_TEXT: Record<ShiftStatus, string> = {
  active: 'text-emerald-700',
  away: 'text-amber-700',
  offline: 'text-gray-400',
};

const ShiftMateScreen = () => {
  const { data: mates = [], isLoading } = useGetShiftMates();
  const [escalateTarget, setEscalateTarget] = useState<ShiftMate | null>(null);

  const counts = (['active', 'away', 'offline'] as const).map((s) => ({
    status: s,
    n: mates.filter((m) => m.status === s).length,
  }));

  return (
    <RepDashboardLayout>
      <div className="w-full flex flex-col gap-5">
        <PageIntro
          actions={
            !isLoading && mates.length > 0 ? (
              <div className="flex items-center gap-1.5">
                {counts.map(({ status, n }) => (
                  <span
                    key={status}
                    className={`inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-gray-100 ${STATUS_TEXT[status]}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : status === 'away' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                    {n} {STATUS_LABEL[status].toLowerCase()}
                  </span>
                ))}
              </div>
            ) : undefined
          }
        >
          See who's currently on shift in your branch and escalate to them when you need backup.
        </PageIntro>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" role="status" aria-label="Loading teammates">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
                <span className="h-11 w-11 animate-pulse rounded-xl bg-gray-100" />
                <div className="flex flex-1 flex-col gap-2">
                  <span className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                  <span className="h-2.5 w-1/3 animate-pulse rounded bg-gray-50" />
                </div>
              </div>
            ))}
          </div>
        ) : mates.length === 0 ? (
          <Card>
            <EmptyState icon="ri-group-line" title="No teammates yet">
              No teammates found for your branch.
            </EmptyState>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {mates.map((mate) => (
              <div
                key={mate.id}
                className={`flex items-center justify-between gap-3 bg-white rounded-2xl p-4 shadow-card ${mate.status === 'offline' ? 'opacity-75' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar id={mate.id} name={mate.name} status={mate.status} />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{mate.name}</p>
                    <p className="text-xs text-gray-400 truncate">{mate.role}</p>
                    <p className={`text-[11px] font-semibold mt-0.5 ${STATUS_TEXT[mate.status]}`}>{STATUS_LABEL[mate.status]}</p>
                  </div>
                </div>

                <button
                  onClick={() => setEscalateTarget(mate)}
                  disabled={mate.status === 'offline'}
                  className="shrink-0 flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold hover:border-orange-200 hover:bg-orange-50 hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-200"
                >
                  <i className="ri-alarm-warning-line text-sm" />
                  Escalate
                </button>
              </div>
            ))}
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
