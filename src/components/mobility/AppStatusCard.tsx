import { useState } from "react";
import { Link } from "react-router-dom";
import { naira } from "../../lib/data/mobility";
import type { MobilityApp, MobilityProduct } from "../../service/partnerService";
import { ActivationModal } from "./ActivationModal";
import { feedbackActions } from "../../store/client/feedback";

/**
 * Where an app stands, and the one thing to do next.
 *
 * Shared by both products because the lifecycle is the same — configure,
 * request, get quoted by sales, accept — and only the wording differs. Saving is
 * always available (branding is never locked), so it sits beside whatever the
 * next step is rather than replacing it.
 */

const BADGE: Record<string, { label: string; tone: string }> = {
  none: { label: "Not started", tone: "bg-gray-100 text-gray-600" },
  draft: { label: "Draft", tone: "bg-gray-100 text-gray-600" },
  requested: { label: "Awaiting quote", tone: "bg-amber-50 text-amber-700" },
  quoted: { label: "Quote ready", tone: "bg-blue-50 text-blue-700" },
  active: { label: "Active", tone: "bg-emerald-50 text-emerald-700" },
  suspended: { label: "Suspended", tone: "bg-red-50 text-red-700" },
  cancelled: { label: "Cancelled", tone: "bg-gray-100 text-gray-500" },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const b = BADGE[status] ?? BADGE.none;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${b.tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {b.label}
    </span>
  );
};

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "";

