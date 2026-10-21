import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RepDashboardLayout } from '../../layouts/RepDashboardLayout';
import { useRepProfile, useRepLogout } from '../../hooks/useRepAuth';
import { useUpdateShiftStatus } from '../../hooks/useAgents';
import { Avatar, Card, CardHeader } from '../../components/support/SupportUI';

// There's no GET-my-own-status endpoint — only PATCH to set it, and the
// GET /branch/<code>/agents roster that shows it back is manager-only. So a
// plain rep can't confirm their own status from the server; this is a local
// cache of the last selection, kept in sync by firing the real PATCH below.
const SHIFT_STORAGE_KEY = 'rep_shift_status';

const SHIFT_OPTIONS = [
  { value: 'active' as const, label: 'Active', hint: 'Taking new conversations', dot: 'bg-emerald-500', on: 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100' },
  { value: 'away' as const, label: 'Away', hint: 'On a break — teammates see it', dot: 'bg-amber-400', on: 'border-amber-300 bg-amber-50 text-amber-800 ring-4 ring-amber-100' },
];

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
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <Card>
          {/* Navy cap with the brand's warm glow — the profile's identity strip. */}
          <div className="relative h-20 bg-brand-navy">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(251,191,36,0.35),transparent_45%),radial-gradient(circle_at_0%_100%,rgba(241,71,36,0.35),transparent_45%)]" />
          </div>
          <div className="px-5 pb-6 sm:px-6">
            <div className="relative -mt-8 w-fit rounded-[20px] bg-white p-1 shadow-card">
              <Avatar id={profile.id} name={fullName} size="lg" />
            </div>
            <div className="mt-3 min-w-0">
              <h2 className="truncate font-bold text-lg text-gray-900">{fullName}</h2>
              <p className="truncate text-sm text-gray-500">{profile.invite_role?.name}</p>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow icon="ri-mail-line" label="Email" value={profile.email} />
              <DetailRow icon="ri-git-branch-line" label="Branch" value={profile.branch?.branch_code} />
              <DetailRow icon="ri-shield-user-line" label="Role" value={profile.invite_role?.name} />
              {profile.inviting_partner?.partner_name && (
                <DetailRow icon="ri-building-2-line" label="Company" value={profile.inviting_partner.partner_name} />
              )}
            </dl>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader icon="ri-pulse-line" title="Shift status" />
            <div className="flex flex-col gap-2 p-4 sm:p-5">
              {SHIFT_OPTIONS.map((opt) => {
                const selected = shiftStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleShiftChange(opt.value)}
                    aria-pressed={selected}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      selected ? opt.on : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${opt.dot}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{opt.label}</span>
                      <span className={`block text-xs ${selected ? 'opacity-80' : 'text-gray-400'}`}>{opt.hint}</span>
                    </span>
                    {selected && <i className="ri-check-line text-lg" />}
                  </button>
                );
              })}
            </div>
          </Card>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <i className="ri-logout-box-r-line text-base" />
            Log out
          </button>
        </div>
      </div>
    </RepDashboardLayout>
  );
};

export default RepProfileScreen;

function DetailRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-gray-50 px-3.5 py-3">
      <i className={`${icon} text-base text-gray-400`} />
      <div className="min-w-0">
        <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
        <dd className="truncate text-sm font-medium text-gray-800">{value || '—'}</dd>
      </div>
    </div>
  );
}
