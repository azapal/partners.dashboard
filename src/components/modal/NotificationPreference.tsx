import { useEffect, useState } from 'react';
import { useNotificationPreferences, useSaveNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { useGetBranches } from '../../hooks/useBranchPartner';
import type { NotificationChannel, NotificationPreferenceRow } from '../../service/partnerService';

type Draft = Omit<NotificationPreferenceRow, 'label'>;

const CHANNEL_ICON: Record<NotificationChannel, string> = {
  whatsapp: 'ri-whatsapp-line',
  sms: 'ri-message-2-line',
  email: 'ri-mail-line',
};

/**
 * Notification preferences.
 *
 * Replaces a three-step wizard that collected a branch, some names and a channel,
 * logged them to the console and showed a success message — nothing was ever
 * saved, and the branches, managers and team members were all hardcoded fixtures.
 *
 * It also had no notion of *what* the notification was about, which is what makes
 * a preference a preference: "email Musa" isn't a rule until it says when. So the
 * shape here is one row per event, each with its own channels and recipients.
 *
 * The sub-branch step is gone. There are no sub-branch endpoints on the backend,
 * so that step could only ever have been fixtures.
 */
export const NotificationPreference = () => {
  const [branchId, setBranchId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [loadedFor, setLoadedFor] = useState<number | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: branches = [] } = useGetBranches();
  const { data, isLoading } = useNotificationPreferences(branchId);
  const save = useSaveNotificationPreferences(branchId);

  // Re-seed whenever the scope changes: a branch's rules are a different set, and
  // carrying the previous scope's edits across would silently write them here.
  useEffect(() => {
    if (!data || loadedFor === branchId) return;
    setLoadedFor(branchId);
    setDrafts(
      data.preferences.map(({ label, ...rest }) => ({ ...rest, channels: [...rest.channels] })),
    );
    setError(null);
    setSaved(false);
  }, [data, branchId, loadedFor]);

  const update = (event: string, patch: Partial<Draft>) => {
    setSaved(false);
    setDrafts((prev) => (prev ?? []).map((d) => (d.event === event ? { ...d, ...patch } : d)));
  };

  const toggleChannel = (event: string, channel: NotificationChannel) => {
    const draft = drafts?.find((d) => d.event === event);
    if (!draft) return;
    update(event, {
      channels: draft.channels.includes(channel)
        ? draft.channels.filter((c) => c !== channel)
        : [...draft.channels, channel],
    });
  };

  const toggleRecipient = (event: string, id: number) => {
    const draft = drafts?.find((d) => d.event === event);
    if (!draft) return;
    update(event, {
      recipient_ids: draft.recipient_ids.includes(id)
        ? draft.recipient_ids.filter((r) => r !== id)
        : [...draft.recipient_ids, id],
    });
  };

  const handleSave = () => {
    if (!drafts) return;
    setError(null);
    save.mutate(drafts, {
      onSuccess: () => setSaved(true),
      onError: (e: any) => setError(e.message || 'Could not save your preferences'),
    });
  };

  if (isLoading || !data || !drafts) {
    return (
      <p className="text-center py-10 text-gray-400 text-sm">
        <i className="ri-loader-4-line animate-spin text-xl" />
      </p>
    );
  }

  const enabledCount = drafts.filter((d) => d.is_enabled).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">Notification preferences</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {enabledCount} of {drafts.length} events are being notified on.
          </p>
        </div>
        {branches.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 font-medium shrink-0">Scope:</span>
            <select
              value={branchId ?? ''}
              onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
              className="h-10 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
            >
              <option value="">All branches (default)</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.branch_code} · {b.state}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {data.recipients.length === 0 && (
        <p className="flex items-start gap-1.5 rounded-xl bg-orange-50 p-3 text-xs text-orange-800">
          <i className="ri-information-line mt-0.5" />
          Nobody on your team is available to notify{branchId ? ' at this branch' : ''}. Invite people under
          Users, or add a contact directly on a rule below.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {data.preferences.map((row) => {
          const draft = drafts.find((d) => d.event === row.event);
          if (!draft) return null;

          return (
            <div key={row.event} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">{row.label}</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.is_enabled}
                  aria-label={row.label}
                  onClick={() => update(row.event, { is_enabled: !draft.is_enabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    draft.is_enabled ? 'bg-brand' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      draft.is_enabled ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* The detail only matters once a rule is on, so it stays collapsed
                  until then rather than presenting nine events' worth of controls. */}
              {draft.is_enabled && (
                <div className="mt-3 flex flex-col gap-3 border-t border-gray-50 pt-3">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">How</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {data.channels.map((channel) => {
                        const on = draft.channels.includes(channel.id);
                        return (
                          <button
                            key={channel.id}
                            type="button"
                            onClick={() => toggleChannel(row.event, channel.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              on
                                ? 'border-brand bg-orange-50 text-brand'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <i className={CHANNEL_ICON[channel.id]} />
                            {channel.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {data.recipients.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Who</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {data.recipients.map((person) => {
                          const on = draft.recipient_ids.includes(person.id);
                          return (
                            <button
                              key={person.id}
                              type="button"
                              onClick={() => toggleRecipient(row.event, person.id)}
                              title={person.role ?? undefined}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                on
                                  ? 'border-brand bg-orange-50 text-brand'
                                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {person.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      Also notify (optional)
                    </label>
                    {/* Free-form addresses for what employees can't express — an ops
                        group, a shared inbox. Validated server-side against the
                        channels chosen above. */}
                    <input
                      type="text"
                      value={draft.extra_contacts.join(', ')}
                      onChange={(e) =>
                        update(row.event, {
                          extra_contacts: e.target.value
                            .split(',')
                            .map((c) => c.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="ops@yourcompany.com, +234801…"
                      className="h-10 px-3 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-green-700">Preferences saved.</p>}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={save.isPending}
          className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40"
        >
          {save.isPending ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
};
