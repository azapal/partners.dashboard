import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useQuoteRequests, useUpdateQuoteRequestStatus } from "../../hooks/useQuotePage";
import { emailKeys, useCanEmailCustomers } from "../../hooks/useEmailCampaigns";
import { channelIcon, channelLabel } from "../../lib/quotePage";
import { customerService, type Customer, type QuoteContactChannel, type QuoteRequestRecord, type QuoteRequestStatus } from "../../service/partnerService";
import { ComposeEmailModal } from "../customers/ComposeEmailModal";

/**
 * The requests customers left on the public page — the partner's leads.
 *
 * Each one is a snapshot of what the customer was asked and answered, so it
 * reads the same however the partner has reworded their questions since. The
 * partner moves it through new → contacted → booked / lost; nothing else
 * changes it.
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

/** `onOpenSettings` is omitted where the viewer can't edit the page — support staff. */
export const QuoteRequestsPanel = ({
  onOpenSettings,
  branchId = null,
}: {
  onOpenSettings?: () => void;
  /** Narrows to one branch's leads; null is everything the viewer may see. */
  branchId?: number | null;
}) => {
  const { data: requests = [], isPending, isError, error, refetch } = useQuoteRequests(branchId);
  const updateStatus = useUpdateQuoteRequestStatus();
  const [filter, setFilter] = useState<QuoteRequestStatus | "all">("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);

  // Emailing a lead goes through the customer directory's composer, which needs
  // the customer's id — so it's looked up by email first. Only the partner and
  // elevated admins can use that directory (anyone else would get a 403, which
  // signs them out), so support staff keep the plain mailto link.
  const canEmail = useCanEmailCustomers();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [composeTo, setComposeTo] = useState<Customer[] | null>(null);
  const [lookingUp, setLookingUp] = useState<string | null>(null);
  const mailto = (r: QuoteRequestRecord) =>
    `mailto:${r.customer_email}?subject=${encodeURIComponent(`Your quote request ${r.reference}`)}`;
  const emailLead = async (r: QuoteRequestRecord) => {
    setLookingUp(r.reference);
    try {
      const email = (r.customer_email ?? "").trim().toLowerCase();
      const customer = await qc.fetchQuery({
        queryKey: [...emailKeys.all, "by-email", email],
        queryFn: () => customerService.findByEmail(email),
        staleTime: 60 * 1000,
      });
      if (customer) setComposeTo([customer]);
      else window.location.href = mailto(r);
    } catch {
      // Not in the directory, or it couldn't be reached — the mail app still works.
      window.location.href = mailto(r);
    } finally {
      setLookingUp(null);
    }
  };

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
        {onOpenSettings && (
          <button type="button" onClick={onOpenSettings} className="text-sm font-semibold text-brand hover:text-brand-hover">
            Set up and share your quote page
          </button>
        )}
      </div>
    );
  }

  const services = [...new Set(requests.map((r) => r.service))];
  const labels = Object.fromEntries(requests.map((r) => [r.service, r.service_label]));
  // Where leads came from: the partner's reference links, plus "the bare link"
  // for everyone who arrived without one.
  const sources = [...new Set(requests.map((r) => r.source).filter(Boolean))];
  const sourceLabels = Object.fromEntries(requests.map((r) => [r.source, r.source_label]));
  const shown = requests.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (serviceFilter === "all" || r.service === serviceFilter) &&
      (sourceFilter === "all" || r.source === sourceFilter),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
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
        {/* Only worth showing once the page offers more than one thing. */}
        {services.length > 1 && (
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            aria-label="Filter by service"
            className="ml-auto rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-card outline-none"
          >
            <option value="all">All services</option>
            {services.map((id) => (
              <option key={id} value={id}>{labels[id] ?? id}</option>
            ))}
          </select>
        )}
        {/* Only once a reference link has actually brought someone. */}
        {sources.length > 0 && (
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            aria-label="Filter by where the lead came from"
            className={`rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-card outline-none ${
              services.length > 1 ? "" : "ml-auto"
            }`}
          >
            <option value="all">Everywhere</option>
            {sources.map((code) => (
              <option key={code} value={code}>{sourceLabels[code] || code}</option>
            ))}
            <option value="">Straight to the link</option>
          </select>
        )}
        {canEmail && (
          <Link
            to="/customers"
            className={`flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand shadow-card hover:text-brand-hover ${
              services.length > 1 || sources.length > 0 ? "" : "ml-auto"
            }`}
          >
            <i className="ri-group-line" />See all customers
          </Link>
        )}
      </div>

      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-card">
        {shown.length === 0 && <p className="px-5 py-10 text-center text-sm text-gray-400">Nothing here.</p>}
        {shown.map((r) => {
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
                      {[r.service_label, r.answers[0] ? `${r.answers[0].label}: ${r.answers[0].value}` : "", r.details]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-400">
                      {when(r.created_at)}
                      {!branchId && r.branch && <span>· {r.branch.branch_code}</span>}
                      {r.source && (
                        <span className="flex items-center gap-1" title="Where this lead came from">
                          · <i className="ri-share-forward-line" />
                          {r.source_label || r.source}
                        </span>
                      )}
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
                {canEmail && r.customer_email && (
                  <button
                    type="button"
                    onClick={() => emailLead(r)}
                    disabled={lookingUp === r.reference}
                    className="hidden shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand hover:bg-orange-50 disabled:opacity-60 sm:flex"
                    title={`Email ${r.customer_name}`}
                  >
                    <i className={lookingUp === r.reference ? "ri-loader-4-line animate-spin" : "ri-mail-line"} />Email
                  </button>
                )}
                <span className="shrink-0 text-xs font-semibold text-gray-400 sm:w-32 sm:text-right">To quote</span>
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
                    {r.details && <p className="whitespace-pre-wrap text-xs text-gray-700">{r.details}</p>}
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
                        <span className="text-gray-600">{contact.label || contact.address}</span>
                      </p>
                    ))}
                    <div className="flex flex-wrap gap-2">
                      <ReachOut href={`tel:${r.customer_phone}`} icon="ri-phone-line" label="Call" />
                      <ReachOut
                        href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hi ${r.customer_name}, it's about your quote request ${r.reference}.`)}`}
                        icon="ri-whatsapp-line"
                        label="WhatsApp"
                        external
                      />
                      {r.customer_email &&
                        (canEmail ? (
                          <button
                            type="button"
                            onClick={() => emailLead(r)}
                            disabled={lookingUp === r.reference}
                            className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-orange-100 disabled:opacity-60"
                          >
                            <i className={lookingUp === r.reference ? "ri-loader-4-line animate-spin" : "ri-mail-line"} />
                            Email
                          </button>
                        ) : (
                          <ReachOut href={mailto(r)} icon="ri-mail-line" label="Email" />
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {composeTo && (
        <ComposeEmailModal
          customers={composeTo}
          onClose={() => setComposeTo(null)}
          onOpenEditor={(seed) => {
            setComposeTo(null);
            navigate("/customers", { state: { builder: seed } });
          }}
        />
      )}
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
