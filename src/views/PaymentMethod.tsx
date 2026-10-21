import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import {
  useBillingAccounts,
  useOpenTransferAccount,
  usePlatformPrices,
  useRemoveBillingCard,
  useStartCardSetup,
} from "../hooks/usePlatformBilling";
import type { BillingMethod, PlatformBillingAccount } from "../service/partnerService";

/**
 * How each branch pays Azapal.
 *
 * Per branch on purpose: a branch carries the cost of what it does, so the
 * person accountable for it picks how it settles. The company account covers
 * what no branch owns — creating a branch, and the company quote page.
 *
 * Two methods, and neither of them takes card details here:
 *
 *  - **Card.** Paystack only hands back a card that can be charged again after
 *    the cardholder has authenticated a real payment, so adding one means
 *    sending them to Paystack's own page for a small charge. That money is
 *    theirs — it lands in their billing account as credit — which is why the
 *    button says so rather than calling it a fee.
 *  - **Bank transfer.** We open a dedicated account in their name. It is
 *    deliberately not the account their customers pay into: money in this one
 *    is Azapal's from the moment it arrives.
 *
 * What is not offered, also on purpose: settling a bill out of the partner's
 * own wallet. That balance is what their customers paid them.
 */

const naira = (n: number) => `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failing: "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Set up",
  pending: "Needs a method",
  failing: "Needs attention",
};

export const PaymentMethod = () => {
  const { data: accounts = [], isPending, isError, error, refetch } = useBillingAccounts();
  const { data: prices = [] } = usePlatformPrices();
  const [openScope, setOpenScope] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="flex w-full flex-col gap-5 overflow-y-auto">
        <div>
          <p className="mt-0.5 text-sm text-gray-500">
            How each branch pays for what it uses. Branches carry their own costs, so each one has its own
            method; your company account covers what no branch owns.{" "}
            <Link to="/bills" className="font-semibold text-brand hover:text-brand-hover">See what you're using</Link>
          </p>
        </div>

        {prices.length > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold text-gray-800">What Azapal charges</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Nothing here charges until you use it, and every price is shown again at the moment it applies.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {prices.map((price) => {
                const left = Math.max(0, price.free_allowance - price.used);
                return (
                  <li key={price.kind} className="flex items-baseline justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-800">{price.label}</span>
                      {price.free_allowance > 0 && (
                        <span className="block text-[11px] text-emerald-700">
                          {left > 0 ? `${left} of your first ${price.free_allowance} still free` : "Free allowance used up"}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold text-gray-900">{naira(price.unit_amount)}</span>
                      <span className="block text-[11px] text-gray-400">{price.unit_label}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {isPending ? (
          <p className="rounded-2xl bg-white py-14 text-center text-sm text-gray-400 shadow-card">Loading…</p>
        ) : isError ? (
          <div className="rounded-2xl bg-white py-14 text-center shadow-card">
            <p className="text-sm text-gray-500">
              Couldn't load your billing{error?.message ? ` — ${error.message}` : "."}
            </p>
            <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.scope}
                account={account}
                expanded={openScope === account.scope}
                onToggle={() => setOpenScope(openScope === account.scope ? null : account.scope)}
                onRefresh={() => refetch()}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const AccountCard = ({
  account,
  expanded,
  onToggle,
  onRefresh,
}: {
  account: PlatformBillingAccount;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}) => {
  const startCard = useStartCardSetup();
  const openTransfer = useOpenTransferAccount();
  const removeCard = useRemoveBillingCard();
  const [copied, setCopied] = useState(false);

  const name = account.branch ? account.branch.branch_code : "Company account";
  const busy = startCard.isPending || openTransfer.isPending || removeCard.isPending;

  const choose = (method: BillingMethod) => {
    if (method === "transfer") {
      openTransfer.mutate({ scope: account.scope });
      return;
    }
    // Paystack's page does the rest; the card lands on file when the charge
    // clears, which this screen learns by refetching, not from this response.
    startCard.mutate(
      { scope: account.scope, callbackUrl: `${window.location.origin}/PaymentMethod` },
      { onSuccess: (ticket) => { window.location.href = ticket.authorization_url; } },
    );
  };

  return (
    <section className="rounded-2xl bg-white shadow-card">
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <i className={`ri-arrow-${expanded ? "down" : "right"}-s-line text-gray-400`} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-800">{name}</span>
          <span className="block truncate text-xs text-gray-500">
            {account.method === "card" && account.card
              ? `${account.card.brand || "Card"} ending ${account.card.last4}`
              : account.method === "transfer" && account.transfer
                ? `Transfer to ${account.transfer.bank_name} · ${account.transfer.account_number}`
                : "No payment method yet"}
          </span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-xs text-gray-400">Running up this month</span>
          <span className="block text-sm font-semibold text-gray-900">{naira(account.unbilled)}</span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONE[account.status]}`}>
          {STATUS_LABEL[account.status]}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Figure label="Credit on this account" value={account.balance === null ? "—" : naira(account.balance)} />
            <Figure label="Owed on issued bills" value={naira(account.outstanding)} tone={account.outstanding > 0 ? "text-amber-700" : undefined} />
            <Figure label="Not yet billed" value={naira(account.unbilled)} />
          </div>

          {/* Paystack returns the cardholder to this screen, so it has to tell a
              card that was never started from one that was paid for and hasn't
              reached us yet — otherwise it asks them to add the card again. */}
          {account.card_setup_pending ? (
            <div className="rounded-xl bg-gray-50 px-4 py-3.5">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <i className="ri-loader-4-line animate-spin text-gray-400" aria-hidden="true" />
                Confirming your card
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Paystack has taken the {naira(account.card_setup_amount ?? 1000)} and we're waiting for it to reach us — usually a few seconds. It lands on
                this account as credit either way.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={onRefresh} className="text-xs font-semibold text-brand hover:text-brand-hover">
                  Check again
                </button>
                <button
                  type="button"
                  onClick={() => choose("card")}
                  disabled={busy}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-40"
                >
                  Try the card again
                </button>
                <button
                  type="button"
                  onClick={() => choose("transfer")}
                  disabled={busy}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-40"
                >
                  Use bank transfer instead
                </button>
              </div>
            </div>
          ) : account.method === "" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <MethodChoice
                icon="ri-bank-card-line"
                title="Pay by card"
                body={`We charge your card when a bill falls due. Adding it means a ${naira(account.card_setup_amount ?? 1000)} charge you authorise on Paystack — that lands here as credit against your first bill, not as a fee.`}
                cta="Add a card"
                disabled={busy}
                onClick={() => choose("card")}
              />
              <MethodChoice
                icon="ri-bank-line"
                title="Pay by bank transfer"
                body="We open an account in your name to transfer into. Bills settle from what you've paid in. It's separate from the account your customers pay into."
                cta="Open an account"
                disabled={busy}
                onClick={() => choose("transfer")}
              />
            </div>
          ) : account.method === "card" && account.card ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-gray-50 px-3.5 py-3">
                <i className="ri-bank-card-line text-lg text-gray-400" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-800">
                    {account.card.brand || "Card"} ending {account.card.last4}
                  </span>
                  <span className="block text-[11px] text-gray-400">
                    {account.card.bank ? `${account.card.bank} · ` : ""}
                    expires {account.card.exp_month}/{account.card.exp_year}
                  </span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => choose("card")}
                disabled={busy}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Replace card
              </button>
              <button
                type="button"
                onClick={() => removeCard.mutate(account.scope)}
                disabled={busy}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 hover:text-red-600 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ) : account.transfer ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-gray-50 px-3.5 py-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Transfer to</p>
                <p className="mt-0.5 text-lg font-bold tracking-wide text-gray-900">{account.transfer.account_number}</p>
                <p className="text-xs text-gray-500">
                  {account.transfer.account_name} · {account.transfer.bank_name}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard?.writeText(account.transfer!.account_number).then(
                      () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
                      () => undefined,
                    )
                  }
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <i className={`${copied ? "ri-check-line" : "ri-file-copy-line"} mr-1`} />
                  {copied ? "Copied" : "Copy account number"}
                </button>
                <button
                  type="button"
                  onClick={() => choose("card")}
                  disabled={busy}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-40"
                >
                  Switch to a card instead
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Transfer here before a bill is due and it settles itself. Anything left over stays as credit.
              </p>
            </div>
          ) : (
            <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-700">
              Your account is being opened — this usually takes a moment. Refresh to check.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

const Figure = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div className="rounded-xl bg-gray-50 px-3.5 py-2.5">
    <p className="text-[11px] text-gray-400">{label}</p>
    <p className={`mt-0.5 text-sm font-semibold ${tone ?? "text-gray-900"}`}>{value}</p>
  </div>
);

const MethodChoice = ({
  icon,
  title,
  body,
  cta,
  disabled,
  onClick,
}: {
  icon: string;
  title: string;
  body: string;
  cta: string;
  disabled: boolean;
  onClick: () => void;
}) => (
  <div className="flex flex-col rounded-xl border border-gray-200 p-4">
    <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
      <i className={`${icon} text-lg text-gray-400`} aria-hidden="true" />
      {title}
    </p>
    <p className="mt-1 flex-1 text-xs leading-5 text-gray-500">{body}</p>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-3 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-40"
    >
      {cta}
    </button>
  </div>
);

export default PaymentMethod;
