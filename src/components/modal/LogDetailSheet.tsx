import { useAppStore } from '../../hooks/useAppStore';
import type { PartnerLog } from '../../service/partnerService';

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-green-50 text-green-700',
  UPDATE: 'bg-blue-50 text-blue-700',
  DELETE: 'bg-red-50 text-red-600',
  VIEW: 'bg-gray-100 text-gray-600',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

export const LogDetailSheet = () => {
  const { modal: { props } } = useAppStore((s) => s);
  const log: PartnerLog | undefined = props?.log;
  const actorName: string | undefined = props?.actorName;
  const description: string | undefined = props?.description;

  if (!log) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-2 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 shadow-sm">
            <i className="ri-file-list-3-line text-2xl text-[#F14724]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 text-base leading-tight">{description ?? log.action}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Log #{log.id}</p>
            <span className={`inline-block mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${ACTION_STYLES[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
              {log.action}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <Section title="Log Details">
          <DetailRow icon="ri-user-line" label="Actor" value={actorName ?? log.actor_type} />
          <DetailRow icon="ri-price-tag-3-line" label="Actor Type" value={log.actor_type} />
          <DetailRow icon="ri-links-line" label="Resource" value={log.resource} />
          {log.object_id && <DetailRow icon="ri-hashtag" label="Object ID" value={log.object_id} />}
          <DetailRow icon="ri-signal-tower-line" label="Level" value={log.level} />
          <DetailRow icon="ri-global-line" label="IP Address" value={log.ip_address} />
          {log.branch != null && <DetailRow icon="ri-git-branch-line" label="Branch" value={`#${log.branch}`} />}
          <DetailRow icon="ri-time-line" label="Timestamp" value={formatDate(log.created_at)} />
        </Section>

        {log.payload != null && (
          <Section title="Payload">
            <pre className="text-xs text-gray-600 px-4 py-3 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </Section>
        )}
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