export const AppStatusCard = ({
  product,
  app,
  name,
  dirty,
  saving,
  onSave,
  missing,
  onFix,
  billableBlocked,
  onAction,
  acting,
}: {
  product: MobilityProduct;
  app: MobilityApp | null;
  name: string;
  dirty: boolean;
  saving: boolean;
  onSave: () => Promise<unknown>;
  /** What still blocks a request, with the panel that fixes each. */
  missing: { label: string; panel?: string }[];
  onFix?: (panel: string) => void;
  billableBlocked: boolean;
  onAction: (action: "request" | "accept" | "cancel") => Promise<unknown>;
  acting: boolean;
}) => {
  const [accepting, setAccepting] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const status = app?.status ?? "none";
  const whiteLabel = product === "white_label";
  const priced = app?.amount != null
    ? `${naira(app.amount)}${whiteLabel ? "/month" : " one-time"}`
    : null;

  // A cancelled app restarts as a fresh draft the moment it is saved again.
  const canRequest = status === "none" || status === "draft" || status === "cancelled";
  const canCancel = whiteLabel
    ? ["requested", "quoted", "active"].includes(status)
    : ["requested", "quoted"].includes(status);

  // The save and action mutations are silent (useMobility.ts) and the outcome
  // is said here instead, because only this card knows which product and which
  // step it was — and a request that saves first should say one thing, not two.
  // Failures still reach the user through the global FeedbackModal.
  const saveNow = async () => {
    try {
      await onSave();
      feedbackActions.success(
        whiteLabel && status === "active" ? "Saved — your changes are live in the Azapal app." : "Saved.",
      );
    } catch {
      // Shown by the FeedbackModal.
    }
  };

  const request = async () => {
    // Saving first means the request is always for what is on screen.
    try {
      if (dirty || !app || status === "cancelled") await onSave();
      await onAction("request");
      feedbackActions.success(
        whiteLabel
          ? "Activation requested — sales will send your monthly price here."
          : "Quote requested — sales will send your one-time fee here.",
      );
    } catch {
      // Shown by the FeedbackModal.
    }
  };

  const cancel = async () => {
    const wasActive = status === "active";
    try {
      await onAction("cancel");
      feedbackActions.success(
        wasActive
          ? "Stopped. Your branding is off the Azapal app, and no month after this one is billed."
          : "Request withdrawn. You can start again whenever you like.",
      );
    } catch {
      // Shown by the FeedbackModal.
    }
    setConfirmCancel(false);
  };

  const kycGate = billableBlocked && (canRequest || status === "quoted") && (
    <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
      <i className="ri-shield-check-line mt-0.5" />
      <span>
        Verify your business before {status === "quoted" ? "accepting" : "requesting"} this.{" "}
        <Link to="/settings?tab=verification" className="font-semibold underline underline-offset-2">Go to verification</Link>
      </span>
    </p>
  );

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusBadge status={status} />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            {status === "none" || status === "draft"
              ? whiteLabel ? "Brand the Azapal app" : "Configure your app"
              : status === "requested"
                ? "Sales is preparing your quote"
                : status === "quoted"
                  ? `Your quote: ${priced}`
                  : status === "active"
                    ? whiteLabel
                      ? "Live in the Azapal app"
                      : app?.live_at ? "Live in the stores" : "In build"
                    : status === "suspended"
                      ? "Suspended by Azapal"
                      : "Cancelled"}
          </h3>
          <p className="mt-0.5 text-xs leading-5 text-gray-500">
            {status === "none" || status === "draft"
              ? whiteLabel
                ? "Pick your logo and colours, then request activation. Sales sends your monthly price before anything is billed."
                : "Shape your app, then request a quote. The one-time fee is set by sales and nothing is billed until you accept it."
              : status === "requested"
                ? `Requested ${date(app!.requested_at)}. You'll see the price here once sales sends it — you can keep editing meanwhile.`
                : status === "quoted"
                  ? whiteLabel
                    ? "Billed for every month it's active, on your monthly Azapal bill. Nothing is charged until you accept."
                    : "Added once to your next Azapal bill when you accept, and the build starts."
                  : status === "active"
                    ? whiteLabel
                      ? `Since ${date(app!.accepted_at)} · ${priced}. Changes to your logo and colours go out when you save.`
                      : app?.live_at
                        ? `Published ${date(app.live_at)}. Talk to sales about updates beyond this configuration.`
                        : `Accepted ${date(app!.accepted_at)} · ${priced}. Azapal is building it; store review follows.`
                    : status === "suspended"
                      ? "It isn't showing to customers right now. Contact sales to find out why and resume it."
                      : "Save a configuration to start again — it will need a fresh quote."}
          </p>
        </div>
      </div>

      {app?.sales_note && ["quoted", "active", "suspended"].includes(status) && (
        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
          <span className="font-semibold text-gray-700">From Azapal sales: </span>{app.sales_note}
        </p>
      )}

      {kycGate}

      {canRequest && missing.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-1 text-xs text-gray-500">
          <span>Still needs</span>
          {missing.map((m, i) => (
            <span key={m.label} className="contents">
              {m.panel && onFix ? (
                <button type="button" onClick={() => onFix(m.panel!)} className="font-semibold text-brand underline underline-offset-2 hover:text-brand-hover">
                  {m.label}
                </button>
              ) : (
                <span className="font-semibold text-gray-700">{m.label}</span>
              )}
              {i < missing.length - 1 && <span>·</span>}
            </span>
          ))}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {canRequest && (
          <button
            type="button"
            onClick={request}
            disabled={acting || saving || missing.length > 0 || billableBlocked}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-gray-200 disabled:text-gray-400"
          >
            {acting ? "Sending…" : whiteLabel ? "Request activation" : "Request a quote"}
          </button>
        )}
        {status === "quoted" && (
          <button
            type="button"
            onClick={() => setAccepting(true)}
            disabled={billableBlocked}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-gray-200 disabled:text-gray-400"
          >
            Review &amp; accept
          </button>
        )}
        {status !== "cancelled" && (
          <button
            type="button"
            onClick={saveNow}
            disabled={!dirty || saving}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:text-gray-300"
          >
            {saving ? "Saving…" : dirty ? (app ? "Save changes" : "Save draft") : "Saved"}
          </button>
        )}
        {canCancel && !confirmCancel && (
          <button type="button" onClick={() => setConfirmCancel(true)} className="ml-auto text-xs font-semibold text-gray-400 hover:text-red-600">
            {status === "active" ? "Stop the app" : "Withdraw request"}
          </button>
        )}
      </div>

      {confirmCancel && (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-3">
          <p className="text-xs leading-5 text-red-800">
            {status === "active"
              ? "Your branding comes off the Azapal app, and no month after this one is billed. This month stays billed."
              : "Sales stops working on this. You can start again later, with a fresh quote."}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={acting}
              onClick={cancel}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {status === "active" ? "Yes, stop it" : "Yes, withdraw"}
            </button>
            <button type="button" onClick={() => setConfirmCancel(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white">
              Keep it
            </button>
          </div>
        </div>
      )}

      {accepting && app && (
        <ActivationModal
          app={app}
          name={name}
          pending={acting}
          onClose={() => setAccepting(false)}
          onConfirm={async () => {
            try {
              await onAction("accept");
              setAccepting(false);
              feedbackActions.success(
                whiteLabel
                  ? "Accepted. Your branding goes live in the Azapal app, billed monthly on your Azapal bill."
                  : "Accepted. Azapal is starting the build — the fee is on your next Azapal bill.",
              );
            } catch {
              // Shown by the FeedbackModal; the modal stays open to retry.
            }
          }}
        />
      )}
    </section>
  );
};
