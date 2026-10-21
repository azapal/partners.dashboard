import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBillingAccounts, useOpenTransferAccount, usePlatformPrices, useStartCardSetup } from "../hooks/usePlatformBilling";
import { useOnboarding, useSkipBillingSetup } from "../hooks/useKyc";

/**
 * The last step of signing up: how this business pays Azapal.
 *
 * It stands in front of the dashboard rather than sitting on a checklist,
 * because an account with no way to pay is one we would have to chase or
 * switch off later — and the honest moment to ask is before anyone has built
 * anything on top of it.
 *
 * Two ways through, and both prove themselves rather than being taken on trust:
 *
 *  - **Card.** Paystack only returns a card that can be charged again after the
 *    cardholder authenticates a real charge, so adding one costs a small amount
 *    (₦1,000 by default) — and it lands in their own billing account as credit.
 *  - **Transfer.** We open an account and ask for ₦1,000 into it. Not a fee and
 *    not held: it is credit against their first bills. An account that has
 *    never received a naira hasn't been shown to work, and the day a bill fails
 *    is the wrong day to find out.
 *
 * Both amounts are Azapal staff's to set in the KYC portal, so they come from
 * the server and are never written into this screen.
 *
 * It can be skipped. A partner who isn't ready to pay yet still gets in; the
 * step stays undone on their checklist and DashboardLayout shows a reminder
 * until they set one up. Charges still accrue in the meantime.
 *
 * Verifying the business is deliberately *not* here. That needs paperwork a
 * partner may not have to hand, and making it the price of entry would turn a
 * five-minute signup into a week of waiting.
 */

