import { useEffect, useState } from "react";
import { naira } from "../../lib/data/mobility";
import type { MobilityApp } from "../../service/partnerService";

/**
 * Accepting a quote.
 *
 * This is the one place in Mobility that commits a partner to money, so it stops
 * being a button and becomes a decision: the figure sales quoted, how it is
 * billed, what can change afterwards, and the terms. Consent is explicit — the
 * confirm button stays dead until the box is ticked.
 *
 * The figure is the one sales quoted this partner, in naira, exactly as it will
 * appear on their Azapal bill. There is no list price and no conversion to show.
 */

const TERMS = {
  white_label: [
    ["Scope", "Your logo and colours are applied to the Azapal customer app for your customers. Azapal owns and runs the app; you own your brand and your customer relationships."],
    ["Billing", "The monthly amount is billed for every calendar month the app is active, including this one, on your company's monthly Azapal bill. Months are charged whole, not prorated."],
    ["Changes", "Change your logo and colours whenever you like. The monthly amount stays as quoted; a different price is a new quote you would accept again."],
    ["Ending it", "Stop it at any time from this page. You aren't billed for any month after that."],
  ],
  custom: [
    ["Scope", "Azapal builds and publishes an app under your name, from the configuration on this page. You own your brand, content and customer relationships; Azapal owns the underlying platform."],
    ["Store review", "Publication depends on Apple and Google approving the app. Azapal submits and responds to review, but can't guarantee approval or a date."],
    ["Your content", "You are responsible for your logo, imagery, service descriptions, privacy policy and terms, and for holding the rights to them."],
    ["Customer data", "Data your customers enter belongs to you. Azapal processes it to run the service and will not sell it. You remain the data controller."],
    ["Fee", "The one-time fee is added to your company's next monthly Azapal bill, and is non-refundable once the build starts. Ongoing hosting or changes beyond your configuration are agreed with sales separately."],
  ],
} as const;

export const ActivationModal = ({
  app,
  name,
  onClose,
  onConfirm,
  pending,
}: {
  app: MobilityApp;
  /** The business or app name, for the consent line. */
  name: string;
  onClose: () => void;
  onConfirm: () => void;
  pending?: boolean;
}) => {
  const [agreed, setAgreed] = useState(false);
  const whiteLabel = app.product === "white_label";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[10020] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Accept your quote"
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {whiteLabel ? "Activate the Azapal app with your brand" : "Start building your app"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">Your quote, and what you're agreeing to.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <section className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-gray-600">
                {whiteLabel ? "Per month, while active" : "One-time"}
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {app.amount != null ? naira(app.amount) : "—"}
                {whiteLabel && <span className="text-sm font-semibold text-gray-400">/month</span>}
              </span>
            </div>
            {app.sales_note && (
              <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
                <span className="font-semibold text-gray-700">From Azapal sales: </span>
                {app.sales_note}
              </p>
            )}
          </section>

          <section className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Terms of service</h3>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-3 text-[11px] leading-5 text-gray-600">
              {TERMS[app.product].map(([title, text], i) => (
                <p key={title}><strong>{i + 1}. {title}.</strong> {text}</p>
              ))}
              <p className="text-gray-400">
                This is a plain-language summary, not the full contract. The executed agreement is what governs.
              </p>
            </div>
          </section>

          <label className="mt-5 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#F14724]"
            />
            <span className="text-xs leading-5 text-gray-700">
              I'm authorised to agree on behalf of <strong>{name || "my business"}</strong>, and I accept
              the terms and the {whiteLabel ? "monthly charge" : "one-time fee"} above.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50"
          >
            Not yet
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!agreed || pending}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-gray-200 disabled:text-gray-400"
          >
            {pending ? "Accepting…" : "Agree & accept"}
          </button>
        </div>
      </div>
    </div>
  );
};
