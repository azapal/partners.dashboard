import { useState } from "react";
import { useQuoteRequests, useUpdateQuoteRequestStatus } from "../../hooks/useQuotePage";
import { currencySymbol, money } from "../../lib/data/moveRates";
import { channelIcon, channelLabel } from "../../lib/quotePage";
import type { QuoteContactChannel, QuoteRequestRecord, QuoteRequestStatus } from "../../service/partnerService";

/**
 * The quotes customers took from the public page — the partner's leads.
 *
 * Each one is a snapshot of what the customer was told, so it reads the same
 * however the price list has changed since. The partner moves it through
 * new → contacted → booked / lost; nothing else changes it.
 */

const STATUSES: { id: QuoteRequestStatus; label: string; tone: string }[] = [
  { id: "new", label: "New", tone: "bg-orange-50 text-brand" },
  { id: "contacted", label: "Contacted", tone: "bg-blue-50 text-blue-700" },
  { id: "booked", label: "Booked", tone: "bg-emerald-50 text-emerald-700" },
  { id: "lost", label: "Lost", tone: "bg-gray-100 text-gray-500" },
];

const COPY_NOTE: Record<QuoteRequestRecord["copy_status"], string> = {
  not_requested: "",
  sent: "Copy sent",
  failed: "Copy failed to send",
  limited: "Copy held back (daily limit)",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const QuoteRequestsPanel = ({ onOpenSettings }: { onOpenSettings: () => void }) => {
  const { data: requests = [], isPending, isError, error, refetch } = useQuoteRequests();
  const updateStatus = useUpdateQuoteRequestStatus();
  const [filter, setFilter] = useState<QuoteRequestStatus | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  if (isPending || isError) {
    return (
      <div className="rounded-2xl bg-white py-14 text-center shadow-card">
        {isError ? (
          <>
            <p className="text-sm text-gray-500">Couldn't load quote requests{error?.message ? ` — ${error.message}` : "."}</p>
            <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-400">Loading…</p>
        )}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-14 text-center shadow-card">
        <i className="ri-inbox-2-line text-3xl text-gray-300" />
        <p className="text-sm text-gray-500">No quotes yet. They'll appear here as customers use your quote page.</p>
        <button type="button" onClick={onOpenSettings} className="text-sm font-semibold text-brand hover:text-brand-hover">
          Set up and share your quote page
        </button>
      </div>
    );
  }

  const shown = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {[{ id: "all" as const, label: "All" }, ...STATUSES].map((s) => {
          const count = s.id === "all" ? requests.length : requests.filter((r) => r.status === s.id).length;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setFilter(s.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === s.id ? "bg-gray-900 text-white" : "bg-white text-gray-500 shadow-card hover:text-gray-800"
              }`}
            >
              {s.label} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {updateStatus.error && <p className="text-xs text-red-600">{updateStatus.error.message}</p>}

      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-card">
        {shown.length === 0 && <p className="px-5 py-10 text-center text-sm text-gray-400">Nothing here.</p>}
        {shown.map((r) => {
          const symbol = currencySymbol(r.currency);
          const expanded = open === r.reference;
          const phoneDigits = r.customer_phone.replace(/^\+/, "");
          return (
            <div key={r.reference}>
              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : r.reference)}
                  aria-expanded={expanded}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <i className={`ri-arrow-${expanded ? "down" : "right"}-s-line mt-0.5 text-gray-400`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-800">
                      {r.customer_name}
                      <span className="ml-2 font-mono text-[11px] font-normal text-gray-400">{r.reference}</span>
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {r.lines[0]?.label}
                      {r.lines[0]?.detail ? ` · ${r.lines[0].detail}` : ""} · {r.country}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-400">
                      {when(r.created_at)}
                      {r.contacted_via.length > 0 && (
                        <span className="flex items-center gap-1" title="Sent to you on">
                          · sent on
                          {r.contacted_via.map((c) => (
                            <i key={c} className={channelIcon(c)} aria-label={channelLabel(c)} />
                          ))}
                        </span>
                      )}
                      {COPY_NOTE[r.copy_status] && <span>· {COPY_NOTE[r.copy_status]}</span>}
                    </span>
                  </span>
                </button>
                <span className="shrink-0 text-base font-bold text-gray-900 sm:w-32 sm:text-right">{money(symbol, r.total)}</span>
                <select
                  value={r.status}
                  onChange={(e) => updateStatus.mutate({ reference: r.reference, status: e.target.value as QuoteRequestStatus })}
                  aria-label={`Status of ${r.reference}`}
                  className={`shrink-0 rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold outline-none ${
                    STATUSES.find((s) => s.id === r.status)?.tone
                  }`}
                >
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {expanded && (
                <div className="grid gap-4 bg-gray-50/60 px-5 pb-5 pt-1 sm:grid-cols-2 sm:pl-12">
                  <div>
                    {r.lines.map((line, i) => (
                      <div key={`${line.label}-${i}`} className="flex justify-between gap-3 py-0.5 text-xs">
                        <span className="text-gray-600">
                          {line.label}
                          {line.detail && <span className="text-gray-400"> · {line.detail}</span>}
                        </span>
                        <span className="shrink-0 text-gray-800">{money(symbol, line.amount)}</span>
                      </div>
                    ))}
                    {r.answers.map((a) => (
                      <p key={a.label} className="mt-1 text-xs text-gray-500">
                        {a.label}: <span className="text-gray-800">{a.value}</span>
                      </p>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-gray-600">
                      {r.customer_phone}
                      {r.customer_email && <><br />{r.customer_email}</>}
                    </p>
                    {/* Whose phone this one was pointed at — the interesting part once
                        interchange is sharing leads around a team. */}
                    {Object.entries(r.assigned_contacts ?? {}).map(([channel, contact]) => (
                      <p key={channel} className="text-[11px] text-gray-400">
                        {channelLabel(channel as QuoteContactChannel)} went to{" "}
                        <span className="text-gray-600">{contact.label || contact.phone}</span>
                      </p>
                    ))}
                    <div className="flex flex-wrap gap-2">
                      <ReachOut href={`tel:${r.customer_phone}`} icon="ri-phone-line" label="Call" />
                      <ReachOut
                        href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hi ${r.customer_name}, it's about your moving quote ${r.reference}.`)}`}
                        icon="ri-whatsapp-line"
                        label="WhatsApp"
                        external
                      />
                      {r.customer_email && (
                        <ReachOut href={`mailto:${r.customer_email}?subject=${encodeURIComponent(`Your moving quote ${r.reference}`)}`} icon="ri-mail-line" label="Email" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReachOut = ({ href, icon, label, external }: { href: string; icon: string; label: string; external?: boolean }) => (
  <a
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noopener noreferrer" : undefined}
    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
  >
    <i className={icon} />
    {label}
  </a>
);