const naira = (n: number) => `₦${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const OnboardingBillingScreen = () => {
  const { data: onboarding, refetch: refetchOnboarding } = useOnboarding();
  const { data: accounts = [], refetch, isPending } = useBillingAccounts();
  const { data: prices = [] } = usePlatformPrices();
  const startCard = useStartCardSetup();
  const openTransfer = useOpenTransferAccount();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [waitedFor, setWaitedFor] = useState(0);

  const company = accounts.find((a) => a.scope === "company");
  const opening = onboarding?.minimum_opening_balance ?? company?.minimum_opening_balance ?? 1000;
  const cardAmount = onboarding?.card_setup_amount ?? company?.card_setup_amount ?? 1000;
  const skip = useSkipBillingSetup();
  const [confirmSkip, setConfirmSkip] = useState(false);
  // Paystack sends the cardholder back here, so this screen is the first thing
  // they see after paying — it has to know the difference between "not started"
  // and "paid, not confirmed yet" or it asks them to do it all over again.
  const confirmingCard = !!company?.card_setup_pending && !company?.ready;
  const waitingForTransfer = company?.method === "transfer" && !company?.ready;
  const waiting = confirmingCard || waitingForTransfer;

  // Both kinds of money reach us by webhook, so the only way this screen learns
  // anything landed is to ask again. Only while actually waiting.
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => {
      setWaitedFor((n) => n + 1);
      refetch();
      // The gate in DashboardLayout reads this one, and it is cached for five
      // minutes — without refetching it, a confirmed card still meets a closed door.
      refetchOnboarding();
    }, 5000);
    return () => clearInterval(timer);
  }, [waiting, refetch, refetchOnboarding]);

  // Set up, so there is nothing to set up. This is the screen Paystack returns
  // to, and leaving someone on it once they are done is the whole of the bug it
  // used to have.
  useEffect(() => {
    if (onboarding?.required_done) navigate("/dashboard", { replace: true });
  }, [onboarding?.required_done, navigate]);

  const busy = startCard.isPending || openTransfer.isPending || skip.isPending;

  const chooseCard = () =>
    startCard.mutate(
      { scope: "company", callbackUrl: `${window.location.origin}/onboarding/billing` },
      { onSuccess: (ticket) => { window.location.href = ticket.authorization_url; } },
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5">
          <span className="text-sm font-semibold text-gray-800">Setting up your account</span>
          {/* The same exit the header offers everywhere else: nobody should be
              stuck on a screen they can't leave. */}
          <a href="/LogoutScreen" className="text-xs font-semibold text-gray-400 hover:text-gray-700">
            Log out
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">Last step</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">How will you pay for Azapal?</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          You're charged for what you use, billed monthly — nothing is taken now. Pick how those bills get settled and
          your dashboard opens.
        </p>

        {prices.length > 0 && (
          <div className="mt-5 rounded-2xl bg-white p-5 shadow-card">
            <p className="text-xs font-semibold text-gray-700">What you'll be charged for</p>
            <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {prices.map((price) => (
                <li key={price.kind} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-gray-600">{price.label}</span>
                  <span className="shrink-0 font-semibold text-gray-900">
                    {price.free_allowance > 0 && price.used < price.free_allowance
                      ? `First ${price.free_allowance} free`
                      : naira(price.unit_amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isPending ? (
          <p className="mt-6 rounded-2xl bg-white py-14 text-center text-sm text-gray-400 shadow-card">Loading…</p>
        ) : confirmingCard ? (
          <section className="mt-6 rounded-2xl bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <i className="ri-loader-4-line animate-spin text-gray-400" aria-hidden="true" />
              Confirming your card
            </h2>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Paystack has taken the {naira(cardAmount)} and we're waiting for it to reach us. It usually takes a few seconds,
              and this page moves on by itself. The {naira(cardAmount)} is yours either way — it sits on your billing account
              as credit against your first bill.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { refetch(); refetchOnboarding(); }}
                className="rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Check again
              </button>
            </div>

            {/* Honest after half a minute rather than spinning forever: say what
                they can do instead of leaving them watching an animation. */}
            {waitedFor > 6 && (
              <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3">
                <p className="text-xs leading-5 text-amber-800">
                  This is taking longer than it should. Your card hasn't been charged twice and the {naira(cardAmount)} is
                  safe — it lands as credit either way. You can try the card again, or set up a transfer instead.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={chooseCard}
                    disabled={busy}
                    className="text-xs font-semibold text-amber-900 underline underline-offset-2 disabled:opacity-40"
                  >
                    Try the card again
                  </button>
                  <button
                    type="button"
                    onClick={() => openTransfer.mutate({ scope: "company" })}
                    disabled={busy}
                    className="text-xs font-semibold text-amber-900 underline underline-offset-2 disabled:opacity-40"
                  >
                    Use bank transfer instead
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : waitingForTransfer && company?.transfer ? (
          <section className="mt-6 rounded-2xl bg-white p-6 shadow-card">
            <h2 className="text-sm font-semibold text-gray-800">Transfer {naira(opening)} to finish</h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              This is your own account and the {naira(opening)} stays yours — it sits as credit and your first bills come
              out of it. Nothing is charged on top.
            </p>

            <div className="mt-4 rounded-xl bg-gray-50 px-4 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Transfer to</p>
              <p className="mt-1 text-2xl font-bold tracking-wide text-gray-900">{company.transfer.account_number}</p>
              <p className="mt-0.5 text-sm text-gray-500">
                {company.transfer.account_name} · {company.transfer.bank_name}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard?.writeText(company.transfer!.account_number).then(
                    () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
                    () => undefined,
                  )
                }
                className="rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                <i className={`${copied ? "ri-check-line" : "ri-file-copy-line"} mr-1`} />
                {copied ? "Copied" : "Copy account number"}
              </button>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800"
              >
                I've sent it
              </button>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <i className="ri-loader-4-line animate-spin" aria-hidden="true" />
              Watching for your transfer. This page opens on its own when it lands.
            </p>
            {company.balance ? (
              <p className="mt-1 text-xs text-amber-700">
                {naira(company.balance)} received so far — {company.needs}
              </p>
            ) : null}

            <button
              type="button"
              onClick={chooseCard}
              disabled={busy}
              className="mt-4 text-xs font-semibold text-gray-400 underline underline-offset-2 hover:text-gray-700 disabled:opacity-40"
            >
              Use a card instead
            </button>
          </section>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Choice
              icon="ri-bank-card-line"
              title="Pay by card"
              body="We charge your card when a monthly bill falls due."
              detail={`Adding it costs ${naira(cardAmount)} that you authorise on Paystack — and that ${naira(cardAmount)} goes to your billing account as credit, not to us as a fee.`}
              cta="Add a card"
              disabled={busy}
              onClick={chooseCard}
            />
            <Choice
              icon="ri-bank-line"
              title="Pay by bank transfer"
              body="We open an account in your name and bills come out of what's in it."
              detail={`Transfer ${naira(opening)} to get started. It stays yours as credit against your first bills.`}
              cta="Open an account"
              disabled={busy}
              onClick={() => openTransfer.mutate({ scope: "company" })}
            />
          </div>
        )}

        {/* Not while a card is being confirmed: they've already paid, and
            skipping would only hide the moment it lands. */}
        {!confirmingCard && (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 px-5 py-4">
            {confirmSkip ? (
              <>
                <p className="text-sm font-semibold text-gray-800">Skip billing setup for now?</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your dashboard opens and you can use everything as usual. What you use is still charged, and monthly
                  bills will show as unpaid until you add a card or transfer account. We'll keep a reminder on your
                  dashboard, and you can set it up any time from Billing.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => skip.mutate(undefined, { onSuccess: () => navigate("/dashboard", { replace: true }) })}
                    disabled={busy}
                    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                  >
                    {skip.isPending ? "Opening your dashboard…" : "Yes, skip for now"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmSkip(false)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100"
                  >
                    Set it up now
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs leading-5 text-gray-500">
                  Not ready to choose? You can do this later from Billing.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmSkip(true)}
                  disabled={busy}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Skip for now
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-xs leading-5 text-gray-400">
          Verifying your business comes later — you can do that from Settings once you're in, and you only need it for
          the parts of Azapal that move money.
        </p>
      </main>
    </div>
  );
};

const Choice = ({
  icon,
  title,
  body,
  detail,
  cta,
  disabled,
  onClick,
}: {
  icon: string;
  title: string;
  body: string;
  detail: string;
  cta: string;
  disabled: boolean;
  onClick: () => void;
}) => (
  <section className="flex flex-col rounded-2xl bg-white p-5 shadow-card">
    <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
      <i className={`${icon} text-lg text-gray-400`} aria-hidden="true" />
      {title}
    </p>
    <p className="mt-1.5 text-sm text-gray-600">{body}</p>
    <p className="mt-2 flex-1 text-xs leading-5 text-gray-400">{detail}</p>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-4 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-40"
    >
      {cta}
    </button>
  </section>
);

export default OnboardingBillingScreen;
