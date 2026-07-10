import { useAppStore } from '../../hooks/useAppStore';
import type { PartnerSession } from '../../service/partnerService';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

export const SessionDetailSheet = () => {
  const { modal: { props } } = useAppStore((s) => s);
  const session: PartnerSession | undefined = props?.session;
  const actorName: string | undefined = props?.actorName;
  const device: string | undefined = props?.device;

  if (!session) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-2 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 shadow-sm">
            <i className="ri-shield-keyhole-line text-2xl text-[#F14724]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 text-base leading-tight">{actorName ?? session.actor_type}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Session #{session.id}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <Section title="Session Details">
          <DetailRow icon="ri-price-tag-3-line" label="Actor Type" value={session.actor_type} />
          <DetailRow icon="ri-computer-line" label="Device" value={device ?? '—'} />
          <DetailRow icon="ri-global-line" label="IP Address" value={session.ip_address} />
          {session.branch != null && <DetailRow icon="ri-git-branch-line" label="Branch" value={`#${session.branch}`} />}
          {session.employee != null && <DetailRow icon="ri-user-line" label="Employee ID" value={`#${session.employee}`} />}
          <DetailRow icon="ri-time-line" label="Signed In" value={formatDate(session.created_at)} />
        </Section>

        <Section title="User Agent">
          <p className="text-xs text-gray-500 px-4 py-3 break-words">{session.user_agent || '—'}</p>
        </Section>
      </div>
    </div>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        {title}
      </p>
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
        <i className={`${icon} text-sm text-[#F14724]`} />
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400 shrink-0">{label}</p>
        <p className="text-sm font-medium text-gray-800 truncate text-right">{value}</p>
      </div>
    </div>
  );
}
