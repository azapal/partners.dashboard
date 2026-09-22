import { useEffect, useState } from "react";
import { ACTIVATION_FEE_USD, BILLING_CURRENCIES, type MobilityConfig } from "../../lib/data/mobility";

/**
 * The activation agreement.
 *
 * Applying commits a partner to a fee and to a build, so it stops being a
 * button and becomes a decision: what Azapal will make, what they can change
 * afterwards, the terms, and what it costs. Consent is explicit — the confirm
 * button stays dead until the box is ticked.
 *
 * ── On the fee ────────────────────────────────────────────────────────────
 * The fee is quoted in USD because that is what it is denominated in. Local
 * currencies are listed so a partner can see they may pay in theirs, but no
 * converted figure is shown: inventing an exchange rate and printing it next
 * to a price someone is about to agree to would be a number they could hold us
 * to. The rate is whatever it is on the day, and the screen says so.
 */

export const ActivationModal = ({
  config,
  onClose,
  onConfirm,
}: {
  config: MobilityConfig;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const [agreed, setAgreed] = useState(false);
  const [currency, setCurrency] = useState(BILLING_CURRENCIES[0].code);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const picked = BILLING_CURRENCIES.find((c) => c.code === currency)!;
  const platforms = [config.platforms.ios && "iOS", config.platforms.android && "Android"]
    .filter(Boolean)
    .join(" and ");

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
        aria-label="Activate your branded app"
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Activate your branded app</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              What we'll build, and what it costs.
            </p>
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
          {/* What is being agreed */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Service agreement</h3>
            <p className="mt-2 text-xs leading-6 text-gray-700">
              Azapal will build and publish <strong>{config.appName || "your app"}</strong> for{" "}
              <strong>{platforms || "the platforms you select"}</strong>, carrying the{" "}
              {config.services.length} service{config.services.length === 1 ? "" : "s"} and the
              screens, branding and sign-in methods configured on this page. Deliveries booked in
              the app run through your existing Azapal operation — the same rates, branches, riders
              and settlement.
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5">
              <i className="ri-refresh-line mt-0.5 text-sm text-blue-600" />
              <p className="text-[11px] leading-4 text-blue-900">
                <strong>Settings aren't locked.</strong> Branding, services, screens and sections can
                be changed whenever you like, and we ship the update — you're not agreeing to this
                configuration forever, only to the app being built from it now.
              </p>
            </div>
          </section>

          {/* Terms */}
          <section className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Terms of service</h3>
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-gray-50 p-3 text-[11px] leading-5 text-gray-600">
              <p><strong>1. Scope.</strong> Azapal provides the app as a hosted service. You own your brand, content and customer relationships; Azapal owns the underlying platform.</p>
              <p className="mt-2"><strong>2. Store review.</strong> Publication depends on Apple and Google approving the app. Azapal submits and responds to review, but cannot guarantee approval or a date.</p>
              <p className="mt-2"><strong>3. Your content.</strong> You are responsible for your logo, imagery, service descriptions, privacy policy and terms, and for holding the rights to them.</p>
              <p className="mt-2"><strong>4. Customer data.</strong> Data your customers enter belongs to you. Azapal processes it to run the service and will not sell it. You remain the data controller and must meet the law where you operate.</p>
              <p className="mt-2"><strong>5. Fees.</strong> The activation fee is one-time and non-refundable once the build starts. The monthly Mobility charge begins when the app is live in the stores, and appears on your Azapal bill.</p>
              <p className="mt-2"><strong>6. Ending it.</strong> You may stop the monthly service at any time; the app is then unpublished. Your operational data stays in your Azapal account.</p>
              <p className="mt-2 text-gray-400">
                This is a plain-language summary, not the full contract. The executed agreement is what governs.
              </p>
            </div>
          </section>

          {/* Fee */}
          <section className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Activation fee</h3>
            <div className="mt-2 rounded-xl border border-gray-200 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-600">One-time, to start the build</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${ACTIVATION_FEE_USD.toLocaleString()}
                </span>
              </div>

              <p className="mt-3 text-xs font-medium text-gray-500">Pay in</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {BILLING_CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      currency === c.code
                        ? "border-brand bg-orange-50 text-brand"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
              <p className="mt-2.5 text-[11px] leading-4 text-gray-400">
                {currency === "USD" ? (
                  <>Charged in US dollars.</>
                ) : (
                  <>
                    Charged in {picked.name} ({picked.symbol}) at the exchange rate on the day you
                    pay — we don't quote a converted figure here because it would be out of date by
                    the time you paid it.
                  </>
                )}{" "}
                The monthly Mobility charge starts only once your app is live.
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
              I've read the above, I'm authorised to agree on behalf of{" "}
              <strong>{config.appName || "my business"}</strong>, and I accept the terms of service
              and the one-time activation fee.
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
            disabled={!agreed}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-gray-200 disabled:text-gray-400"
          >
            Agree &amp; submit
          </button>
        </div>
      </div>
    </div>
  );
};
