import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RepDashboardLayout } from '../../layouts/RepDashboardLayout';
import { useRepProfile, useRepLogout } from '../../hooks/useRepAuth';
import { useUpdateShiftStatus } from '../../hooks/useAgents';

// There's no GET-my-own-status endpoint — only PATCH to set it, and the
// GET /branch/<code>/agents roster that shows it back is manager-only. So a
// plain rep can't confirm their own status from the server; this is a local
// cache of the last selection, kept in sync by firing the real PATCH below.
const SHIFT_STORAGE_KEY = 'rep_shift_status';

function avatarColor(id: number) {
  const colors = ['bg-orange-400', 'bg-blue-400', 'bg-teal-400', 'bg-purple-400', 'bg-pink-400'];
  return colors[id % colors.length];
}

const RepProfileScreen = () => {
  const profile = useRepProfile();
  const logout = useRepLogout();
  const navigate = useNavigate();
  const { mutate: updateShiftStatus } = useUpdateShiftStatus();

  const [shiftStatus, setShiftStatus] = useState<'active' | 'away'>(
    (localStorage.getItem(SHIFT_STORAGE_KEY) as 'active' | 'away') || 'active'
  );

  if (!profile) return null;

  const fullName = `${profile.first_name} ${profile.last_name}`;
  const initials = `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();

  const handleShiftChange = (status: 'active' | 'away') => {
    setShiftStatus(status);
    localStorage.setItem(SHIFT_STORAGE_KEY, status);
    updateShiftStatus(status);
  };

  const handleLogout = () => {
    logout();
    navigate('/support/login');
  };

  return (
    <RepDashboardLayout>
      <div className="w-full flex flex-col gap-5 max-w-xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl ${avatarColor(profile.id)} flex items-center justify-center shrink-0 shadow-sm`}>
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">{fullName}</h2>
              <p className="text-sm text-gray-500">{profile.invite_role?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow label="Email" value={profile.email} />
            <DetailRow label="Branch" value={profile.branch?.branch_code} />
            <DetailRow label="Role" value={profile.invite_role?.name} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-800 mb-3">Shift status</p>
          <div className="flex gap-2">
            {(['active', 'away'] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleShiftChange(status)}
                className={`flex-1 capitalize text-sm font-semibold px-4 py-2.5 rounded-xl border transition-colors
                  ${shiftStatus === status
                    ? 'bg-[#F14724] text-white border-[#F14724]'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <i className="ri-logout-box-r-line text-base" />
          Log out
        </button>
      </div>
    </RepDashboardLayout>
  );
};

export default RepProfileScreen;

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
    </div>
  );
}
