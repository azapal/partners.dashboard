import { useState } from "react";
import { isCampaignInProgress, useCancelEmailCampaign, useEmailCampaign, useEmailCampaigns } from "../../hooks/useEmailCampaigns";
import { campaignTypeLabel, naira } from "../../lib/emailDesign";
import type { EmailCampaign } from "../../service/partnerService";
import { EmailPreviewFrame } from "./EmailPreviewFrame";
import { CampaignStatusChip, when, whenShort, useEscapeToClose } from "./shared";

/**
 * Every send, newest first. The list (and an open campaign) poll every 5s while
 * anything is still queued or going out — see useEmailCampaigns.
 */
export const CampaignsTab = ({ onNew }: { onNew: () => void }) => {
  const { data: campaigns = [], isPending, isError, error, refetch } = useEmailCampaigns();
  const [open, setOpen] = useState<number | null>(null);

  if (isPending || isError) {
    return (
      <div className="rounded-2xl bg-white py-16 text-center shadow-card">
        {isError ? (
          <>
            <p className="text-sm text-gray-500">Couldn't load your campaigns{error?.message ? ` — ${error.message}` : "."}</p>
            <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold text-brand hover:text-brand-hover">Try again</button>
          </>
        ) : (
          <p className="text-sm text-gray-400"><i className="ri-loader-4-line mr-1 animate-spin" />Loading campaigns…</p>
        )}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-16 text-center shadow-card">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl text-brand"><i className="ri-mail-send-line" /></span>
        <p className="font-semibold text-gray-900">No campaigns yet</p>
        <p className="max-w-sm text-sm text-gray-500">Send a promo, a seasonal note or a discount to your customers. Every email you send — even a single one — is listed here.</p>
        <button type="button" onClick={onNew} className="mt-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">New campaign</button>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-card md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-b border-gray-100 text-xs font-semibold text-gray-400">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="w-28 px-2 py-3">Status</th>
              <th className="w-[22%] px-2 py-3">Progress</th>
              <th className="w-28 px-2 py-3 text-right">Cost so far</th>
              <th className="w-44 px-4 py-3">Sent by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {campaigns.map((c) => (
              <tr key={c.id} onClick={() => setOpen(c.id)} className="cursor-pointer hover:bg-gray-50/70">
                <td className="px-4 py-3">
                  <p className="truncate font-semibold text-gray-900">{c.name || c.subject}</p>
                  <p className="truncate text-xs text-gray-500">{campaignTypeLabel(c.campaign_type)} · {c.subject}</p>
                </td>
                <td className="px-2 py-3"><CampaignStatusChip status={c.status} /></td>
                <td className="px-2 py-3"><Progress campaign={c} /></td>
                <td className="px-2 py-3 text-right font-semibold tabular-nums text-gray-800">{naira(c.cost_so_far)}</td>
                <td className="px-4 py-3">
                  <p className="truncate text-xs text-gray-700">{c.created_by_name || "—"}</p>
                  <p className="text-[11px] text-gray-400">{whenShort(c.created_at)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {campaigns.map((c) => (
          <button key={c.id} type="button" onClick={() => setOpen(c.id)} className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-left shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{c.name || c.subject}</p>
                <p className="truncate text-xs text-gray-500">{campaignTypeLabel(c.campaign_type)} · {whenShort(c.created_at)}</p>
              </div>
              <CampaignStatusChip status={c.status} />
            </div>
            <Progress campaign={c} />
            <p className="text-xs text-gray-500">{naira(c.cost_so_far)} so far{c.created_by_name ? ` · by ${c.created_by_name}` : ""}</p>
          </button>
        ))}
      </div>

      {open != null && <CampaignDrawer id={open} summary={campaigns.find((c) => c.id === open)} onClose={() => setOpen(null)} />}
    </>
  );
};

const Progress = ({ campaign: c }: { campaign: EmailCampaign }) => {
  const done = c.sent_count + c.failed_count + c.skipped_count;
  const pct = c.recipient_count ? Math.round((c.sent_count / c.recipient_count) * 100) : 0;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${c.status === "failed" ? "bg-red-400" : "bg-brand"} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <p className="truncate text-[11px] text-gray-500">
        <span className="font-semibold text-gray-800">{c.sent_count.toLocaleString()}</span> / {c.recipient_count.toLocaleString()} sent
        {c.failed_count > 0 && <span className="text-red-500"> · {c.failed_count.toLocaleString()} failed</span>}
        {c.skipped_count > 0 && <span> · {c.skipped_count.toLocaleString()} skipped</span>}
        {isCampaignInProgress(c) && done < c.recipient_count && <span> · {(c.recipient_count - done).toLocaleString()} to go</span>}
      </p>
    </div>
  );
};

const RECIPIENT_TONE: Record<string, string> = {
  sent: "text-emerald-600",
  failed: "text-red-500",
  skipped: "text-gray-400",
  pending: "text-blue-600",
};

const CampaignDrawer = ({ id, summary, onClose }: { id: number; summary?: EmailCampaign; onClose: () => void }) => {
  const { data, isPending, isError, error } = useEmailCampaign(id);
  const cancel = useCancelEmailCampaign();
  const [tab, setTab] = useState<"recipients" | "email">("recipients");
  const c = data ?? summary;
  useEscapeToClose(onClose);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-labelledby="campaign-title" className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 id="campaign-title" className="truncate text-lg font-bold text-gray-900">{c?.name || c?.subject || "Campaign"}</h2>
              {c && <CampaignStatusChip status={c.status} />}
            </div>
            {c && <p className="truncate text-xs text-gray-500">{campaignTypeLabel(c.campaign_type)} · “{c.subject}”</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <i className="ri-close-line text-xl" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!c ? (
            <p className="py-10 text-center text-sm text-gray-400">{isError ? `Couldn't load it — ${error?.message}` : "Loading…"}</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Count label="Recipients" value={c.recipient_count} />
                <Count label="Sent" value={c.sent_count} tone="text-emerald-600" />
                <Count label="Failed" value={c.failed_count} tone={c.failed_count ? "text-red-500" : undefined} />
                <Count label="Skipped" value={c.skipped_count} />
              </div>
              <Progress campaign={c} />
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl bg-gray-50 px-4 py-3 text-xs sm:grid-cols-2">
                <Meta label="Cost so far" value={`${naira(c.cost_so_far)} · ${naira(c.unit_amount)} each`} />
                <Meta label="Audience" value={c.audience?.mode === "filter" ? audienceFilterLabel(c.audience.filter) : `${(c.audience?.selected ?? c.recipient_count).toLocaleString()} picked by hand`} />
                <Meta label="Sent by" value={c.created_by_name || "—"} />
                <Meta label="Created" value={when(c.created_at)} />
                {c.completed_at && <Meta label="Finished" value={when(c.completed_at)} />}
              </dl>
              {isCampaignInProgress(c) && (
                <div className="flex flex-col gap-2 rounded-xl border border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-600">Still going out. Stopping it skips everyone not reached yet — what's sent stays sent and billed.</p>
                  <button
                    type="button"
                    onClick={() => cancel.mutate(c.id)}
                    disabled={cancel.isPending}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancel.isPending ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-stop-circle-line" />}Stop sending
                  </button>
                </div>
              )}

              <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
                {(["recipients", "email"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTab(t)} className={`flex-1 rounded-lg py-1.5 text-sm font-semibold ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                    {t === "recipients" ? "Recipients" : "What was sent"}
                  </button>
                ))}
              </div>

              {tab === "recipients" ? (
                isPending ? (
                  <p className="py-6 text-center text-sm text-gray-400">Loading recipients…</p>
                ) : data ? (
                  <div className="overflow-hidden rounded-xl border border-gray-100">
                    <ul className="divide-y divide-gray-50">
                      {data.recipients.map((r) => (
                        <li key={r.email} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-800">{r.name || r.email}</p>
                            <p className="truncate text-xs text-gray-500">{r.email}{r.error ? ` · ${r.error}` : ""}</p>
                          </div>
                          <span className={`shrink-0 text-xs font-semibold capitalize ${RECIPIENT_TONE[r.status] ?? "text-gray-500"}`}>{r.status}</span>
                        </li>
                      ))}
                    </ul>
                    {data.recipient_count > data.recipients.length && (
                      <p className="border-t border-gray-100 bg-gray-50 px-3 py-2 text-center text-[11px] text-gray-500">
                        Showing the first {data.recipients.length.toLocaleString()} of {data.recipient_count.toLocaleString()}.
                      </p>
                    )}
                  </div>
                ) : null
              ) : data ? (
                <EmailPreviewFrame content={{ subject: data.subject, preheader: data.preheader, design: data.design }} minHeight={480} />
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">Loading…</p>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

const audienceFilterLabel = (f: { q?: string; source?: string; service?: string } | null) => {
  const parts = [f?.q && `“${f.q}”`, f?.service, f?.source?.replace("_", " ")].filter(Boolean);
  return parts.length ? `Everyone matching ${parts.join(" · ")}` : "All emailable customers";
};

const Count = ({ label, value, tone }: { label: string; value: number; tone?: string }) => (
  <div className="rounded-xl bg-gray-50 px-3 py-2.5">
    <p className="text-[11px] font-semibold text-gray-400">{label}</p>
    <p className={`text-xl font-bold tabular-nums ${tone ?? "text-gray-900"}`}>{value.toLocaleString()}</p>
  </div>
);

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2">
    <dt className="w-24 shrink-0 text-gray-400">{label}</dt>
    <dd className="min-w-0 text-gray-700">{value}</dd>
  </div>
);
