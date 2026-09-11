import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import type { User } from '../../views/UserManagementScreen';

const STATUS_STYLES: Record<User['status'], string> = {
  active:     'bg-green-50 text-green-700',
  pending:    'bg-yellow-50 text-yellow-700',
  suspended:  'bg-orange-50 text-orange-700',
  terminated: 'bg-red-50 text-red-600',
};

function avatarColor(id: string) {
  const colors = ['bg-orange-400', 'bg-blue-400', 'bg-teal-400', 'bg-purple-400', 'bg-pink-400'];
  return colors[Number(id) % colors.length];
}

export const UserDetailSheet = () => {
  const { modal: { props } } = useAppStore((s) => s);
  const user: User = props?.user;
  const directReports: User[] = props?.directReports ?? [];
  const onEdit: (u: User) => void = props?.onEdit;
  const onSuspend: (id: string) => void = props?.onSuspend;
  const onTerminate: (id: string) => void = props?.onTerminate;
  const onDelete: (id: string) => void = props?.onDelete;

  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`;
  const ini = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  const isSuspended = user.status === 'suspended';
  const isTerminated = user.status === 'terminated';

  const runAction = (fn?: () => void) => {
    setActionsOpen(false);
    fn?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-2 pb-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Team Member
            </p>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${avatarColor(user.id)} flex items-center justify-center shrink-0 shadow-sm`}>
                <span className="text-white text-lg font-bold">{ini}</span>
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 text-base leading-tight">{fullName}</h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
                <span className={`inline-block mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[user.status]}`}>
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          {/* Actions dropdown */}
          <div className="relative shrink-0" ref={actionsRef}>
            <button
              type="button"
              onClick={() => setActionsOpen((open) => !open)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Actions
              <i className={`ri-arrow-${actionsOpen ? 'up' : 'down'}-s-line text-base text-gray-400`} />
            </button>

            {actionsOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10">
                <a
                  href={`mailto:${user.email}`}
                  onClick={() => setActionsOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <i className="ri-mail-send-line text-base text-gray-400" />
                  Send Email
                </a>
                <button
                  type="button"
                  onClick={() => runAction(() => onEdit?.(user))}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <i className="ri-edit-line text-base text-gray-400" />
                  Edit User
                </button>
                <button
                  type="button"
                  disabled={isTerminated}
                  onClick={() => runAction(() => onSuspend?.(user.id))}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  <i className={`${isSuspended ? 'ri-checkbox-circle-line' : 'ri-forbid-line'} text-base text-gray-400`} />
                  {isSuspended ? 'Unsuspend' : 'Suspend'}
                </button>
                <button
                  type="button"
                  disabled={isTerminated}
                  onClick={() => runAction(() => onTerminate?.(user.id))}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  <i className="ri-user-unfollow-line text-base text-gray-400" />
                  Terminate
                </button>
                <button
                  type="button"
                  onClick={() => runAction(() => onDelete?.(user.id))}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left border-t border-gray-50"
                >
                  <i className="ri-delete-bin-line text-base" />
                  Delete User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <Section title="User Details">
          <DetailRow icon="ri-briefcase-line" label="Role" value={user.invite_role} />
          <DetailRow icon="ri-map-pin-line" label="Branch" value={user.branch} />
          {user.phone && <DetailRow icon="ri-phone-line" label="Phone" value={user.phone} />}
          {user.joined_at && (
            <DetailRow
              icon="ri-calendar-line"
              label="Joined"
              value={new Date(user.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            />
          )}
          {user.reports_to && <DetailRow icon="ri-user-star-line" label="Reports To" value={user.reports_to} />}
        </Section>

        {/* Direct reports */}
        <Section title={`Direct Reports (${directReports.length})`}>
          {directReports.length === 0 ? (
            <p className="text-xs text-gray-400 py-1">No one reports to this user.</p>
          ) : (
            directReports.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2">
                <div className={`w-8 h-8 rounded-xl ${avatarColor(r.id)} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-[11px] font-bold">
                    {r.first_name[0]}{r.last_name[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.first_name} {r.last_name}</p>
                  <p className="text-xs text-gray-400 truncate">{r.invite_role} · {r.branch}</p>
                </div>
              </div>
            ))
          )}
        </Section>
      </div>
    </div>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
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
        <i className={`${icon} text-sm text-brand`} />
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 truncate text-right">{value}</p>
      </div>
    </div>
  );
}
