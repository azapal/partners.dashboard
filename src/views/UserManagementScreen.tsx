import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AddNewUserModal } from '../components/modal/AddNewUserModal';
import { EditUserModal } from '../components/modal/EditUserModal';
import { BulkInviteModal } from '../components/modal/BulkInviteModal';
import { sheetActions } from '../store/client/sheets';
import { useGetInvites, useCreateInvite, useUpdateInvite, useDeleteInvite } from '../hooks/useInvites';
import type { PartnerInvite } from '../service/partnerService';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  branch: string;
  invite_role: string;
  status: 'active' | 'pending' | 'suspended' | 'terminated';
  phone?: string;
  joined_at?: string;
  reports_to?: string;
}

function mapInvite(inv: PartnerInvite): User {
  return {
    id: String(inv.id),
    email: inv.email,
    first_name: inv.first_name,
    last_name: inv.last_name,
    branch: inv.branch?.branch_code ?? '',
    invite_role: inv.invite_role?.name ?? '',
    status: inv.status ? 'active' : 'pending',
    joined_at: inv.created_at?.slice(0, 10),
  };
}

const STATUS_STYLES: Record<User['status'], string> = {
  active:     'bg-green-50 text-green-700',
  pending:    'bg-yellow-50 text-yellow-700',
  suspended:  'bg-orange-50 text-orange-700',
  terminated: 'bg-red-50 text-red-600',
};

function initials(u: User) {
  return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
}

function avatarColor(id: string) {
  const colors = ['bg-orange-400', 'bg-blue-400', 'bg-teal-400', 'bg-purple-400', 'bg-pink-400'];
  return colors[Number(id) % colors.length];
}

const UserManagementScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data: invites = [], isLoading } = useGetInvites();
  const { mutate: createInvite, isPending: isInviting } = useCreateInvite();
  const { mutate: updateInvite } = useUpdateInvite();
  const { mutate: deleteInvite } = useDeleteInvite();

  const users: User[] = invites?.map(mapInvite);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.branch.toLowerCase().includes(q) ||
      u.invite_role.toLowerCase().includes(q)
    );
  });

  const closeSheet = () =>
    sheetActions.toggleBasicResizableSheet({ name: null, show: false, props: null });

  const openDetail = (user: User) => {
    sheetActions.toggleBasicResizableSheet({
      name: 'userDetailSheet',
      show: true,
      props: {
        user,
        directReports: users.filter(
          (u) => u.reports_to === `${user.first_name} ${user.last_name}`
        ),
        onEdit: (u: User) => { closeSheet(); setEditUser(u); },
        onSuspend: (id: string) =>
          updateInvite({ id, payload: { status: users.find((u) => u.id === id)?.status !== 'suspended' } }),
        onTerminate: (id: string) =>
          updateInvite({ id, payload: { status: false } }),
        onDelete: (id: string) => {
          if (window.confirm('Delete this user? This cannot be undone.')) {
            deleteInvite(id, { onSuccess: closeSheet });
          }
        },
      },
    });
  };

  const handleInvite = (data: { email: string; first_name: string; last_name: string; branch?: string; invite_role: string }) => {
    setInviteError(null);
    createInvite(data, {
      onSuccess: () => setIsInviteOpen(false),
      onError: (err) => setInviteError(err instanceof Error ? err.message : 'Failed to send invite'),
    });
  };

  const handleUpdate = (id: string, data: Partial<User>) => {
    updateInvite(
      {
        id,
        payload: {
          first_name: data.first_name,
          last_name: data.last_name,
          branch: data.branch,
          invite_role: data.invite_role,  // role FK id
        },
      },
      { onSuccess: () => setEditUser(null) }
    );
  };

  return (
    <DashboardLayout>
      <div className="w-full flex flex-col gap-5 overflow-y-auto">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsBulkOpen(true)}
              className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <i className="ri-file-upload-line text-base" />
              Bulk Invite
            </button>
            <button
              onClick={() => { setInviteError(null); setIsInviteOpen(true); }}
              className="flex items-center gap-2 bg-[#F14724] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#d63d1e] transition-colors"
            >
              <i className="ri-user-add-line text-base" />
              Invite User
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { label: 'Total Users', value: users.length, icon: 'ri-group-line', color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Active', value: users.filter((u) => u.status === 'active').length, icon: 'ri-checkbox-circle-line', color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Pending', value: users.filter((u) => u.status === 'pending').length, icon: 'ri-time-line', color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Suspended', value: users.filter((u) => u.status === 'suspended').length, icon: 'ri-forbid-line', color: 'text-orange-500', bg: 'bg-orange-50' },
            ] as const
          ).map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <i className={`${icon} text-lg ${color}`} />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-orange-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-14 text-gray-400 text-sm">
                      <i className="ri-loader-4-line animate-spin text-xl" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-14 text-gray-400 text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => openDetail(user)}
                      className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${avatarColor(user.id)} flex items-center justify-center shrink-0`}>
                            <span className="text-white text-xs font-bold">{initials(user)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 text-sm">{user.branch}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                          {user.invite_role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-50">
            {isLoading ? (
              <p className="text-center py-14 text-gray-400 text-sm">
                <i className="ri-loader-4-line animate-spin text-xl" />
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-14 text-gray-400 text-sm">No users found</p>
            ) : (
              filtered.map((user) => (
                <div
                  key={user.id}
                  onClick={() => openDetail(user)}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50/40 cursor-pointer transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl ${avatarColor(user.id)} flex items-center justify-center shrink-0`}>
                    <span className="text-white text-sm font-bold">{initials(user)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user.branch} · {user.invite_role}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLES[user.status]}`}>
                    {user.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">
                Showing {filtered.length} of {users.length} users
              </p>
            </div>
          )}
        </div>
      </div>

      <AddNewUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInvite}
        error={inviteError}
        isSubmitting={isInviting}
      />
      <BulkInviteModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} />
      {editUser && (
        <EditUserModal
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          onUpdate={handleUpdate}
          user={editUser}
        />
      )}
    </DashboardLayout>
  );
};

export default UserManagementScreen;

