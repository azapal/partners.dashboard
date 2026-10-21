import { useEffect } from "react";
import { Link } from "react-router-dom";
import { feedbackStore } from "../../store/client/feedback";
import type { Customer, EmailCampaignStatus, EmailEstimate } from "../../service/partnerService";
import { naira } from "../../lib/emailDesign";

/** Escape closes, unless a FeedbackModal is on top — that takes the key to dismiss itself. */
export const useEscapeToClose = (onClose: () => void, active = true) => {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || feedbackStore.state.queue.length > 0) return;
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, active]);
};

export const customerStatus = (c: Pick<Customer, "email" | "emailable" | "unsubscribed">) =>
  c.unsubscribed
    ? { id: "unsubscribed", label: "Unsubscribed", tone: "bg-gray-100 text-gray-500", why: "They unsubscribed from your emails." }
    : !c.email
      ? { id: "no_email", label: "No email", tone: "bg-amber-50 text-amber-700", why: "We only have a phone number for them." }
      : c.emailable
        ? { id: "emailable", label: "Emailable", tone: "bg-emerald-50 text-emerald-700", why: "" }
        : { id: "blocked", label: "Can't email", tone: "bg-gray-100 text-gray-500", why: "This address can't receive email from you." };

export const CustomerStatusChip = ({ customer }: { customer: Customer }) => {
  const s = customerStatus(customer);
  return (
    <span title={s.why || undefined} className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.tone}`}>
      {s.label}
    </span>
  );
};

export const CAMPAIGN_STATUS: Record<EmailCampaignStatus, { label: string; tone: string; icon: string }> = {
  queued: { label: "Queued", tone: "bg-blue-50 text-blue-700", icon: "ri-time-line" },
  sending: { label: "Sending", tone: "bg-orange-50 text-brand", icon: "ri-loader-4-line animate-spin" },
  sent: { label: "Sent", tone: "bg-emerald-50 text-emerald-700", icon: "ri-check-line" },
  failed: { label: "Failed", tone: "bg-red-50 text-red-600", icon: "ri-error-warning-line" },
  cancelled: { label: "Stopped", tone: "bg-gray-100 text-gray-500", icon: "ri-stop-circle-line" },
};

export const CampaignStatusChip = ({ status }: { status: EmailCampaignStatus }) => {
  const s = CAMPAIGN_STATUS[status] ?? CAMPAIGN_STATUS.queued;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.tone}`}>
      <i className={s.icon} />
      {s.label}
    </span>
  );
};

/** Sending is refused until verification is done — said with the way to fix it. */
export const KycNotice = () => (
  <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
    <i className="ri-shield-keyhole-line mt-0.5 text-lg" />
    <div>
      <p className="font-semibold">Verify your business to send emails</p>
      <p className="mt-0.5 text-xs text-amber-700">
        Campaigns go out under your name, so Azapal needs your verification finished first.{" "}
        <Link to="/settings?tab=verification" className="font-semibold underline">
          Finish verification
        </Link>
      </p>
    </div>
  </div>
);

/** "₦100 · 1 email", with who's left out when anyone is. */
export const CostLine = ({ estimate, loading }: { estimate?: EmailEstimate; loading?: boolean }) => {
  if (!estimate) {
    return <span className="text-xs text-gray-400">{loading ? "Working out the cost…" : ""}</span>;
  }
  const left = estimate.no_email + estimate.unsubscribed;
  return (
    <span className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
      <span className="font-semibold text-gray-900">{naira(estimate.total)}</span>
      <span>
        · {estimate.recipients.toLocaleString()} email{estimate.recipients === 1 ? "" : "s"}
        {estimate.recipients > 0 && ` at ${naira(estimate.unit_amount)}`}
      </span>
      {left > 0 && <span className="text-gray-400">· {left.toLocaleString()} can't be emailed</span>}
    </span>
  );
};

export const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export const whenShort = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

export const Avatar = ({ name, muted }: { name: string; muted?: boolean }) => (
  <span
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
      muted ? "bg-gray-100 text-gray-400" : "bg-orange-50 text-brand"
    }`}
  >
    {initials(name)}
  </span>
);
